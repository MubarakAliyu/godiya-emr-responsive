<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    default:
        send_response(['error' => 'Method not allowed'], 405);
        break;
}

function handleGet($pdo)
{
    try {
        // Fetch admission charges grouped by IPD number
        $sql = "
            SELECT 
                GROUP_CONCAT(ac.charge_id) as charge_ids,
                ac.admission_id,
                ba.ipd_number,
                ba.admission_date,
                ba.admission_patient as patient_unique_id,
                ba.admission_is_subfile,
                COALESCE(p.full_name, CONCAT(s.subfile_fname, ' ', s.subfile_lname)) as patient_name,
                GROUP_CONCAT(ac.charge_description SEPARATOR '||') as grouped_descriptions,
                SUM(CAST(ac.charge_total AS DECIMAL(15,2))) as total_amount,
                SUM(CAST(ac.amount_paid AS DECIMAL(15,2))) as total_paid,
                s.subfile_file_id as parent_file_id,
                GROUP_CONCAT(ac.payment_history SEPARATOR '||') as grouped_history,
                MAX(ac.charge_id) as latest_charge_id
            FROM tbl_admission_charge ac
            JOIN tbl_bed_admission ba ON ac.admission_id = ba.admission_id
            LEFT JOIN tbl_patients p ON ba.admission_patient = p.patient_unique_id AND ba.admission_is_subfile = 0
            LEFT JOIN tbl_subfile s ON REPLACE(ba.admission_patient, 'SF-', '') = s.subfile_id AND ba.admission_is_subfile = 1
            GROUP BY ac.admission_id, ba.ipd_number
            ORDER BY latest_charge_id DESC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $charges = $stmt->fetchAll(PDO::FETCH_ASSOC);

        send_response($charges);
    } catch (PDOException $e) {
        send_response(['error' => $e->getMessage()], 500);
    }
}
