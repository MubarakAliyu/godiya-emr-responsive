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
    case 'PUT':
        handlePut($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet($pdo)
{
    $id = $_GET['appointment_id'] ?? null;
    $fileId = $_GET['appointment_fileid'] ?? null;
    $doctor = $_GET['doctor'] ?? null;          // filter by appointment_doctor
    $status = $_GET['status'] ?? null;          // filter by appointment_sta
    $isPaid = isset($_GET['is_paid']) ? (int) $_GET['is_paid'] : null; // filter by appointment_ispaid

    $baseQuery = "SELECT a.*, 
                         CASE 
                            WHEN a.is_subfile = 1 THEN CONCAT(s.subfile_fname, ' ', s.subfile_lname, ' (SF-', s.subfile_id, ')')
                            ELSE p.full_name 
                         END AS patient_name,
                         CASE 
                            WHEN a.is_subfile = 1 THEN s.subfile_gender
                            ELSE p.gender 
                         END AS gender,
                         CASE 
                            WHEN a.is_subfile = 1 THEN s.subfile_file_id
                            ELSE a.appointment_fileid
                         END AS display_file_id,
                         (SELECT SUM(amount_paid) FROM tbl_payments WHERE reference_id = a.appointment_number) as total_paid
                  FROM tbl_appointment a 
                  LEFT JOIN tbl_patients p ON a.appointment_fileid = p.patient_unique_id AND (a.is_subfile = 0 OR a.is_subfile IS NULL)
                  LEFT JOIN tbl_subfile s ON REPLACE(a.appointment_fileid, 'SF-', '') = s.subfile_id AND a.is_subfile = 1";

    if ($id) {
        $stmt = $pdo->prepare("$baseQuery WHERE a.appointment_id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    } elseif ($fileId) {
        $stmt = $pdo->prepare("$baseQuery WHERE a.appointment_fileid = :fileId ORDER BY a.appointment_date DESC");
        $stmt->execute([':fileId' => $fileId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } elseif ($doctor !== null) {
        // Fetch appointments for a specific doctor, optionally filtered by status and payment
        $conditions = ['a.appointment_doctor = :doctor'];
        $params = [':doctor' => $doctor];

        if ($status !== null) {
            $statusArray = explode(',', $status);
            $placeholders = [];
            foreach ($statusArray as $index => $s) {
                $key = ":status$index";
                $placeholders[] = $key;
                $params[$key] = strtolower(trim($s));
            }
            $conditions[] = 'LOWER(a.appointment_sta) IN (' . implode(',', $placeholders) . ')';
        }

        if ($isPaid !== null) {
            $conditions[] = 'a.appointment_ispaid = :is_paid';
            $params[':is_paid'] = $isPaid;
        }

        $where = 'WHERE ' . implode(' AND ', $conditions);
        $stmt = $pdo->prepare("$baseQuery $where ORDER BY a.appointment_date DESC, a.appointment_id DESC");
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else {
        // Optional status + payment filter on the full list
        $conditions = [];
        $params = [];

        if ($status !== null) {
            $statusArray = explode(',', $status);
            $placeholders = [];
            foreach ($statusArray as $index => $s) {
                $key = ":status$index";
                $placeholders[] = $key;
                $params[$key] = strtolower(trim($s));
            }
            $conditions[] = 'LOWER(a.appointment_sta) IN (' . implode(',', $placeholders) . ')';
        }

        if ($isPaid !== null) {
            $conditions[] = 'a.appointment_ispaid = :is_paid';
            $params[':is_paid'] = $isPaid;
        }

        if (!empty($conditions)) {
            $where = 'WHERE ' . implode(' AND ', $conditions);
            $stmt = $pdo->prepare("$baseQuery $where ORDER BY a.appointment_date DESC, a.appointment_id DESC");
            $stmt->execute($params);
        } else {
            $stmt = $pdo->query("$baseQuery ORDER BY a.appointment_date DESC, a.appointment_id DESC");
        }
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

function handlePost($pdo)
{
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['appointment_fileid'], $data['appointment_doctor'], $data['appointment_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    // Generate appointment number if not provided
    $appointment_number = $data['appointment_number'] ?? 'AP-' . date('YmdHis') . rand(100, 999);

    $sql = "INSERT INTO tbl_appointment (
                appointment_fileid, appointment_doctor, appointment_shift, 
                appointment_date, appointment_priority, appointment_sta, 
                appointment_ispaid, appointment_messege, appointment_alternate_address, 
                appointment_number, is_subfile, appointment_department, appointment_fee
            ) VALUES (
                :fileid, :doctor, :shift, 
                :adate, :priority, :asta, 
                :ispaid, :message, :alt_address, 
                :anumber, :is_subfile, :department, :fee
            )";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fileid' => $data['appointment_fileid'],
            ':doctor' => $data['appointment_doctor'],
            ':shift' => $data['appointment_shift'] ?? null,
            ':adate' => $data['appointment_date'],
            ':priority' => $data['appointment_priority'] ?? 'Normal',
            ':asta' => $data['appointment_sta'] ?? 'Scheduled',
            ':ispaid' => $data['appointment_ispaid'] ?? 0,
            ':message' => $data['appointment_messege'] ?? null,
            ':alt_address' => $data['appointment_alternate_address'] ?? null,
            ':anumber' => $appointment_number,
            ':is_subfile' => $data['is_subfile'] ?? 0,
            ':department' => $data['appointment_department'] ?? null,
            ':fee' => $data['appointment_fee'] ?? 0
        ]);

        $id = $pdo->lastInsertId();
        echo json_encode([
            'success' => true,
            'appointment_id' => $id,
            'appointment_number' => $appointment_number
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create appointment: ' . $e->getMessage()]);
    }
}

function handlePut($pdo)
{
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['appointment_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing appointment ID']);
        return;
    }

    $sql = "UPDATE tbl_appointment SET 
                appointment_doctor = :doctor,
                appointment_shift = :shift,
                appointment_date = :adate,
                appointment_priority = :priority,
                appointment_sta = :asta,
                appointment_ispaid = :ispaid,
                appointment_messege = :message,
                appointment_alternate_address = :alt_address,
                is_subfile = :is_subfile,
                appointment_department = :department,
                appointment_fee = :fee
            WHERE appointment_id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':doctor' => $data['appointment_doctor'],
            ':shift' => $data['appointment_shift'],
            ':adate' => $data['appointment_date'],
            ':priority' => $data['appointment_priority'],
            ':asta' => $data['appointment_sta'],
            ':ispaid' => $data['appointment_ispaid'],
            ':message' => $data['appointment_messege'],
            ':alt_address' => $data['appointment_alternate_address'],
            ':is_subfile' => $data['is_subfile'],
            ':department' => $data['appointment_department'],
            ':fee' => $data['appointment_fee'] ?? 0,
            ':id' => $data['appointment_id']
        ]);

        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update appointment: ' . $e->getMessage()]);
    }
}

function handleDelete($pdo)
{
    $id = $_GET['appointment_id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing appointment ID']);
        return;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM tbl_appointment WHERE appointment_id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete appointment: ' . $e->getMessage()]);
    }
}
