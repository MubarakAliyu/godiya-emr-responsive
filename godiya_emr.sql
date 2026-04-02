-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 20, 2026 at 03:03 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `godiya_emr`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL,
  `user_id` varchar(20) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `device_info` text DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drug_invoice`
--

CREATE TABLE `drug_invoice` (
  `inv_id` int(11) NOT NULL,
  `drug_list` longtext NOT NULL,
  `is_paid` int(11) NOT NULL DEFAULT 0,
  `gen_date` varchar(255) NOT NULL,
  `sta` int(11) NOT NULL DEFAULT 0,
  `total` varchar(255) NOT NULL,
  `inv_file_number` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospital_settings`
--

CREATE TABLE `hospital_settings` (
  `settings_key` varchar(50) NOT NULL,
  `settings_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings_value`)),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hospital_settings`
--

INSERT INTO `hospital_settings` (`settings_key`, `settings_value`, `updated_at`) VALUES
('billing', '{\"individualFileFee\":1500,\"consultationFee\":1000,\"admissionDeposit\":5000,\"enableNHIS\":false,\"familyFileFee\":5000,\"pharmacyFlexible\":true,\"allowManualFeeOverride\":true,\"allowInvoiceRegeneration\":false}', '2026-02-25 15:13:29'),
('general', '{\"hospitalName\":\"Godiya Hospital\",\"hospitalShortName\":\"GH\",\"timeZone\":\"Africa\\/Lagos\",\"dateFormat\":\"DD\\/MM\\/YYYY\",\"currencySymbol\":\"\\u20a6\",\"language\":\"English\",\"workingHoursStart\":\"08:00\",\"workingHoursEnd\":\"17:00\"}', '2026-02-25 15:12:35'),
('notifications', '{\"enableSystemNotifications\":true,\"enableEmailAlerts\":true,\"enableSMSAlerts\":false,\"appointmentReminder\":true,\"paymentConfirmation\":true,\"labResultReady\":true,\"notificationSound\":\"default\"}', '2026-02-25 15:13:43'),
('preferences', '{\"defaultLandingPage\":\"\\/emr\\/dashboard\",\"tableRowsDefault\":10,\"enableDarkMode\":false,\"enableAnimations\":true,\"printLayoutStyle\":\"standard\"}', '2026-02-25 15:14:04'),
('profile', '{\"logo\":\"\",\"address\":\"Birnin Kebbi, Kebbi State, Nigeria\",\"phoneNumber\":\"+234-8123456\",\"email\":\"info@godiyahospital.com\",\"website\":\"www.godiyahospital.com\",\"cmdName\":\"Dr. Abdurrahman Aliyu\",\"registrationNumber\":\"GH-REG-2025\",\"hospitalType\":\"Private\"}', '2026-02-25 15:13:03'),
('security', '{\"passwordLength\":8,\"sessionTimeout\":30,\"enable2FA\":false,\"enableIPRestriction\":false,\"accountLockAttempts\":5}', '2026-02-25 15:13:38');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` varchar(20) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `department_scope` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`department_scope`)),
  `status` enum('Active','Disabled') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `role_name`, `description`, `department_scope`, `status`, `created_at`, `updated_at`, `created_by`) VALUES
