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
    $file_id = $_GET['file_id'] ?? null;
    $subfile_id = $_GET['subfile_id'] ?? null;
    try {
        if ($subfile_id) {
            $stmt = $pdo->prepare("SELECT * FROM tbl_subfile WHERE subfile_id = ?");
            $stmt->execute([$subfile_id]);
            $subfile = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$subfile) {
                send_response(['error' => 'Subfile not found'], 404);
            }
            send_response($subfile);
            return;
        }

        if ($file_id) {
            $stmt = $pdo->prepare("SELECT * FROM tbl_subfile WHERE subfile_file_id = ? ORDER BY created_at DESC");
            $stmt->execute([$file_id]);
        } else {
            $stmt = $pdo->query("SELECT * FROM tbl_subfile ORDER BY created_at DESC");
        }
        $subfiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_response($subfiles);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePost($pdo)
{
    $data = get_request_data();

    if (empty($data['subfile_file_id']) || empty($data['subfile_fname']) || empty($data['subfile_lname']) || empty($data['subfile_gender'])) {
        send_response(['error' => 'Required fields missing'], 400);
    }

    try {
        $sql = "INSERT INTO tbl_subfile (
                    subfile_file_id, subfile_fname, subfile_lname, 
                    subfile_gender, subfile_maritalstatus, subfile_knownallergies, 
                    subfile_dob, subfile_bloodgroup, is_dead,
                    date_of_death, cause_of_death, death_remarks
                ) VALUES (
                    :file_id, :fname, :lname, 
                    :gender, :marital, :allergies, 
                    :dob, :blood, :is_dead,
                    :dod, :cod, :remarks
                )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':file_id' => $data['subfile_file_id'],
            ':fname' => $data['subfile_fname'],
            ':lname' => $data['subfile_lname'],
            ':gender' => $data['subfile_gender'],
            ':marital' => $data['subfile_maritalstatus'] ?? null,
            ':allergies' => $data['subfile_knownallergies'] ?? null,
            ':dob' => $data['subfile_dob'] ?? null,
            ':blood' => $data['subfile_bloodgroup'] ?? null,
            ':is_dead' => $data['is_dead'] ?? 0,
            ':dod' => $data['date_of_death'] ?? null,
            ':cod' => $data['cause_of_death'] ?? null,
            ':remarks' => $data['death_remarks'] ?? null
        ]);

        $id = $pdo->lastInsertId();

        log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_SUBFILE', 'Patients', null, array_merge($data, ['id' => $id]));

        send_response(['id' => $id, 'message' => 'Family member added successfuly'], 201);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePut($pdo)
{
    $data = get_request_data();

    if (empty($data['subfile_id'])) {
        send_response(['error' => 'Subfile ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_subfile WHERE subfile_id = ?");
        $stmt->execute([$data['subfile_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Subfile not found'], 404);
        }

        $sql = "UPDATE tbl_subfile SET 
                    subfile_fname = :fname, 
                    subfile_lname = :lname, 
                    subfile_gender = :gender, 
                    subfile_maritalstatus = :marital, 
                    subfile_knownallergies = :allergies, 
                    subfile_dob = :dob, 
                    subfile_bloodgroup = :blood, 
                    is_dead = :is_dead,
                    date_of_death = :dod,
                    cause_of_death = :cod,
                    death_remarks = :remarks
                WHERE subfile_id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fname' => $data['subfile_fname'] ?? $oldValue['subfile_fname'],
            ':lname' => $data['subfile_lname'] ?? $oldValue['subfile_lname'],
            ':gender' => $data['subfile_gender'] ?? $oldValue['subfile_gender'],
            ':marital' => $data['subfile_maritalstatus'] ?? $oldValue['subfile_maritalstatus'],
            ':allergies' => $data['subfile_knownallergies'] ?? $oldValue['subfile_knownallergies'],
            ':dob' => $data['subfile_dob'] ?? $oldValue['subfile_dob'],
            ':blood' => $data['subfile_bloodgroup'] ?? $oldValue['subfile_bloodgroup'],
            ':is_dead' => $data['is_dead'] ?? $oldValue['is_dead'],
            ':dod' => $data['date_of_death'] ?? $oldValue['date_of_death'],
            ':cod' => $data['cause_of_death'] ?? $oldValue['cause_of_death'],
            ':remarks' => $data['death_remarks'] ?? $oldValue['death_remarks'],
            ':id' => $data['subfile_id']
        ]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_SUBFILE', 'Patients', $oldValue, $data);

        send_response(['message' => 'Subfile updated successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleDelete($pdo)
{
    $data = get_request_data();

    if (empty($data['subfile_id'])) {
        send_response(['error' => 'Subfile ID is required'], 400);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM tbl_subfile WHERE subfile_id = ?");
        $stmt->execute([$data['subfile_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Subfile not found'], 404);
        }

        $stmt = $pdo->prepare("DELETE FROM tbl_subfile WHERE subfile_id = ?");
        $stmt->execute([$data['subfile_id']]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_SUBFILE', 'Patients', $oldValue, null);

        send_response(['message' => 'Subfile deleted successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
