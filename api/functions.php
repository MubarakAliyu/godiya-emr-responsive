<?php
/**
 * Global helper functions for the EMR API
 */

/**
 * Log an audit activity
 * 
 * @param PDO $pdo The PDO connection object
 * @param string $userId The ID of the user performing the action
 * @param string $action The action performed (e.g., 'CREATE_ROLE')
 * @param string $module The module affected (e.g., 'Administration')
 * @param mixed $oldValue Previous data state (otional)
 * @param mixed $newValue New data state (optional)
 * @return bool Success or failure
 */
function log_activity($pdo, $userId, $action, $module, $oldValue = null, $newValue = null)
{
    try {
        $sql = "INSERT INTO audit_logs (user_id, action, module, ip_address, device_info, old_value, new_value) 
                VALUES (:user_id, :action, :module, :ip_address, :device_info, :old_value, :new_value)";

        $realUserId = $userId;

        // If userId looks like an email, try to find the GH-US-xxx ID
        if (filter_var($userId, FILTER_VALIDATE_EMAIL)) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $realUserId = $user['id'];
            } else {
                // If not found, we can't satisfy the FK if it's strict.
                // For now, let's just use NULL if it's not a valid user to avoid FK error
                $realUserId = null;
            }
        } elseif ($userId === 'System') {
            $realUserId = null; // System actions can be NULL user or dedicated ID
        }

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':user_id' => $realUserId,
            ':action' => $action,
            ':module' => $module,
            ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            ':device_info' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            ':old_value' => $oldValue ? json_encode($oldValue) : null,
            ':new_value' => $newValue ? json_encode($newValue) : null
        ]);

        return true;
    } catch (PDOException $e) {
        // Log to system error log
        error_log("Audit Log Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Get the request data (JSON or POST)
 */
function get_request_data()
{
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if ($data === null) {
        return $_POST;
    }

    return $data;
}

/**
 * Send JSON response and exit
 */
function send_response($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit();
}
/**
 * Calculate age from date of birth
 */
function calculate_age($dob)
{
    if (!$dob || $dob === '0000-00-00')
        return null;
    try {
        $birthDate = new DateTime($dob);
        $today = new DateTime('today');
        return $birthDate->diff($today)->y;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Create a system notification
 * 
 * @param PDO $pdo The PDO connection object
 * @param string|null $userId Specific user ID or NULL for global
 * @param string $title Notification title
 * @param string $description Notification detail
 * @param string $category 'clinical', 'billing', 'admin', 'all'
 * @param string $type 'info', 'warning', 'error', 'success'
 * @param string $icon Lucide icon name
 * @return bool Success or failure
 */
function create_notification($pdo, $userId, $title, $description, $category = 'all', $type = 'info', $icon = 'AlertCircle', $module = 'System')
{
    try {
        $stmt = $pdo->prepare("INSERT INTO tbl_notifications (user_id, type, category, module, title, description, icon) VALUES (?, ?, ?, ?, ?, ?, ?)");
        return $stmt->execute([$userId, $type, $category, $module, $title, $description, $icon]);
    } catch (PDOException $e) {
        error_log("Notification Error: " . $e->getMessage());
        return false;
    }
}
