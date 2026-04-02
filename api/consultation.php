<?php
require_once 'config.php';
require_once 'functions.php';
require_once 'session_validate.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    case 'PUT':
        handlePut($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// ─────────────────────────────────────────────
// GET  /api/consultation.php?appointment_id=xx
//      Returns the full consultation record (if any) for a given appointment,
//      including lab tests, prescriptions, referral, surgery, admission.
// ─────────────────────────────────────────────
function handleGet($pdo)
{
    $appointmentId = $_GET['appointment_id'] ?? null;
    $patientId = $_GET['patient_id'] ?? null;

    if ($patientId && !$appointmentId) {
        // Fetch consultation history for a patient
        $stmt = $pdo->prepare("
            SELECT c.*, a.appointment_number, u.full_name as doctor_name
            FROM tbl_consultation_data c
            LEFT JOIN tbl_appointment a ON c.appointment_id = a.appointment_id
            LEFT JOIN users u ON c.doctor_id = u.id
            WHERE c.patient_id = ? 
            ORDER BY c.consultation_date DESC
        ");
        $stmt->execute([$patientId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // For each history record, fetch prescriptions for summary
        foreach ($history as &$h) {
            $stmt = $pdo->prepare("SELECT prescription FROM tbl_prescriptions WHERE consultation_id = ?");
            $stmt->execute([$h['id']]);
            $rxRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $drugs = [];
            foreach ($rxRows as $r) {
                $items = json_decode($r['prescription'], true);
                if (is_array($items)) {
                    foreach ($items as $it) {
                        if (!empty($it['drugName']))
                            $drugs[] = $it['drugName'];
                    }
                }
            }
            $h['prescription_summary'] = implode(', ', $drugs);
        }

        echo json_encode($history);
        return;
    }

    if (!$appointmentId) {
        http_response_code(400);
        echo json_encode(['error' => 'appointment_id or patient_id is required']);
        return;
    }

    // Main consultation
    $stmt = $pdo->prepare("SELECT * FROM tbl_consultation_data WHERE appointment_id = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$appointmentId]);
    $consultation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$consultation) {
        echo json_encode(null);
        return;
    }

    $consultationId = $consultation['id'];

    // Lab tests — test column stores a JSON array of test name strings
    $stmt = $pdo->prepare("SELECT * FROM tbl_lab_tests WHERE consultation_id = ? ORDER BY id ASC");
    $stmt->execute([$consultationId]);
    $labRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $labTests = [];
    foreach ($labRows as $row) {
        $tests = json_decode($row['test'], true);
        if (is_array($tests)) {
            foreach ($tests as $t) {
                $labTests[] = ['id' => $row['id'], 'testName' => $t, 'is_paid' => $row['is_paid'], 'sta' => $row['sta']];
            }
        } else {
            $labTests[] = ['id' => $row['id'], 'testName' => $row['test'], 'is_paid' => $row['is_paid'], 'sta' => $row['sta']];
        }
    }

    // Prescriptions — prescription column stores a JSON array of objects
    $stmt = $pdo->prepare("SELECT * FROM tbl_prescriptions WHERE consultation_id = ? ORDER BY id ASC");
    $stmt->execute([$consultationId]);
    $rxRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $prescriptions = [];
    foreach ($rxRows as $row) {
        $items = json_decode($row['prescription'], true);
        if (is_array($items)) {
            foreach ($items as $item) {
                $item['row_id'] = $row['id'];
                $item['is_paid'] = $row['is_paid'];
                $item['sta'] = $row['sta'];
                $prescriptions[] = $item;
            }
        } else {
            $prescriptions[] = ['row_id' => $row['id'], 'prescription' => $row['prescription'], 'is_paid' => $row['is_paid'], 'sta' => $row['sta']];
        }
    }

    // Referral
    $stmt = $pdo->prepare("SELECT * FROM tbl_refer_request WHERE rs_apid = ? ORDER BY rs_id DESC LIMIT 1");
    $stmt->execute([$appointmentId]);
    $referral = $stmt->fetch(PDO::FETCH_ASSOC);

    // Surgery
    $stmt = $pdo->prepare("SELECT * FROM tbl_surgery_request WHERE sr_apid = ? ORDER BY sr_id DESC LIMIT 1");
    $stmt->execute([$appointmentId]);
    $surgery = $stmt->fetch(PDO::FETCH_ASSOC);

    // Admission
    $stmt = $pdo->prepare("SELECT * FROM tbl_admission WHERE admit_apid = ? ORDER BY admit_id DESC LIMIT 1");
    $stmt->execute([$appointmentId]);
    $admission = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'consultation' => $consultation,
        'labTests' => $labTests,
        'prescriptions' => $prescriptions,
        'referral' => $referral ?: null,
        'surgery' => $surgery ?: null,
        'admission' => $admission ?: null,
    ]);
}

// ─────────────────────────────────────────────
// POST /api/consultation.php
//      Save a NEW full consultation.
//      Body: { appointment_id, patient_id, doctor_id, patient_complain, diagnosis,
//              observations, is_subfile, followup_date, followup_type, followup_instruction,
//              labTests: string[], prescriptions: object[], referral?, surgery?, admission? }
// ─────────────────────────────────────────────
function handlePost($pdo)
{
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['appointment_id'], $data['patient_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'appointment_id and patient_id are required']);
        return;
    }

    // Check if consultation already exists for this appointment
    $stmt = $pdo->prepare("SELECT id FROM tbl_consultation_data WHERE appointment_id = ?");
    $stmt->execute([$data['appointment_id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $data['consultation_id'] = $existing['id'];
        handlePut($pdo, $data);
        return;
    }

    // Auto-detect is_subfile from patient_id prefix (case-insensitive)
    $isSubfile = (stripos($data['patient_id'], 'sf-') === 0) ? 1 : 0;

    $pdo->beginTransaction();
    try {
        // 1. Insert main consultation record
        $stmt = $pdo->prepare("
            INSERT INTO tbl_consultation_data
                (appointment_id, patient_id, doctor_id, consultation_date,
                 patient_complain, diagnosis, observations,
                 is_subfile, followup_date, followup_type, followup_instruction)
            VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['appointment_id'],
            $data['patient_id'],
            $data['doctor_id'] ?? ($_SESSION['user_id'] ?? null),
            $data['patient_complain'] ?? '',
            $data['diagnosis'] ?? '',
            $data['observations'] ?? '',
            $isSubfile,
            $data['followup_date'] ?: null,
            $data['followup_type'] ?? '',
            $data['followup_instruction'] ?? '',
        ]);
        $consultationId = $pdo->lastInsertId();

        // 2. Lab tests
        if (!empty($data['labTests']) && is_array($data['labTests'])) {
            $testNames = array_map(fn($t) => is_string($t) ? $t : ($t['testName'] ?? ''), $data['labTests']);
            $testNames = array_filter($testNames);
            if ($testNames) {
                $stmt = $pdo->prepare("
                    INSERT INTO tbl_lab_tests (consultation_id, test, created_at, updated_at, is_paid, sta)
                    VALUES (?, ?, NOW(), NOW(), 0, 'pending')
                ");
                $stmt->execute([$consultationId, json_encode(array_values($testNames))]);
            }
        }

        // 3. Prescriptions
        if (!empty($data['prescriptions']) && is_array($data['prescriptions'])) {
            $rxItems = array_filter($data['prescriptions'], fn($p) => !empty($p['drugName']));
            if ($rxItems) {
                $stmt = $pdo->prepare("
                    INSERT INTO tbl_prescriptions (consultation_id, prescription, created_at, updated_at, is_paid, sta)
                    VALUES (?, ?, NOW(), NOW(), 0, 'pending')
                ");
                $stmt->execute([$consultationId, json_encode(array_values($rxItems))]);

                // Notify Pharmacy
                create_notification(
                    $pdo,
                    null,
                    "New Prescription",
                    "A new prescription has been sent for patient {$data['patient_id']}.",
                    "clinical",
                    "info",
                    "FlaskConical"
                );
            }
        }

        // 4. Referral request
        if (!empty($data['referral']['referto'])) {
            $ref = $data['referral'];
            $stmt = $pdo->prepare("
                INSERT INTO tbl_refer_request (rs_apid, rs_referto, rs_remarks, rs_datetime, rs_sta, update_remark)
                VALUES (?, ?, ?, NOW(), 'pending', '')
            ");
            $stmt->execute([
                $data['appointment_id'],
                $ref['referto'] ?? '',
                $ref['remarks'] ?? '',
            ]);
        }

        // 5. Surgery request
        if (!empty($data['surgery']['name'])) {
            $sur = $data['surgery'];
            $stmt = $pdo->prepare("
                INSERT INTO tbl_surgery_request (sr_apid, sr_name, sr_remarks, sr_datetime, sr_sta, update_remark)
                VALUES (?, ?, ?, NOW(), 'pending', '')
            ");
            $stmt->execute([
                $data['appointment_id'],
                $sur['name'] ?? '',
                $sur['remarks'] ?? '',
            ]);
        }

        // 6. Admission request
        if (!empty($data['admission']['remarks'])) {
            $adm = $data['admission'];
            $stmt = $pdo->prepare("
                INSERT INTO tbl_admission (admit_apid, admit_remarks, admit_datetime, admit_sta)
                VALUES (?, ?, NOW(), 'pending')
            ");
            $stmt->execute([
                $data['appointment_id'],
                $adm['remarks'] ?? '',
            ]);
        }

        // 7. Update appointment status if finished
        if (!empty($data['finish'])) {
            $stmt = $pdo->prepare("UPDATE tbl_appointment SET appointment_sta = 'finished' WHERE appointment_id = ?");
            $stmt->execute([$data['appointment_id']]);
        } else {
            // Ensure status is at least 'In Progress'
            $stmt = $pdo->prepare("UPDATE tbl_appointment SET appointment_sta = 'In Progress' WHERE appointment_id = ? AND appointment_sta = 'Pending'");
            $stmt->execute([$data['appointment_id']]);
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'consultation_id' => $consultationId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// ─────────────────────────────────────────────
// PUT  /api/consultation.php
//      Update an EXISTING consultation by consultation_id.
//      Body: { consultation_id, appointment_id, patient_complain, diagnosis,
//              observations, followup_date, followup_type, followup_instruction,
//              labTests?, prescriptions? }
// ─────────────────────────────────────────────
function handlePut($pdo, $data = null)
{
    if ($data === null) {
        $data = json_decode(file_get_contents('php://input'), true);
    }

    if (!isset($data['consultation_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'consultation_id is required for update']);
        return;
    }

    $pdo->beginTransaction();
    try {
        $consultationId = $data['consultation_id'];

        // Update main consultation record
        $stmt = $pdo->prepare("
            UPDATE tbl_consultation_data SET
                patient_complain     = ?,
                diagnosis            = ?,
                observations         = ?,
                followup_date        = ?,
                followup_type        = ?,
                followup_instruction = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $data['patient_complain'] ?? '',
            $data['diagnosis'] ?? '',
            $data['observations'] ?? '',
            $data['followup_date'] ?: null,
            $data['followup_type'] ?? '',
            $data['followup_instruction'] ?? '',
            $consultationId,
        ]);

        // Replace lab tests row
        if (isset($data['labTests'])) {
            $pdo->prepare("DELETE FROM tbl_lab_tests WHERE consultation_id = ?")->execute([$consultationId]);
            $testNames = array_filter(
                array_map(fn($t) => is_string($t) ? $t : ($t['testName'] ?? ''), $data['labTests'])
            );
            if ($testNames) {
                $stmt = $pdo->prepare("
                    INSERT INTO tbl_lab_tests (consultation_id, test, created_at, updated_at, is_paid, sta)
                    VALUES (?, ?, NOW(), NOW(), 0, 'pending')
                ");
                $stmt->execute([$consultationId, json_encode(array_values($testNames))]);
            }
        }

        // Replace prescriptions row
        if (isset($data['prescriptions'])) {
            $pdo->prepare("DELETE FROM tbl_prescriptions WHERE consultation_id = ?")->execute([$consultationId]);
            $rxItems = array_filter($data['prescriptions'], fn($p) => !empty($p['drugName']));
            if ($rxItems) {
                $stmt = $pdo->prepare("
                    INSERT INTO tbl_prescriptions (consultation_id, prescription, created_at, updated_at, is_paid, sta)
                    VALUES (?, ?, NOW(), NOW(), 0, 'pending')
                ");
                $stmt->execute([$consultationId, json_encode(array_values($rxItems))]);

                // Notify Pharmacy
                create_notification(
                    $pdo,
                    null,
                    "Updated Prescription",
                    "A prescription has been updated for patient {$data['patient_id']}.",
                    "clinical",
                    "info",
                    "FlaskConical"
                );
            }
        }

        // 4. Referral request
        if (!empty($data['referral']['referto'])) {
            $ref = $data['referral'];
            $pdo->prepare("DELETE FROM tbl_refer_request WHERE rs_apid = ?")->execute([$data['appointment_id']]);
            $stmt = $pdo->prepare("
                INSERT INTO tbl_refer_request (rs_apid, rs_referto, rs_remarks, rs_datetime, rs_sta, update_remark)
                VALUES (?, ?, ?, NOW(), 'pending', '')
            ");
            $stmt->execute([
                $data['appointment_id'],
                $ref['referto'] ?? '',
                $ref['remarks'] ?? '',
            ]);
        }

        // 5. Surgery request
        if (!empty($data['surgery']['name'])) {
            $sur = $data['surgery'];
            $pdo->prepare("DELETE FROM tbl_surgery_request WHERE sr_apid = ?")->execute([$data['appointment_id']]);
            $stmt = $pdo->prepare("
                INSERT INTO tbl_surgery_request (sr_apid, sr_name, sr_remarks, sr_datetime, sr_sta, update_remark)
                VALUES (?, ?, ?, NOW(), 'pending', '')
            ");
            $stmt->execute([
                $data['appointment_id'],
                $sur['name'] ?? '',
                $sur['remarks'] ?? '',
            ]);
        }

        // 6. Admission request
        if (!empty($data['admission']['remarks'])) {
            $adm = $data['admission'];
            $pdo->prepare("DELETE FROM tbl_admission WHERE admit_apid = ?")->execute([$data['appointment_id']]);
            $stmt = $pdo->prepare("
                INSERT INTO tbl_admission (admit_apid, admit_remarks, admit_datetime, admit_sta)
                VALUES (?, ?, NOW(), 'pending')
            ");
            $stmt->execute([
                $data['appointment_id'],
                $adm['remarks'] ?? '',
            ]);
        }

        // Update appointment status if finished
        if (!empty($data['appointment_id']) && !empty($data['finish'])) {
            $stmt = $pdo->prepare("UPDATE tbl_appointment SET appointment_sta = 'finished' WHERE appointment_id = ?");
            $stmt->execute([$data['appointment_id']]);
        }

        $pdo->commit();
        echo json_encode(['success' => true, 'consultation_id' => $consultationId]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
