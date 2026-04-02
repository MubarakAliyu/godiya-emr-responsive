<?php
/**
 * Nurse OPD Workflow API
 * Handles: record complaint, order lab investigation (auto-paid), approve lab results
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/session_validate.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    default:
        send_response(['error' => 'Method not allowed'], 405);
}

function handleGet($pdo)
{
    $action = $_GET['action'] ?? '';

    // Get all appointments with pending (approved=0) or completed (approved=1) lab results
    // for a specific appointment, so nurse can review and approve
    if ($action === 'get_appointment_labs') {
        $appointment_number = $_GET['appointment_number'] ?? '';
        if (empty($appointment_number)) {
            send_response(['error' => 'appointment_number is required'], 400);
            return;
        }
        try {
            // Get numeric appt id
            $stmt = $pdo->prepare("SELECT appointment_id FROM tbl_appointment WHERE appointment_number = ?");
            $stmt->execute([$appointment_number]);
            $aid = $stmt->fetchColumn();

            // Get lab tests from tbl_lab_tests via consultation
            $stmt = $pdo->prepare("
                SELECT lt.*, lt.test as test_list, lt.sta as status
                FROM tbl_lab_tests lt
                JOIN tbl_consultation_data c ON lt.consultation_id = c.id
                WHERE c.appointment_id = :aid
                ORDER BY lt.created_at DESC
            ");
            $stmt->execute([':aid' => $aid]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            send_response($rows ?: []);
        } catch (PDOException $e) {
            send_response(['error' => $e->getMessage()], 500);
        }
    }

    // Get complaint for a specific appointment
    else if ($action === 'get_complaint') {
        $appointment_number = $_GET['appointment_number'] ?? '';
        if (empty($appointment_number)) {
            send_response(['error' => 'appointment_number is required'], 400);
            return;
        }
        try {
            $stmt = $pdo->prepare("SELECT * FROM tbl_nurse_opd_complaint WHERE appointment_number = :appt LIMIT 1");
            $stmt->execute([':appt' => $appointment_number]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            send_response($row ?: null);
        } catch (PDOException $e) {
            send_response(['error' => $e->getMessage()], 500);
        }
    }

    // Get all appointments that have results in tbl_lab_tests (sta='Completed') for patients currently In Progress
    else if ($action === 'pending_approvals') {
        try {
            $sql = "
                SELECT 
                    lt.id as invoice_id,
                    a.appointment_number,
                    lt.test as test_list,
                    a.appointment_patientid as patient_id,
                    p.full_name as patient_name,
                    ltr.result_list,
                    ltr.result_picture,
                    ltr.result_date,
                    a.appointment_date,
                    a.appointment_id
                FROM tbl_lab_tests lt
                JOIN tbl_consultation_data c ON lt.consultation_id = c.id
                JOIN tbl_appointment a ON a.appointment_id = c.appointment_id
                LEFT JOIN tbl_patients p ON p.patient_unique_id = a.appointment_patientid
                LEFT JOIN tbl_lab_test_result ltr ON ltr.lab_invoice_id = lt.id
                WHERE lt.sta = 'Completed' AND a.appointment_sta = 'In Progress'
                ORDER BY lt.id DESC
            ";
            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            send_response($rows ?: []);
        } catch (PDOException $e) {
            send_response(['error' => $e->getMessage()], 500);
        }
    } else {
        send_response(['error' => 'Invalid action'], 400);
    }
}

function handlePost($pdo)
{
    $data = get_request_data();
    $action = $data['action'] ?? '';

    // Record a patient complaint
    if ($action === 'record_complaint') {
        $appointment_number = $data['appointment_number'] ?? '';
        $patient_id = $data['patient_id'] ?? '';
        $complaint = $data['complaint'] ?? '';
        $duration = $data['duration'] ?? '';
        $severity = $data['severity'] ?? '';
        $nurse_id = $data['nurse_id'] ?? ($_SESSION['user_id'] ?? 'System');

        if (empty($appointment_number) || empty($complaint)) {
            send_response(['error' => 'appointment_number and complaint are required'], 400);
            return;
        }

        try {
            // Upsert complaint
            $stmt = $pdo->prepare("
                INSERT INTO tbl_nurse_opd_complaint (appointment_number, patient_id, complaint, duration, severity, nurse_id)
                VALUES (:appt, :pid, :complaint, :duration, :severity, :nurse)
                ON DUPLICATE KEY UPDATE complaint = :complaint2, duration = :duration2, severity = :severity2, nurse_id = :nurse2
            ");
            $stmt->execute([
                ':appt' => $appointment_number,
                ':pid' => $patient_id,
                ':complaint' => $complaint,
                ':duration' => $duration,
                ':severity' => $severity,
                ':nurse' => $nurse_id,
                ':complaint2' => $complaint,
                ':duration2' => $duration,
                ':severity2' => $severity,
                ':nurse2' => $nurse_id,
            ]);

            log_activity($pdo, $nurse_id, 'RECORD_COMPLAINT', 'Nurse', $appointment_number, [
                'complaint' => $complaint,
            ]);

            send_response(['success' => true, 'message' => 'Complaint recorded successfully', 'debug_marker' => 'v1-antigravity']);
        } catch (Throwable $e) {
            error_log('nurse_opd record_complaint: ' . $e->getMessage());
            send_response(['error' => $e->getMessage()], 500);
        }
    }

    // Order lab investigation — EXCLUSIVELY in tbl_lab_tests
    else if ($action === 'order_lab_investigation') {
        $appointment_number = $data['appointment_number'] ?? '';
        $patient_id = $data['patient_id'] ?? '';
        $is_subfile = (int) ($data['is_subfile'] ?? 0);
        $tests = $data['tests'] ?? []; // array of {name, cat}
        $nurse_id = $data['nurse_id'] ?? ($_SESSION['user_id'] ?? 'System');

        if (empty($appointment_number) || empty($patient_id) || empty($tests)) {
            send_response(['error' => 'appointment_number, patient_id and tests are required'], 400);
            return;
        }

        try {
            $pdo->beginTransaction();

            $gen_date = date('Y-m-d H:i:s');

            // 1. Resolve numeric appointment ID and Doctor
            $stmt = $pdo->prepare("SELECT appointment_id, appointment_doctor FROM tbl_appointment WHERE appointment_number = :num");
            $stmt->execute([':num' => $appointment_number]);
            $appt = $stmt->fetch(PDO::FETCH_ASSOC);
            $numeric_appt_id = $appt ? $appt['appointment_id'] : 0;
            $doctor_id = $appt ? $appt['appointment_doctor'] : null;

            // 2. Ensure a consultation record exists (MANDATORY for tbl_lab_tests)
            $stmt = $pdo->prepare("SELECT id FROM tbl_consultation_data WHERE appointment_id = :aid");
            $stmt->execute([':aid' => $numeric_appt_id]);
            $cons = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($cons) {
                $consultation_id = $cons['id'];
            } else {
                $stmt = $pdo->prepare("INSERT INTO tbl_consultation_data (appointment_id, patient_id, doctor_id, consultation_date, is_subfile) VALUES (:aid, :pid, :did, :cdate, :is_sub)");
                $stmt->execute([
                    ':aid' => $numeric_appt_id,
                    ':pid' => $patient_id,
                    ':did' => $doctor_id,
                    ':cdate' => $gen_date,
                    ':is_sub' => $is_subfile
                ]);
                $consultation_id = $pdo->lastInsertId();
            }

            // 2. Format tests into EXACT requested structure: [{"test_name":"...", "priority":"Normal", "notes":""}]
            $test_names_str = implode(', ', array_map(function ($t) {
                return $t['name'] ?? 'Unknown';
            }, $tests));
            $test_json = json_encode([
                [
                    'test_name' => $test_names_str,
                    'priority' => 'Normal',
                    'notes' => ''
                ]
            ]);

            // 3. Update/Insert into tbl_lab_tests (Clinical record)
            $stmt = $pdo->prepare("SELECT id FROM tbl_lab_tests WHERE consultation_id = :cid LIMIT 1");
            $stmt->execute([':cid' => $consultation_id]);
            $existing_lab_entry = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($existing_lab_entry) {
                $stmt = $pdo->prepare("UPDATE tbl_lab_tests SET test = :test_json, updated_at = :udate, sta = 'pending' WHERE id = :id");
                $stmt->execute([
                    ':test_json' => $test_json,
                    ':udate' => $gen_date,
                    ':id' => $existing_lab_entry['id']
                ]);
                $final_id = $existing_lab_entry['id'];
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO tbl_lab_tests (consultation_id, test, created_at, updated_at, is_paid, sta)
                    VALUES (:cid, :test_json, :cdate, :udate, :is_paid, :sta)
                ");
                $stmt->execute([
                    ':cid' => $consultation_id,
                    ':test_json' => $test_json,
                    ':cdate' => $gen_date,
                    ':udate' => $gen_date,
                    ':is_paid' => 1,
                    ':sta' => 'pending'
                ]);
                $final_id = $pdo->lastInsertId();
            }

            log_activity($pdo, $nurse_id, 'NURSE_ORDER_LAB', 'Nurse', $appointment_number, [
                'lab_test_id' => $final_id,
                'tests' => count($tests),
            ]);

            $pdo->commit();
            send_response([
                'success' => true,
                'message' => 'Lab investigation recorded in tbl_lab_tests (Clinical Record)',
                'lab_test_id' => $final_id
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction())
                $pdo->rollBack();
            error_log('nurse_opd order_lab: ' . $e->getMessage());
            send_response(['error' => $e->getMessage()], 500);
        }
    }

    // Nurse approves lab results -> update appointment sta to Processed
    else if ($action === 'approve_lab_result') {
        $appointment_number = $data['appointment_number'] ?? '';
        $nurse_id = $data['nurse_id'] ?? ($_SESSION['user_id'] ?? 'System');

        if (empty($appointment_number)) {
            send_response(['error' => 'appointment_number is required'], 400);
            return;
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("UPDATE tbl_appointment SET appointment_sta = 'Processed' WHERE appointment_number = :appt");
            $stmt->execute([':appt' => $appointment_number]);

            log_activity($pdo, $nurse_id, 'NURSE_APPROVE_LAB_APPOINTMENT', 'Nurse', $appointment_number);

            $pdo->commit();
            send_response(['success' => true, 'message' => 'Appointment marked as Processed']);
        } catch (Throwable $e) {
            if ($pdo->inTransaction())
                $pdo->rollBack();
            error_log('nurse_opd approve_lab: ' . $e->getMessage());
            send_response(['error' => $e->getMessage()], 500);
        }
    }

    // Upload/Update lab result summary and picture
    else if ($action === 'upload_lab_result') {
        $invoice_id = $data['invoice_id'] ?? '';
        $result_summary = $data['result_summary'] ?? '';
        $result_picture = $data['result_picture'] ?? ''; // base64
        $nurse_id = $data['nurse_id'] ?? ($_SESSION['user_id'] ?? 'System');

        if (empty($invoice_id)) {
            send_response(['error' => 'invoice_id is required'], 400);
            return;
        }

        try {
            $pdo->beginTransaction();
            $gen_date = date('Y-m-d H:i:s');

            // 1. Upsert into tbl_lab_test_result
            $stmt = $pdo->prepare("
                INSERT INTO tbl_lab_test_result (lab_invoice_id, result_list, result_date, technician_id, result_picture)
                VALUES (:inv, :res, :date, :tech, :pic)
                ON DUPLICATE KEY UPDATE result_list = :res2, result_date = :date2, technician_id = :tech2, result_picture = :pic2
            ");
            $stmt->execute([
                ':inv' => $invoice_id,
                ':res' => $result_summary,
                ':date' => $gen_date,
                ':tech' => $nurse_id,
                ':pic' => $result_picture,
                ':res2' => $result_summary,
                ':date2' => $gen_date,
                ':tech2' => $nurse_id,
                ':pic2' => $result_picture,
            ]);

            // 2. Mark tbl_lab_tests as Completed (sta='Completed') so it shows in pending review
            $stmt = $pdo->prepare("UPDATE tbl_lab_tests SET sta = 'Completed' WHERE id = :id");
            $stmt->execute([':id' => $invoice_id]);

            log_activity($pdo, $nurse_id, 'UPLOAD_LAB_RESULT', 'Nurse', $invoice_id);
            $pdo->commit();
            send_response(['success' => true, 'message' => 'Lab result recorded in tbl_lab_tests and summary saved']);
        } catch (Throwable $e) {
            if ($pdo->inTransaction())
                $pdo->rollBack();
            error_log('nurse_opd upload_lab_result: ' . $e->getMessage());
            send_response(['error' => $e->getMessage()], 500);
        }
    }
    // Mark appointment as Processed
    else if ($action === 'mark_appointment_processed') {
        $appointment_number = $data['appointment_number'] ?? '';
        $nurse_id = $data['nurse_id'] ?? ($_SESSION['user_id'] ?? 'System');

        if (empty($appointment_number)) {
            send_response(['error' => 'appointment_number is required'], 400);
            return;
        }

        try {
            $stmt = $pdo->prepare("UPDATE tbl_appointment SET appointment_sta = 'Processed' WHERE appointment_number = :appt");
            $stmt->execute([':appt' => $appointment_number]);

            log_activity($pdo, $nurse_id, 'MARK_APPOINTMENT_PROCESSED', 'Nurse', $appointment_number);
            send_response(['success' => true, 'message' => 'Appointment marked as processed']);
        } catch (Throwable $e) {
            error_log('nurse_opd mark_processed: ' . $e->getMessage());
            send_response(['error' => $e->getMessage()], 500);
        }
    } else {
        send_response(['error' => 'Invalid action'], 400);
    }
}
