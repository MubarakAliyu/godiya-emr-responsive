<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$data = get_request_data();

// Helper: get session email
function getSessionEmail()
{
    if (session_status() === PHP_SESSION_NONE)
        session_start();
    return $_SESSION['user_email'] ?? null;
}

switch ($method) {
    case 'GET':
        if ($action === 'status') {
            // Check whether this cashier already has a PIN set
            $email = getSessionEmail();
            if (!$email) {
                send_response(['error' => 'Not authenticated'], 401);
            }
            global $pdo;
            $stmt = $pdo->prepare("SELECT id FROM tbl_cashier_pin WHERE user_email = ?");
            $stmt->execute([$email]);
            send_response(['has_pin' => (bool) $stmt->fetch()]);
        }
        send_response(['error' => 'Unknown action'], 400);
        break;

    case 'POST':
        if ($action === 'set') {
            // Set or update cashier PIN
            $email = getSessionEmail();
            $pin = $data['pin'] ?? '';

            if (!$email) {
                send_response(['error' => 'Not authenticated'], 401);
            }
            if (!preg_match('/^\d{4,6}$/', $pin)) {
                send_response(['error' => 'PIN must be 4–6 digits'], 422);
            }

            $hash = password_hash($pin, PASSWORD_BCRYPT);
            global $pdo;
            $stmt = $pdo->prepare("
                INSERT INTO tbl_cashier_pin (user_email, pin_hash)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE pin_hash = VALUES(pin_hash)
            ");
            $stmt->execute([$email, $hash]);
            log_activity($pdo, $email, 'SET_CASHIER_PIN', 'Cashier', null, ['email' => $email]);
            send_response(['message' => 'PIN set successfully']);
        }

        if ($action === 'verify') {
            // Verify cashier PIN (e.g. before a sensitive action)
            $email = getSessionEmail();
            $pin = $data['pin'] ?? '';

            if (!$email) {
                send_response(['error' => 'Not authenticated'], 401);
            }
            if (!$pin) {
                send_response(['error' => 'PIN is required'], 422);
            }

            global $pdo;
            $stmt = $pdo->prepare("SELECT pin_hash FROM tbl_cashier_pin WHERE user_email = ?");
            $stmt->execute([$email]);
            $row = $stmt->fetch();

            if (!$row) {
                send_response(['error' => 'No PIN set for this account'], 404);
            }
            if (!password_verify($pin, $row['pin_hash'])) {
                send_response(['error' => 'Incorrect PIN'], 401);
            }
            send_response(['verified' => true]);
        }

        send_response(['error' => 'Unknown action'], 400);
        break;

    default:
        send_response(['error' => 'Method not allowed'], 405);
}