('GH-RL-19135ad9', 'Receptionist', '', '[\"Human Resources\"]', 'Active', '2026-02-25 15:06:51', '2026-02-25 15:06:51', 'System'),
('GH-RL-63c29f12', 'Laboratory', '', '[\"Laboratory\"]', 'Active', '2026-02-25 14:50:03', '2026-02-25 14:50:03', 'System'),
('GH-RL-7470fab8', 'Nurse', '', '[\"Nursing\",\"Human Resources\"]', 'Active', '2026-02-25 15:06:04', '2026-02-25 15:06:04', 'System'),
('GH-RL-7cc9cd94', 'Senior doctor', '', '[\"Nursing\",\"Medical\"]', 'Active', '2026-02-25 21:26:52', '2026-02-25 21:26:52', 'System'),
('GH-RL-89630a14', 'Cashier', '', '[\"Finance\"]', 'Active', '2026-02-25 21:43:10', '2026-02-25 21:43:10', 'System'),
('GH-RL-a1b72f29', 'Super Admin', 'Access to all modules', '[\"Medical\",\"Nursing\",\"Laboratory\",\"Pharmacy\",\"IT\",\"Administration\",\"Finance\",\"Human Resources\"]', 'Active', '2026-02-18 11:32:00', '2026-02-18 11:32:00', 'System'),
('GH-RL-b8c0889a', 'Doctor', '', '[\"Medical\"]', 'Active', '2026-02-25 14:48:09', '2026-02-25 14:48:09', 'System'),
('GH-RL-bbe2491d', 'Pharmacy', 'pharm', '[\"Pharmacy\"]', 'Active', '2026-02-25 14:49:42', '2026-02-25 14:49:42', 'System');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL,
  `role_id` varchar(20) DEFAULT NULL,
  `module_name` enum('Patients','Appointments','Finance','Pharmacy','Laboratory','Beds','Reports','Attendance','Administration') NOT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_create` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `can_export` tinyint(1) DEFAULT 0,
  `can_approve` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `module_name`, `can_view`, `can_create`, `can_edit`, `can_delete`, `can_export`, `can_approve`) VALUES
(9, 'GH-RL-a1b72f29', 'Administration', 1, 1, 1, 1, 1, 1),
(154, 'GH-RL-b8c0889a', 'Patients', 1, 0, 0, 0, 0, 0),
(155, 'GH-RL-b8c0889a', 'Appointments', 1, 1, 1, 1, 1, 1),
(156, 'GH-RL-b8c0889a', 'Finance', 0, 0, 0, 0, 0, 0),
(157, 'GH-RL-b8c0889a', 'Pharmacy', 0, 0, 0, 0, 0, 0),
(158, 'GH-RL-b8c0889a', 'Laboratory', 0, 0, 0, 0, 0, 0),
(159, 'GH-RL-b8c0889a', 'Beds', 0, 0, 0, 0, 0, 0),
(160, 'GH-RL-b8c0889a', 'Reports', 0, 0, 0, 0, 0, 0),
(161, 'GH-RL-b8c0889a', 'Attendance', 0, 0, 0, 0, 0, 0),
(162, 'GH-RL-b8c0889a', 'Administration', 0, 0, 0, 0, 0, 0),
(163, 'GH-RL-bbe2491d', 'Patients', 0, 0, 0, 0, 0, 0),
(164, 'GH-RL-bbe2491d', 'Appointments', 0, 0, 0, 0, 0, 0),
(165, 'GH-RL-bbe2491d', 'Finance', 0, 0, 0, 0, 0, 0),
(166, 'GH-RL-bbe2491d', 'Pharmacy', 1, 1, 1, 1, 1, 1),
(167, 'GH-RL-bbe2491d', 'Laboratory', 0, 0, 0, 0, 0, 0),
(168, 'GH-RL-bbe2491d', 'Beds', 0, 0, 0, 0, 0, 0),
(169, 'GH-RL-bbe2491d', 'Reports', 0, 0, 0, 0, 0, 0),
(170, 'GH-RL-bbe2491d', 'Attendance', 0, 0, 0, 0, 0, 0),
(171, 'GH-RL-bbe2491d', 'Administration', 0, 0, 0, 0, 0, 0),
(172, 'GH-RL-63c29f12', 'Patients', 0, 0, 0, 0, 0, 0),
(173, 'GH-RL-63c29f12', 'Appointments', 0, 0, 0, 0, 0, 0),
(174, 'GH-RL-63c29f12', 'Finance', 0, 0, 0, 0, 0, 0),
(175, 'GH-RL-63c29f12', 'Pharmacy', 0, 0, 0, 0, 0, 0),
(176, 'GH-RL-63c29f12', 'Laboratory', 1, 1, 1, 1, 1, 1),
(177, 'GH-RL-63c29f12', 'Beds', 0, 0, 0, 0, 0, 0),
(178, 'GH-RL-63c29f12', 'Reports', 0, 0, 0, 0, 0, 0),
(179, 'GH-RL-63c29f12', 'Attendance', 0, 0, 0, 0, 0, 0),
(180, 'GH-RL-63c29f12', 'Administration', 0, 0, 0, 0, 0, 0),
(190, 'GH-RL-19135ad9', 'Patients', 1, 1, 1, 1, 1, 1),
(191, 'GH-RL-19135ad9', 'Appointments', 1, 1, 1, 1, 1, 1),
(192, 'GH-RL-19135ad9', 'Finance', 0, 0, 0, 0, 0, 0),
(193, 'GH-RL-19135ad9', 'Pharmacy', 0, 0, 0, 0, 0, 0),
(194, 'GH-RL-19135ad9', 'Laboratory', 0, 0, 0, 0, 0, 0),
(195, 'GH-RL-19135ad9', 'Beds', 0, 0, 0, 0, 0, 0),
(196, 'GH-RL-19135ad9', 'Reports', 0, 0, 0, 0, 0, 0),
(197, 'GH-RL-19135ad9', 'Attendance', 0, 0, 0, 0, 0, 0),
(198, 'GH-RL-19135ad9', 'Administration', 0, 0, 0, 0, 0, 0),
(199, 'GH-RL-7cc9cd94', 'Patients', 1, 1, 1, 1, 1, 1),
(200, 'GH-RL-7cc9cd94', 'Appointments', 1, 1, 1, 1, 0, 0),
(201, 'GH-RL-7cc9cd94', 'Finance', 0, 0, 0, 0, 0, 0),
(202, 'GH-RL-7cc9cd94', 'Pharmacy', 0, 0, 0, 0, 0, 0),
(203, 'GH-RL-7cc9cd94', 'Laboratory', 0, 0, 0, 0, 0, 0),
(204, 'GH-RL-7cc9cd94', 'Beds', 0, 0, 0, 0, 0, 0),
(205, 'GH-RL-7cc9cd94', 'Reports', 0, 0, 0, 0, 0, 0),
(206, 'GH-RL-7cc9cd94', 'Attendance', 0, 0, 0, 0, 0, 0),
(207, 'GH-RL-7cc9cd94', 'Administration', 0, 0, 0, 0, 0, 0),
(217, 'GH-RL-89630a14', 'Patients', 0, 0, 0, 0, 0, 0),
(218, 'GH-RL-89630a14', 'Appointments', 0, 0, 0, 0, 0, 0),
(219, 'GH-RL-89630a14', 'Finance', 1, 1, 1, 1, 1, 1),
(220, 'GH-RL-89630a14', 'Pharmacy', 0, 0, 0, 0, 0, 0),
(221, 'GH-RL-89630a14', 'Laboratory', 0, 0, 0, 0, 0, 0),
(222, 'GH-RL-89630a14', 'Beds', 0, 0, 0, 0, 0, 0),
(223, 'GH-RL-89630a14', 'Reports', 0, 0, 0, 0, 0, 0),
(224, 'GH-RL-89630a14', 'Attendance', 0, 0, 0, 0, 0, 0),
(225, 'GH-RL-89630a14', 'Administration', 0, 0, 0, 0, 0, 0),
(235, 'GH-RL-7470fab8', 'Patients', 1, 1, 1, 1, 1, 1),
(236, 'GH-RL-7470fab8', 'Appointments', 1, 1, 1, 1, 1, 1),
(237, 'GH-RL-7470fab8', 'Finance', 1, 0, 0, 0, 0, 0),
(238, 'GH-RL-7470fab8', 'Pharmacy', 1, 0, 0, 0, 0, 0),
(239, 'GH-RL-7470fab8', 'Laboratory', 1, 0, 0, 0, 0, 0),
(240, 'GH-RL-7470fab8', 'Beds', 1, 0, 1, 0, 0, 0),
(241, 'GH-RL-7470fab8', 'Reports', 1, 0, 0, 0, 0, 0),
(242, 'GH-RL-7470fab8', 'Attendance', 0, 0, 0, 0, 0, 0),
(243, 'GH-RL-7470fab8', 'Administration', 0, 0, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_admission`
--

