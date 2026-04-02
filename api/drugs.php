<?php
require_once 'config.php';
require_once 'functions.php';

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
        break;
}

function handleGet($pdo)
{
    try {
        $stmt = $pdo->query("SELECT * FROM tbl_drugs ORDER BY drug_name ASC");
        $drugs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Map database fields to frontend expectations if needed, 
        // but here we'll just return the raw rows and handle mapping in the frontend
        send_response($drugs);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePost($pdo)
{
    $data = get_request_data();
    $action = $data['action'] ?? '';

    switch ($action) {
        case 'add_drug':
            addDrug($pdo, $data);
            break;
        case 'update_drug':
            updateDrug($pdo, $data);
            break;
        case 'delete_drug':
            deleteDrug($pdo, $data);
            break;
        default:
            send_response(['error' => 'Invalid action'], 400);
            break;
    }
}

function addDrug($pdo, $data)
{
    if (empty($data['drug_name'])) {
        send_response(['error' => 'Drug name is required'], 400);
    }

    try {
        $sql = "INSERT INTO tbl_drugs (drug_name, drug_price, drug_qty, expiry_date) 
                VALUES (:name, :price, :qty, :expiry)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $data['drug_name'],
            ':price' => $data['drug_price'] ?? 0,
            ':qty' => $data['drug_qty'] ?? 0,
            ':expiry' => $data['expiry_date'] ?? null
        ]);

        $id = $pdo->lastInsertId();

        log_activity($pdo, $data['performerId'] ?? 'System', 'ADD_DRUG', 'Pharmacy', null, $data);

        send_response([
            'success' => true,
            'message' => 'Drug added successfully',
            'drug_id' => $id
        ], 201);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function updateDrug($pdo, $data)
{
    if (empty($data['drug_id'])) {
        send_response(['error' => 'Drug ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_drugs WHERE drug_id = ?");
        $stmt->execute([$data['drug_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Drug not found'], 404);
        }

        $sql = "UPDATE tbl_drugs SET 
                drug_name = :name, 
                drug_price = :price, 
                drug_qty = :qty, 
                expiry_date = :expiry 
                WHERE drug_id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $data['drug_name'] ?? $oldValue['drug_name'],
            ':price' => $data['drug_price'] ?? $oldValue['drug_price'],
            ':qty' => $data['drug_qty'] ?? $oldValue['drug_qty'],
            ':expiry' => $data['expiry_date'] ?? $oldValue['expiry_date'],
            ':id' => $data['drug_id']
        ]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_DRUG', 'Pharmacy', $oldValue, $data);

        send_response(['success' => true, 'message' => 'Drug updated successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function deleteDrug($pdo, $data)
{
    if (empty($data['drug_id'])) {
        send_response(['error' => 'Drug ID is required'], 400);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM tbl_drugs WHERE drug_id = ?");
        $stmt->execute([$data['drug_id']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Drug not found'], 404);
        }

        $stmt = $pdo->prepare("DELETE FROM tbl_drugs WHERE drug_id = ?");
        $stmt->execute([$data['drug_id']]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_DRUG', 'Pharmacy', $oldValue, null);

        send_response(['success' => true, 'message' => 'Drug deleted successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
