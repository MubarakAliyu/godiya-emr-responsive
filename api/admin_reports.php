<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? 'overview';
$from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
$to = $_GET['to'] ?? date('Y-m-d');

if ($method !== 'GET') {
    send_response(['error' => 'Method not allowed'], 405);
}

try {
    switch ($type) {
        case 'overview':
            handleOverview($pdo);
            break;
        case 'financial':
            handleFinancial($pdo, $from, $to);
            break;
        case 'patient-flow':
            handlePatientFlow($pdo);
            break;
        case 'audit-logs':
            handleAuditLogs($pdo);
            break;
        case 'department-performance':
            handleDepartmentPerformance($pdo, $from, $to);
            break;
        default:
            send_response(['error' => 'Invalid report type'], 400);
            break;
    }
} catch (PDOException $e) {
    send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
}

function handleOverview($pdo)
{
    // Total Patients
    $pCount = $pdo->query("SELECT COUNT(*) FROM tbl_patients")->fetchColumn();

    // Total Revenue
    $revenue = $pdo->query("SELECT SUM(amount_paid) FROM tbl_payments")->fetchColumn();

    // Appointments Today
    $today = date('Y-m-d');
    $apptCount = $pdo->prepare("SELECT COUNT(*) FROM tbl_appointment WHERE DATE(appointment_date) = ?");
    $apptCount->execute([$today]);
    $appts = $apptCount->fetchColumn();

    // Staff Count
    $staffCount = $pdo->query("SELECT COUNT(*) FROM users WHERE status = 'Active'")->fetchColumn();

    // Bed Occupancy
    $beds = $pdo->query("SELECT SUM(total_beds) as total, SUM(occupied_beds) as occupied FROM tbl_bed_categories")->fetch(PDO::FETCH_ASSOC);
    $occupancy = $beds['total'] > 0 ? ($beds['occupied'] / $beds['total']) * 100 : 0;

    send_response([
        'totalPatients' => (int) $pCount,
        'totalRevenue' => (float) $revenue,
        'appointmentsToday' => (int) $appts,
        'activeStaffToday' => (int) $staffCount,
        'bedOccupancy' => round($occupancy, 1)
    ]);
}

function handleFinancial($pdo, $from, $to)
{
    // 1. Transaction Table Data
    $sql = "SELECT 
                p.payment_id as id,
                p.reference_id as invoiceNumber,
                p.created_at as billingDate,
                p.amount_paid as totalAmount,
                p.payment_method as paymentMethod,
                p.payment_description as description,
                'Paid' as paymentStatus,
                COALESCE(pat.full_name, CONCAT(sub.subfile_fname, ' ', sub.subfile_lname), 'Walking Patient') as patientName,
                CASE 
                    WHEN p.reference_id LIKE 'REG-%' THEN 'Registration'
                    WHEN p.reference_id LIKE 'ADM-CHG%' THEN 'Admission'
                    WHEN p.reference_id LIKE 'IPD-%' THEN 'IPD Billing'
                    WHEN p.reference_id LIKE 'LAB-%' THEN 'Laboratory'
                    WHEN p.reference_id LIKE 'PHARM-%' THEN 'Pharmacy'
                    ELSE 'General'
                END as department
            FROM tbl_payments p
            LEFT JOIN tbl_patients pat ON p.patient_unique_id = pat.patient_unique_id
            LEFT JOIN tbl_subfile sub ON REPLACE(p.patient_unique_id, 'SF-', '') = sub.subfile_id
            WHERE DATE(p.created_at) BETWEEN ? AND ?
            ORDER BY p.created_at DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Revenue Trend (Last 6 Months)
    $trendSql = "SELECT 
                    DATE_FORMAT(created_at, '%b %Y') as month,
                    SUM(amount_paid) as revenue
                 FROM tbl_payments
                 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                 GROUP BY YEAR(created_at), MONTH(created_at)
                 ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC";
    $revenueTrend = $pdo->query($trendSql)->fetchAll(PDO::FETCH_ASSOC);

    send_response([
        'records' => $transactions,
        'revenueTrend' => $revenueTrend
    ]);
}

function handleDepartmentPerformance($pdo, $from, $to)
{
    $sql = "SELECT 
                CASE 
                    WHEN reference_id LIKE 'REG-%' THEN 'Registration'
                    WHEN reference_id LIKE 'ADM-CHG%' THEN 'Admission Charges'
                    WHEN reference_id LIKE 'IPD-%' THEN 'IPD Billing'
                    WHEN reference_id LIKE 'LAB-%' THEN 'Laboratory'
                    WHEN reference_id LIKE 'PHARM-%' THEN 'Pharmacy'
                    ELSE 'General'
                END as name,
                SUM(amount_paid) as value
            FROM tbl_payments 
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY name
            ORDER BY value DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Assign colors
    $colors = ['#1e40af', '#059669', '#0891b2', '#7c3aed', '#f59e0b', '#dc2626'];
    foreach ($data as $idx => &$item) {
        $item['color'] = $colors[$idx % count($colors)];
    }

    send_response($data);
}

function handlePatientFlow($pdo)
{
    $sql = "SELECT 
                DATE_FORMAT(created_at, '%b') as month,
                SUM(CASE WHEN patient_type = 'OPD' THEN 1 ELSE 0 END) as opd,
                SUM(CASE WHEN patient_type = 'IPD' THEN 1 ELSE 0 END) as ipd
            FROM tbl_patients
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY YEAR(created_at), MONTH(created_at)
            ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC";
    $data = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    send_response($data);
}

function handleAuditLogs($pdo)
{
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 200;
    $offset = isset($_GET['offset']) ? (int) $_GET['offset'] : 0;
    $search = $_GET['search'] ?? '';
    $module_filter = $_GET['module'] ?? '';
    $from = $_GET['from'] ?? '';
    $to = $_GET['to'] ?? '';

    $sql = "SELECT 
                a.id,
                a.action,
                a.module,
                a.ip_address,
                a.timestamp,
                a.old_value,
                a.new_value,
                COALESCE(u.full_name, 'System') as userName,
                COALESCE(r.role_name, 'System') as userRole
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE 1=1";

    $params = [];

    if ($search) {
        $sql .= " AND (u.full_name LIKE ? OR a.action LIKE ? OR a.module LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    if ($module_filter) {
        $sql .= " AND a.module = ?";
        $params[] = $module_filter;
    }

    if ($from) {
        $sql .= " AND DATE(a.timestamp) >= ?";
        $params[] = $from;
    }

    if ($to) {
        $sql .= " AND DATE(a.timestamp) <= ?";
        $params[] = $to;
    }

    $sql .= " ORDER BY a.timestamp DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);

    // Bind string params positionally
    $i = 1;
    foreach ($params as $p) {
        $stmt->bindValue($i++, $p);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    send_response($logs);
}
