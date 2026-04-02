<?php
/**
 * Audit Logs API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    send_response(["error" => "Method not allowed"], 405);
}

// Get filters
$user_id = $_GET['user_id'] ?? null;
$module = $_GET['module'] ?? null;
$action = $_GET['action'] ?? null;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
$offset = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;

$query = "SELECT a.*, u.full_name as user_name 
          FROM audit_logs a 
          LEFT JOIN users u ON a.user_id = u.id 
          WHERE 1=1";
$params = [];

if ($user_id) {
    $query .= " AND a.user_id = ?";
    $params[] = $user_id;
}

if ($module) {
    $query .= " AND a.module = ?";
    $params[] = $module;
}

if ($action) {
    $query .= " AND a.action = ?";
    $params[] = $action;
}

$query .= " ORDER BY a.timestamp DESC LIMIT :limit OFFSET :offset";

try {
    $stmt = $pdo->prepare($query);

    // Bind filters
    $paramIndex = 1;
    foreach ($params as $param) {
        $stmt->bindValue($paramIndex++, $param);
    }

    // Bind limit and offset as integers
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $logs = $stmt->fetchAll();

    send_response($logs);
} catch (PDOException $e) {
    send_response(["error" => $e->getMessage()], 500);
}
?>