CREATE TABLE `tbl_admission` (
  `admit_id` int(11) NOT NULL,
  `admit_apid` int(11) NOT NULL,
  `admit_remarks` text DEFAULT NULL,
  `admit_datetime` timestamp NOT NULL DEFAULT current_timestamp(),
  `admit_sta` varchar(20) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_admission_charge`
--

CREATE TABLE `tbl_admission_charge` (
  `charge_id` int(11) NOT NULL,
  `admission_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `charge_description` longtext NOT NULL,
  `charge_total` varchar(255) NOT NULL,
  `amount_paid` varchar(255) NOT NULL,
  `payment_history` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_appointment`
--

CREATE TABLE `tbl_appointment` (
  `appointment_id` int(11) NOT NULL,
  `appointment_fileid` varchar(50) NOT NULL,
  `appointment_doctor` varchar(50) NOT NULL,
  `appointment_shift` varchar(50) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_priority` varchar(20) DEFAULT 'Normal',
  `appointment_sta` varchar(50) DEFAULT 'Scheduled',
  `appointment_ispaid` tinyint(1) DEFAULT 0,
  `appointment_messege` text DEFAULT NULL,
  `appointment_alternate_address` varchar(255) DEFAULT NULL,
  `appointment_fee` decimal(10,2) DEFAULT 0.00,
  `appointment_number` varchar(50) NOT NULL,
  `is_subfile` tinyint(1) DEFAULT 0,
  `appointment_department` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_bed_admission`
--

CREATE TABLE `tbl_bed_admission` (
  `id` int(11) NOT NULL,
  `admission_id` int(11) NOT NULL,
  `admission_patient` varchar(50) NOT NULL,
  `admission_is_subfile` tinyint(1) NOT NULL DEFAULT 0,
  `admission_sta` varchar(20) DEFAULT 'approved',
  `admission_ispaid` tinyint(1) NOT NULL DEFAULT 0,
  `admission_datetime` timestamp NOT NULL DEFAULT current_timestamp(),
  `admission_discharge_date` datetime DEFAULT NULL,
  `admission_bed` int(11) NOT NULL,
  `admission_appointment` int(11) NOT NULL,
  `admission_date` date NOT NULL,
  `case_id` varchar(100) DEFAULT NULL,
  `ipd_number` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_bed_categories`
--

CREATE TABLE `tbl_bed_categories` (
  `id` int(11) NOT NULL,
  `category_unique_id` varchar(50) NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `price_per_day` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_beds` int(11) NOT NULL DEFAULT 0,
  `occupied_beds` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_cashier_pin`
--

CREATE TABLE `tbl_cashier_pin` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) NOT NULL COMMENT 'Links to the cashier user email',
  `pin_hash` varchar(255) NOT NULL COMMENT 'bcrypt-hashed 4–6 digit PIN',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_consultation_data`
--

CREATE TABLE `tbl_consultation_data` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `doctor_id` varchar(20) DEFAULT NULL,
  `consultation_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `patient_complain` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `observations` text DEFAULT NULL,
  `is_subfile` tinyint(1) NOT NULL DEFAULT 0,
  `followup_date` date DEFAULT NULL,
  `followup_type` varchar(50) DEFAULT NULL,
  `followup_instruction` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_department`
--

CREATE TABLE `tbl_department` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(225) NOT NULL,
  `department_description` text DEFAULT NULL,
  `department_type` enum('Clinical','Support') NOT NULL DEFAULT 'Clinical',
  `department_status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_drugs`
--

CREATE TABLE `tbl_drugs` (
  `drug_id` int(11) NOT NULL,
  `drug_name` varchar(225) NOT NULL,
  `drug_price` varchar(225) NOT NULL,
  `drug_qty` varchar(255) NOT NULL,
  `expiry_date` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_drug_chart`
--

CREATE TABLE `tbl_drug_chart` (
  `id` int(11) NOT NULL,
  `admission_id` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `drug_name` varchar(255) NOT NULL,
  `dosage` varchar(255) NOT NULL,
  `route` varchar(100) NOT NULL,
  `administered` tinyint(1) DEFAULT 0,
  `administered_by` varchar(255) DEFAULT NULL,
  `administered_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_findings`
--

CREATE TABLE `tbl_findings` (
  `f_id` int(11) NOT NULL,
  `finding_description` longtext NOT NULL,
  `finding_date` varchar(255) NOT NULL,
  `finding_prescription_id` int(11) NOT NULL,
  `finding_appointment_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_findings_test`
--

CREATE TABLE `tbl_findings_test` (
  `f_id` int(11) NOT NULL,
  `finding_description` text NOT NULL,
  `finding_date` date NOT NULL,
  `finding_prescription_id` int(11) NOT NULL,
  `finding_appointment_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_lab_tests`
--

CREATE TABLE `tbl_lab_tests` (
  `id` int(11) NOT NULL,
  `consultation_id` int(11) NOT NULL,
  `test` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`test`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_paid` tinyint(1) NOT NULL DEFAULT 0,
  `sta` varchar(20) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_lab_test_result`
--

CREATE TABLE `tbl_lab_test_result` (
  `result_id` int(11) NOT NULL,
  `lab_invoice_id` int(11) NOT NULL,
  `result_list` longtext NOT NULL,
  `result_date` varchar(255) NOT NULL,
  `technician_id` varchar(50) DEFAULT NULL,
  `result_picture` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_medication`
--

CREATE TABLE `tbl_medication` (
  `medication_id` int(11) NOT NULL,
  `medication_admission` int(11) NOT NULL,
  `medication_medicine` varchar(225) NOT NULL,
  `medication_dosage` longtext NOT NULL,
  `medication_date` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_notifications`
--

CREATE TABLE `tbl_notifications` (
  `id` int(11) NOT NULL,
  `user_id` varchar(20) DEFAULT NULL,
  `type` enum('info','warning','error','success') DEFAULT 'info',
  `category` enum('clinical','billing','admin','all') DEFAULT 'all',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `module` varchar(50) DEFAULT 'System',
  `icon` varchar(50) DEFAULT 'AlertCircle',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_nurse_note`
--

CREATE TABLE `tbl_nurse_note` (
  `note_id` int(11) NOT NULL,
  `note_admission` int(11) NOT NULL,
  `note_note` longtext NOT NULL,
  `note_comment` longtext NOT NULL,
  `nurse_nurse` varchar(20) DEFAULT NULL,
  `date_time` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_nurse_opd_complaint`
--

CREATE TABLE `tbl_nurse_opd_complaint` (
  `id` int(11) NOT NULL,
  `appointment_number` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `complaint` text NOT NULL,
  `duration` varchar(100) DEFAULT '',
  `severity` varchar(50) DEFAULT 'Moderate',
  `nurse_id` varchar(50) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_nurse_opd_labs`
--

CREATE TABLE `tbl_nurse_opd_labs` (
  `id` int(11) NOT NULL,
  `appointment_number` varchar(50) NOT NULL,
  `patient_id` varchar(50) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `nurse_approved` tinyint(1) DEFAULT 0,
  `nurse_id` varchar(50) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_operations`
--

CREATE TABLE `tbl_operations` (
  `id` int(11) NOT NULL,
  `admission_id` int(11) NOT NULL,
  `operation_category` varchar(100) NOT NULL,
  `operation_name` varchar(100) NOT NULL,
  `operation_date` varchar(100) NOT NULL,
  `consultant_doctor` varchar(100) NOT NULL,
  `assistant_consultant_1` varchar(100) DEFAULT NULL,
  `assistant_consultant_2` varchar(100) DEFAULT NULL,
  `anesthetist` varchar(100) DEFAULT NULL,
  `anesthesia_type` varchar(100) DEFAULT NULL,
  `ot_technician` varchar(100) DEFAULT NULL,
  `ot_assistant` varchar(100) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `result` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sta` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_patients`
--

CREATE TABLE `tbl_patients` (
  `patient_id` int(11) NOT NULL,
  `patient_unique_id` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `dob` date DEFAULT NULL,
  `phone_number` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `file_type` enum('Individual','Family') NOT NULL DEFAULT 'Individual',
  `parent_file_id` varchar(50) DEFAULT NULL,
  `patient_type` enum('IPD','OPD') NOT NULL DEFAULT 'OPD',
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `is_nhis` tinyint(1) NOT NULL DEFAULT 0,
  `nhis_number` varchar(50) DEFAULT NULL,
  `nhis_provider` varchar(150) DEFAULT NULL,
  `blood_group` enum('A+','A-','B+','B-','O+','O-','AB+','AB-') DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `emergency_contact_name` varchar(150) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `next_of_kin` varchar(150) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_dead` tinyint(1) NOT NULL DEFAULT 0,
  `date_of_death` datetime DEFAULT NULL,
  `cause_of_death` varchar(255) DEFAULT NULL,
  `death_remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_paid` tinyint(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payments`
--

CREATE TABLE `tbl_payments` (
  `payment_id` int(11) NOT NULL,
  `patient_unique_id` varchar(50) NOT NULL,
  `reference_id` varchar(100) DEFAULT NULL COMMENT 'id of the appointment or invoice being paid',
  `amount_expected` decimal(15,2) NOT NULL,
  `amount_paid` decimal(15,2) NOT NULL,
  `balance` decimal(15,2) NOT NULL,
  `payment_method` enum('Cash','Card','Transfer','Cheque') NOT NULL DEFAULT 'Cash',
  `payment_description` text NOT NULL,
  `cashier_id` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_prescriptions`
--

CREATE TABLE `tbl_prescriptions` (
  `id` int(11) NOT NULL,
  `consultation_id` int(11) NOT NULL,
  `prescription` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`prescription`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_paid` tinyint(1) NOT NULL DEFAULT 0,
  `sta` varchar(20) DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_refer_request`
--

CREATE TABLE `tbl_refer_request` (
  `rs_id` int(11) NOT NULL,
  `rs_apid` int(11) NOT NULL,
  `rs_referto` varchar(255) NOT NULL,
  `rs_remarks` text DEFAULT NULL,
  `rs_datetime` timestamp NOT NULL DEFAULT current_timestamp(),
  `rs_sta` varchar(20) DEFAULT 'pending',
  `update_remark` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_staff`
--

CREATE TABLE `tbl_staff` (
  `staff_id` int(11) NOT NULL,
  `staff_unique` varchar(50) NOT NULL,
  `staff_fname` varchar(100) NOT NULL,
  `staff_mname` varchar(100) DEFAULT NULL,
  `staff_lname` varchar(100) NOT NULL,
  `staff_gender` enum('Male','Female') NOT NULL,
  `staff_email` varchar(150) NOT NULL,
  `staff_phone` varchar(20) NOT NULL,
  `staff_address` text DEFAULT NULL,
  `staff_department_id` int(11) DEFAULT NULL,
  `staff_role` varchar(100) NOT NULL,
  `staff_employment_type` enum('Full-time','Part-time','Contract') NOT NULL DEFAULT 'Full-time',
  `staff_status` enum('Active','On Leave','Suspended','Resigned') NOT NULL DEFAULT 'Active',
  `staff_image` varchar(255) DEFAULT NULL,
  `staff_salary` decimal(15,2) DEFAULT 0.00,
  `staff_dob` date DEFAULT NULL,
  `staff_qualification` text DEFAULT NULL,
  `staff_license_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_subfile`
--

CREATE TABLE `tbl_subfile` (
  `subfile_id` int(11) NOT NULL,
  `subfile_file_id` varchar(50) NOT NULL,
  `subfile_fname` varchar(100) NOT NULL,
  `subfile_lname` varchar(100) NOT NULL,
  `subfile_gender` enum('Male','Female') NOT NULL,
  `subfile_maritalstatus` varchar(50) DEFAULT NULL,
  `subfile_knownallergies` text DEFAULT NULL,
  `subfile_dob` date DEFAULT NULL,
  `subfile_bloodgroup` varchar(10) DEFAULT NULL,
  `is_dead` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_surgery_request`
--

CREATE TABLE `tbl_surgery_request` (
  `sr_id` int(11) NOT NULL,
  `sr_apid` int(11) NOT NULL,
  `sr_name` varchar(255) NOT NULL,
  `sr_remarks` text DEFAULT NULL,
  `sr_datetime` timestamp NOT NULL DEFAULT current_timestamp(),
  `sr_sta` varchar(20) DEFAULT 'pending',
  `update_remark` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_test_item`
--

CREATE TABLE `tbl_test_item` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(225) NOT NULL,
  `item_fees` varchar(225) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_timeline`
--

CREATE TABLE `tbl_timeline` (
  `timeline_id` int(11) NOT NULL,
  `timeline_title` varchar(225) NOT NULL,
  `timeline_description` longtext NOT NULL,
  `timeline_date` varchar(255) NOT NULL,
  `timeline_nurse` varchar(20) DEFAULT NULL,
  `timeline_ipd` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_vitals`
--

CREATE TABLE `tbl_vitals` (
  `vital_id` int(11) NOT NULL,
  `vital_pid` varchar(255) NOT NULL,
  `vital_is_sub` tinyint(1) DEFAULT 0,
  `vital_temperature` decimal(4,1) DEFAULT NULL,
  `vital_bloodpressure` varchar(20) DEFAULT NULL,
  `vital_heartrate` int(11) DEFAULT NULL,
  `vital_respiratory` int(11) DEFAULT NULL,
  `vital_oxygen` int(11) DEFAULT NULL,
  `vital_weight` decimal(5,2) DEFAULT NULL,
  `vital_height` decimal(5,2) DEFAULT NULL,
  `vital_bmi` decimal(4,1) DEFAULT NULL,
  `vital_rbs` int(11) DEFAULT NULL,
  `vital_appointment` varchar(255) DEFAULT NULL,
  `date_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `test_invoice`
--

CREATE TABLE `test_invoice` (
  `inv_id` int(11) NOT NULL,
  `test_list` longtext NOT NULL,
  `is_paid` int(11) NOT NULL DEFAULT 0,
  `gen_date` varchar(255) NOT NULL,
  `sta` int(11) NOT NULL DEFAULT 0,
  `total` varchar(255) NOT NULL,
  `inv_file_number` varchar(255) NOT NULL,
  `is_subfile` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(20) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `role_id` varchar(20) DEFAULT NULL,
  `status` enum('Active','Suspended','Pending') DEFAULT 'Active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` varchar(100) DEFAULT NULL,
  `login_attempts` tinyint(3) NOT NULL DEFAULT 0,
  `locked_until` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `full_name`, `email`, `phone`, `username`, `password_hash`, `department`, `role_id`, `status`, `last_login`, `created_at`, `updated_at`, `created_by`, `login_attempts`, `locked_until`) VALUES
('GH-US-001', 'Aliyu', 'Sani', 'Aliyu Sani', 'ghaliyu@gmail.com', '', 'superadmin', '$2y$10$AhAx/VloyrdbBBxTEQkR3edrEfr0XkMtrbpO3lkRwDdkRxvkgonxu', '', 'GH-RL-b8c0889a', 'Active', NULL, '2026-02-19 11:51:10', '2026-02-25 14:52:34', 'System', 0, NULL),
('GH-US-afe6534a', 'Super', 'Admin', 'Super Admin', 'admin@gmail.com', '+23412345678901', 'super.admin', '$2y$10$jSIu6RbYF0cNs1G.Dve4quKTPT2jKwqLPCay36RlKyYAr1lnYZiqG', 'Administration', 'GH-RL-a1b72f29', 'Active', '2026-03-20 00:38:54', '2026-02-18 11:51:11', '2026-03-20 02:02:29', 'System', 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_timestamp` (`timestamp`),
  ADD KEY `idx_audit_logs_user_action` (`user_id`,`action`);

--
-- Indexes for table `drug_invoice`
--
ALTER TABLE `drug_invoice`
  ADD PRIMARY KEY (`inv_id`);

--
-- Indexes for table `hospital_settings`
--
ALTER TABLE `hospital_settings`
  ADD PRIMARY KEY (`settings_key`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_role_module` (`role_id`,`module_name`);

--
-- Indexes for table `tbl_admission`
--
ALTER TABLE `tbl_admission`
  ADD PRIMARY KEY (`admit_id`),
  ADD KEY `admit_apid` (`admit_apid`);

--
-- Indexes for table `tbl_admission_charge`
--
ALTER TABLE `tbl_admission_charge`
  ADD PRIMARY KEY (`charge_id`);

--
-- Indexes for table `tbl_appointment`
--
ALTER TABLE `tbl_appointment`
  ADD PRIMARY KEY (`appointment_id`),
  ADD UNIQUE KEY `appointment_number` (`appointment_number`),
  ADD KEY `appointment_fileid` (`appointment_fileid`),
  ADD KEY `appointment_doctor` (`appointment_doctor`);

--
-- Indexes for table `tbl_bed_admission`
--
ALTER TABLE `tbl_bed_admission`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admission_id` (`admission_id`),
  ADD KEY `admission_bed` (`admission_bed`);

--
-- Indexes for table `tbl_bed_categories`
--
ALTER TABLE `tbl_bed_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `category_unique_id` (`category_unique_id`);

--
-- Indexes for table `tbl_cashier_pin`
--
ALTER TABLE `tbl_cashier_pin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_email` (`user_email`),
  ADD KEY `idx_email` (`user_email`);

--
-- Indexes for table `tbl_consultation_data`
--
ALTER TABLE `tbl_consultation_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `tbl_department`
--
ALTER TABLE `tbl_department`
  ADD PRIMARY KEY (`department_id`);

--
-- Indexes for table `tbl_drugs`
--
ALTER TABLE `tbl_drugs`
  ADD PRIMARY KEY (`drug_id`);

--
-- Indexes for table `tbl_drug_chart`
--
ALTER TABLE `tbl_drug_chart`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_findings`
--
ALTER TABLE `tbl_findings`
  ADD PRIMARY KEY (`f_id`);

--
-- Indexes for table `tbl_findings_test`
--
ALTER TABLE `tbl_findings_test`
  ADD PRIMARY KEY (`f_id`);

--
-- Indexes for table `tbl_lab_tests`
--
ALTER TABLE `tbl_lab_tests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consultation_id` (`consultation_id`);

--
-- Indexes for table `tbl_lab_test_result`
--
ALTER TABLE `tbl_lab_test_result`
  ADD PRIMARY KEY (`result_id`);

--
-- Indexes for table `tbl_medication`
--
ALTER TABLE `tbl_medication`
  ADD PRIMARY KEY (`medication_id`);

--
-- Indexes for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `is_read` (`is_read`),
  ADD KEY `category` (`category`);

--
-- Indexes for table `tbl_nurse_note`
--
ALTER TABLE `tbl_nurse_note`
  ADD PRIMARY KEY (`note_id`);

--
-- Indexes for table `tbl_nurse_opd_complaint`
--
ALTER TABLE `tbl_nurse_opd_complaint`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_appt_complaint` (`appointment_number`);

--
-- Indexes for table `tbl_nurse_opd_labs`
--
ALTER TABLE `tbl_nurse_opd_labs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appt_labs` (`appointment_number`),
  ADD KEY `idx_invoice_labs` (`invoice_id`);

--
-- Indexes for table `tbl_operations`
--
ALTER TABLE `tbl_operations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_patients`
--
ALTER TABLE `tbl_patients`
  ADD PRIMARY KEY (`patient_id`),
  ADD UNIQUE KEY `patient_unique_id` (`patient_unique_id`),
  ADD KEY `idx_patient_unique` (`patient_unique_id`),
  ADD KEY `idx_patient_name` (`full_name`);

--
-- Indexes for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `patient_unique_id` (`patient_unique_id`),
  ADD KEY `reference_id` (`reference_id`);

--
-- Indexes for table `tbl_prescriptions`
--
ALTER TABLE `tbl_prescriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consultation_id` (`consultation_id`);

--
-- Indexes for table `tbl_refer_request`
--
ALTER TABLE `tbl_refer_request`
  ADD PRIMARY KEY (`rs_id`),
  ADD KEY `rs_apid` (`rs_apid`);

--
-- Indexes for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `staff_unique` (`staff_unique`),
  ADD UNIQUE KEY `staff_email` (`staff_email`),
  ADD KEY `idx_staff_department` (`staff_department_id`);

--
-- Indexes for table `tbl_subfile`
--
ALTER TABLE `tbl_subfile`
  ADD PRIMARY KEY (`subfile_id`),
  ADD KEY `idx_subfile_parent` (`subfile_file_id`);

--
-- Indexes for table `tbl_surgery_request`
--
ALTER TABLE `tbl_surgery_request`
  ADD PRIMARY KEY (`sr_id`),
  ADD KEY `sr_apid` (`sr_apid`);

--
-- Indexes for table `tbl_test_item`
--
ALTER TABLE `tbl_test_item`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `tbl_timeline`
--
ALTER TABLE `tbl_timeline`
  ADD PRIMARY KEY (`timeline_id`);

--
-- Indexes for table `tbl_vitals`
--
ALTER TABLE `tbl_vitals`
  ADD PRIMARY KEY (`vital_id`);

--
-- Indexes for table `test_invoice`
--
ALTER TABLE `test_invoice`
  ADD PRIMARY KEY (`inv_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `drug_invoice`
--
ALTER TABLE `drug_invoice`
  MODIFY `inv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=244;

--
-- AUTO_INCREMENT for table `tbl_admission`
--
ALTER TABLE `tbl_admission`
  MODIFY `admit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_admission_charge`
--
ALTER TABLE `tbl_admission_charge`
  MODIFY `charge_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_appointment`
--
ALTER TABLE `tbl_appointment`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_bed_admission`
--
ALTER TABLE `tbl_bed_admission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_bed_categories`
--
ALTER TABLE `tbl_bed_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_cashier_pin`
--
ALTER TABLE `tbl_cashier_pin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_consultation_data`
--
ALTER TABLE `tbl_consultation_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_department`
--
ALTER TABLE `tbl_department`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_drugs`
--
ALTER TABLE `tbl_drugs`
  MODIFY `drug_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_drug_chart`
--
ALTER TABLE `tbl_drug_chart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_findings`
--
ALTER TABLE `tbl_findings`
  MODIFY `f_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_findings_test`
--
ALTER TABLE `tbl_findings_test`
  MODIFY `f_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_lab_tests`
--
ALTER TABLE `tbl_lab_tests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_lab_test_result`
--
ALTER TABLE `tbl_lab_test_result`
  MODIFY `result_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_medication`
--
ALTER TABLE `tbl_medication`
  MODIFY `medication_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_nurse_note`
--
ALTER TABLE `tbl_nurse_note`
  MODIFY `note_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_nurse_opd_complaint`
--
ALTER TABLE `tbl_nurse_opd_complaint`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_nurse_opd_labs`
--
ALTER TABLE `tbl_nurse_opd_labs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_operations`
--
ALTER TABLE `tbl_operations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_patients`
--
ALTER TABLE `tbl_patients`
  MODIFY `patient_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_prescriptions`
--
ALTER TABLE `tbl_prescriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_refer_request`
--
ALTER TABLE `tbl_refer_request`
  MODIFY `rs_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_subfile`
--
ALTER TABLE `tbl_subfile`
  MODIFY `subfile_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_surgery_request`
--
ALTER TABLE `tbl_surgery_request`
  MODIFY `sr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_test_item`
--
ALTER TABLE `tbl_test_item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_timeline`
--
ALTER TABLE `tbl_timeline`
  MODIFY `timeline_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_vitals`
--
ALTER TABLE `tbl_vitals`
  MODIFY `vital_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `test_invoice`
--
ALTER TABLE `test_invoice`
  MODIFY `inv_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  ADD CONSTRAINT `fk_staff_department` FOREIGN KEY (`staff_department_id`) REFERENCES `tbl_department` (`department_id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
