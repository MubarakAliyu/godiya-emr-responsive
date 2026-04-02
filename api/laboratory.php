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
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet($pdo)
{
    $action = $_GET['action'] ?? '';

    if ($action === 'get_items') {
        try {
            $stmt = $pdo->query("SELECT * FROM tbl_test_item ORDER BY item_name ASC");
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            send_response($items);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'search_patients') {
        $query = $_GET['query'] ?? '';
        try {
            $stmt = $pdo->prepare("SELECT patient_id, patient_unique_id as file_number, full_name as name, phone_number as phone, dob, gender, file_type 
                                  FROM tbl_patients 
                                  WHERE full_name LIKE :query1 OR patient_unique_id LIKE :query2 
                                  LIMIT 10");
            $stmt->execute([':query1' => "%$query%", ':query2' => "%$query%"]);
            $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            send_response($patients);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'get_subfiles') {
        $file_id = $_GET['file_id'] ?? '';
        try {
            // First, get the patient details to know both patient_id and patient_unique_id
            $stmt = $pdo->prepare("SELECT patient_id, patient_unique_id FROM tbl_patients WHERE patient_unique_id = ? OR patient_id = ?");
            $stmt->execute([$file_id, $file_id]);
            $parent = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$parent) {
                $p_id = $file_id;
                $p_unique = $file_id;
            } else {
                $p_id = $parent['patient_id'];
                $p_unique = $parent['patient_unique_id'];
            }

            // Fetch from tbl_subfile (simple members) AND tbl_patients (full members linked as sub-files)
            $stmt = $pdo->prepare("
                SELECT subfile_id as id, CONCAT(subfile_fname, ' ', subfile_lname) as name, subfile_gender as gender, 'Family Member' as relationship 
                FROM tbl_subfile 
                WHERE subfile_file_id = :u1 OR subfile_file_id = :i1
                UNION
                SELECT patient_unique_id as id, full_name as name, gender, 'Member' as relationship
                FROM tbl_patients
                WHERE parent_file_id = :u2 OR parent_file_id = :i2
            ");
            $stmt->execute([
                ':u1' => $p_unique,
                ':i1' => $p_id,
                ':u2' => $p_unique,
                ':i2' => $p_id
            ]);
            $subfiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            send_response($subfiles);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'get_pending_tests') {
        $fileNumber = $_GET['file_number'] ?? null;
        $status = $_GET['sta'] ?? 'pending';
        try {
            $conditions = [];
            $params = [];
            if ($status !== 'all') {
                $conditions[] = "lt.sta = :sta";
                $params[':sta'] = $status;
            }
            if ($fileNumber) {
                $conditions[] = "c.patient_id = :file_number";
                $params[':file_number'] = $fileNumber;
            }

            $whereClause = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";

            $sql = "
                SELECT 
                    lt.id,
                    lt.test as test_json,
                    lt.created_at as date,
                    lt.sta,
                    lt.is_paid,
                    c.patient_id as c_patient_id,
                    c.is_subfile,
                    c.doctor_id,
                    u.full_name as doctor_name,
                    p.patient_unique_id as p_file_number,
                    p.full_name as p_name,
                    p.phone_number as p_phone,
                    p.dob as p_dob,
                    p.gender as p_gender,
                    p.patient_type as p_category,
                    CONCAT(sf.subfile_fname, ' ', sf.subfile_lname) as sf_name,
                    sf.subfile_file_id as sf_parent_file,
                    sf.subfile_dob as sf_dob,
                    sf.subfile_gender as sf_gender
                FROM tbl_lab_tests lt
                JOIN tbl_consultation_data c ON lt.consultation_id = c.id
                LEFT JOIN users u ON c.doctor_id = u.id
                LEFT JOIN tbl_patients p ON c.patient_id = p.patient_unique_id AND c.is_subfile = 0
                LEFT JOIN tbl_subfile sf ON sf.subfile_id = SUBSTRING(c.patient_id, 4) AND c.is_subfile = 1
                $whereClause
                ORDER BY lt.created_at DESC
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $results = [];
            foreach ($rows as $row) {
                $isSubfile = (int) $row['is_subfile'] === 1;
                $testList = json_decode($row['test_json'], true);

                $results[] = [
                    'id' => $row['id'],
                    'fileNumber' => $isSubfile ? $row['sf_parent_file'] : $row['p_file_number'],
                    'patientName' => $isSubfile ? $row['sf_name'] : $row['p_name'],
                    'patientId' => $row['c_patient_id'],
                    'labTests' => is_array($testList) ? $testList : [],
                    'date' => $row['date'],
                    'status' => $row['sta'],
                    'isPaid' => (int) $row['is_paid'],
                    'doctor' => $row['doctor_name'] ?? 'Unknown Doctor',
                    'patientPhone' => $row['p_phone'] ?? 'N/A',
                    'patientAge' => $isSubfile ? $row['sf_dob'] : $row['p_dob'],
                    'patientGender' => $isSubfile ? $row['sf_gender'] : $row['p_gender'],
                    'category' => $row['p_category'] ?? 'OPD'
                ];
            }
            send_response($results);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'get_lab_kpis') {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM test_invoice WHERE is_paid = 0");
            $awaitingPayment = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            // Updated to fetch from tbl_lab_tests as requested
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM tbl_lab_tests WHERE sta = 'pending'");
            $awaitingResult = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM test_invoice");
            $totalTests = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM test_invoice WHERE sta = 1");
            $completedTests = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $pdo->query("SELECT COUNT(*) as count FROM test_invoice WHERE DATE(gen_date) = CURDATE()");
            $testsToday = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            send_response([
                'awaitingPayment' => (int) $awaitingPayment,
                'awaitingResult' => (int) $awaitingResult,
                'totalTests' => (int) $totalTests,
                'completedTests' => (int) $completedTests,
                'testsToday' => (int) $testsToday
            ]);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'get_paid_invoices') {
        try {
            $sql = "
                SELECT 
                    i.*,
                    p.full_name as p_name,
                    p.patient_unique_id as p_file_number,
                    CONCAT(sf.subfile_fname, ' ', sf.subfile_lname) as sf_name,
                    sf.subfile_file_id as sf_parent_file_id
                FROM test_invoice i
                LEFT JOIN tbl_patients p ON i.inv_file_number = p.patient_unique_id AND i.is_subfile = 0
                LEFT JOIN tbl_subfile sf ON i.is_subfile = 1 AND sf.subfile_id = (CASE WHEN i.inv_file_number LIKE 'SF-%' THEN SUBSTRING(i.inv_file_number, 4) ELSE i.inv_file_number END)
                WHERE i.is_paid = 1
                ORDER BY i.gen_date DESC
            ";
            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $results = [];
            foreach ($rows as $row) {
                $isSubfile = (int) $row['is_subfile'] === 1;
                $results[] = [
                    'id' => $row['inv_id'],
                    'invoice_id' => $row['inv_id'],
                    'fileNumber' => $isSubfile ? ($row['sf_parent_file_id'] ?? $row['inv_file_number']) : ($row['p_file_number'] ?? $row['inv_file_number']),
                    'subFileNumber' => $row['inv_file_number'],
                    'patientName' => $isSubfile ? (trim(($row['sf_parent_file_id'] ?? '') . ' ' . ($row['sf_name'] ?: 'Sub-file Patient'))) : ($row['p_name'] ?: ($row['inv_file_number'] ?: 'Walk-in Patient')),
                    'total' => (float) ($row['total'] ?? 0),
                    'date' => $row['gen_date'],
                    'status' => (int) ($row['sta'] ?? 0) === 1 ? 'Completed' : 'Awaiting Result',
                    'sta' => (int) ($row['sta'] ?? 0),
                    'test_list' => json_decode($row['test_list'] ?? '[]', true) ?: [],
                    'is_subfile' => $isSubfile
                ];
            }
            send_response($results);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'get_invoice_records') {
        $fileNumber = $_GET['file_number'] ?? null;
        try {
            $whereClause = $fileNumber ? "WHERE i.inv_file_number = :file_number" : "";
            $sql = "
                SELECT 
                    i.*,
                    p.full_name as p_name,
                    p.patient_unique_id as p_file_number,
                    p.phone_number as p_phone,
                    CONCAT(sf.subfile_fname, ' ', sf.subfile_lname) as sf_name,
                    sf.subfile_file_id as sf_parent_file_id
                FROM test_invoice i
                LEFT JOIN tbl_patients p ON i.inv_file_number = p.patient_unique_id AND i.is_subfile = 0
                LEFT JOIN tbl_subfile sf ON i.is_subfile = 1 AND sf.subfile_id = (CASE WHEN i.inv_file_number LIKE 'SF-%' THEN SUBSTRING(i.inv_file_number, 4) ELSE i.inv_file_number END)
                $whereClause
                ORDER BY i.gen_date DESC
            ";
            $stmt = $pdo->prepare($sql);
            $fileNumber ? $stmt->execute([':file_number' => $fileNumber]) : $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $results = [];
            foreach ($rows as $row) {
                $isSubfile = (int) $row['is_subfile'] === 1;
                $results[] = [
                    'id' => $row['inv_id'],
                    'invoiceNumber' => 'INV-' . str_pad($row['inv_id'], 6, '0', STR_PAD_LEFT),
                    'fileNumber' => $isSubfile ? ($row['sf_parent_file_id'] ?? $row['inv_file_number']) : ($row['p_file_number'] ?? $row['inv_file_number']),
                    'parentFileNumber' => $isSubfile ? ($row['sf_parent_file_id'] ?? '') : '',
                    'subFileName' => $isSubfile ? ($row['sf_name'] ?? '') : '',
                    'subFileNumber' => $row['inv_file_number'],
                    'patientName' => $isSubfile ? (trim(($row['sf_parent_file_id'] ?? '') . ' ' . ($row['sf_name'] ?: 'Sub-file Patient'))) : ($row['p_name'] ?: ($row['inv_file_number'] ?: 'Walk-in Patient')),
                    'phoneNumber' => $row['p_phone'] ?? 'N/A',
                    'total' => (float) ($row['total'] ?? 0),
                    'date' => $row['gen_date'],
                    'status' => (int) $row['is_paid'] === 1 ? 'Paid' : 'Unpaid',
                    'sta' => (int) $row['sta'],
                    'tests' => json_decode($row['test_list'] ?? '[]', true) ?: [],
                    'is_subfile' => $isSubfile
                ];
            }
            send_response($results);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'get_test_result') {
        $lab_invoice_id = $_GET['lab_invoice_id'] ?? '';
        if (empty($lab_invoice_id)) {
            send_response(['error' => 'Invoice ID is required'], 400);
        }
        try {
            $stmt = $pdo->prepare("SELECT * FROM tbl_lab_test_result WHERE lab_invoice_id = :id");
            $stmt->execute([':id' => $lab_invoice_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $result['result_list'] = json_decode($result['result_list'], true);
                send_response($result);
            } else {
                send_response(['error' => 'Result not found'], 404);
            }
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        send_response(['error' => 'Invalid action'], 400);
    }
}

function handlePost($pdo)
{
    $data = get_request_data();
    $action = $data['action'] ?? '';

    if ($action === 'add_test_item') {
        $name = $data['item_name'] ?? '';
        $fees = $data['item_fees'] ?? '';

        if (empty($name) || empty($fees)) {
            send_response(['error' => 'Test name and fees are required'], 400);
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO tbl_test_item (item_name, item_fees) VALUES (:name, :fees)");
            $stmt->execute([
                ':name' => $name,
                ':fees' => $fees
            ]);

            log_activity($pdo, $data['performerId'] ?? 'System', 'ADD_LAB_TEST_ITEM', 'Laboratory', null, ['name' => $name, 'fees' => $fees]);

            send_response(['success' => true, 'message' => 'Laboratory test item added successfully', 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'update_test_item') {
        $id = $data['item_id'] ?? '';
        $name = $data['item_name'] ?? '';
        $fees = $data['item_fees'] ?? '';

        if (empty($id) || empty($name) || empty($fees)) {
            send_response(['error' => 'Item ID, name and fees are required'], 400);
        }

        try {
            $stmt = $pdo->prepare("UPDATE tbl_test_item SET item_name = :name, item_fees = :fees WHERE item_id = :id");
            $stmt->execute([
                ':name' => $name,
                ':fees' => $fees,
                ':id' => $id
            ]);

            log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_LAB_TEST_ITEM', 'Laboratory', $id, ['name' => $name, 'fees' => $fees]);

            send_response(['success' => true, 'message' => 'Laboratory test item updated successfully']);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'delete_test_item') {
        $id = $data['item_id'] ?? '';

        if (empty($id)) {
            send_response(['error' => 'Item ID is required'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM tbl_test_item WHERE item_id = :id");
            $stmt->execute([':id' => $id]);

            log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_LAB_TEST_ITEM', 'Laboratory', $id);

            send_response(['success' => true, 'message' => 'Laboratory test item deleted successfully']);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'delete_invoice') {
        $id = $data['id'] ?? '';
        if (empty($id)) {
            send_response(['error' => 'Invoice ID is required'], 400);
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM test_invoice WHERE inv_id = :id");
            $stmt->execute([':id' => $id]);
            log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_LAB_INVOICE', 'Laboratory', $id);
            send_response(['success' => true, 'message' => 'Invoice deleted successfully']);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'save_invoice') {
        $test_list = $data['test_list'] ?? '';
        $total = $data['total'] ?? '';
        $inv_file_number = $data['inv_file_number'] ?? '';
        $is_subfile = $data['is_subfile'] ?? 0;
        $gen_date = date('Y-m-d H:i:s');

        $is_paid = $data['is_paid'] ?? 0;

        if (empty($test_list) || empty($total) || empty($inv_file_number)) {
            send_response(['error' => 'Missing required invoice data'], 400);
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO test_invoice (test_list, is_paid, gen_date, sta, total, inv_file_number, is_subfile) 
                                  VALUES (:test_list, 0, :gen_date, 0, :total, :inv_file_number, :is_subfile)");
            $stmt->execute([
                ':test_list' => is_array($test_list) ? json_encode($test_list) : $test_list,
                ':gen_date' => $gen_date,
                ':total' => $total,
                ':inv_file_number' => $inv_file_number,
                ':is_subfile' => $is_subfile
            ]);

            $invoice_id = $pdo->lastInsertId();

            log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_LAB_INVOICE', 'Laboratory', $invoice_id, [
                'file_number' => $inv_file_number,
                'total' => $total
            ]);

            send_response(['success' => true, 'message' => 'Invoice saved successfully', 'invoice_id' => $invoice_id]);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'update_test_status') {
        $id = $data['id'] ?? '';
        $status = $data['status'] ?? '';

        if (empty($id) || empty($status)) {
            send_response(['error' => 'ID and status are required'], 400);
        }

        try {
            $stmt = $pdo->prepare("UPDATE tbl_lab_tests SET sta = :status WHERE id = :id");
            $stmt->execute([':status' => $status, ':id' => $id]);

            log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_LAB_TEST_STATUS', 'Laboratory', $id, ['status' => $status]);

            send_response(['success' => true, 'message' => 'Lab test status updated successfully']);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'save_test_result') {
        $lab_invoice_id = $data['lab_invoice_id'] ?? '';
        $result_list = $data['result_list'] ?? [];
        $result_picture = $data['result_picture'] ?? '';
        $result_date = date('Y-m-d H:i:s');

        // Map session user ID to numeric staff_id if possible
        $technician_id = 0;
        if (isset($_SESSION['user_id'])) {
            try {
                $stmt_staff = $pdo->prepare("SELECT id FROM users WHERE id = ? OR email = ? LIMIT 1");
                $stmt_staff->execute([$_SESSION['user_id'], $_SESSION['user_email'] ?? '']);
                $staff = $stmt_staff->fetch(PDO::FETCH_ASSOC);
                if ($staff) {
                    $technician_id = $staff['id'];
                } else {
                    $technician_id = $_SESSION['user_id'];
                }
            } catch (Exception $e) {
                // Ignore and use 0 or cast user_id
                $technician_id = (int) ($_SESSION['user_id'] ?? 0);
            }
        }

        if (empty($lab_invoice_id)) {
            send_response(['error' => 'Invoice ID is required'], 400);
        }

        try {
            $pdo->beginTransaction();

            // 1. Check if result already exists
            $stmt = $pdo->prepare("SELECT result_id FROM tbl_lab_test_result WHERE lab_invoice_id = :id");
            $stmt->execute([':id' => $lab_invoice_id]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);

            $encoded_list = is_array($result_list) ? json_encode($result_list) : $result_list;

            if ($existing) {
                // Update
                $sql = "UPDATE tbl_lab_test_result 
                        SET result_list = :list, result_date = :date, technician_id = :tech, result_picture = :pic 
                        WHERE lab_invoice_id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':list' => $encoded_list,
                    ':date' => $result_date,
                    ':tech' => $technician_id,
                    ':pic' => $result_picture,
                    ':id' => $lab_invoice_id
                ]);
            } else {
                // Insert
                $sql = "INSERT INTO tbl_lab_test_result (lab_invoice_id, result_list, result_date, technician_id, result_picture) 
                        VALUES (:id, :list, :date, :tech, :pic)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    ':id' => $lab_invoice_id,
                    ':list' => $encoded_list,
                    ':date' => $result_date,
                    ':tech' => $technician_id,
                    ':pic' => $result_picture
                ]);
            }

            // 2. Update status in test_invoice
            $stmt = $pdo->prepare("UPDATE test_invoice SET sta = 1 WHERE inv_id = :id");
            $stmt->execute([':id' => $lab_invoice_id]);

            log_activity($pdo, $_SESSION['user_id'] ?? 'System', 'SAVE_LAB_RESULT', 'Laboratory', $lab_invoice_id);

            $pdo->commit();
            send_response(['success' => true, 'message' => 'Test results saved successfully']);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            // Log the literal error for the developer but return JSON to the client
            error_log("Laboratory Save Result Error: " . $e->getMessage());
            send_response(['error' => 'Error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'confirm_lab_payment') {
        $invoice_id = $data['id'] ?? '';
        $pin = $data['pin'] ?? '';
        $payment_method = $data['payment_method'] ?? 'cash';
        $email = $_SESSION['user_email'] ?? '';

        if (empty($invoice_id) || empty($pin)) {
            send_response(['error' => 'Invoice ID and PIN are required'], 400);
        }

        try {
            // 1. Verify Cashier PIN
            $stmt = $pdo->prepare("SELECT pin_hash FROM tbl_cashier_pin WHERE user_email = ?");
            $stmt->execute([$email]);
            $row = $stmt->fetch();

            if (!$row) {
                send_response(['error' => 'No PIN set for this account. Please set a PIN in settings.'], 404);
            }
            if (!password_verify($pin, $row['pin_hash'])) {
                send_response(['error' => 'Incorrect PIN'], 401);
            }

            // 2. Update Invoice Status
            $stmt = $pdo->prepare("UPDATE test_invoice SET is_paid = 1 WHERE inv_id = :id");
            $stmt->execute([':id' => $invoice_id]);

            log_activity($pdo, $_SESSION['user_id'] ?? 'System', 'CONFIRM_LAB_PAYMENT', 'Cashier', $invoice_id, [
                'invoice_id' => $invoice_id,
                'is_paid' => 1,
                'payment_method' => $payment_method
            ]);

            send_response(['success' => true, 'message' => 'Payment confirmed successfully']);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        send_response(['error' => 'Invalid action'], 400);
    }
}
