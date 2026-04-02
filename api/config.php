<?php
require_once 'functions.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Database Configuration and Connection
 * Environment-aware (Local vs Live)
 */

// Environment detection
$is_local = (isset($_SERVER['REMOTE_ADDR']) && ($_SERVER['REMOTE_ADDR'] == '127.0.0.1' || $_SERVER['REMOTE_ADDR'] == '::1')) ||
    (isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] == 'localhost') ||
    (php_sapi_name() === 'cli');

if ($is_local) {
    // Localhost settings
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'godiya_emr');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    // Live domain settings
    define('DB_HOST', '');
    define('DB_NAME', '');
    define('DB_USER', '');
    define('DB_PASS', '');
}

// Error reporting - Only show errors on local
if ($is_local) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Header for JSON response
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// PDO connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // In production, log error to file instead of echoing
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . ($is_local ? $e->getMessage() : "Internal Server Error")]);
    exit();
}
