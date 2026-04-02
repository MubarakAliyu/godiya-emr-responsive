<?php
/**
 * Authentication Middleware
 * Include this file in any API endpoint that requires authentication
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    send_response(['error' => 'Unauthorized: Please login'], 401);
}

// User is authenticated, populate global $currentUser
$currentUser = [
    'id' => $_SESSION['user_id'],
    'role' => $_SESSION['role'],
    'role_id' => $_SESSION['role_id'],
    'name' => $_SESSION['user_name']
];

/**
 * Check if the current user has a specific permission for a module
 * 
 * @param PDO $pdo
 * @param string $module Module name (e.g., 'Finance')
 * @param string $action Action required (e.g., 'can_view', 'can_edit')
 * @return bool
 */
function check_permission($pdo, $module, $action)
{
    global $currentUser;

    // Super Admin has all permissions
    if ($currentUser['role'] === 'Super Admin') {
        return true;
    }

    $stmt = $pdo->prepare("
        SELECT $action 
        FROM role_permissions 
        WHERE role_id = ? AND module_name = ?
    ");
    $stmt->execute([$currentUser['role_id'], $module]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    return ($result && $result[$action] == 1);
}

/**
 * Enforce a permission check and exit if denied
 */
function require_permission($pdo, $module, $action)
{
    if (!check_permission($pdo, $module, $action)) {
        send_response(['error' => "Forbidden: You don't have permission to $action in $module"], 403);
    }
}
