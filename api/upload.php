<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_response(['error' => 'Method not allowed'], 405);
}

if (!isset($_FILES['file'])) {
    send_response(['error' => 'No file uploaded'], 400);
}

$file = $_FILES['file'];
$targetDir = __DIR__ . '/../uploads/staff/';

// Create directory if it doesn't exist
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

if (!in_array($fileExtension, $allowedExtensions)) {
    send_response(['error' => 'Invalid file type. Allowed types: ' . implode(', ', $allowedExtensions)], 400);
}

// Max file size: 5MB
if ($file['size'] > 5 * 1024 * 1024) {
    send_response(['error' => 'File size exceeds limit (5MB)'], 400);
}

$fileName = uniqid('staff_') . '.' . $fileExtension;
$targetFile = $targetDir . $fileName;

if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    $webPath = '/uploads/staff/' . $fileName;
    send_response(['url' => $webPath, 'message' => 'File uploaded successfully']);
} else {
    send_response(['error' => 'Failed to move uploaded file'], 500);
}
