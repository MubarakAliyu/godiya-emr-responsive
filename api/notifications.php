<?php
require_once 'config.php';
require_once 'functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$user_id = $_GET['user_id'] ?? null;

try {
    if ($method === 'GET') {
        $category = $_GET['category'] ?? null;

        $sql = "SELECT * FROM tbl_notifications WHERE (user_id = ? OR user_id IS NULL)";
        $params = [$user_id];

        if ($category && $category !== 'all') {
            $sql .= " AND category = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY created_at DESC LIMIT 50";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if ($action === 'mark_read') {
            if (!isset($data['id']))
                send_response(['error' => 'ID required'], 400);
            $stmt = $pdo->prepare("UPDATE tbl_notifications SET is_read = 1 WHERE id = ?");
            $stmt->execute([$data['id']]);
            send_response(['success' => true]);
        }

        if ($action === 'clear_all') {
            if (!$user_id)
                send_response(['error' => 'User ID required'], 400);
            $stmt = $pdo->prepare("DELETE FROM tbl_notifications WHERE user_id = ? OR user_id IS NULL");
            $stmt->execute([$user_id]);
            send_response(['success' => true]);
        }

        if ($action === 'add') {
            if (!isset($data['title']))
                send_response(['error' => 'Title required'], 400);

            $stmt = $pdo->prepare("INSERT INTO tbl_notifications (user_id, type, category, module, title, description, icon) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['user_id'] ?? null,
                $data['type'] ?? 'info',
                $data['category'] ?? 'all',
                $data['module'] ?? 'System',
                $data['title'],
                $data['description'] ?? null,
                $data['icon'] ?? 'AlertCircle'
            ]);
            send_response(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
    }

    if ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        if (!$id)
            send_response(['error' => 'ID required'], 400);
        $stmt = $pdo->prepare("DELETE FROM tbl_notifications WHERE id = ?");
        $stmt->execute([$id]);
        send_response(['success' => true]);
    }

} catch (PDOException $e) {
    send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
}
