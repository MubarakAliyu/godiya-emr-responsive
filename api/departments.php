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
        $sql = "SELECT d.*, 
                (SELECT COUNT(*) FROM tbl_staff s WHERE s.staff_department_id = d.department_id) as staffCount 
                FROM tbl_department d 
                ORDER BY d.department_name ASC";
        $stmt = $pdo->query($sql);
        $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_response($departments);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePost($pdo)
{
    $data = get_request_data();

    if (empty($data['department_name'])) {
        send_response(['error' => 'Department name is required'], 400);
    }

    try {
        $sql = "INSERT INTO tbl_department (department_name, department_description, department_type, department_status) 
                VALUES (:name, :description, :type, :status)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $data['department_name'],
            ':description' => $data['department_description'] ?? null,
            ':type' => $data['department_type'] ?? 'Clinical',
            ':status' => $data['department_status'] ?? 1
        ]);

        $id = $pdo->lastInsertId();

        log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_DEPARTMENT', 'Staff', null, $data);

        send_response(['id' => $id, 'message' => 'Department created successfully'], 201);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePut($pdo)
{
    $data = get_request_data();

    if (empty($data['department_id'])) {
        send_response(['error' => 'Department ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_department WHERE department_id = ?");
        $stmt->execute([$data['department_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Department not found'], 404);
        }

        $sql = "UPDATE tbl_department SET 
                department_name = :name, 
                department_description = :description, 
                department_type = :type, 
                department_status = :status 
                WHERE department_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $data['department_name'] ?? $oldValue['department_name'],
            ':description' => $data['department_description'] ?? $oldValue['department_description'],
            ':type' => $data['department_type'] ?? $oldValue['department_type'],
            ':status' => $data['department_status'] ?? $oldValue['department_status'],
            ':id' => $data['department_id']
        ]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_DEPARTMENT', 'Staff', $oldValue, $data);

        send_response(['message' => 'Department updated successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleDelete($pdo)
{
    $data = get_request_data();

    if (empty($data['department_id'])) {
        send_response(['error' => 'Department ID is required'], 400);
    }

    try {
        // Check if users are assigned to this department
        $stmtDept = $pdo->prepare("SELECT department_name FROM tbl_department WHERE department_id = ?");
        $stmtDept->execute([$data['department_id']]);
        $deptName = $stmtDept->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE department = ?");
        $stmt->execute([$deptName]);
        if ($stmt->fetchColumn() > 0) {
            send_response(['error' => 'Cannot delete department with assigned users'], 400);
        }

        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_department WHERE department_id = ?");
        $stmt->execute([$data['department_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("DELETE FROM tbl_department WHERE department_id = ?");
        $stmt->execute([$data['department_id']]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_DEPARTMENT', 'Staff', $oldValue, null);

        send_response(['message' => 'Department deleted successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>