<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

try {
    $stmt = $pdo->query("DESCRIBE tbl_admission_charges");
    $schema = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($schema, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
