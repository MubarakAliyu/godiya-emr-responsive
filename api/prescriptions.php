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

// ─────────────────────────────────────────────────────────
// GET /api/prescriptions.php
//   ?sta=pending     → pending prescriptions (default)
//   ?sta=all         → all prescriptions
//
// Returns an array of prescription records, each enriched with:
//   - patient name & file number
//   - subfile details (if the consultation was on a subfile)
//   - parent family file number (if applicable)
//   - the JSON-decoded drug list
// ─────────────────────────────────────────────────────────
function handleGet($pdo)
{
    try {
        $sta = $_GET['sta'] ?? 'pending';
        $fileNumber = $_GET['file_number'] ?? null;

        $conditions = [];
        $params = [];

        if ($sta !== 'all') {
            $conditions[] = "rx.sta = :sta";
            $params[':sta'] = $sta;
        }

        if ($fileNumber) {
            $conditions[] = "c.patient_id = :file_number";
            $params[':file_number'] = $fileNumber;
        }

        $whereClause = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";

        $sql = "
            SELECT
                rx.id                       AS rx_id,
                rx.consultation_id,
                rx.prescription             AS prescription_json,
                rx.sta,
                rx.is_paid,
                rx.created_at               AS prescription_date,

                -- Consultation info
                c.id                        AS consultation_id_real,
                c.appointment_id,
                c.patient_id                AS c_patient_id,
                c.is_subfile,
                c.consultation_date,
                c.doctor_id,

                -- Doctor name
                COALESCE(u.full_name, 'Unknown Doctor') AS doctor_name,

                -- Regular patient
                p.patient_unique_id,
                p.full_name                 AS patient_full_name,
                p.phone_number              AS patient_phone,
                p.patient_type,
                p.file_type,
                p.parent_file_id,
                p.gender,
                p.dob,

                -- Subfile fields (when is_subfile = 1)
                sf.subfile_id,
                CONCAT(sf.subfile_fname, ' ', sf.subfile_lname) AS subfile_full_name,
                sf.subfile_file_id          AS parent_family_file_id

            FROM tbl_prescriptions rx
            INNER JOIN tbl_consultation_data c ON rx.consultation_id = c.id
            LEFT JOIN tbl_patients p
                ON p.patient_unique_id = c.patient_id AND c.is_subfile = 0
            LEFT JOIN tbl_subfile sf
                ON sf.subfile_id = SUBSTRING(c.patient_id, 4)
                AND c.is_subfile = 1
            LEFT JOIN users u ON u.id = c.doctor_id
            $whereClause
            ORDER BY rx.created_at DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $results = [];
        foreach ($rows as $row) {
            // Decode the JSON prescription array
            $drugs = json_decode($row['prescription_json'], true);
            if (!is_array($drugs)) {
                $drugs = [];
            }

            $isSubfile = (int) $row['is_subfile'] === 1;

            // Build patient display name and file number
            if ($isSubfile) {
                $patientName = $row['subfile_full_name'] ?: 'Unknown';
                $fileNumber = $row['c_patient_id'];       // the sf-xxx id
                $parentFileId = $row['parent_family_file_id'];
            } else {
                $patientName = $row['patient_full_name'] ?: 'Unknown';
                $fileNumber = $row['patient_unique_id'] ?? $row['c_patient_id'];
                $parentFileId = $row['parent_file_id'];     // for family file type
            }

            // If patient is a family-file main record, parent_file_id may be NULL
            // (the family file IS the parent). Show parent_file_id only when non-null.

            $results[] = [
                'id' => (int) $row['rx_id'],
                'consultationId' => (int) $row['consultation_id'],
                'prescriptionDate' => $row['prescription_date'],
                'sta' => $row['sta'],
                'isPaid' => (int) $row['is_paid'],
                'doctorName' => $row['doctor_name'],

                // Patient info
                'isSubfile' => $isSubfile,
                'patientName' => $patientName,
                'fileNumber' => $fileNumber,
                'parentFamilyFile' => $parentFileId,    // null if not a family/subfile record
                'patientType' => $row['patient_type'] ?? 'OPD',
                'phone' => $row['patient_phone'] ?? '',
                'gender' => $isSubfile ? '' : ($row['gender'] ?? ''),
                'dob' => $isSubfile ? '' : ($row['dob'] ?? ''),

                // Subfile-specific
                'subfileId' => $isSubfile ? $row['subfile_id'] : null,
                'subfileNumber' => $isSubfile ? $row['c_patient_id'] : null,
                'subfileName' => $isSubfile ? $row['subfile_full_name'] : null,

                // Drug list decoded from JSON
                'drugs' => $drugs,
            ];
        }

        send_response($results);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// ─────────────────────────────────────────────────────────
// POST /api/prescriptions.php
//   Update prescription status (mark as processing / paid etc.)
//   Or handle final submission (dispense) with drug_invoice creation
//
// Body for status update: { action: 'update_status', id: number, sta: string }
// Body for submission:   { action: 'submit_dispense', id: number, drug_list: object, inv_file_number: string, total: number }
// ─────────────────────────────────────────────────────────
function handlePost($pdo)
{
    $data = get_request_data();
    $action = $data['action'] ?? 'update_status';

    if (empty($data['id'])) {
        send_response(['error' => 'Prescription id is required'], 400);
        return;
    }

    try {
        if ($action === 'submit_dispense') {
            // Start transaction
            $pdo->beginTransaction();

            // 1. Update prescription status to 'Processed'
            $stmt = $pdo->prepare("UPDATE tbl_prescriptions SET sta = 'Processed', updated_at = NOW() WHERE id = :id");
            $stmt->execute([':id' => $data['id']]);

            // 2. Insert into drug_invoice
            $drugListJson = json_encode($data['drug_list']);
            $stmt = $pdo->prepare("
                INSERT INTO drug_invoice (drug_list, is_paid, gen_date, sta, total, inv_file_number)
                VALUES (:drug_list, 0, :gen_date, 1, :total, :inv_file_number)
            ");
            $stmt->execute([
                ':drug_list' => $drugListJson,
                ':gen_date' => date('Y-m-d H:i:s'),
                ':total' => $data['total'],
                ':inv_file_number' => $data['inv_file_number']
            ]);

            // 3. Reduce stock in tbl_drugs for available items
            if (isset($data['drug_list']['available']) && is_array($data['drug_list']['available'])) {
                foreach ($data['drug_list']['available'] as $item) {
                    $drugId = $item['id'];
                    $qtyDispensed = (int) $item['quantity'];

                    // Update tbl_drugs qty
                    $stmt = $pdo->prepare("UPDATE tbl_drugs SET drug_qty = drug_qty - :qty WHERE drug_id = :drug_id");
                    $stmt->execute([
                        ':qty' => $qtyDispensed,
                        ':drug_id' => $drugId
                    ]);
                }
            }

            $pdo->commit();
            send_response(['success' => true, 'message' => 'Prescription processed and invoice generated']);
        } else {
            // Default: Simple status update
            $fields = [];
            $params = [];

            if (isset($data['sta'])) {
                $fields[] = 'sta = :sta';
                $params[':sta'] = $data['sta'];
            }
            if (isset($data['is_paid'])) {
                $fields[] = 'is_paid = :is_paid';
                $params[':is_paid'] = $data['is_paid'];
            }

            if (empty($fields)) {
                send_response(['error' => 'Nothing to update'], 400);
                return;
            }

            $params[':id'] = $data['id'];
            $sql = 'UPDATE tbl_prescriptions SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = :id';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            send_response(['success' => true]);
        }
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
