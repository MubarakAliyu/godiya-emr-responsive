<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? 'daily-summary';
$from = $_GET['from'] ?? date('Y-m-d');
$to = $_GET['to'] ?? date('Y-m-d');

if ($method !== 'GET') {
    send_response(['error' => 'Method not allowed'], 405);
}

try {
    switch ($type) {
        case 'cashier-dashboard-stats':
            handleCashierDashboardStats($pdo);
            break;
        case 'stats':
            handleStats($pdo, $from, $to);
            break;
        case 'service-wise':
            handleServiceWise($pdo, $from, $to);
            break;
        case 'payment-methods':
            handlePaymentMethods($pdo, $from, $to);
            break;
        case 'transactions':
            handleTransactions($pdo, $from, $to);
            break;
        case 'revenue-analysis':
            handleRevenueAnalysis($pdo, $from, $to);
            break;
        default:
            send_response(['error' => 'Invalid report type'], 400);
            break;
    }
} catch (PDOException $e) {
    send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
}

function handleStats($pdo, $from, $to)
{
    $sql = "SELECT 
                SUM(amount_paid) as totalRevenue,
                COUNT(*) as totalTransactions,
                AVG(amount_paid) as avgTransaction
            FROM tbl_payments 
            WHERE DATE(created_at) BETWEEN ? AND ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get top service
    $sqlTop = "SELECT 
                CASE 
                    WHEN reference_id LIKE 'REG-%' THEN 'Registration'
                    WHEN reference_id LIKE 'ADM-CHG%' THEN 'Admission Charges'
                    WHEN reference_id LIKE 'IPD-%' THEN 'IPD Billing'
                    WHEN reference_id LIKE 'LAB-%' THEN 'Laboratory'
                    WHEN reference_id LIKE 'PHARM-%' THEN 'Pharmacy'
                    ELSE 'General'
                END as service,
                SUM(amount_paid) as total
               FROM tbl_payments
               WHERE DATE(created_at) BETWEEN ? AND ?
               GROUP BY service
               ORDER BY total DESC
               LIMIT 1";
    $stmtTop = $pdo->prepare($sqlTop);
    $stmtTop->execute([$from, $to]);
    $top = $stmtTop->fetch(PDO::FETCH_ASSOC);

    $stats['topService'] = $top ? $top['service'] : 'N/A';

    send_response($stats);
}

function handleServiceWise($pdo, $from, $to)
{
    $sql = "SELECT 
                CASE 
                    WHEN reference_id LIKE 'REG-%' THEN 'Registration'
                    WHEN reference_id LIKE 'ADM-CHG%' THEN 'Admission Charges'
                    WHEN reference_id LIKE 'IPD-%' THEN 'IPD Billing'
                    WHEN reference_id LIKE 'LAB-%' THEN 'Laboratory'
                    WHEN reference_id LIKE 'PHARM-%' THEN 'Pharmacy'
                    ELSE 'General'
                END as service,
                COUNT(*) as count,
                SUM(amount_paid) as amount
            FROM tbl_payments 
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY service
            ORDER BY amount DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to]);
    send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function handlePaymentMethods($pdo, $from, $to)
{
    $sql = "SELECT 
                payment_method as method,
                COUNT(*) as count,
                SUM(amount_paid) as amount
            FROM tbl_payments 
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY method
            ORDER BY amount DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to]);
    send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function handleTransactions($pdo, $from, $to)
{
    $sql = "SELECT 
                p.payment_id as id,
                p.created_at,
                p.payment_description as description,
                p.payment_method as method,
                p.amount_paid as amount,
                COALESCE(pat.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname), 'Walking Patient') as patient,
                CASE 
                    WHEN reference_id LIKE 'REG-%' THEN 'Registration'
                    WHEN reference_id LIKE 'ADM-CHG%' THEN 'Admission Charges'
                    WHEN reference_id LIKE 'IPD-%' THEN 'IPD Billing'
                    WHEN reference_id LIKE 'LAB-%' THEN 'Laboratory'
                    WHEN reference_id LIKE 'PHARM-%' THEN 'Pharmacy'
                    ELSE 'General'
                END as type
            FROM tbl_payments p
            LEFT JOIN tbl_patients pat ON p.patient_unique_id = pat.patient_unique_id
            LEFT JOIN tbl_subfile s ON REPLACE(p.patient_unique_id, 'SF-', '') = s.subfile_id
            WHERE DATE(p.created_at) BETWEEN ? AND ?
            ORDER BY p.created_at DESC
            LIMIT 100";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to]);
    send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function handleRevenueAnalysis($pdo, $from, $to)
{
    $sql = "SELECT 
                DATE(created_at) as date,
                SUM(amount_paid) as revenue,
                COUNT(*) as transactions
            FROM tbl_payments 
            WHERE DATE(created_at) BETWEEN ? AND ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to]);
    send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

