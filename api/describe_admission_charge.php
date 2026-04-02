<?php
require 'config.php';
$stmt = $pdo->query('DESCRIBE tbl_admission_charge');
print_r($stmt->fetchAll());
?>