<?php
require 'config.php';
$stmt = $pdo->query('DESCRIBE tbl_bed_admission');
print_r($stmt->fetchAll());
?>