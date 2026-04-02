<?php
require_once 'config.php';
require_once 'session_validate.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($pdo);
        break;
    case 'POST':
        handlePost($pdo);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet($pdo)
{
    $appointment_number = $_GET['appointment_number'] ?? null;
    $patient_id = $_GET['patient_id'] ?? null;

    if ($appointment_number) {
        $stmt = $pdo->prepare("SELECT * FROM tbl_vitals WHERE vital_appointment = :appt ORDER BY date_time DESC LIMIT 1");
        $stmt->execute([':appt' => $appointment_number]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    } elseif ($patient_id) {
        $stmt = $pdo->prepare("SELECT * FROM tbl_vitals WHERE vital_pid = :pid ORDER BY date_time DESC");
        $stmt->execute([':pid' => $patient_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Missing search parameters']);
    }
}

function handlePost($pdo)
{
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['vital_pid'], $data['vital_appointment'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    try {
        $pdo->beginTransaction();

        // Check if vitals already exist for this appointment
        $checkStmt = $pdo->prepare("SELECT vital_id FROM tbl_vitals WHERE vital_appointment = :appt");
        $checkStmt->execute([':appt' => $data['vital_appointment']]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Update existing record
            $sql = "UPDATE tbl_vitals SET 
                        vital_pid = :pid,
                        vital_is_sub = :is_sub,
                        vital_temperature = :temp,
                        vital_bloodpressure = :bp,
                        vital_heartrate = :hr,
                        vital_respiratory = :resp,
                        vital_oxygen = :ox,
                        vital_weight = :weight,
                        vital_height = :height,
                        vital_bmi = :bmi,
                        vital_rbs = :rbs
                    WHERE vital_appointment = :appt";
        } else {
            // Insert new record
            $sql = "INSERT INTO tbl_vitals (
                        vital_pid, vital_is_sub, vital_temperature, 
                        vital_bloodpressure, vital_heartrate, vital_respiratory, 
                        vital_oxygen, vital_weight, vital_height, 
                        vital_bmi, vital_rbs, vital_appointment
                    ) VALUES (
                        :pid, :is_sub, :temp, 
                        :bp, :hr, :resp, 
                        :ox, :weight, :height, 
                        :bmi, :rbs, :appt
                    )";
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':pid' => $data['vital_pid'],
            ':is_sub' => $data['vital_is_sub'] ?? 0,
            ':temp' => $data['vital_temperature'] ?? null,
            ':bp' => $data['vital_bloodpressure'] ?? null,
            ':hr' => $data['vital_heartrate'] ?? null,
            ':resp' => $data['vital_respiratory'] ?? null,
            ':ox' => $data['vital_oxygen'] ?? null,
            ':weight' => $data['vital_weight'] ?? null,
            ':height' => $data['vital_height'] ?? null,
            ':bmi' => $data['vital_bmi'] ?? null,
            ':rbs' => $data['vital_rbs'] ?? null,
            ':appt' => $data['vital_appointment']
        ]);

        // Update appointment status to 'Processed' - DEACTIVATED per user request
        // $updateSql = "UPDATE tbl_appointment SET appointment_sta = 'Processed' WHERE appointment_number = :appt";
        // $updateStmt = $pdo->prepare($updateSql);
        // $updateStmt->execute([':appt' => $data['vital_appointment']]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => $existing ? 'Vitals updated successfully' : 'Vitals recorded successfully'
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save vitals: ' . $e->getMessage()]);
    }
}
