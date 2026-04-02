<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    default:
        send_response(['error' => 'Method not allowed'], 405);
}

function handlePost($pdo)
{
    $data = get_request_data();
    $action = $data['action'] ?? '';

    if ($action === 'mark_paid') {
        $inv_id = $data['inv_id'] ?? null;
        $pin = $data['pin'] ?? '';
        $payment_method = $data['payment_method'] ?? 'cash';
        $email = $_SESSION['user_email'] ?? '';

        if (!$inv_id) {
            send_response(['error' => 'Invoice ID required'], 400);
        }

        try {
            // PIN Verification
            if (!empty($pin)) {
                $stmt = $pdo->prepare("SELECT pin_hash FROM tbl_cashier_pin WHERE user_email = ?");
                $stmt->execute([$email]);
                $row = $stmt->fetch();

                if (!$row) {
                    send_response(['error' => 'No PIN set for this account.'], 404);
                }
                if (!password_verify($pin, $row['pin_hash'])) {
                    send_response(['error' => 'Incorrect PIN'], 401);
                }
            }

            $stmt = $pdo->prepare("UPDATE drug_invoice SET is_paid = 1 WHERE inv_id = :id");
            $stmt->execute(['id' => $inv_id]);

            log_activity($pdo, $_SESSION['user_id'] ?? 'System', 'CONFIRM_PHARMACY_PAYMENT', 'Cashier', $inv_id, [
                'invoice_id' => $inv_id,
                'is_paid' => 1,
                'payment_method' => $payment_method
            ]);
            send_response(['success' => true, 'message' => 'Invoice marked as paid']);
        } catch (PDOException $e) {
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'dispense') {
        $inv_id = $data['inv_id'] ?? null;
        if (!$inv_id) {
            send_response(['error' => 'Invoice ID required'], 400);
        }

        try {
            $pdo->beginTransaction();

            // 1. Fetch current invoice to get drug_list
            $stmt = $pdo->prepare("SELECT drug_list, sta, is_paid FROM drug_invoice WHERE inv_id = :id");
            $stmt->execute(['id' => $inv_id]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$invoice) {
                $pdo->rollBack();
                send_response(['error' => 'Invoice not found'], 404);
            }

            if ((int) $invoice['sta'] === 1) {
                $pdo->rollBack();
                send_response(['error' => 'Invoice already dispensed'], 400);
            }

            if ((int) $invoice['is_paid'] !== 1) {
                $pdo->rollBack();
                send_response(['error' => 'Invoice must be paid before dispensing'], 400);
            }

            $drugList = json_decode($invoice['drug_list'], true);

            // 2. Subtract from inventory for available items
            if (isset($drugList['available']) && is_array($drugList['available'])) {
                foreach ($drugList['available'] as $item) {
                    $drugId = $item['id'] ?? null;
                    $qtyToSubtract = (int) ($item['quantity'] ?? 0);

                    if ($drugId && $qtyToSubtract > 0) {
                        $updateStmt = $pdo->prepare("UPDATE tbl_drugs SET drug_qty = drug_qty - :qty WHERE drug_id = :id");
                        $updateStmt->execute(['qty' => $qtyToSubtract, 'id' => $drugId]);

                        // Check for low stock notification
                        $checkStmt = $pdo->prepare("SELECT drug_name, drug_qty FROM tbl_drugs WHERE drug_id = ?");
                        $checkStmt->execute([$drugId]);
                        $drug = $checkStmt->fetch(PDO::FETCH_ASSOC);
                        if ($drug && $drug['drug_qty'] < 10) {
                            create_notification(
                                $pdo,
                                null,
                                "Low Stock Alert",
                                "Drug '{$drug['drug_name']}' is running low ({$drug['drug_qty']} remaining).",
                                "clinical",
                                "warning",
                                "AlertCircle"
                            );
                        }
                    }
                }
            }

            // 3. Mark as dispensed
            $updateInvStmt = $pdo->prepare("UPDATE drug_invoice SET sta = 1 WHERE inv_id = :id");
            $updateInvStmt->execute(['id' => $inv_id]);

            log_activity($pdo, $data['performerId'] ?? 'System', 'DISPENSE_PRESCRIPTION', 'Pharmacy', null, ['inv_id' => $inv_id]);

            $pdo->commit();
            send_response(['success' => true, 'message' => 'Prescription dispensed and inventory updated']);
        } catch (PDOException $e) {
            $pdo->rollBack();
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else if ($action === 'create_invoice') {
        $inv_file_number = $data['inv_file_number'] ?? null;
        $total = $data['total'] ?? 0;
        $drug_list = $data['drug_list'] ?? null;

        if (!$inv_file_number || !$drug_list) {
            send_response(['error' => 'Missing required fields for invoice creation'], 400);
        }

        try {
            $pdo->beginTransaction();

            // 1. Insert into drug_invoice
            // Direct POS sales are marked as paid (is_paid=1) and dispensed (sta=1)
            $stmt = $pdo->prepare("
                INSERT INTO drug_invoice (drug_list, is_paid, gen_date, sta, total, inv_file_number)
                VALUES (:drug_list, 0, NOW(), 0, :total, :inv_file_number)
            ");
            $stmt->execute([
                ':drug_list' => json_encode($drug_list),
                ':total' => $total,
                ':inv_file_number' => $inv_file_number
            ]);

            $new_inv_id = $pdo->lastInsertId();

            log_activity($pdo, $data['performerId'] ?? 'Pharmacist', 'CREATE_POS_INVOICE', 'Pharmacy', null, ['inv_id' => $new_inv_id, 'file_number' => $inv_file_number]);

            // Add Notification for Pharmacy staff
            create_notification(
                $pdo,
                null, // Global for now or can target specific roles if user_id is known
                "New Prescription Invoice",
                "Invoice #{$new_inv_id} created for patient {$inv_file_number}.",
                "billing",
                "info",
                "DollarSign"
            );

            $pdo->commit();
            send_response(['success' => true, 'message' => 'Invoice created successfully', 'inv_id' => $new_inv_id]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        send_response(['error' => 'Invalid action'], 400);
    }
}

function handleGet($pdo)
{
    try {
        $paidOnly = isset($_GET['paid_only']) && $_GET['paid_only'] === '1';
        $undispensedOnly = isset($_GET['undispensed_only']) && $_GET['undispensed_only'] === '1';
        $fileNumber = $_GET['file_number'] ?? null;

        $conditions = [];
        $params = [];

        if ($paidOnly)
            $conditions[] = "i.is_paid = 1";
        if ($undispensedOnly)
            $conditions[] = "i.sta = 0";
        if ($fileNumber) {
            $conditions[] = "i.inv_file_number = :file_number";
            $params[':file_number'] = $fileNumber;
        }

        $whereClause = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";

        $sql = "
            SELECT 
                i.*,
                -- Patient name logic
                CASE 
                    WHEN i.inv_file_number LIKE 'sf-%' THEN CONCAT(sf.subfile_fname, ' ', sf.subfile_lname)
                    ELSE p.full_name
                END AS patient_name,
                -- Patient info
                p.phone_number AS patient_phone,
                p.gender AS patient_gender,
                p.dob AS patient_dob,
                p.patient_type,
                -- Subfile specific
                sf.subfile_gender,
                sf.subfile_dob AS subfile_dob_date,
                sf.subfile_file_id AS parent_file_id,
                sf.subfile_fname,
                sf.subfile_lname
            FROM drug_invoice i
            LEFT JOIN tbl_patients p 
                ON p.patient_unique_id = i.inv_file_number 
                AND i.inv_file_number NOT LIKE 'sf-%'
            LEFT JOIN tbl_subfile sf 
                ON CAST(sf.subfile_id AS CHAR) = SUBSTRING(i.inv_file_number, 4) 
                AND i.inv_file_number LIKE 'sf-%'
            $whereClause
            ORDER BY i.gen_date DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($rows as $row) {
            $drugList = json_decode($row['drug_list'], true);

            // Reconstruct unified items list from available/unavailable
            $items = [];
            if (isset($drugList['available']) && is_array($drugList['available'])) {
                foreach ($drugList['available'] as $item) {
                    $items[] = [
                        'drugId' => $item['id'] ?? 'N/A',
                        'name' => $item['name'] ?? 'Unknown',
                        'quantity' => $item['quantity'] ?? 0,
                        'unitPrice' => $item['price'] ?? 0,
                        'subtotal' => $item['subtotal'] ?? (($item['price'] ?? 0) * ($item['quantity'] ?? 0)),
                        'status' => 'Available'
                    ];
                }
            }
            if (isset($drugList['unavailable']) && is_array($drugList['unavailable'])) {
                foreach ($drugList['unavailable'] as $item) {
                    $items[] = [
                        'drugId' => 'N/A',
                        'name' => $item['name'] ?? 'Unknown',
                        'quantity' => 0,
                        'unitPrice' => 0,
                        'subtotal' => 0,
                        'status' => 'Unavailable'
                    ];
                }
            }

            $dateParts = explode(' ', $row['gen_date']);
            $date = $dateParts[0];
            $time = $dateParts[1] ?? '';

            $results[] = [
                'id' => $row['inv_id'],
                'invoiceId' => 'GH-PH-INV-' . str_pad($row['inv_id'], 5, '0', STR_PAD_LEFT),
                'fileNumber' => $row['inv_file_number'],
                'patientName' => $row['patient_name'] ?: 'Unknown',
                'patientPhone' => $row['patient_phone'] ?: '',
                'patientGender' => str_starts_with($row['inv_file_number'], 'sf-') ? $row['subfile_gender'] : $row['patient_gender'],
                'patientAge' => str_starts_with($row['inv_file_number'], 'sf-') ? calculate_age($row['subfile_dob_date']) : calculate_age($row['patient_dob']),
                'patientType' => $row['patient_type'] ?: 'OPD',
                'items' => $items,
                'amount' => (float) $row['total'],
                'status' => (int) $row['is_paid'] === 1 ? 'Paid' : 'Unpaid',
                'isDispensed' => (int) $row['sta'] === 1,
                'is_subfile' => str_starts_with($row['inv_file_number'], 'sf-'),
                'parentFileNumber' => str_starts_with($row['inv_file_number'], 'sf-') ? $row['parent_file_id'] : null,
                'subFileName' => str_starts_with($row['inv_file_number'], 'sf-') ? ($row['subfile_fname'] . ' ' . $row['subfile_lname']) : null,
                'subFileNumber' => str_starts_with($row['inv_file_number'], 'sf-') ? $row['inv_file_number'] : null,
                'date' => $date,
                'time' => $time,
                'raw_date' => $row['gen_date']
            ];

        }

        send_response($results);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
