<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        handleGet($pdo, $action);
        break;
    case 'POST':
        handlePost($pdo, $action);
        break;
    default:
        send_response(['error' => 'Method not allowed'], 405);
        break;
}

function handleGet($pdo, $action)
{
    $admission_id = isset($_GET['admission_id']) ? trim($_GET['admission_id']) : null;
    $patient_id = isset($_GET['patient_id']) ? trim($_GET['patient_id']) : null;

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    try {
        switch ($action) {
            case 'nurse_notes':
                if (!$admission_id)
                    send_response(['error' => 'Admission ID required'], 400);
                $stmt = $pdo->prepare("SELECT DISTINCT n.*, u.full_name as nurse_name 
                                     FROM tbl_nurse_note n 
                                     LEFT JOIN users u ON n.nurse_nurse = u.id 
                                     WHERE n.note_admission = ? 
                                     ORDER BY n.date_time DESC");
                $stmt->execute([$admission_id]);
                send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'drug_chart':
                if (!$admission_id)
                    send_response(['error' => 'Admission ID required'], 400);
                $stmt = $pdo->prepare("SELECT * FROM tbl_drug_chart WHERE admission_id = ? ORDER BY date DESC, time DESC");
                $stmt->execute([$admission_id]);
                send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'timeline':
                if (!$admission_id)
                    send_response(['error' => 'Admission ID required'], 400);
                $stmt = $pdo->prepare("SELECT DISTINCT t.*, u.full_name as nurse_name 
                                     FROM tbl_timeline t 
                                     LEFT JOIN users u ON t.timeline_nurse = u.id 
                                     WHERE t.timeline_ipd = ? 
                                     ORDER BY t.timeline_date DESC");
                $stmt->execute([$admission_id]);
                send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'findings':
                if (!$admission_id)
                    send_response(['error' => 'Admission ID required'], 400);

                // Get findings for prescriptions
                $stmt = $pdo->prepare("SELECT * FROM tbl_findings WHERE finding_appointment_id IN 
                                     (SELECT admission_appointment FROM tbl_bed_admission WHERE admission_id = ?)");
                $stmt->execute([$admission_id]);
                $rx_findings = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Get findings for tests
                $stmt = $pdo->prepare("SELECT * FROM tbl_findings_test WHERE finding_appointment_id IN 
                                     (SELECT admission_appointment FROM tbl_bed_admission WHERE admission_id = ?)");
                $stmt->execute([$admission_id]);
                $test_findings = $stmt->fetchAll(PDO::FETCH_ASSOC);

                send_response([
                    'prescriptions' => $rx_findings,
                    'tests' => $test_findings
                ]);
                break;

            case 'operations':
                if (!$admission_id)
                    send_response(['error' => 'Admission ID required'], 400);
                $stmt = $pdo->prepare("SELECT * FROM tbl_operations WHERE admission_id = ? ORDER BY created_at DESC");
                $stmt->execute([$admission_id]);
                send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'medications':
                if (!$admission_id)
                    send_response(['error' => 'Admission ID required'], 400);
                $stmt = $pdo->prepare("SELECT * FROM tbl_medication WHERE medication_admission = ? ORDER BY medication_date DESC");
                $stmt->execute([$admission_id]);
                send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'all_patient_lab_tests':
                $p_id = $_GET['patient_id'] ?? null;
                $a_id = $_GET['admission_id'] ?? null;

                if (!$p_id && !$a_id)
                    send_response(['error' => 'Patient ID or Admission ID required'], 400);

                // Fetch tests via consultations. Try patient_id first, then admission context.
                $query = "
                    SELECT lt.*, c.doctor_id, u.full_name as doctor_name, c.appointment_id
                    FROM tbl_lab_tests lt
                    JOIN tbl_consultation_data c ON lt.consultation_id = c.id
                    LEFT JOIN users u ON c.doctor_id = u.id
                    WHERE (c.patient_id = ? OR c.appointment_id IN (SELECT admission_appointment FROM tbl_bed_admission WHERE admission_id = ?))
                    ORDER BY lt.id DESC
                ";
                $stmt = $pdo->prepare($query);
                $stmt->execute([$p_id, $a_id]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $labTests = [];
                foreach ($rows as $row) {
                    $tests = json_decode($row['test'], true);
                    if (is_array($tests)) {
                        foreach ($tests as $t) {
                            // Structuring $t if it's just a string (test name)
                            $tArr = is_array($t) ? $t : ['testName' => $t];

                            $labTests[] = array_merge($tArr, [
                                'lab_id' => $row['id'],
                                'doctor' => $row['doctor_name'],
                                'date' => $row['created_at'],
                                'appointment_id' => $row['appointment_id'],
                                'status' => $row['sta']
                            ]);
                        }
                    }
                }
                send_response($labTests);
                break;

            case 'get_admission_charges':
                if (!$admission_id)
                    send_response(['error' => 'Admission ID required'], 400);
                $stmt = $pdo->prepare("SELECT * FROM tbl_admission_charge WHERE admission_id = ? ORDER BY charge_id DESC");
                $stmt->execute([$admission_id]);
                send_response($stmt->fetchAll(PDO::FETCH_ASSOC));
                break;

            case 'get_vitals':
                if (!$admission_id && !$patient_id)
                    send_response(['error' => 'Admission ID or Patient ID required'], 400);

                // If only admission_id is provided, find the associated patient_id
                if ($admission_id && !$patient_id) {
                    $stmt = $pdo->prepare("SELECT admission_patient FROM tbl_bed_admission WHERE admission_id = ?");
                    $stmt->execute([$admission_id]);
                    $patient_id = $stmt->fetchColumn();
                }

                if (!$patient_id)
                    send_response(['error' => 'Patient not found for this admission'], 404);

                // Robust query for ALL vitals of this patient
                $alt_patient_id = $patient_id;
                if (stripos($patient_id, 'SF-') === 0) {
                    $alt_patient_id = substr($patient_id, 3);
                }
                
                $stmt_p = $pdo->prepare("SELECT patient_id FROM tbl_patients WHERE patient_unique_id = ?");
                $stmt_p->execute([$patient_id]);
                $internal_pid = $stmt_p->fetchColumn() ?: 0;

                $stmt = $pdo->prepare("
                    SELECT DISTINCT v.* FROM tbl_vitals v
                    WHERE LOWER(TRIM(v.vital_pid)) = LOWER(TRIM(?)) 
                       OR LOWER(TRIM(v.vital_pid)) = LOWER(TRIM(?)) 
                       OR v.vital_pid = ? 
                       OR v.vital_appointment IN (
                           SELECT appointment_number FROM tbl_appointment WHERE appointment_fileid = ?
                           UNION
                           SELECT CAST(appointment_id AS CHAR) FROM tbl_appointment WHERE appointment_fileid = ?
                       )
                    ORDER BY v.date_time DESC
                ");
                $stmt->execute([ (string)$patient_id, (string)$alt_patient_id, $internal_pid, $patient_id, $patient_id ]);
                $v_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                send_response($v_rows);
                break;

            case 'consultation_details':
                if (!$admission_id && !$patient_id)
                    send_response(['error' => 'Admission ID or Patient ID required'], 400);

                $appt_id = null;
                if ($admission_id) {
                    $stmt = $pdo->prepare("SELECT admission_appointment FROM tbl_bed_admission WHERE admission_id = ?");
                    $stmt->execute([$admission_id]);
                    $adm = $stmt->fetch(PDO::FETCH_ASSOC);
                    $appt_id = $adm ? $adm['admission_appointment'] : null;
                } else {
                    // Get latest finished or in-progress appointment for this patient
                    $stmt = $pdo->prepare("SELECT appointment_id FROM tbl_appointment WHERE appointment_fileid = ? ORDER BY appointment_id DESC LIMIT 1");
                    $stmt->execute([$patient_id]);
                    $appt_id = $stmt->fetchColumn();
                }

                if (!$appt_id)
                    send_response(null);

                // Fetch consultation data
                $stmt = $pdo->prepare("SELECT c.*, u.full_name as doctor_name 
                                     FROM tbl_consultation_data c 
                                     LEFT JOIN users u ON c.doctor_id = u.id 
                                     WHERE c.appointment_id = ?");
                $stmt->execute([$appt_id]);
                $consultation = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$consultation)
                    send_response(null);

                // Fetch prescriptions
                $stmt = $pdo->prepare("SELECT * FROM tbl_prescriptions WHERE consultation_id = ?");
                $stmt->execute([$consultation['id']]);
                $rxRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $prescriptions = [];
                foreach ($rxRows as $row) {
                    $items = json_decode($row['prescription'], true);
                    if (is_array($items)) {
                        foreach ($items as $item)
                            $prescriptions[] = $item;
                    }
                }

                // Fetch lab tests
                $stmt = $pdo->prepare("SELECT * FROM tbl_lab_tests WHERE consultation_id = ?");
                $stmt->execute([$consultation['id']]);
                $labRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $labTests = [];
                foreach ($labRows as $row) {
                    $tests = json_decode($row['test'], true);
                    if (is_array($tests)) {
                        foreach ($tests as $t)
                            $labTests[] = $t;
                    }
                }

                send_response([
                    'consultation' => $consultation,
                    'prescriptions' => $prescriptions,
                    'labTests' => $labTests
                ]);
                break;

            case 'appt_consultation':
                $appointment_id = $_GET['appointment_id'] ?? null;
                if (!$appointment_id)
                    send_response(['error' => 'Appointment ID required'], 400);

                $stmt = $pdo->prepare("SELECT c.*, u.full_name as doctor_name 
                                     FROM tbl_consultation_data c 
                                     LEFT JOIN users u ON c.doctor_id = u.id 
                                     WHERE c.appointment_id = ?");
                $stmt->execute([$appointment_id]);
                $consultation = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$consultation)
                    send_response(null);

                $stmt = $pdo->prepare("SELECT * FROM tbl_prescriptions WHERE consultation_id = ?");
                $stmt->execute([$consultation['id']]);
                $rxRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $prescriptions = [];
                foreach ($rxRows as $row) {
                    $items = json_decode($row['prescription'], true);
                    if (is_array($items)) {
                        foreach ($items as $item)
                            $prescriptions[] = $item;
                    }
                }

                $stmt = $pdo->prepare("SELECT * FROM tbl_lab_tests WHERE consultation_id = ?");
                $stmt->execute([$consultation['id']]);
                $labRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $labTests = [];
                foreach ($labRows as $row) {
                    $tests = json_decode($row['test'], true);
                    if (is_array($tests)) {
                        foreach ($tests as $t)
                            $labTests[] = $t;
                    }
                }

                send_response([
                    'consultation' => $consultation,
                    'prescriptions' => $prescriptions,
                    'labTests' => $labTests
                ]);
                break;


            case 'lab_results':
                $lab_id = $_GET['lab_id'] ?? null;
                if (!$lab_id)
                    send_response(['error' => 'Lab ID required'], 400);

                // Note: tbl_lab_test_result currently links via lab_invoice_id
                // We might need to handle this differently if invoices aren't 1:1 with test records
                $stmt = $pdo->prepare("SELECT * FROM tbl_lab_test_result WHERE lab_invoice_id = ?");
                $stmt->execute([$lab_id]);
                send_response($stmt->fetch(PDO::FETCH_ASSOC));
                break;

            case 'full_patient_file':
                if (!$patient_id)
                    send_response(['error' => 'Patient ID required'], 400);

                $results = [];

                // 0. Patient Info
                $patient = null;
                if (stripos($patient_id, 'SF-') === 0) {
                    $pid = substr($patient_id, 3);
                    $stmt = $pdo->prepare("SELECT * FROM tbl_subfile WHERE subfile_id = ?");
                    $stmt->execute([$pid]);
                    $sub = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($sub) {
                        $patient = [
                            'id' => 'SF-' . $sub['subfile_id'],
                            'fullName' => $sub['subfile_fname'] . ' ' . $sub['subfile_lname'],
                            'firstName' => $sub['subfile_fname'],
                            'lastName' => $sub['subfile_lname'],
                            'gender' => $sub['subfile_gender'],
                            'age' => date_diff(date_create($sub['subfile_dob'] ?? 'now'), date_create('today'))->y,
                            'dateOfBirth' => $sub['subfile_dob'],
                            'phoneNumber' => 'N/A',
                            'fileType' => 'Subfile',
                            'patientType' => 'Outpatient',
                            'status' => $sub['is_dead'] ? 'Deceased' : 'Active',
                            'isNHIS' => false,
                            'isDead' => (bool) $sub['is_dead'],
                            'dateRegistered' => $sub['created_at'],
                            'isSubfile' => true,
                            'parentFileId' => $sub['subfile_file_id']
                        ];
                    }
                } else {
                    $stmt = $pdo->prepare("SELECT * FROM tbl_patients WHERE patient_unique_id = ?");
                    $stmt->execute([$patient_id]);
                    $p = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($p) {
                        $patient = [
                            'id' => $p['patient_unique_id'],
                            'fullName' => $p['full_name'],
                            'firstName' => $p['first_name'],
                            'lastName' => $p['last_name'],
                            'gender' => $p['gender'],
                            'age' => date_diff(date_create($p['dob'] ?? 'now'), date_create('today'))->y,
                            'dateOfBirth' => $p['dob'],
                            'phoneNumber' => $p['phone_number'],
                            'fileType' => $p['file_type'],
                            'patientType' => $p['patient_type'],
                            'status' => $p['is_dead'] ? 'Deceased' : $p['status'],
                            'isNHIS' => ($p['file_type'] ?? '') === 'NHIS',
                            'isDead' => (bool) $p['is_dead'],
                            'dateRegistered' => $p['created_at']
                        ];
                    }
                }
                $results['patient'] = $patient;

                // 1. Appointments: from tbl_appointment, show status and payment status
                $stmt = $pdo->prepare("SELECT * FROM tbl_appointment WHERE appointment_fileid = ? ORDER BY appointment_date DESC");
                $stmt->execute([$patient_id]);
                $results['appointments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 2. Prescriptions: gotten from tbl_prescription inner join appointment
                // (Using tbl_prescriptions as per database.sql)
                $stmt = $pdo->prepare("
                    SELECT p.*, a.appointment_date, a.appointment_number 
                    FROM tbl_prescriptions p 
                    INNER JOIN tbl_consultation_data c ON p.consultation_id = c.id
                    INNER JOIN tbl_appointment a ON c.appointment_id = a.appointment_id
                    WHERE a.appointment_fileid = ?
                    ORDER BY a.appointment_date DESC
                ");
                $stmt->execute([$patient_id]);
                $results['prescriptions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 3. Payments: union of test_invoice, drug_invoice, and tbl_payments
                $payments = [];
                // test_invoice where is_paid = 1
                $stmt = $pdo->prepare("SELECT * FROM test_invoice WHERE inv_file_number = ? AND is_paid = 1");
                $stmt->execute([$patient_id]);
                $test_invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($test_invoices as $ti)
                    $payments[] = array_merge($ti, ['payment_category' => 'Lab Test', 'reference_id' => $ti['inv_id'] ?? $ti['id'] ?? null]);

                // drug_invoice where is_paid = 1
                $stmt = $pdo->prepare("SELECT * FROM drug_invoice WHERE inv_file_number = ? AND is_paid = 1");
                $stmt->execute([$patient_id]);
                $drug_invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($drug_invoices as $di)
                    $payments[] = array_merge($di, ['payment_category' => 'Pharmacy', 'reference_id' => $di['inv_id'] ?? $di['id'] ?? null]);

                // tbl_payments (every record here is a payment)
                $stmt = $pdo->prepare("SELECT * FROM tbl_payments WHERE patient_unique_id = ? ORDER BY created_at DESC");
                $stmt->execute([$patient_id]);
                $other_payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($other_payments as $op)
                    $payments[] = array_merge($op, ['payment_category' => 'General', 'reference_id' => $op['payment_id'] ?? $op['id'] ?? null]);

                $results['payments'] = $payments;

                // 4. Admissions: from tbl_bed_admission
                $stmt = $pdo->prepare("SELECT ba.*, bc.category_name as ward_name, ba.admission_bed as bed_no
                                     FROM tbl_bed_admission ba
                                     LEFT JOIN tbl_bed_categories bc ON ba.admission_bed = bc.id
                                     WHERE ba.admission_patient = ? 
                                     ORDER BY ba.admission_datetime DESC");
                $stmt->execute([$patient_id]);
                $results['admissions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 5. Lab Tests: tbl_lab_test innerjoin appoinment
                // (Using tbl_lab_tests as per database.sql)
                $stmt = $pdo->prepare("
                    SELECT lt.*, a.appointment_date, a.appointment_number, u.full_name as doctor_name
                    FROM tbl_lab_tests lt 
                    INNER JOIN tbl_consultation_data c ON lt.consultation_id = c.id
                    INNER JOIN tbl_appointment a ON c.appointment_id = a.appointment_id
                    LEFT JOIN users u ON c.doctor_id = u.id
                    WHERE a.appointment_fileid = ?
                    ORDER BY a.appointment_date DESC
                ");
                $stmt->execute([$patient_id]);
                $results['lab_tests'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 6. Findings (from tbl_findings and tbl_findings_test)
                $stmt = $pdo->prepare("SELECT * FROM tbl_findings WHERE finding_appointment_id IN (SELECT appointment_id FROM tbl_appointment WHERE appointment_fileid = ?)");
                $stmt->execute([$patient_id]);
                $rx_findings = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $stmt = $pdo->prepare("SELECT * FROM tbl_findings_test WHERE finding_appointment_id IN (SELECT appointment_id FROM tbl_appointment WHERE appointment_fileid = ?)");
                $stmt->execute([$patient_id]);
                $test_findings = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $results['findings'] = array_merge($rx_findings, $test_findings);

                // 7. Medications: from drug chart where administered
                $stmt = $pdo->prepare("
                    SELECT dc.* 
                    FROM tbl_drug_chart dc
                    WHERE dc.administered = 1 AND dc.admission_id IN (SELECT admission_id FROM tbl_bed_admission WHERE admission_patient = ?)
                    ORDER BY dc.administered_at DESC
                ");
                $stmt->execute([$patient_id]);
                $results['medications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 8. Operations
                $stmt = $pdo->prepare("SELECT * FROM tbl_operations WHERE admission_id IN (SELECT admission_id FROM tbl_bed_admission WHERE admission_patient = ?)");
                $stmt->execute([$patient_id]);
                $results['operations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 9. Refer Requests: where approved (rs_sta = 'approved')
                $stmt = $pdo->prepare("SELECT * FROM tbl_refer_request WHERE rs_sta = 'approved' AND rs_apid IN (SELECT appointment_id FROM tbl_appointment WHERE appointment_fileid = ?)");
                $stmt->execute([$patient_id]);
                $results['refer_requests'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 10. Surgery Requests: where approved (sr_sta = 'approved')
                $stmt = $pdo->prepare("SELECT * FROM tbl_surgery_request WHERE sr_sta = 'approved' AND sr_apid IN (SELECT appointment_id FROM tbl_appointment WHERE appointment_fileid = ?)");
                $stmt->execute([$patient_id]);
                $results['surgery_requests'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 10.5 Vitals
                $alt_patient_id = $patient_id;
                if (stripos($patient_id, 'SF-') === 0) {
                    $alt_patient_id = substr($patient_id, 3);
                }
                
                // Get internal patient ID as another fallback
                $internal_pid = 0;
                $stmt_p = $pdo->prepare("SELECT patient_id FROM tbl_patients WHERE patient_unique_id = ?");
                $stmt_p->execute([$patient_id]);
                $internal_pid = $stmt_p->fetchColumn() ?: 0;

                // Get vitals by PID fallback, subfile ID fallback, internal ID fallback,
                // AND vitals linked to any of this patient's appointments (by ID or Number)
                $stmt = $pdo->prepare("
                    SELECT DISTINCT v.* FROM tbl_vitals v
                    WHERE LOWER(TRIM(v.vital_pid)) = LOWER(TRIM(?)) 
                       OR LOWER(TRIM(v.vital_pid)) = LOWER(TRIM(?)) 
                       OR v.vital_pid = ? 
                       OR v.vital_appointment IN (
                           SELECT appointment_number FROM tbl_appointment WHERE appointment_fileid = ?
                           UNION
                           SELECT CAST(appointment_id AS CHAR) FROM tbl_appointment WHERE appointment_fileid = ?
                       )
                    ORDER BY v.date_time DESC
                ");
                $stmt->execute([ (string)$patient_id, (string)$alt_patient_id, $internal_pid, $patient_id, $patient_id ]);
                $vitals_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $results['vitals'] = is_array($vitals_data) ? $vitals_data : [];

                // 11. Consultations: all appointment consultation summary
                $stmt = $pdo->prepare("
                    SELECT c.*, u.full_name as doctor_name 
                    FROM tbl_consultation_data c 
                    LEFT JOIN users u ON c.doctor_id = u.id 
                    WHERE c.patient_id = ? OR c.appointment_id IN (SELECT appointment_id FROM tbl_appointment WHERE appointment_fileid = ?)
                    ORDER BY c.consultation_date DESC
                ");
                $stmt->execute([$patient_id, $patient_id]);
                $consultations = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Fetch prescriptions and lab tests for each consultation to show in summary
                foreach ($consultations as &$con) {
                    // Prescriptions (Drugs)
                    $stmt = $pdo->prepare("SELECT * FROM tbl_prescriptions WHERE consultation_id = ?");
                    $stmt->execute([$con['id']]);
                    $rxRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    $con['prescriptions'] = [];
                    foreach ($rxRows as $row) {
                        $items = json_decode($row['prescription'], true);
                        if (is_array($items)) {
                            foreach ($items as $item)
                                $con['prescriptions'][] = $item;
                        }
                    }

                    // Lab Tests
                    $stmt = $pdo->prepare("SELECT * FROM tbl_lab_tests WHERE consultation_id = ?");
                    $stmt->execute([$con['id']]);
                    $labRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    $con['lab_tests'] = [];
                    foreach ($labRows as $row) {
                        $tests = json_decode($row['test'], true);
                        if (is_array($tests)) {
                            foreach ($tests as $t)
                                $con['lab_tests'][] = $t;
                        }
                    }
                }
                $results['consultations'] = $consultations;

                // 12. Nurse Notes: entries relating to the patient
                $stmt = $pdo->prepare("
                    SELECT n.*, u.full_name as nurse_name 
                    FROM tbl_nurse_note n 
                    LEFT JOIN users u ON n.nurse_nurse = u.id 
                    WHERE n.note_admission IN (SELECT admission_id FROM tbl_bed_admission WHERE admission_patient = ?)
                    ORDER BY n.date_time DESC
                ");
                $stmt->execute([$patient_id]);
                $results['nurse_notes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 13. Doctor Notes: from tbl_timeline where title is 'Doctor Note'
                $stmt = $pdo->prepare("
                    SELECT t.*, u.full_name as doctor_name 
                    FROM tbl_timeline t 
                    LEFT JOIN users u ON t.timeline_nurse = u.id 
                    WHERE t.timeline_title = 'Doctor Note' AND t.timeline_ipd IN (SELECT admission_id FROM tbl_bed_admission WHERE admission_patient = ?)
                    ORDER BY t.timeline_date DESC
                ");
                $stmt->execute([$patient_id]);
                $results['doctor_notes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // 15. Lab Test Results: from tbl_lab_test_result joined with test_invoice
                $stmt = $pdo->prepare("
                    SELECT tr.*, ti.gen_date as invoice_date, ti.total as invoice_total, u.full_name as technician_name
                    FROM tbl_lab_test_result tr
                    JOIN test_invoice ti ON tr.lab_invoice_id = ti.inv_id
                    LEFT JOIN users u ON tr.technician_id = u.id
                    WHERE TRIM(ti.inv_file_number) = ? OR TRIM(ti.inv_file_number) = ?
                    GROUP BY tr.result_id
                    ORDER BY tr.result_date DESC
                ");

                // For subfiles, if patient_id is SF-4, also try searching for just 4
                $alt_patient_id = $patient_id;
                if (stripos($patient_id, 'SF-') === 0) {
                    $alt_patient_id = substr($patient_id, 3);
                }

                $stmt->execute([$patient_id, $alt_patient_id]);
                $lab_results = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($lab_results as &$lr) {
                    if (!empty($lr['result_list'])) {
                        $lr['result_list'] = json_decode($lr['result_list'], true);
                    }
                    if (!empty($lr['result_picture'])) {
                        // Check if it's JSON (multiple images)
                        if (strpos($lr['result_picture'], '{') === 0) {
                            $lr['result_pictures'] = json_decode($lr['result_picture'], true);
                        } else {
                            // Single image
                            $lr['result_pictures'] = ['Result' => $lr['result_picture']];
                        }
                    } else {
                        $lr['result_pictures'] = [];
                    }
                }
                $results['lab_results'] = $lab_results;
                send_response($results);
                break;

            default:
                send_response(['error' => 'Invalid action'], 400);
        }
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handlePost($pdo, $action)
{
    $data = get_request_data();

    try {
        switch ($action) {
            case 'add_nurse_note':
                $stmt = $pdo->prepare("INSERT INTO tbl_nurse_note (note_admission, note_note, note_comment, nurse_nurse, date_time) 
                                     VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['admission_id'],
                    $data['note'],
                    $data['comment'] ?? '',
                    $data['nurse_id'],
                    date('Y-m-d H:i:s')
                ]);
                $note_id = $pdo->lastInsertId();

                // Trigger Notification: Admitting doctor might need to know a nurse note was added
                $stmt = $pdo->prepare("SELECT admission_appointment FROM tbl_bed_admission WHERE admission_id = ?");
                $stmt->execute([$data['admission_id']]);
                $adm = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($adm) {
                    $stmt = $pdo->prepare("SELECT appointment_doctor FROM tbl_appointment WHERE appointment_number = ?");
                    $stmt->execute([$adm['admission_appointment']]);
                    $doc = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($doc) {
                        $stmt = $pdo->prepare("INSERT INTO tbl_notifications (user_id, type, category, title, description, icon) VALUES (?, 'info', 'clinical', ?, ?, 'UserPlus')");
                        $stmt->execute([
                            $doc['appointment_doctor'],
                            'New Nurse Note',
                            'A new note has been added for patient in admission #' . $data['admission_id']
                        ]);
                    }
                }

                send_response(['message' => 'Note added successfully', 'id' => $note_id]);
                break;

            case 'edit_nurse_note':
                $stmt = $pdo->prepare("UPDATE tbl_nurse_note SET note_note = ?, note_comment = ? WHERE note_id = ?");
                $stmt->execute([
                    $data['note'],
                    $data['comment'] ?? '',
                    $data['note_id']
                ]);
                send_response(['message' => 'Note updated']);
                break;

            case 'delete_nurse_note':
                $stmt = $pdo->prepare("DELETE FROM tbl_nurse_note WHERE note_id = ?");
                $stmt->execute([$data['note_id']]);
                send_response(['message' => 'Note deleted']);
                break;

            case 'add_doctor_note':
                // Doctor notes are stored in tbl_timeline
                $stmt = $pdo->prepare("INSERT INTO tbl_timeline (timeline_title, timeline_description, timeline_date, timeline_nurse, timeline_ipd) 
                                     VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    'Doctor Note',
                    $data['note'],
                    date('Y-m-d H:i:s'),
                    $data['doctor_id'],
                    $data['admission_id']
                ]);
                $note_id = $pdo->lastInsertId();

                // Notification for Nurses on duty
                $stmt = $pdo->prepare("INSERT INTO tbl_notifications (user_id, type, category, title, description, icon) VALUES (NULL, 'info', 'clinical', ?, ?, 'AlertCircle')");
                $stmt->execute([
                    'New Doctor Instruction',
                    'A doctor has added a new note/instruction for admission #' . $data['admission_id']
                ]);

                send_response(['message' => 'Doctor note added', 'id' => $note_id]);
                break;

            case 'edit_doctor_note':
                $stmt = $pdo->prepare("UPDATE tbl_timeline SET timeline_description = ? WHERE timeline_id = ?");
                $stmt->execute([$data['note'], $data['note_id']]);
                send_response(['message' => 'Doctor note updated']);
                break;

            case 'delete_doctor_note':
                $stmt = $pdo->prepare("DELETE FROM tbl_timeline WHERE timeline_id = ?");
                $stmt->execute([$data['note_id']]);
                send_response(['message' => 'Doctor note deleted']);
                break;

            case 'add_drug_chart':
                $stmt = $pdo->prepare("INSERT INTO tbl_drug_chart (admission_id, date, time, drug_name, dosage, route) 
                                     VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['admission_id'],
                    $data['date'],
                    $data['time'],
                    $data['drug_name'],
                    $data['dosage'],
                    $data['route']
                ]);
                $chart_id = $pdo->lastInsertId();

                // Notify Nurses
                $stmt = $pdo->prepare("INSERT INTO tbl_notifications (user_id, type, category, title, description, icon) VALUES (NULL, 'info', 'clinical', ?, ?, 'FlaskConical')");
                $stmt->execute([
                    'New Medication Scheduled',
                    'A new drug has been scheduled for admission #' . $data['admission_id']
                ]);

                send_response(['message' => 'Drug chart entry added', 'id' => $chart_id]);
                break;

            case 'update_drug_chart':
                $stmt = $pdo->prepare("UPDATE tbl_drug_chart SET date = ?, time = ?, drug_name = ?, dosage = ?, route = ? WHERE id = ?");
                $stmt->execute([
                    $data['date'],
                    $data['time'],
                    $data['drug_name'],
                    $data['dosage'],
                    $data['route'],
                    $data['id']
                ]);
                send_response(['message' => 'Drug chart entry updated']);
                break;

            case 'delete_drug_chart':
                $stmt = $pdo->prepare("DELETE FROM tbl_drug_chart WHERE id = ?");
                $stmt->execute([$data['id']]);
                send_response(['message' => 'Drug chart entry deleted']);
                break;

            case 'administer_drug':
                $stmt = $pdo->prepare("UPDATE tbl_drug_chart SET administered = 1, administered_by = ?, administered_at = NOW() WHERE id = ?");
                $stmt->execute([$data['nurse_name'] ?? 'Staff', $data['id']]);
                send_response(['message' => 'Drug administered successfully']);
                break;

            case 'add_finding':
                $table = ($data['type'] === 'test') ? 'tbl_findings_test' : 'tbl_findings';
                $prescription_id_col = ($data['type'] === 'test') ? 'finding_prescription_id' : 'finding_prescription_id'; // Both use same col name in provided schema

                $stmt = $pdo->prepare("INSERT INTO $table (finding_description, finding_date, $prescription_id_col, finding_appointment_id) 
                                     VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['description'],
                    date('Y-m-d'),
                    $data['item_id'],
                    $data['appointment_id']
                ]);
                send_response(['message' => 'Finding added successfully', 'id' => $pdo->lastInsertId()]);
                break;

            case 'add_operation':
                $stmt = $pdo->prepare("INSERT INTO tbl_operations (admission_id, operation_category, operation_name, operation_date, consultant_doctor, assistant_consultant_1, assistant_consultant_2, anesthetist, anesthesia_type, ot_technician, ot_assistant, remark, result) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['admission_id'],
                    $data['category'],
                    $data['name'],
                    $data['date'],
                    $data['consultant'],
                    $data['assistant1'] ?? null,
                    $data['assistant2'] ?? null,
                    $data['anesthetist'] ?? null,
                    $data['anesthesia_type'] ?? null,
                    $data['technician'] ?? null,
                    $data['assistant'] ?? null,
                    $data['remark'] ?? '',
                    $data['result'] ?? ''
                ]);
                send_response(['message' => 'Operation recorded successfully', 'id' => $pdo->lastInsertId()]);
                break;

            case 'add_timeline':
                $stmt = $pdo->prepare("INSERT INTO tbl_timeline (timeline_title, timeline_description, timeline_date, timeline_nurse, timeline_ipd) 
                                     VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['title'],
                    $data['description'],
                    date('Y-m-d H:i:s'),
                    $data['nurse_id'],
                    $data['admission_id']
                ]);
                send_response(['message' => 'Timeline entry added', 'id' => $pdo->lastInsertId()]);
                break;

            case 'save_vitals':
                $stmt = $pdo->prepare("SELECT admission_appointment, admission_patient, admission_is_subfile FROM tbl_bed_admission WHERE admission_id = ?");
                $stmt->execute([$data['admission_id']]);
                $adm = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$adm)
                    send_response(['error' => 'Admission not found'], 404);

                // For IPD, we always record a fresh set of vitals to maintain history
                $sql = "INSERT INTO tbl_vitals (vital_pid, vital_is_sub, vital_temperature, vital_bloodpressure, vital_heartrate, vital_respiratory, vital_oxygen, vital_weight, vital_height, vital_rbs, vital_appointment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $params = [
                    $adm['admission_patient'],
                    $adm['admission_is_subfile'],
                    $data['temp'],
                    $data['bp'],
                    $data['pulse'],
                    $data['respRate'],
                    $data['oxygenSat'],
                    $data['weight'],
                    $data['height'],
                    $data['bloodSugar'],
                    $adm['admission_appointment']
                ];

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                send_response(['message' => 'Vitals saved successfully']);
                break;

            case 'add_admission_charge':
                if (!isset($data['admission_id'], $data['description'], $data['total'])) {
                    send_response(['error' => 'Missing data'], 400);
                }
                $stmt = $pdo->prepare("INSERT INTO tbl_admission_charge (admission_id, patient_id, charge_description, charge_total, amount_paid, payment_history) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['admission_id'],
                    $data['patient_id'] ?? 0,
                    $data['description'],
                    $data['total'],
                    $data['amount_paid'] ?? '0',
                    $data['payment_history'] ?? '[]'
                ]);
                $charge_id = $pdo->lastInsertId();

                // Notify Billing/Admin
                $stmt = $pdo->prepare("INSERT INTO tbl_notifications (user_id, type, category, title, description, icon) VALUES (NULL, 'info', 'billing', ?, ?, 'DollarSign')");
                $stmt->execute([
                    'New Admission Charge',
                    'A new charge of ₦' . $data['total'] . ' has been added for admission #' . $data['admission_id']
                ]);

                send_response(['success' => true, 'id' => $charge_id]);
                break;

            case 'delete_admission_charge':
                if (!isset($data['charge_id'])) {
                    send_response(['error' => 'Charge ID required'], 400);
                }
                $stmt = $pdo->prepare("DELETE FROM tbl_admission_charge WHERE charge_id = ?");
                $stmt->execute([$data['charge_id']]);
                send_response(['success' => true]);
                break;

            case 'discharge_patient':
                if (!isset($data['admission_id'])) {
                    send_response(['error' => 'Admission ID required'], 400);
                }

                $pdo->beginTransaction();
                try {
                    // 1. Get admission details (bed and payment status)
                    $stmt = $pdo->prepare("SELECT admission_bed, admission_ispaid FROM tbl_bed_admission WHERE admission_id = ?");
                    $stmt->execute([$data['admission_id']]);
                    $adm = $stmt->fetch(PDO::FETCH_ASSOC);

                    if (!$adm)
                        throw new Exception("Admission record not found");

                    if ($adm['admission_ispaid'] == 0) {
                        throw new Exception("Cannot discharge: Bed admission fee has not been paid.");
                    }

                    // 2. Check for unpaid admission charges
                    $stmt = $pdo->prepare("SELECT SUM(CAST(charge_total AS DECIMAL(10,2))) as total, SUM(CAST(amount_paid AS DECIMAL(10,2))) as paid FROM tbl_admission_charge WHERE admission_id = ?");
                    $stmt->execute([$data['admission_id']]);
                    $charges = $stmt->fetch();
                    if ($charges && $charges['total'] > $charges['paid']) {
                        $pending = $charges['total'] - $charges['paid'];
                        throw new Exception("Cannot discharge: Patient has pending admission charges totaling ₦" . number_format($pending, 2));
                    }

                    $bed_id = $adm['admission_bed'];

                    // 3. Update admission status
                    $stmt = $pdo->prepare("UPDATE tbl_bed_admission SET admission_sta = 'discharged', admission_discharge_date = NOW() WHERE admission_id = ?");
                    $stmt->execute([$data['admission_id']]);

                    // 4. Update bed category occupancy
                    if ($bed_id) {
                        $stmt = $pdo->prepare("UPDATE tbl_bed_categories SET occupied_beds = GREATEST(0, occupied_beds - 1) WHERE id = ?");
                        $stmt->execute([$bed_id]);
                    }

                    // 5. Log activity
                    log_activity($pdo, $data['user_id'] ?? 'Staff', 'DISCHARGE_PATIENT', 'Clinical', null, ['admission_id' => $data['admission_id']]);

                    $pdo->commit();
                    send_response(['success' => true, 'message' => 'Patient discharged successfully']);
                } catch (Exception $e) {
                    if ($pdo->inTransaction())
                        $pdo->rollBack();
                    send_response(['error' => $e->getMessage()], 400);
                }
                break;

            case 'add_treatment':
                if (!isset($data['admission_id'], $data['finding'], $data['appointment_id'], $data['patient_id'])) {
                    send_response(['error' => 'Missing required treatment data'], 400);
                }

                $pdo->beginTransaction();
                try {
                    $admission_id = $data['admission_id'];
                    $finding = $data['finding'];
                    $appointment_id = $data['appointment_id'];
                    $patient_id = $data['patient_id'];
                    $doctor_id = $data['doctor_id'] ?? ($_SESSION['user_id'] ?? 'Doctor');
                    $prescriptions = $data['prescriptions'] ?? []; // Array of { drugName, dosage, frequency, duration, note }
                    $lab_tests = $data['lab_tests'] ?? [];         // Array of strings

                    // 1. Get/Create consultation_id for this appointment
                    $stmt = $pdo->prepare("SELECT id FROM tbl_consultation_data WHERE appointment_id = ?");
                    $stmt->execute([$appointment_id]);
                    $consultation = $stmt->fetch(PDO::FETCH_ASSOC);

                    if (!$consultation) {
                        $isSubfile = (stripos($patient_id, 'sf-') === 0) ? 1 : 0;
                        $stmt = $pdo->prepare("INSERT INTO tbl_consultation_data (appointment_id, patient_id, doctor_id, consultation_date, diagnosis, observations, is_subfile) VALUES (?, ?, ?, NOW(), ?, ?, ?)");
                        $stmt->execute([$appointment_id, $patient_id, $doctor_id, $finding, 'New IPD Entry', $isSubfile]);
                        $consultation_id = $pdo->lastInsertId();
                    } else {
                        $consultation_id = $consultation['id'];
                        // Update existing diagnosis if it was empty
                        $stmt = $pdo->prepare("UPDATE tbl_consultation_data SET diagnosis = IF(diagnosis IS NULL OR diagnosis = '', ?, diagnosis) WHERE id = ?");
                        $stmt->execute([$finding, $consultation_id]);
                    }

                    // 2. Store Finding in tbl_findings for history
                    $stmt = $pdo->prepare("INSERT INTO tbl_findings (finding_description, finding_date, finding_appointment_id, finding_prescription_id) VALUES (?, NOW(), ?, 0)");
                    $stmt->execute([$finding, $appointment_id]);
                    $finding_id = $pdo->lastInsertId();

                    // 3. Store Prescriptions
                    if (!empty($prescriptions)) {
                        // A. Store in tbl_medication (For IPD patient file view)
                        foreach ($prescriptions as $rx) {
                            $stmt = $pdo->prepare("INSERT INTO tbl_medication (medication_admission, medication_medicine, medication_dosage, medication_date) VALUES (?, ?, ?, NOW())");
                            $stmt->execute([
                                $admission_id,
                                $rx['drugName'],
                                ($rx['dosage'] ?? '') . ' ' . ($rx['frequency'] ?? '') . ' ' . ($rx['duration'] ?? '')
                            ]);
                        }

                        // B. Store in tbl_prescriptions (For Pharmacy)
                        $stmt = $pdo->prepare("INSERT INTO tbl_prescriptions (consultation_id, prescription, created_at, updated_at, is_paid, sta) VALUES (?, ?, NOW(), NOW(), 0, 'pending')");
                        $stmt->execute([$consultation_id, json_encode($prescriptions)]);
                    }

                    // 4. Store Lab Tests
                    if (!empty($lab_tests)) {
                        $stmt = $pdo->prepare("INSERT INTO tbl_lab_tests (consultation_id, test, created_at, updated_at, is_paid, sta) VALUES (?, ?, NOW(), NOW(), 0, 'pending')");
                        $stmt->execute([$consultation_id, json_encode($lab_tests)]);
                    }

                    // 5. Notify Nursing/Pharmacy
                    $stmt = $pdo->prepare("INSERT INTO tbl_notifications (user_id, type, category, title, description, icon) VALUES (NULL, 'info', 'clinical', ?, ?, 'ClipboardList')");
                    $stmt->execute([
                        'New Clinical Orders',
                        'Doctor added new finding/orders for patient ' . $patient_id
                    ]);

                    $pdo->commit();
                    send_response(['success' => true, 'message' => 'Treatment and findings saved successfully']);
                } catch (Exception $e) {
                    if ($pdo->inTransaction())
                        $pdo->rollBack();
                    send_response(['error' => $e->getMessage()], 500);
                }
                break;

            case 'record_death':
                if (!isset($data['admission_id'], $data['patient_id'])) {
                    send_response(['error' => 'Admission and Patient ID required'], 400);
                }

                $pdo->beginTransaction();
                try {
                    $admission_id = $data['admission_id'];
                    $patient_id = $data['patient_id'];
                    $is_subfile = $data['is_subfile'] ?? 0;

                    // 1. Discharge the patient first (logic from above)
                    $stmt = $pdo->prepare("SELECT admission_bed FROM tbl_bed_admission WHERE admission_id = ?");
                    $stmt->execute([$admission_id]);
                    $adm = $stmt->fetch(PDO::FETCH_ASSOC);

                    if ($adm) {
                        $bed_id = $adm['admission_bed'];
                        $stmt = $pdo->prepare("UPDATE tbl_bed_admission SET admission_sta = 'discharged', admission_discharge_date = NOW() WHERE admission_id = ?");
                        $stmt->execute([$admission_id]);
                        if ($bed_id) {
                            $stmt = $pdo->prepare("UPDATE tbl_bed_categories SET occupied_beds = GREATEST(0, occupied_beds - 1) WHERE id = ?");
                            $stmt->execute([$bed_id]);
                        }
                    }

                    // 2. Update patient death status
                    if ($is_subfile) {
                        $stmt = $pdo->prepare("UPDATE tbl_subfile SET is_dead = 1 WHERE subfile_id = ?");
                        $stmt->execute([str_replace('SF-', '', $patient_id)]);
                    } else {
                        $stmt = $pdo->prepare("UPDATE tbl_patients SET is_dead = 1, date_of_death = NOW(), cause_of_death = ?, death_remarks = ? WHERE patient_unique_id = ?");
                        $stmt->execute([
                            $data['cause_of_death'] ?? 'Unknown',
                            $data['remarks'] ?? '',
                            $patient_id
                        ]);
                    }

                    // 3. Log activity
                    log_activity($pdo, $data['doctor_id'] ?? 'Doctor', 'RECORD_DEATH', 'Clinical', null, ['patient_id' => $patient_id, 'admission_id' => $admission_id]);

                    $pdo->commit();
                    send_response(['success' => true, 'message' => 'Death record saved successfully']);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    send_response(['error' => $e->getMessage()], 500);
                }
                break;

            default:
                send_response(['error' => 'Invalid action'], 400);
        }
    } catch (PDOException $e) {
        send_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
