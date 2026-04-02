<?php
/**
 * Authentication API
 * POST   → login
 * GET    → validate session
 * DELETE → logout
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

// Start PHP session for server-side session management
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? 'login';
        if ($action === 'change_password') {
            handleChangePassword($pdo);
        } elseif ($action === 'update_profile') {
            handleUpdateProfile($pdo);
        } else {
            handleLogin($pdo);
        }
        break;
    case 'GET':
        handleValidate($pdo);
        break;
    case 'DELETE':
        handleLogout($pdo);
        break;
    default:
        send_response(['error' => 'Method not allowed'], 405);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
function handleLogin($pdo)
{
    $data = get_request_data();

    $email = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    if (!$email || !$password) {
        send_response(['error' => 'Email and password are required'], 400);
    }

    // ── Load security settings from DB (fallback to safe defaults) ──────────
    $securitySettings = getSecuritySettings($pdo);
    $maxAttempts = (int) ($securitySettings['accountLockAttempts'] ?? 5);
    $sessionTimeout = (int) ($securitySettings['sessionTimeout'] ?? 30);
    if ($sessionTimeout <= 0)
        $sessionTimeout = 30; // Safety fallback

    // ── Fetch user ──────────────────────────────────────────────────────────
    $stmt = $pdo->prepare("
        SELECT u.*, r.role_name, r.id as role_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.email = ?
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        send_response(['error' => 'Invalid email or password'], 401);
    }

    // ── Check account status ────────────────────────────────────────────────
    if ($user['status'] === 'Suspended') {
        send_response(['error' => 'Your account has been suspended. Contact the administrator.'], 403);
    }

    if ($user['status'] !== 'Active') {
        send_response(['error' => 'Account is not active. Current status: ' . $user['status']], 403);
    }

    // ── Check Role ──────────────────────────────────────────────────────────
    if (empty($user['role_id']) || empty($user['role_name'])) {
        send_response(['error' => 'No role assigned to this account. Access denied.'], 403);
    }

    if (strtolower($user['role_name']) === 'staff') {
        send_response(['error' => 'Generic staff accounts are not permitted to login. Please contact HR to assign a specific system role.'], 403);
    }

    // ── Check lockout ───────────────────────────────────────────────────────
    if (!empty($user['locked_until'])) {
        $lockedUntil = new DateTime($user['locked_until']);
        $now = new DateTime();
        if ($now < $lockedUntil) {
            $remaining = $lockedUntil->format('H:i:s');
            send_response([
                'error' => 'Account temporarily locked due to too many failed attempts.',
                'locked_until' => $user['locked_until'],
                'locked' => true,
            ], 429);
        } else {
            // Lock expired — reset
            $pdo->prepare("UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?")
                ->execute([$user['id']]);
            $user['login_attempts'] = 0;
            $user['locked_until'] = null;
        }
    }

    // ── Verify password ─────────────────────────────────────────────────────
    if (!password_verify($password, $user['password_hash'])) {
        $attempts = (int) $user['login_attempts'] + 1;
        $remaining = max(0, $maxAttempts - $attempts);

        if ($attempts >= $maxAttempts) {
            // Lock for 15 minutes
            $lockUntil = (new DateTime())->modify('+15 minutes')->format('Y-m-d H:i:s');
            $pdo->prepare("UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?")
                ->execute([$attempts, $lockUntil, $user['id']]);

            send_response([
                'error' => 'Account locked due to too many failed login attempts. Try again in 15 minutes.',
                'locked_until' => $lockUntil,
                'locked' => true,
            ], 429);
        }

        $pdo->prepare("UPDATE users SET login_attempts = ? WHERE id = ?")
            ->execute([$attempts, $user['id']]);

        $msg = $remaining > 0
            ? "Invalid email or password. {$remaining} attempt(s) remaining before lockout."
            : "Invalid email or password.";

        send_response([
            'error' => $msg,
            'attempts_left' => $remaining,
        ], 401);
    }

    // ── Password OK — load permissions ──────────────────────────────────────
    $permStmt = $pdo->prepare("
        SELECT module_name, can_view, can_create, can_edit, can_delete, can_export, can_approve
        FROM role_permissions
        WHERE role_id = ?
    ");
    $permStmt->execute([$user['role_id']]);
    $rawPerms = $permStmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert to a keyed map: { Patients: { view, create, edit, delete, export, approve }, ... }
    $permissions = [];
    foreach ($rawPerms as $perm) {
        $permissions[$perm['module_name']] = [
            'view' => (bool) $perm['can_view'],
            'create' => (bool) $perm['can_create'],
            'edit' => (bool) $perm['can_edit'],
            'delete' => (bool) $perm['can_delete'],
            'export' => (bool) $perm['can_export'],
            'approve' => (bool) $perm['can_approve'],
        ];
    }

    // ── Reset attempts + update last_login ──────────────────────────────────
    $pdo->prepare("UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?")
        ->execute([$user['id']]);

    // ── Store in PHP session ────────────────────────────────────────────────
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['role'] = $user['role_name'];
    $_SESSION['role_id'] = $user['role_id'];
    $_SESSION['user_name'] = $user['full_name'] ?? ($user['first_name'] . ' ' . $user['last_name']);
    $_SESSION['logged_in_at'] = time();
    $_SESSION['last_activity'] = time();

    // ── Audit log ───────────────────────────────────────────────────────────
    log_activity($pdo, $user['id'], 'LOGIN', 'Authentication', null, ['email' => $email, 'ip' => $_SERVER['REMOTE_ADDR'] ?? '']);

    send_response([
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'name' => $user['full_name'] ?? ($user['first_name'] . ' ' . $user['last_name']),
            'email' => $user['email'],
            'role' => $user['role_name'],
            'roleId' => $user['role_id'],
            'department' => $user['department'],
            'staffId' => $user['id'],
            'phone_number' => $user['phone'] ?? '',
        ],
        'permissions' => $permissions,
        'sessionTimeout' => $sessionTimeout,
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE SESSION
// ─────────────────────────────────────────────────────────────────────────────
function handleValidate($pdo)
{
    if (empty($_SESSION['user_id'])) {
        send_response(['error' => 'No active session'], 401);
    }

    $userId = $_SESSION['user_id'];

    // Check session timeout from security settings
    $securitySettings = getSecuritySettings($pdo);
    $timeoutMinutes = (int) ($securitySettings['sessionTimeout'] ?? 30);
    if ($timeoutMinutes <= 0)
        $timeoutMinutes = 30; // Safety fallback
    $timeoutSeconds = $timeoutMinutes * 60;

    if (isset($_SESSION['last_activity'])) {
        if ((time() - $_SESSION['last_activity']) > $timeoutSeconds) {
            session_destroy();
            send_response(['error' => 'Session expired due to inactivity'], 401);
        }
    }

    // Refresh last activity
    $_SESSION['last_activity'] = time();

    // Re-fetch user to get latest status/role
    $stmt = $pdo->prepare("
        SELECT u.id, u.first_name, u.last_name, u.full_name, u.email, u.department, u.phone,
               u.status, u.role_id, r.role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.status = 'Active'
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        session_destroy();
        send_response(['error' => 'User not found or suspended'], 401);
    }

    // Role check for consistency
    if (empty($user['role_id']) || empty($user['role_name']) || strtolower($user['role_name']) === 'staff') {
        session_destroy();
        send_response(['error' => 'Insufficient permissions or unassigned role'], 401);
    }

    // Load permissions
    $permStmt = $pdo->prepare("
        SELECT module_name, can_view, can_create, can_edit, can_delete, can_export, can_approve
        FROM role_permissions WHERE role_id = ?
    ");
    $permStmt->execute([$user['role_id']]);
    $rawPerms = $permStmt->fetchAll(PDO::FETCH_ASSOC);

    $permissions = [];
    foreach ($rawPerms as $perm) {
        $permissions[$perm['module_name']] = [
            'view' => (bool) $perm['can_view'],
            'create' => (bool) $perm['can_create'],
            'edit' => (bool) $perm['can_edit'],
            'delete' => (bool) $perm['can_delete'],
            'export' => (bool) $perm['can_export'],
            'approve' => (bool) $perm['can_approve'],
        ];
    }

    send_response([
        'user' => [
            'id' => $user['id'],
            'name' => $user['full_name'] ?? ($user['first_name'] . ' ' . $user['last_name']),
            'email' => $user['email'],
            'role' => $user['role_name'],
            'roleId' => $user['role_id'],
            'department' => $user['department'],
            'staffId' => $user['id'],
            'phone_number' => $user['phone'] ?? '',
        ],
        'permissions' => $permissions,
        'sessionTimeout' => $timeoutMinutes,
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
function handleLogout($pdo)
{
    if (!empty($_SESSION['user_id'])) {
        log_activity($pdo, $_SESSION['user_id'], 'LOGOUT', 'Authentication', null, null);
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();

    send_response(['message' => 'Logged out successfully']);
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
function handleChangePassword($pdo)
{
    if (empty($_SESSION['user_id'])) {
        send_response(['error' => 'Unauthorized'], 401);
    }

    $data = get_request_data();
    $currentPassword = $data['currentPassword'] ?? '';
    $newPassword = $data['newPassword'] ?? '';

    if (!$currentPassword || !$newPassword) {
        send_response(['error' => 'Current and new passwords are required'], 400);
    }

    $userId = $_SESSION['user_id'];

    // Verify current password
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
        send_response(['error' => 'Incorrect current password'], 401);
    }

    // Update password
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$newHash, $userId]);

    log_activity($pdo, $userId, 'PASSWORD_CHANGE', 'Authentication');

    send_response(['message' => 'Password changed successfully']);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
function handleUpdateProfile($pdo)
{
    if (empty($_SESSION['user_id'])) {
        send_response(['error' => 'Unauthorized'], 401);
    }

    $data = get_request_data();
    $firstName = trim($data['firstName'] ?? '');
    $lastName = trim($data['lastName'] ?? '');
    $phone = trim($data['phone_number'] ?? '');

    if (!$firstName || !$lastName) {
        send_response(['error' => 'First name and last name are required'], 400);
    }

    $userId = $_SESSION['user_id'];

    $stmt = $pdo->prepare("
        UPDATE users 
        SET first_name = ?, last_name = ?, full_name = ?, phone = ? 
        WHERE id = ?
    ");
    $fullName = $firstName . ' ' . $lastName;
    $stmt->execute([$firstName, $lastName, $fullName, $phone, $userId]);

    // Update session data if needed (e.g., name display)
    if ($stmt->rowCount() > 0) {
        $_SESSION['user_name'] = $fullName;
    }

    log_activity($pdo, $userId, 'UPDATE_PROFILE', 'Profile', null, ['name' => $fullName, 'phone' => $phone]);

    send_response(['message' => 'Profile updated successfully']);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getSecuritySettings($pdo)
{
    try {
        $stmt = $pdo->prepare("SELECT settings_value FROM hospital_settings WHERE settings_key = 'security'");
        $stmt->execute();
        $row = $stmt->fetchColumn();
        if ($row) {
            return json_decode($row, true) ?? [];
        }
    } catch (Exception $e) {
        // Table missing or other error — use defaults
    }
    return [];
}
?>