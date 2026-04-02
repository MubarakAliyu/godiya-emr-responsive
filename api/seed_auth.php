<?php
/**
 * Seed script to create initial roles and a super admin user.
 * Includes database migrations for login attempt tracking.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

try {
    // 1. Database Migrations - Add columns if they don't exist
    echo "Checking database columns...\n";
    $columns = $pdo->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('login_attempts', $columns)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN login_attempts tinyint(3) NOT NULL DEFAULT 0");
        echo "Added 'login_attempts' column to users table.\n";
    }

    if (!in_array('locked_until', $columns)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN locked_until datetime DEFAULT NULL");
        echo "Added 'locked_until' column to users table.\n";
    }

    $pdo->beginTransaction();

    // 2. Create Super Admin Role if it doesn't exist
    $roleId = 'GH-RL-SADMIN';
    $roleName = 'Super Admin';

    // Check by ID or Name
    $stmt = $pdo->prepare("SELECT id FROM roles WHERE id = ? OR role_name = ?");
    $stmt->execute([$roleId, $roleName]);
    $existingRole = $stmt->fetch();

    if (!$existingRole) {
        $stmt = $pdo->prepare("INSERT INTO roles (id, role_name, description, status, created_by) VALUES (?, ?, 'Full system access', 'Active', 'System')");
        $stmt->execute([$roleId, $roleName]);
        echo "Created Super Admin role.\n";
    } else {
        $roleId = $existingRole['id'];
        echo "Super Admin role already exists (ID: $roleId).\n";
    }

    // 3. Add all permissions for Super Admin
    $modules = ['Patients', 'Appointments', 'Finance', 'Pharmacy', 'Laboratory', 'Beds', 'Reports', 'Attendance', 'Administration'];
    foreach ($modules as $module) {
        $stmt = $pdo->prepare("INSERT INTO role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export, can_approve) 
                               VALUES (?, ?, 1, 1, 1, 1, 1, 1)
                               ON DUPLICATE KEY UPDATE can_view=1, can_create=1, can_edit=1, can_delete=1, can_export=1, can_approve=1");
        $stmt->execute([$roleId, $module]);
    }
    echo "Updated permissions for Super Admin role.\n";

    // 4. Create initial Super Admin user if it doesn't exist
    $adminEmail = 'ghaliyu@gmail.com';
    $password = 'godiya@2025';
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$adminEmail]);
    $existingUser = $stmt->fetch();

    if (!$existingUser) {
        $userId = 'GH-US-001';
        $stmt = $pdo->prepare("INSERT INTO users (id, first_name, last_name, full_name, email, username, password_hash, role_id, status, created_by) 
                               VALUES (?, 'Aliyu', 'Sani', 'Aliyu Sani', ?, 'superadmin', ?, ?, 'Active', 'System')");
        $stmt->execute([$userId, $adminEmail, $passwordHash, $roleId]);
        echo "Created initial Super Admin user (Email: $adminEmail, Password: $password).\n";
    } else {
        $userId = $existingUser['id'];
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, role_id = ? WHERE id = ?");
        $stmt->execute([$passwordHash, $roleId, $userId]);
        echo "Updated existing user $adminEmail (ID: $userId) password and role.\n";
    }

    $pdo->commit();
    echo "Seeding completed successfully.\n";

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error during seeding: " . $e->getMessage() . "\n";
}
?>