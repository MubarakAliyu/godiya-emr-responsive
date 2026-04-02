<?php
/**
 * Settings CRUD API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = get_request_data();

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo, $data);
        break;
    default:
        send_response(["error" => "Method not allowed"], 405);
}

/**
 * Handle GET requests (Fetch all settings)
 */
function handleGet($pdo)
{
    try {
        $stmt = $pdo->query("SELECT settings_key, settings_value FROM hospital_settings");
        $results = $stmt->fetchAll();

        $settings = [];
        foreach ($results as $row) {
            $settings[$row['settings_key']] = json_decode($row['settings_value'], true);
        }

        send_response($settings);
    } catch (Exception $e) {
        send_response(["error" => $e->getMessage()], 500);
    }
}

/**
 * Handle POST requests (Update a settings category)
 */
function handlePost($pdo, $data)
{
    $key = $data['key'] ?? null;
    $value = $data['value'] ?? null;
    $performerId = $data['performerId'] ?? 'System';

    if (!$key || !$value) {
        send_response(["error" => "Settings key and value are required"], 400);
    }

    try {
        $pdo->beginTransaction();

        // Get old value for audit
        $stmtOld = $pdo->prepare("SELECT settings_value FROM hospital_settings WHERE settings_key = ?");
        $stmtOld->execute([$key]);
        $oldValueJson = $stmtOld->fetchColumn();
        $oldValue = $oldValueJson ? json_decode($oldValueJson, true) : null;

        // Insert or Update
        $stmt = $pdo->prepare("INSERT INTO hospital_settings (settings_key, settings_value) 
                               VALUES (?, ?) 
                               ON DUPLICATE KEY UPDATE settings_value = VALUES(settings_value)");

        $jsonValue = json_encode($value);
        $stmt->execute([$key, $jsonValue]);

        // Audit Log
        log_activity($pdo, $performerId, 'UPDATE_SETTINGS', 'System', $oldValue, $value);

        $pdo->commit();
        send_response(["message" => "Settings updated successfully"]);

    } catch (Exception $e) {
        $pdo->rollBack();
        send_response(["error" => $e->getMessage()], 500);
    }
}
?>