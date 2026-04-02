<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

try {
    $tables = ['admission_charges', 'tbl_payments', 'tbl_bed_admission'];
    $schemas = [];
    foreach ($tables as $table) {
        $stmt = $pdo->query("DESCRIBE $table");
        $schemas[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    echo json_encode($schemas, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
