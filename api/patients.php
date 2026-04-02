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
    case 'PUT':
        handlePut($pdo);
        break;
    case 'DELETE':
        handleDelete($pdo);
        break;
    default:
        send_response(['error' => 'Method not allowed'], 405);
        break;
}

function handleGet($pdo)
{
    $isPaid = isset($_GET['is_paid']) ? ($_GET['is_paid'] === '1' ? 1 : 0) : null;
    try {
        $sql = "SELECT p.*, (SELECT SUM(amount_paid) FROM tbl_payments WHERE reference_id = CONCAT('REG-', p.patient_unique_id)) as total_paid FROM tbl_patients p";
        $params = [];
        $where = [];

        if ($isPaid !== null) {
            $where[] = "is_paid = :is_paid";
            $params[':is_paid'] = $isPaid;
        }

        // Usually we don't want to show subfiles in the main patient list
        $where[] = "parent_file_id IS NULL";

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " ORDER BY created_at DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_response($patients);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function generatePatientUniqueId($pdo)
{
    $prefix = 'GH-' . date('my'); // e.g., GH-0226
    $stmt = $pdo->query("SELECT patient_unique_id FROM tbl_patients ORDER BY patient_id DESC LIMIT 1");
    $lastId = $stmt->fetchColumn();

    if (!$lastId) {
        return $prefix . '-00001';
    }

    $parts = explode('-', $lastId);
    $num = intval(end($parts)) + 1;
    return $prefix . '-' . str_pad($num, 5, '0', STR_PAD_LEFT);
}

function handlePost($pdo)
{
    $data = get_request_data();

    // Debug logging
    file_put_contents(__DIR__ . '/debug_patients.log', date('[Y-m-d H:i:s] ') . "POST data: " . json_encode($data) . PHP_EOL, FILE_APPEND);

    if (empty($data['first_name']) || empty($data['last_name']) || empty($data['gender'])) {
        send_response(['error' => 'Required fields missing'], 400);
    }

    try {
        $patient_unique = generatePatientUniqueId($pdo);
        $full_name = $data['first_name'] . ' ' . (isset($data['middle_name']) ? $data['middle_name'] . ' ' : '') . $data['last_name'];

        $sql = "INSERT INTO tbl_patients (
                    patient_unique_id, first_name, middle_name, last_name, full_name,
                    gender, dob, phone_number, address, file_type, parent_file_id,
                    patient_type, status, is_nhis, nhis_number, nhis_provider,
                    blood_group, allergies, emergency_contact_name, emergency_contact_phone,
                    next_of_kin, notes, is_paid
                ) VALUES (
                    :unique, :fname, :mname, :lname, :fullname,
                    :gender, :dob, :phone, :address, :file_type, :parent_id,
                    :patient_type, :status, :is_nhis, :nhis_no, :nhis_prov,
                    :blood, :allergies, :e_name, :e_phone,
                    :nok, :notes, :is_paid
                )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':unique' => $patient_unique,
            ':fname' => $data['first_name'],
            ':mname' => $data['middle_name'] ?? null,
            ':lname' => $data['last_name'],
            ':fullname' => $full_name,
            ':gender' => $data['gender'],
            ':dob' => $data['dob'] ?? null,
            ':phone' => $data['phone_number'] ?? ($data['phoneNumber'] ?? ($data['phone'] ?? '')),
            ':address' => $data['address'] ?? '',
            ':file_type' => $data['file_type'] ?? 'Individual',
            ':parent_id' => $data['parent_file_id'] ?? null,
            ':patient_type' => $data['patient_type'] ?? 'OPD',
            ':status' => $data['status'] ?? 'Active',
            ':is_nhis' => $data['is_nhis'] ?? 0,
            ':nhis_no' => $data['nhis_number'] ?? null,
            ':nhis_prov' => $data['nhis_provider'] ?? null,
            ':blood' => $data['blood_group'] ?? null,
            ':allergies' => $data['allergies'] ?? null,
            ':e_name' => $data['emergency_contact_name'] ?? null,
            ':e_phone' => $data['emergency_contact_phone'] ?? null,
            ':nok' => $data['next_of_kin'] ?? null,
            ':notes' => $data['notes'] ?? null,
            ':is_paid' => $data['is_paid'] ?? 0
        ]);

        $id = $pdo->lastInsertId();

        // Automatically create a subfile if it's a Family file
        if (isset($data['file_type']) && $data['file_type'] === 'Family') {
            try {
                $subSql = "INSERT INTO tbl_subfile (
                            subfile_file_id, subfile_fname, subfile_lname, 
                            subfile_gender, subfile_dob, subfile_bloodgroup, 
                            subfile_knownallergies
                        ) VALUES (
                            :file_id, :fname, :lname, 
                            :gender, :dob, :blood, 
                            :allergies
                        )";
                $subStmt = $pdo->prepare($subSql);
                $subStmt->execute([
                    ':file_id' => $patient_unique,
                    ':fname' => $data['first_name'],
                    ':lname' => $data['last_name'],
                    ':gender' => $data['gender'],
                    ':dob' => $data['dob'] ?? null,
                    ':blood' => $data['blood_group'] ?? null,
                    ':allergies' => $data['allergies'] ?? null
                ]);
            } catch (PDOException $subE) {
                // Log error but don't fail the primary registration
                file_put_contents(__DIR__ . '/debug_patients.log', date('[Y-m-d H:i:s] ') . "Subfile automation error: " . $subE->getMessage() . PHP_EOL, FILE_APPEND);
            }
        }

        log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_PATIENT', 'Patients', null, array_merge($data, ['patient_unique_id' => $patient_unique]));

        send_response(['id' => $id, 'patient_unique_id' => $patient_unique, 'message' => 'Patient record created successfully'], 201);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePut($pdo)
{
    $data = get_request_data();

    if (empty($data['patient_id'])) {
        send_response(['error' => 'Patient ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_patients WHERE patient_id = ?");
        $stmt->execute([$data['patient_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Patient not found'], 404);
        }

        $full_name = ($data['first_name'] ?? $oldValue['first_name']) . ' ' .
            (isset($data['middle_name']) ? ($data['middle_name'] ? $data['middle_name'] . ' ' : '') : ($oldValue['middle_name'] ? $oldValue['middle_name'] . ' ' : '')) .
            ($data['last_name'] ?? $oldValue['last_name']);

        $sql = "UPDATE tbl_patients SET 
                    first_name = :fname, 
                    middle_name = :mname, 
                    last_name = :lname, 
                    full_name = :fullname,
                    gender = :gender, 
                    dob = :dob, 
                    phone_number = :phone, 
                    address = :address, 
                    file_type = :file_type, 
                    parent_file_id = :parent_id,
                    patient_type = :patient_type, 
                    status = :status, 
                    is_nhis = :is_nhis, 
                    nhis_number = :nhis_no, 
                    nhis_provider = :nhis_prov,
                    blood_group = :blood, 
                    allergies = :allergies, 
                    emergency_contact_name = :e_name, 
                    emergency_contact_phone = :e_phone,
                    next_of_kin = :nok, 
                    notes = :notes,
                    is_dead = :is_dead,
                    date_of_death = :dod,
                    cause_of_death = :cod,
                    death_remarks = :remarks,
                    is_paid = :is_paid
                WHERE patient_id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fname' => $data['first_name'] ?? $oldValue['first_name'],
            ':mname' => $data['middle_name'] ?? $oldValue['middle_name'],
            ':lname' => $data['last_name'] ?? $oldValue['last_name'],
            ':fullname' => $full_name,
            ':gender' => $data['gender'] ?? $oldValue['gender'],
            ':dob' => $data['dob'] ?? $oldValue['dob'],
            ':phone' => $data['phone_number'] ?? ($data['phoneNumber'] ?? ($data['phone'] ?? $oldValue['phone_number'])),
            ':address' => $data['address'] ?? $oldValue['address'],
            ':file_type' => $data['file_type'] ?? $oldValue['file_type'],
            ':parent_id' => $data['parent_file_id'] ?? $oldValue['parent_file_id'],
            ':patient_type' => $data['patient_type'] ?? $oldValue['patient_type'],
            ':status' => $data['status'] ?? $oldValue['status'],
            ':is_nhis' => $data['is_nhis'] ?? $oldValue['is_nhis'],
            ':nhis_no' => $data['nhis_number'] ?? $oldValue['nhis_number'],
            ':nhis_prov' => $data['nhis_provider'] ?? $oldValue['nhis_provider'],
            ':blood' => $data['blood_group'] ?? $oldValue['blood_group'],
            ':allergies' => $data['allergies'] ?? $oldValue['allergies'],
            ':e_name' => $data['emergency_contact_name'] ?? $oldValue['emergency_contact_name'],
            ':e_phone' => $data['emergency_contact_phone'] ?? $oldValue['emergency_contact_phone'],
            ':nok' => $data['next_of_kin'] ?? $oldValue['next_of_kin'],
            ':notes' => $data['notes'] ?? $oldValue['notes'],
            ':is_dead' => $data['is_dead'] ?? $oldValue['is_dead'],
            ':dod' => $data['date_of_death'] ?? $oldValue['date_of_death'],
            ':cod' => $data['cause_of_death'] ?? $oldValue['cause_of_death'],
            ':remarks' => $data['death_remarks'] ?? $oldValue['death_remarks'],
            ':is_paid' => $data['is_paid'] ?? $oldValue['is_paid'],
            ':id' => $data['patient_id']
        ]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_PATIENT', 'Patients', $oldValue, $data);

        send_response(['message' => 'Patient record updated successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleDelete($pdo)
{
    $data = get_request_data();

    if (empty($data['patient_id'])) {
        send_response(['error' => 'Patient ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_patients WHERE patient_id = ?");
        $stmt->execute([$data['patient_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Patient not found'], 404);
        }

        // Delete associated subfiles if this is a family parent
        if (!empty($oldValue['patient_unique_id'])) {
            $parentUid = $oldValue['patient_unique_id'];

            // Delete from tbl_patients where parent_file_id matches
            $stmtFam = $pdo->prepare("DELETE FROM tbl_patients WHERE parent_file_id = ?");
            $stmtFam->execute([$parentUid]);

            // Delete from tbl_subfile where subfile_file_id matches
            $stmtSub = $pdo->prepare("DELETE FROM tbl_subfile WHERE subfile_file_id = ?");
            $stmtSub->execute([$parentUid]);
        }

        $stmt = $pdo->prepare("DELETE FROM tbl_patients WHERE patient_id = ?");
        $stmt->execute([$data['patient_id']]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_PATIENT', 'Patients', $oldValue, null);

        send_response(['message' => 'Patient record deleted successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>