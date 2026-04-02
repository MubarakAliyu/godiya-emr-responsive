<?php
/**
 * Pharmacy Dashboard Stats API
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Ensure user is logged in
if (empty($_SESSION['user_id'])) {
    send_response(['error' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // 1. Get Total Income (Paid Invoices)
        $incomeStmt = $pdo->prepare("SELECT SUM(CAST(total AS DECIMAL(15,2))) as total_income FROM drug_invoice WHERE is_paid = 1");
        $incomeStmt->execute();
        $totalIncome = (float) $incomeStmt->fetchColumn() ?: 0;

        // 2. Get Paid Prescription Count
        $paidCountStmt = $pdo->prepare("SELECT COUNT(*) FROM drug_invoice WHERE is_paid = 1");
        $paidCountStmt->execute();
        $paidCount = (int) $paidCountStmt->fetchColumn() ?: 0;

        // 3. Average Prescription Value
        $avgValue = $paidCount > 0 ? $totalIncome / $paidCount : 0;

        // 4. Pending Prescriptions Count
        $pendingCountStmt = $pdo->prepare("SELECT COUNT(*) FROM drug_invoice WHERE is_paid = 0");
        $pendingCountStmt->execute();
        $pendingCount = (int) $pendingCountStmt->fetchColumn() ?: 0;

        // 5. Recent Activities (from audit_logs)
        $activityStmt = $pdo->prepare("
            SELECT a.id, a.action as type, a.action as description, a.timestamp, u.full_name as user
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.module = 'Pharmacy' OR a.module = 'Profile'
            ORDER BY a.timestamp DESC
            LIMIT 5
        ");
        $activityStmt->execute();
        $activities = $activityStmt->fetchAll(PDO::FETCH_ASSOC);

        // Map activities to match frontend expectations
        $mappedActivities = array_map(function ($a) {
            $desc = str_replace('_', ' ', $a['description']);
            return [
                'id' => $a['id'],
                'type' => strtolower($a['type']),
                'description' => ucfirst(strtolower($desc)),
                'timestamp' => $a['timestamp'],
                'user' => $a['user']
            ];
        }, $activities);

        // 6. Pending Prescriptions List
        $pendingListStmt = $pdo->prepare("
            SELECT inv_id, drug_list, total as amount, gen_date as date, inv_file_number as fileNumber
            FROM drug_invoice 
            WHERE is_paid = 0
            ORDER BY inv_id DESC
            LIMIT 5
        ");
        $pendingListStmt->execute();
        $pendingList = $pendingListStmt->fetchAll(PDO::FETCH_ASSOC);

        // Map pending list to include patient names if possible (via file number)
        // Note: For real implementation, we'd join with tbl_patients
        foreach ($pendingList as &$item) {
            $patientStmt = $pdo->prepare("SELECT full_name FROM tbl_patients WHERE patient_unique_id = ? LIMIT 1");
            $patientStmt->execute([$item['fileNumber']]);
            $item['patientName'] = $patientStmt->fetchColumn() ?: 'Walk-in / Unknown';
            $item['prescriptionId'] = 'GH-RX-' . str_pad($item['inv_id'], 4, '0', STR_PAD_LEFT);
            $item['drugs'] = []; // Could parse drug_list JSON
            $drugData = json_decode($item['drug_list'], true);
            if (isset($drugData['available'])) {
                foreach ($drugData['available'] as $d) {
                    $item['drugs'][] = $d['name'];
                }
            }
        }

        send_response([
            'income' => $totalIncome,
            'avgValue' => $avgValue,
            'pendingCount' => $pendingCount,
            'paidCount' => $paidCount,
            'activities' => $mappedActivities,
            'pendingList' => $pendingList
        ]);

    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
} else {
    send_response(['error' => 'Method not allowed'], 405);
}
