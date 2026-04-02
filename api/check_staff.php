<?php
require_once 'config.php';
try {
    $stmt = $pdo->query("DESCRIBE tbl_staff");
    $schema = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->query("SELECT COUNT(*) FROM tbl_staff");
    $count = $stmt->fetchColumn();

    echo json_encode(['schema' => $schema, 'count' => $count], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo $e->getMessage();
}
