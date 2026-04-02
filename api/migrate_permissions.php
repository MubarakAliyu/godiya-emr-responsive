<?php
require_once 'config.php';

try {
    $receptionist_role_id = 'GH-RL-19135ad9';
    $modules_to_enable = ['Finance', 'Pharmacy', 'Laboratory', 'Beds', 'Reports'];
    
    $placeholders = implode(',', array_fill(0, count($modules_to_enable), '?'));
    
    $sql = "UPDATE role_permissions 
            SET can_view = 1, can_create = 1, can_edit = 1, can_delete = 1, can_export = 1, can_approve = 1 
            WHERE role_id = ? AND module_name IN ($placeholders)";
            
    $stmt = $pdo->prepare($sql);
    $params = array_merge([$receptionist_role_id], $modules_to_enable);
    $stmt->execute($params);
    
    echo json_encode([
        "status" => "success",
        "message" => "Permissions merged successfully for Receptionist role.",
        "affected_rows" => $stmt->rowCount()
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
