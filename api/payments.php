<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    default:
        send_response(['error' => 'Method not allowed'], 405);
        break;
}

function handleGet($pdo)
{
    $action = $_GET['action'] ?? '';
    $patient_unique_id = $_GET['patient_unique_id'] ?? '';

    try {
        if ($action === 'pending_admissions') {
            $stmt = $pdo->prepare("
                SELECT ba.*, 
                       COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                       bc.category_name as ward_name,
                       bc.price_per_day,
                       COALESCE((SELECT SUM(amount_paid) FROM tbl_payments WHERE reference_id = ba.ipd_number), 0) as total_paid
                FROM tbl_bed_admission ba
                LEFT JOIN tbl_patients p ON ba.admission_patient = p.patient_unique_id AND ba.admission_is_subfile = 0
                LEFT JOIN tbl_subfile s ON REPLACE(ba.admission_patient, 'SF-', '') = s.subfile_id AND ba.admission_is_subfile = 1
                LEFT JOIN tbl_bed_categories bc ON ba.admission_bed = bc.id
                ORDER BY ba.admission_datetime DESC
            ");
            $stmt->execute();
            send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
            return;
        }

        if (!$patient_unique_id) {
            send_response(['error' => 'Patient Unique ID is required'], 400);
        }

        if ($action === 'history') {
            $reference_id = $_GET['reference_id'] ?? '';
            if ($reference_id) {
                // Fetch history for a specific reference (bill)
                $stmt = $pdo->prepare("SELECT * FROM tbl_payments WHERE patient_unique_id = ? AND reference_id = ? ORDER BY created_at ASC");
                $stmt->execute([$patient_unique_id, $reference_id]);
            } else {
                // Fetch all history for patient
                $stmt = $pdo->prepare("SELECT * FROM tbl_payments WHERE patient_unique_id = ? ORDER BY created_at DESC");
                $stmt->execute([$patient_unique_id]);
            }
        } else {
            // Default: Fetch all history for patient (legacy compatibility)
            $stmt = $pdo->prepare("SELECT * FROM tbl_payments WHERE patient_unique_id = ? ORDER BY created_at DESC");
            $stmt->execute([$patient_unique_id]);
        }

        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate total paid and current balance
        $total_paid = 0;
        $amount_expected = 0;
        if (count($payments) > 0) {
            $amount_expected = $payments[0]['amount_expected'];
            foreach ($payments as $p) {
                $total_paid += $p['amount_paid'];
            }
        }

        send_response([
            'payments' => $payments,
            'total_paid' => $total_paid,
            'amount_expected' => $amount_expected,
            'balance' => $amount_expected - $total_paid,
            'status' => ($total_paid >= $amount_expected && $amount_expected > 0) ? 'Paid' : ($total_paid > 0 ? 'Partial' : 'Pending')
        ]);
    } catch (PDOException $e) {
        send_response(['error' => $e->getMessage()], 500);
    }
}

function handlePost($pdo)
{
    $data = get_request_data();

    $required = ['patient_unique_id', 'amount_expected', 'amount_paid', 'payment_method', 'payment_description'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            send_response(['error' => "Missing required field: $field"], 400);
        }
    }

    $patient_unique_id = $data['patient_unique_id'];
    $reference_id = $data['reference_id'] ?? null;
    $amount_expected = floatval($data['amount_expected']);
    $amount_paid = floatval($data['amount_paid']);
    $payment_method = $data['payment_method'];
    $payment_description = $data['payment_description'];
    $cashier_id = $data['cashier_id'] ?? 'System';

    try {
        $pdo->beginTransaction();

        // 1. Calculate current balance autonomously
        $stmt = $pdo->prepare("SELECT SUM(amount_paid) as total_paid FROM tbl_payments WHERE reference_id = ?");
        $stmt->execute([$reference_id]);
        $total_paid_before = floatval($stmt->fetchColumn() ?: 0);

        $balance = $amount_expected - ($total_paid_before + $amount_paid);

        // 2. Insert into tbl_payments
        $sql = "INSERT INTO tbl_payments (
                    patient_unique_id, reference_id, amount_expected, amount_paid, 
                    balance, payment_method, payment_description, cashier_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $patient_unique_id,
            $reference_id,
            $amount_expected,
            $amount_paid,
            $balance,
            $payment_method,
            $payment_description,
            $cashier_id
        ]);

        $payment_id = $pdo->lastInsertId();

        // 3. Update patient status if it's a file registration payment and balance is 0
        if (strpos($reference_id, 'REG-') === 0 && $balance <= 0) {
            $updatePatient = $pdo->prepare("UPDATE tbl_patients SET is_paid = 1, status = 'Active' WHERE patient_unique_id = ?");
            $updatePatient->execute([$patient_unique_id]);
        }

        // 4. Update appointment payment status if it's a consultation payment or has appointment_number
        $isConsultation = strpos(strtolower($payment_description), 'consultation') !== false;
        $appointment_number = $data['appointment_number'] ?? '';

        if (($isConsultation || $appointment_number) && $balance <= 0) {
            $update_target = $appointment_number ?: $reference_id;
            if ($update_target && strpos($update_target, 'REG-') === false) {
                $updateApp = $pdo->prepare("UPDATE tbl_appointment SET appointment_ispaid = 1 WHERE appointment_number = ?");
                $updateApp->execute([$update_target]);
            }
        }

        // 5. Update admission payment status if it's an IPD payment
        if (strpos($reference_id, 'IPD-') === 0 && $balance <= 0) {
            $updateAdm = $pdo->prepare("UPDATE tbl_bed_admission SET admission_ispaid = 1 WHERE ipd_number = ?");
            $updateAdm->execute([$reference_id]);
        }

        // 6. Update drug invoice payment status if it's a pharmacy payment
        if (strpos($reference_id, 'GH-RX-') === 0 && $balance <= 0) {
            $inv_id = (int) str_replace('GH-RX-', '', $reference_id);
            $updateDrugInv = $pdo->prepare("UPDATE drug_invoice SET is_paid = 1 WHERE inv_id = ?");
            $updateDrugInv->execute([$inv_id]);

            create_notification(
                $pdo,
                null,
                "Payment Received: Prescription #{$inv_id}",
                "Payment confirmed for patient {$patient_unique_id}. You can now dispense the drugs.",
                "billing",
                "success",
                "DollarSign"
            );
        }

        // 7. Update admission charges if it's an ADM-CHG payment
        if (strpos($reference_id, 'ADM-CHG-') === 0) {
            $isGroup = strpos($reference_id, 'ADM-CHG-GRP-') === 0;
            $idStr = $isGroup ? str_replace('ADM-CHG-GRP-', '', $reference_id) : str_replace('ADM-CHG-', '', $reference_id);
            $chargeIds = explode(',', $idStr);
            $remainingPaid = (float) $amount_paid;

            foreach ($chargeIds as $index => $cid) {
                $cid = (int) $cid;
                $stmtCheck = $pdo->prepare("SELECT amount_paid, payment_history, charge_total FROM tbl_admission_charge WHERE charge_id = ?");
                $stmtCheck->execute([$cid]);
                $charge = $stmtCheck->fetch();

                if ($charge) {
                    $total = (float) $charge['charge_total'];
                    $currentPaid = (float) $charge['amount_paid'];
                    $needed = $total - $currentPaid;
                    $allocate = ($index === count($chargeIds) - 1) ? $remainingPaid : min($needed, $remainingPaid);

                    if ($allocate > 0) {
                        $new_amount_paid = $currentPaid + $allocate;
                        $remainingPaid -= $allocate;
                        $history = json_decode($charge['payment_history'] ?? '[]', true) ?: [];
                        $history[] = [
                            'payment_id' => $payment_id,
                            'amount' => $allocate,
                            'method' => $payment_method,
                            'date' => date('Y-m-d H:i:s'),
                            'cashier' => $cashier_id
                        ];
                        $stmtUpdate = $pdo->prepare("UPDATE tbl_admission_charge SET amount_paid = ?, payment_history = ? WHERE charge_id = ?");
                        $stmtUpdate->execute([$new_amount_paid, json_encode($history), $cid]);
                    }
                }
            }
        }

        log_activity($pdo, $cashier_id, 'PAYMENT_RECORDED', 'Finance', null, [
            'payment_id' => $payment_id,
            'patient' => $patient_unique_id,
            'amount' => $amount_paid,
            'description' => $payment_description
        ]);

        $pdo->commit();
        send_response([
            'message' => 'Payment recorded successfully',
            'payment_id' => $payment_id,
            'new_balance' => $balance
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        send_response(['error' => $e->getMessage()], 500);
    }
}
