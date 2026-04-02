<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

try {
    $stmt = $pdo->query("SELECT * FROM tbl_admission_charge LIMIT 5");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($data, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