function handleCashierDashboardStats($pdo)
{
    $today = date('Y-m-d');
    $monthStart = date('Y-m-01');

    // ── Today's Revenue ─────────────────────────────────────────────────────────
    // 1. tbl_payments (all cashier-recorded payments)
    $s = $pdo->prepare("SELECT COALESCE(SUM(amount_paid), 0) FROM tbl_payments WHERE DATE(created_at) = ?");
    $s->execute([$today]);
    $todayPayments = (float) $s->fetchColumn();

    // 2. Paid lab invoices created today
    $s = $pdo->prepare("SELECT COALESCE(SUM(CAST(total AS DECIMAL(15,2))), 0) FROM test_invoice WHERE is_paid = 1 AND DATE(gen_date) = ?");
    $s->execute([$today]);
    $todayLab = (float) $s->fetchColumn();

    // 3. Paid drug/pharmacy invoices created today
    $s = $pdo->prepare("SELECT COALESCE(SUM(CAST(total AS DECIMAL(15,2))), 0) FROM drug_invoice WHERE is_paid = 1 AND DATE(gen_date) = ?");
    $s->execute([$today]);
    $todayPharm = (float) $s->fetchColumn();

    $todayRevenue = $todayPayments + $todayLab + $todayPharm;

    // ── Monthly Revenue ──────────────────────────────────────────────────────────
    $s = $pdo->prepare("SELECT COALESCE(SUM(amount_paid), 0) FROM tbl_payments WHERE DATE(created_at) >= ?");
    $s->execute([$monthStart]);
    $monthPayments = (float) $s->fetchColumn();

    $s = $pdo->prepare("SELECT COALESCE(SUM(CAST(total AS DECIMAL(15,2))), 0) FROM test_invoice WHERE is_paid = 1 AND DATE(gen_date) >= ?");
    $s->execute([$monthStart]);
    $monthLab = (float) $s->fetchColumn();

    $s = $pdo->prepare("SELECT COALESCE(SUM(CAST(total AS DECIMAL(15,2))), 0) FROM drug_invoice WHERE is_paid = 1 AND DATE(gen_date) >= ?");
    $s->execute([$monthStart]);
    $monthPharm = (float) $s->fetchColumn();

    $monthlyRevenue = $monthPayments + $monthLab + $monthPharm;

    // ── Today's Transaction Count ────────────────────────────────────────────────
    $s = $pdo->prepare("SELECT COUNT(*) FROM tbl_payments WHERE DATE(created_at) = ?");
    $s->execute([$today]);
    $txPayments = (int) $s->fetchColumn();

    $s = $pdo->prepare("SELECT COUNT(*) FROM test_invoice WHERE is_paid = 1 AND DATE(gen_date) = ?");
    $s->execute([$today]);
    $txLab = (int) $s->fetchColumn();

    $s = $pdo->prepare("SELECT COUNT(*) FROM drug_invoice WHERE is_paid = 1 AND DATE(gen_date) = ?");
    $s->execute([$today]);
    $txPharm = (int) $s->fetchColumn();

    $receiptsToday = $txPayments + $txLab + $txPharm;

    // ── Pending (unpaid) Invoices ────────────────────────────────────────────────
    $s = $pdo->query("SELECT COUNT(*) FROM test_invoice WHERE is_paid = 0");
    $pendingLab = (int) $s->fetchColumn();

    $s = $pdo->query("SELECT COUNT(*) FROM drug_invoice WHERE is_paid = 0");
    $pendingPharm = (int) $s->fetchColumn();

    $pendingTotal = $pendingLab + $pendingPharm;

    send_response([
        'todayRevenue' => $todayRevenue,
        'monthlyRevenue' => $monthlyRevenue,
        'receiptsToday' => $receiptsToday,
        'pendingInvoices' => $pendingTotal,
        'breakdown' => [
            'todayPayments' => $todayPayments,
            'todayLab' => $todayLab,
            'todayPharm' => $todayPharm,
            'monthPayments' => $monthPayments,
            'monthLab' => $monthLab,
            'monthPharm' => $monthPharm,
        ]
    ]);
}
