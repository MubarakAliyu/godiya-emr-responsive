<?php
/**
 * Users CRUD API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = get_request_data();

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo, $data);
        break;
    case 'PUT':
        handlePut($pdo, $data);
        break;
    case 'DELETE':
        handleDelete($pdo, $data);
        break;
    default:
        send_response(["error" => "Method not allowed"], 405);
}

/**
 * Handle GET requests
 */
function handleGet($pdo)
{
    $id = $_GET['id'] ?? null;
    $role = $_GET['role'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare("SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) {
            send_response(["error" => "User not found"], 404);
        }

        // Don't return password hash
        unset($user['password_hash']);
        send_response($user);
    } else {
        $query = "SELECT u.id, u.first_name, u.last_name, u.full_name, u.email, u.phone, u.username, u.department, u.role_id, u.status, u.last_login, u.created_at, r.role_name 
                  FROM users u LEFT JOIN roles r ON u.role_id = r.id";
        $params = [];

        if ($role) {
            $query .= " WHERE r.role_name = ?";
            $params[] = $role;
        }

        $query .= " ORDER BY u.created_at DESC";
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll();
        send_response($users);
    }
}

/**
 * Handle POST requests (Create)
 */
function handlePost($pdo, $data)
{
    if (empty($data['email']) || empty($data['username']) || empty($data['password'])) {
        send_response(["error" => "Email, username, and password are required"], 400);
    }

    try {
        $pdo->beginTransaction();

        $id = $data['id'] ?? 'GH-US-' . bin2hex(random_bytes(4));
        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("INSERT INTO users (id, first_name, last_name, full_name, email, phone, username, password_hash, department, role_id, status, created_by) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $id,
            $data['firstName'],
            $data['lastName'],
            $data['fullName'] ?? ($data['firstName'] . ' ' . $data['lastName']),
            $data['email'],
            $data['phone'] ?? null,
            $data['username'],
            $password_hash,
            $data['department'] ?? null,
            $data['roleId'] ?? null,
            $data['status'] ?? 'Active',
            $data['createdBy'] ?? 'System'
        ]);

        // Audit Log
        log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_USER', 'Administration', null, ["id" => $id, "username" => $data['username']]);

        $pdo->commit();
        send_response(["message" => "User created successfully", "id" => $id], 201);

    } catch (Exception $e) {
        $pdo->rollBack();
        send_response(["error" => $e->getMessage()], 500);
    }
}

/**
 * Handle PUT requests (Update)
 */
function handlePut($pdo, $data)
{
    $id = $data['id'] ?? null;
    if (!$id) {
        send_response(["error" => "User ID is required for update"], 400);
    }

    try {
        $pdo->beginTransaction();

        // Get old data for audit
        $stmtOld = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldUser = $stmtOld->fetch();

        if (!$oldUser) {
            send_response(["error" => "User not found"], 404);
        }

        // Build update query dynamically
        $fields = [];
        $params = [];

        $updatable = ['first_name', 'last_name', 'full_name', 'email', 'phone', 'department', 'role_id', 'status'];
        foreach ($updatable as $field) {
            // camelCase to snake_case mapping if needed, or assume consistent
            $key = str_replace('_', '', lcfirst(ucwords($field, '_'))); // basic mapping
            if (isset($data[$key])) {
                $fields[] = "$field = ?";
                $params[] = $data[$key];
            }
        }

        // Handle password separately
        if (!empty($data['password'])) {
            $fields[] = "password_hash = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (empty($fields)) {
            send_response(["message" => "No changes provided"]);
        }

        $params[] = $id;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Audit Log
        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_USER', 'Administration', ["id" => $id], $data);

        $pdo->commit();
        send_response(["message" => "User updated successfully"]);

    } catch (Exception $e) {
        $pdo->rollBack();
        send_response(["error" => $e->getMessage()], 500);
    }
}

/**
 * Handle DELETE requests
 */
function handleDelete($pdo, $data)
{
    $id = $data['id'] ?? $_GET['id'] ?? null;
    if (!$id) {
        send_response(["error" => "User ID is required for deletion"], 400);
    }

    try {
        // Get old data for audit
        $stmtOld = $pdo->prepare("SELECT id, username, email FROM users WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldUser = $stmtOld->fetch();

        if (!$oldUser) {
            send_response(["error" => "User not found"], 404);
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        // Audit Log
        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_USER', 'Administration', $oldUser, null);

        send_response(["message" => "User deleted successfully"]);

    } catch (Exception $e) {
        send_response(["error" => $e->getMessage()], 500);
    }
}
?>