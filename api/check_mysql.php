<?php
require_once 'config.php';
try {
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'max_allowed_packet'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($row);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
