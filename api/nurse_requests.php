<?php
require_once 'config.php';
require_once 'session_validate.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet($pdo)
{
    try {
        $type = $_GET['type'] ?? '';
        $status = $_GET['status'] ?? 'pending';

        switch ($type) {
            case 'referral':
                $stmt = $pdo->prepare("
                    SELECT r.*, a.appointment_number, 
                           COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                           a.appointment_fileid as patient_unique_id,
                           COALESCE(p.dob, s.subfile_dob) as dob,
                           COALESCE(p.gender, s.subfile_gender) as gender,
                           COALESCE(p.phone_number, parent.phone_number) as phone_number,
                           c.diagnosis as consultation_diagnosis, c.observations as consultation_observations
                    FROM tbl_refer_request r
                    JOIN tbl_appointment a ON r.rs_apid = a.appointment_id
                    LEFT JOIN tbl_patients p ON a.appointment_fileid = p.patient_unique_id AND a.is_subfile = 0
                    LEFT JOIN tbl_subfile s ON REPLACE(a.appointment_fileid, 'SF-', '') = s.subfile_id AND a.is_subfile = 1
                    LEFT JOIN tbl_patients parent ON s.subfile_file_id = parent.patient_unique_id
                    LEFT JOIN tbl_consultation_data c ON a.appointment_id = c.appointment_id
                    WHERE r.rs_sta = ?
                    ORDER BY r.rs_datetime DESC
                ");
                $stmt->execute([$status]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'surgery':
                $stmt = $pdo->prepare("
                    SELECT sr.*, a.appointment_number, 
                           COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                           a.appointment_fileid as patient_unique_id,
                           COALESCE(p.dob, s.subfile_dob) as dob,
                           COALESCE(p.gender, s.subfile_gender) as gender,
                           COALESCE(p.phone_number, parent.phone_number) as phone_number,
                           c.diagnosis as consultation_diagnosis, c.observations as consultation_observations
                    FROM tbl_surgery_request sr
                    JOIN tbl_appointment a ON sr.sr_apid = a.appointment_id
                    LEFT JOIN tbl_patients p ON a.appointment_fileid = p.patient_unique_id AND a.is_subfile = 0
                    LEFT JOIN tbl_subfile s ON REPLACE(a.appointment_fileid, 'SF-', '') = s.subfile_id AND a.is_subfile = 1
                    LEFT JOIN tbl_patients parent ON s.subfile_file_id = parent.patient_unique_id
                    LEFT JOIN tbl_consultation_data c ON a.appointment_id = c.appointment_id
                    WHERE sr.sr_sta = ?
                    ORDER BY sr.sr_datetime DESC
                ");
                $stmt->execute([$status]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'admission':
                $stmt = $pdo->prepare("
                    SELECT adm.*, a.appointment_number, 
                           COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                           a.appointment_fileid as patient_unique_id,
                           COALESCE(p.dob, s.subfile_dob) as dob,
                           COALESCE(p.gender, s.subfile_gender) as gender,
                           COALESCE(p.phone_number, parent.phone_number) as phone_number,
                           u.full_name as doctor_name,
                           a.is_subfile,
                           parent.patient_unique_id as bearer_id,
                           c.diagnosis as consultation_diagnosis, c.observations as consultation_observations
                    FROM tbl_admission adm
                    JOIN tbl_appointment a ON adm.admit_apid = a.appointment_id
                    LEFT JOIN tbl_patients p ON a.appointment_fileid = p.patient_unique_id AND a.is_subfile = 0
                    LEFT JOIN tbl_subfile s ON REPLACE(a.appointment_fileid, 'SF-', '') = s.subfile_id AND a.is_subfile = 1
                    LEFT JOIN tbl_patients parent ON s.subfile_file_id = parent.patient_unique_id
                    LEFT JOIN users u ON a.appointment_doctor = u.id
                    LEFT JOIN tbl_consultation_data c ON a.appointment_id = c.appointment_id
                    WHERE adm.admit_sta = ?
                    ORDER BY adm.admit_datetime DESC
                ");
                $stmt->execute([$status]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'ipd_patients':
                $stmt = $pdo->prepare("
                    SELECT ba.*, 
                           COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                           COALESCE(p.gender, s.subfile_gender) as gender,
                           COALESCE(p.dob, s.subfile_dob) as dob,
                           p.file_type,
                           ba.admission_is_subfile as is_subfile,
                           bc.category_name as ward_name,
                           ba.ipd_number
                    FROM tbl_bed_admission ba
                    LEFT JOIN tbl_patients p ON ba.admission_patient = p.patient_unique_id AND ba.admission_is_subfile = 0
                    LEFT JOIN tbl_subfile s ON REPLACE(ba.admission_patient, 'SF-', '') = s.subfile_id AND ba.admission_is_subfile = 1
                    LEFT JOIN tbl_bed_categories bc ON ba.admission_bed = bc.id
                    WHERE ba.admission_sta = 'approved' AND ba.admission_discharge_date IS NULL
                    ORDER BY ba.admission_datetime DESC
                ");
                $stmt->execute();
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'ipd_history':
                $stmt = $pdo->prepare("
                    SELECT ba.*, 
                           COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                           COALESCE(p.gender, s.subfile_gender) as gender,
                           COALESCE(p.dob, s.subfile_dob) as dob,
                           p.file_type,
                           ba.admission_is_subfile as is_subfile,
                           bc.category_name as ward_name,
                           ba.ipd_number
                    FROM tbl_bed_admission ba
                    LEFT JOIN tbl_patients p ON ba.admission_patient = p.patient_unique_id AND ba.admission_is_subfile = 0
                    LEFT JOIN tbl_subfile s ON REPLACE(ba.admission_patient, 'SF-', '') = s.subfile_id AND ba.admission_is_subfile = 1
                    LEFT JOIN tbl_bed_categories bc ON ba.admission_bed = bc.id
                    WHERE ba.admission_sta = 'discharged'
                    ORDER BY ba.admission_discharge_date DESC
                ");
                $stmt->execute();
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'opd_patients':
                $stmt = $pdo->prepare("
                    SELECT 
                        COALESCE(p.patient_unique_id, CONCAT('SF-', s.subfile_id)) as patient_id,
                        COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                        COALESCE(p.gender, s.subfile_gender) as gender,
                        COALESCE(p.dob, s.subfile_dob) as dob,
                        p.file_type,
                        a.is_subfile,
                        parent.patient_unique_id as parent_file_number,
                        COUNT(a.appointment_id) as visit_count
                    FROM tbl_appointment a
                    LEFT JOIN tbl_patients p ON a.appointment_fileid = p.patient_unique_id AND a.is_subfile = 0
                    LEFT JOIN tbl_subfile s ON REPLACE(a.appointment_fileid, 'SF-', '') = s.subfile_id AND a.is_subfile = 1
                    LEFT JOIN tbl_patients parent ON s.subfile_file_id = parent.patient_unique_id
                    WHERE a.appointment_sta = 'finished'
                    GROUP BY a.appointment_fileid, a.is_subfile
                    ORDER BY MAX(a.appointment_date) DESC
                ");
                $stmt->execute();
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'counts':
                $counts = [
                    'admissions' => $pdo->query("SELECT COUNT(*) FROM tbl_admission WHERE admit_sta = 'pending'")->fetchColumn(),
                    'referrals' => $pdo->query("SELECT COUNT(*) FROM tbl_refer_request WHERE rs_sta = 'pending'")->fetchColumn(),
                    'surgeries' => $pdo->query("SELECT COUNT(*) FROM tbl_surgery_request WHERE sr_sta = 'pending'")->fetchColumn(),
                ];
                echo json_encode($counts);
                break;

            default:
                echo json_encode(['error' => 'Invalid type']);
                break;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function handlePost($pdo)
{
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['action'], $data['type'], $data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    $pdo->beginTransaction();
    try {
        $id = $data['id'];
        $action = $data['action'];
        $type = $data['type'];
        $remarks = $data['remarks'] ?? '';

        if ($type === 'referral') {
            $status = ($action === 'approve') ? 'approved' : 'rejected';
            $stmt = $pdo->prepare("UPDATE tbl_refer_request SET rs_sta = ?, update_remark = ? WHERE rs_id = ?");
            $stmt->execute([$status, $remarks, $id]);
        } else if ($type === 'surgery') {
            $status = ($action === 'approve') ? 'approved' : 'rejected';
            // Save scheduling details in update_remark if approving
            $updateRemark = $remarks;
            if ($action === 'approve' && isset($data['schedule'])) {
                $updateRemark .= " | Schedule: " . json_encode($data['schedule']);
            }
            $stmt = $pdo->prepare("UPDATE tbl_surgery_request SET sr_sta = ?, update_remark = ? WHERE sr_id = ?");
            $stmt->execute([$status, $updateRemark, $id]);
        } else if ($type === 'admission') {
            if ($action === 'approve') {
                // 1. Get admission request details
                $stmt = $pdo->prepare("
                    SELECT a.*, app.appointment_number, app.appointment_fileid, app.is_subfile 
                    FROM tbl_admission a
                    JOIN tbl_appointment app ON a.admit_apid = app.appointment_id
                    WHERE a.admit_id = ?
                ");
                $stmt->execute([$id]);
                $req = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$req)
                    throw new Exception("Admission request not found");

                // Generate IPD Number
                $ipd_number = 'IPD-' . date('ym') . '-' . str_pad($id, 5, '0', STR_PAD_LEFT);

                // 2. Insert into tbl_bed_admission
                // SCHEMA: admission_id, admission_patient, admission_is_subfile, admission_sta, admission_ispaid, admission_datetime, admission_discharge_date, admission_bed, admission_appointment, admission_date, case_id, ipd_number
                $stmt = $pdo->prepare("
                    INSERT INTO tbl_bed_admission 
                    (admission_id, admission_patient, admission_is_subfile, admission_sta, admission_ispaid, admission_datetime, admission_discharge_date, admission_bed, admission_appointment, admission_date, case_id, ipd_number)
                    VALUES (?, ?, ?, 'approved', 0, NOW(), NULL, ?, ?, CURDATE(), ?, ?)
                ");
                $stmt->execute([
                    $id,
                    $req['appointment_fileid'],
                    $req['is_subfile'],
                    $data['bed_id'],
                    $req['admit_apid'],
                    $data['case_id'] ?? null,
                    $ipd_number
                ]);

                // 3. Increment occupied_beds in tbl_bed_categories
                $stmt = $pdo->prepare("UPDATE tbl_bed_categories SET occupied_beds = occupied_beds + 1 WHERE id = ?");
                $stmt->execute([$data['bed_id']]);

                // 4. Update request status
                $stmt = $pdo->prepare("UPDATE tbl_admission SET admit_sta = 'approved' WHERE admit_id = ?");
                $stmt->execute([$id]);
            } else {
                $stmt = $pdo->prepare("UPDATE tbl_admission SET admit_sta = 'rejected' WHERE admit_id = ?");
                $stmt->execute([$id]);
            }
        }

        $pdo->commit();
        echo json_encode([
            'success' => true,
            'ipd_number' => $ipd_number ?? null
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
