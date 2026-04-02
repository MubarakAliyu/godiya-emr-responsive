<?php
/**
 * Roles CRUD API
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

    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
        $stmt->execute([$id]);
        $role = $stmt->fetch();

        if (!$role) {
            send_response(["error" => "Role not found"], 404);
        }

        // Get permissions
        $stmtPerms = $pdo->prepare("SELECT * FROM role_permissions WHERE role_id = ?");
        $stmtPerms->execute([$id]);
        $role['permissions'] = $stmtPerms->fetchAll();

        send_response($role);
    } else {
        $stmt = $pdo->query("SELECT * FROM roles ORDER BY created_at DESC");
        $roles = $stmt->fetchAll();

        // Include permissions for each role in the list view
        foreach ($roles as &$role) {
            $stmtPerms = $pdo->prepare("SELECT 
                module_name as module, 
                can_view as view, 
                can_create as `create`, 
                can_edit as edit, 
                can_delete as `delete`, 
                can_export as export, 
                can_approve as approve 
                FROM role_permissions WHERE role_id = ?");
            $stmtPerms->execute([$role['id']]);
            $role['permissions'] = $stmtPerms->fetchAll();
        }

        send_response($roles);
    }
}

/**
 * Handle POST requests (Create)
 */
function handlePost($pdo, $data)
{
    if (empty($data['roleName'])) {
        send_response(["error" => "Role name is required"], 400);
    }

    try {
        $pdo->beginTransaction();

        $id = $data['id'] ?? 'GH-RL-' . bin2hex(random_bytes(4));
        $stmt = $pdo->prepare("INSERT INTO roles (id, role_name, description, department_scope, status, created_by) 
                               VALUES (?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $id,
            $data['roleName'],
            $data['description'] ?? '',
            isset($data['departmentScope']) ? json_encode($data['departmentScope']) : null,
            $data['status'] ?? 'Active',
            $data['createdBy'] ?? 'System'
        ]);

        // Insert permissions if provided
        if (!empty($data['permissions']) && is_array($data['permissions'])) {
            $stmtPerm = $pdo->prepare("INSERT INTO role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export, can_approve) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($data['permissions'] as $perm) {
                $stmtPerm->execute([
                    $id,
                    $perm['module'],
                    $perm['view'] ? 1 : 0,
                    $perm['create'] ? 1 : 0,
                    $perm['edit'] ? 1 : 0,
                    $perm['delete'] ? 1 : 0,
                    $perm['export'] ? 1 : 0,
                    $perm['approve'] ? 1 : 0
                ]);
            }
        }

        // Audit Log
        log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_ROLE', 'Administration', null, $data);

        $pdo->commit();
        send_response(["message" => "Role created successfully", "id" => $id], 201);

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
        send_response(["error" => "Role ID is required for update"], 400);
    }

    try {
        $pdo->beginTransaction();

        // Get old data for audit
        $stmtOld = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldRole = $stmtOld->fetch();

        if (!$oldRole) {
            send_response(["error" => "Role not found"], 404);
        }

        $stmt = $pdo->prepare("UPDATE roles SET role_name = ?, description = ?, department_scope = ?, status = ? WHERE id = ?");
        $stmt->execute([
            $data['roleName'] ?? $oldRole['role_name'],
            $data['description'] ?? $oldRole['description'],
            isset($data['departmentScope']) ? json_encode($data['departmentScope']) : $oldRole['department_scope'],
            $data['status'] ?? $oldRole['status'],
            $id
        ]);

        // Update permissions if provided
        if (!empty($data['permissions']) && is_array($data['permissions'])) {
            // Simple approach: delete and re-insert
            $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?")->execute([$id]);

            $stmtPerm = $pdo->prepare("INSERT INTO role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export, can_approve) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($data['permissions'] as $perm) {
                $stmtPerm->execute([
                    $id,
                    $perm['module'],
                    $perm['view'] ? 1 : 0,
                    $perm['create'] ? 1 : 0,
                    $perm['edit'] ? 1 : 0,
                    $perm['delete'] ? 1 : 0,
                    $perm['export'] ? 1 : 0,
                    $perm['approve'] ? 1 : 0
                ]);
            }
        }

        // Audit Log
        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_ROLE', 'Administration', $oldRole, $data);

        $pdo->commit();
        send_response(["message" => "Role updated successfully"]);

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
        send_response(["error" => "Role ID is required for deletion"], 400);
    }

    try {
        // Get old data for audit
        $stmtOld = $pdo->prepare("SELECT * FROM roles WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldRole = $stmtOld->fetch();

        if (!$oldRole) {
            send_response(["error" => "Role not found"], 404);
        }

        // cascade delete will handle role_permissions
        $stmt = $pdo->prepare("DELETE FROM roles WHERE id = ?");
        $stmt->execute([$id]);

        // Audit Log
        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_ROLE', 'Administration', $oldRole, null);

        send_response(["message" => "Role deleted successfully"]);

    } catch (Exception $e) {
        send_response(["error" => $e->getMessage()], 500);
    }
}
?>