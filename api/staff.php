<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

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
        send_response(['error' => 'Method not allowed'], 405);
        break;
}

function handleGet($pdo)
{
    try {
        $sql = "SELECT s.*, d.department_name 
                FROM tbl_staff s 
                LEFT JOIN tbl_department d ON s.staff_department_id = d.department_id 
                ORDER BY s.staff_fname ASC, s.staff_lname ASC";
        $stmt = $pdo->query($sql);
        $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_response($staff);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function generateStaffUniqueId($pdo)
{
    $stmt = $pdo->query("SELECT staff_unique FROM tbl_staff ORDER BY staff_id DESC LIMIT 1");
    $lastId = $stmt->fetchColumn();

    if (!$lastId) {
        return 'GH-ST-001';
    }

    $parts = explode('-', $lastId);
    $num = intval(end($parts)) + 1;
    return 'GH-ST-' . str_pad($num, 3, '0', STR_PAD_LEFT);
}

function handlePost($pdo)
{
    $data = get_request_data();

    if (empty($data['staff_fname']) || empty($data['staff_lname']) || empty($data['staff_email'])) {
        send_response(['error' => 'First name, last name, and email are required'], 400);
    }

    try {
        $staff_unique = generateStaffUniqueId($pdo);

        $sql = "INSERT INTO tbl_staff (
                    staff_unique, staff_fname, staff_mname, staff_lname, 
                    staff_gender, staff_email, staff_phone, staff_address, 
                    staff_department_id, staff_role, staff_employment_type, 
                    staff_status, staff_image, staff_salary, staff_dob, 
                    staff_qualification, staff_license_number
                ) VALUES (
                    :unique, :fname, :mname, :lname, 
                    :gender, :email, :phone, :address, 
                    :dept_id, :role, :emp_type, 
                    :status, :image, :salary, :dob, 
                    :qualification, :license
                )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':unique' => $staff_unique,
            ':fname' => $data['staff_fname'],
            ':mname' => $data['staff_mname'] ?? null,
            ':lname' => $data['staff_lname'],
            ':gender' => $data['staff_gender'] ?? 'Male',
            ':email' => $data['staff_email'],
            ':phone' => $data['staff_phone'] ?? '',
            ':address' => $data['staff_address'] ?? null,
            ':dept_id' => $data['staff_department_id'] ?? null,
            ':role' => $data['staff_role'] ?? 'Staff',
            ':emp_type' => $data['staff_employment_type'] ?? 'Full-time',
            ':status' => $data['staff_status'] ?? 'Active',
            ':image' => $data['staff_image'] ?? null,
            ':salary' => $data['staff_salary'] ?? 0.00,
            ':dob' => $data['staff_dob'] ?? null,
            ':qualification' => $data['staff_qualification'] ?? null,
            ':license' => $data['staff_license_number'] ?? null
        ]);

        $id = $pdo->lastInsertId();

        log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_STAFF', 'Staff', null, array_merge($data, ['staff_unique' => $staff_unique]));

        send_response(['id' => $id, 'staff_unique' => $staff_unique, 'message' => 'Staff created successfully'], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            send_response(['error' => 'Email address already exists'], 400);
        }
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePut($pdo)
{
    $data = get_request_data();

    if (empty($data['staff_id'])) {
        send_response(['error' => 'Staff ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_staff WHERE staff_id = ?");
        $stmt->execute([$data['staff_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Staff member not found'], 404);
        }

        $sql = "UPDATE tbl_staff SET 
                    staff_fname = :fname, 
                    staff_mname = :mname, 
                    staff_lname = :lname, 
                    staff_gender = :gender, 
                    staff_email = :email, 
                    staff_phone = :phone, 
                    staff_address = :address, 
                    staff_department_id = :dept_id, 
                    staff_role = :role, 
                    staff_employment_type = :emp_type, 
                    staff_status = :status, 
                    staff_image = :image, 
                    staff_salary = :salary, 
                    staff_dob = :dob, 
                    staff_qualification = :qualification, 
                    staff_license_number = :license
                WHERE staff_id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fname' => $data['staff_fname'] ?? $oldValue['staff_fname'],
            ':mname' => $data['staff_mname'] ?? $oldValue['staff_mname'],
            ':lname' => $data['staff_lname'] ?? $oldValue['staff_lname'],
            ':gender' => $data['staff_gender'] ?? $oldValue['staff_gender'],
            ':email' => $data['staff_email'] ?? $oldValue['staff_email'],
            ':phone' => $data['staff_phone'] ?? $oldValue['staff_phone'],
            ':address' => $data['staff_address'] ?? $oldValue['staff_address'],
            ':dept_id' => $data['staff_department_id'] ?? $oldValue['staff_department_id'],
            ':role' => $data['staff_role'] ?? $oldValue['staff_role'],
            ':emp_type' => $data['staff_employment_type'] ?? $oldValue['staff_employment_type'],
            ':status' => $data['staff_status'] ?? $oldValue['staff_status'],
            ':image' => $data['staff_image'] ?? $oldValue['staff_image'],
            ':salary' => $data['staff_salary'] ?? $oldValue['staff_salary'],
            ':dob' => $data['staff_dob'] ?? $oldValue['staff_dob'],
            ':qualification' => $data['staff_qualification'] ?? $oldValue['staff_qualification'],
            ':license' => $data['staff_license_number'] ?? $oldValue['staff_license_number'],
            ':id' => $data['staff_id']
        ]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_STAFF', 'Staff', $oldValue, $data);

        send_response(['message' => 'Staff updated successfully']);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            send_response(['error' => 'Email address already exists'], 400);
        }
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleDelete($pdo)
{
    $data = get_request_data();

    if (empty($data['staff_id'])) {
        send_response(['error' => 'Staff ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_staff WHERE staff_id = ?");
        $stmt->execute([$data['staff_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Staff member not found'], 404);
        }

        $stmt = $pdo->prepare("DELETE FROM tbl_staff WHERE staff_id = ?");
        $stmt->execute([$data['staff_id']]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_STAFF', 'Staff', $oldValue, null);

        send_response(['message' => 'Staff deleted successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>