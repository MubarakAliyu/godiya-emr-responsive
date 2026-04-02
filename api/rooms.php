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
    try {
        $stmt = $pdo->query("SELECT * FROM tbl_bed_categories ORDER BY created_at DESC");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Map database fields to frontend expectations
        $result = array_map(function ($row) {
            return [
                'dbId' => (int) $row['id'],
                'id' => $row['category_unique_id'],
                'categoryName' => $row['category_name'],
                'pricePerDay' => (float) $row['price_per_day'],
                'totalBeds' => (int) $row['total_beds'],
                'occupiedBeds' => (int) $row['occupied_beds'],
                'availableBeds' => (int) $row['total_beds'] - (int) $row['occupied_beds'],
                'description' => $row['description'],
                'dateCreated' => $row['created_at'],
                'lastUpdated' => $row['updated_at']
            ];
        }, $categories);

        send_response($result);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePost($pdo)
{
    $data = get_request_data();

    if (empty($data['category_name'])) {
        send_response(['error' => 'Category name is required'], 400);
    }

    try {
        // Generate a unique category ID that is collision-resistant
        $unique_id = 'GH-BED-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));

        // Retry in unlikely case of collision
        $max_retries = 5;
        for ($i = 0; $i < $max_retries; $i++) {
            $check = $pdo->prepare("SELECT id FROM tbl_bed_categories WHERE category_unique_id = ?");
            $check->execute([$unique_id]);
            if (!$check->fetch())
                break; // Unique, use it
            $unique_id = 'GH-BED-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
        }

        $sql = "INSERT INTO tbl_bed_categories (category_unique_id, category_name, price_per_day, total_beds, occupied_beds,
description)
VALUES (:unique_id, :name, :price, :total, :occupied, :description)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':unique_id' => $unique_id,
            ':name' => $data['category_name'],
            ':price' => $data['price_per_day'] ?? 0,
            ':total' => $data['total_beds'] ?? 0,
            ':occupied' => $data['occupied_beds'] ?? 0,
            ':description' => $data['description'] ?? ''
        ]);

        $id = $pdo->lastInsertId();

        log_activity($pdo, $data['performerId'] ?? 'System', 'CREATE_BED_CATEGORY', 'Beds', null, $data);

        send_response([
            'message' => 'Bed category created successfully',
            'id' => $id,
            'category_unique_id' => $unique_id
        ], 201);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePut($pdo)
{
    $data = get_request_data();

    if (empty($data['dbId'])) {
        send_response(['error' => 'Database ID is required'], 400);
    }

    try {
        // Fetch old value for logging
        $stmt = $pdo->prepare("SELECT * FROM tbl_bed_categories WHERE id = ?");
        $stmt->execute([$data['dbId']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Category not found'], 404);
        }

        $sql = "UPDATE tbl_bed_categories SET
category_name = :name,
price_per_day = :price,
total_beds = :total,
occupied_beds = :occupied,
description = :description
WHERE id = :id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':name' => $data['category_name'] ?? $oldValue['category_name'],
            ':price' => $data['price_per_day'] ?? $oldValue['price_per_day'],
            ':total' => $data['total_beds'] ?? $oldValue['total_beds'],
            ':occupied' => $data['occupied_beds'] ?? $oldValue['occupied_beds'],
            ':description' => $data['description'] ?? $oldValue['description'],
            ':id' => $data['dbId']
        ]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'UPDATE_BED_CATEGORY', 'Beds', $oldValue, $data);

        send_response(['message' => 'Bed category updated successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handleDelete($pdo)
{
    $data = get_request_data();

    if (empty($data['dbId'])) {
        send_response(['error' => 'Database ID is required'], 400);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM tbl_bed_categories WHERE id = ?");
        $stmt->execute([$data['dbId']]);
        $oldValue = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$oldValue) {
            send_response(['error' => 'Category not found'], 404);
        }

        $stmt = $pdo->prepare("DELETE FROM tbl_bed_categories WHERE id = ?");
        $stmt->execute([$data['dbId']]);

        log_activity($pdo, $data['performerId'] ?? 'System', 'DELETE_BED_CATEGORY', 'Beds', $oldValue, null);

        send_response(['message' => 'Bed category deleted successfully']);
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}