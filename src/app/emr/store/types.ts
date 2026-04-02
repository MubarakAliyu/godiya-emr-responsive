// Type definitions for the EMR store

export type PatientType = 'Inpatient' | 'Outpatient';
export type PatientStatus = 'Active' | 'Admitted' | 'Discharged' | 'Pending Payment' | 'Deceased';
export type Gender = 'Male' | 'Female';
export type FileType = 'Individual' | 'Family';

export interface Patient {
  id: string;
  dbId?: number; // Database ID for API operations
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  dateOfBirth?: string;
  age?: number;
  phoneNumber: string;
  address: string;
  patientType: PatientType;
  status: PatientStatus;
  bloodGroup?: string;
  allergies?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  dateRegistered: string;
  nextOfKin: string;
  fileType: FileType;
  parentFileId?: string; // For family files - links to parent family file
  isPaid: boolean;
  totalPaid?: number;
  isDead: boolean;
  dateOfDeath?: string;
  causeOfDeath?: string;
  deathRemarks?: string;
  // NHIS Fields
  isNHIS?: boolean; // Whether patient is enrolled in NHIS
  nhisNumber?: string; // NHIS Scheme ID/Number
  nhisProvider?: string; // HMO Provider name
}

export interface FamilySubfile {
  id: number;
  fileId: string; // parent patient_unique_id
  firstName: string;
  lastName: string;
  gender: Gender;
  maritalStatus?: string;
  allergies?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  isDead: boolean;
  dateOfDeath?: string;
  causeOfDeath?: string;
  deathRemarks?: string;
  createdAt: string;
}

export type AppointmentType = 'Consultation' | 'Follow-up' | 'Emergency' | 'ANC' | 'Immunization';
export type AppointmentStatus = 'Scheduled' | 'In Progress' | 'Processed' | 'Completed' | 'Cancelled';
export type AppointmentPriority = 'Normal' | 'High' | 'Critical';

export interface Appointment {
  id: string; // appointment_number
  dbId?: number; // appointment_id
  patientId: string; // appointment_fileid
  patientName: string;
  appointmentType: AppointmentType;
  department: string; // appointment_department
  doctorName: string; // display name (or use ID in backend)
  doctorId?: string; // appointment_doctor (user id)
  date: string; // appointment_date
  time: string; // appointment_shift or integrated time
  shift?: string; // appointment_shift
  priority: AppointmentPriority; // appointment_priority
  status: AppointmentStatus; // appointment_sta
  isPaid: boolean; // appointment_ispaid
  totalPaid?: number;
  totalFee?: number;
  isSubfile: boolean; // is_subfile
  gender?: string; // patient gender
  message?: string; // appointment_messege
  alternateAddress?: string; // appointment_alternate_address
  latestLabResult?: string; // Added for nurse portal
  latestLabResultPicture?: string;
  latestLabResultDate?: string;
  notes: string;
  createdAt?: string;
}

export type InvoiceType = 'Consultation' | 'Lab' | 'Pharmacy' | 'Admission' | 'Receipt';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface Invoice {
  id: string;
  receiptId: string;
  patientId: string;
  patientName: string;
  invoiceType: InvoiceType;
  amount: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  dateCreated: string;
}

export interface Notification {
  id: string;
  userId?: string; // Optional specific user ID
  type: 'info' | 'success' | 'warning' | 'critical';
  category: 'clinical' | 'billing' | 'admin'; // For tab filtering
  icon: string;
  title: string;
  description: string;
  message?: string; // Full message
  module: 'Patients' | 'Appointments' | 'Billing' | 'Laboratory' | 'Pharmacy' | 'Staff' | 'Departments' | 'System' | 'Security' | 'Beds' | 'Administration';
  timestamp: string;
  unread: boolean;
  actionLink?: string; // Optional action link
  actionLabel?: string; // Label for action button
}

export interface ActivityLog {
  id: string;
  action: string;
  module: 'Patients' | 'Appointments' | 'Billing' | 'System' | 'Staff' | 'Departments';
  user: string;
  timestamp: string;
  icon: string;
}

export type DepartmentType = 'Clinical' | 'Support';
export type DepartmentStatus = 'Active' | 'Inactive';

export interface Department {
  id: string;
  dbId?: number; // Database ID for API operations
  name: string;
  type: DepartmentType;
  description: string;
  staffCount: number;
  status: DepartmentStatus;
  icon?: string;
  dateCreated: string;
  lastUpdated: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
}

export type StaffDepartment =
  | 'Medical'
  | 'Nursing'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Administration'
  | 'Finance'
  | 'IT'
  | 'Human Resources'
  | 'Maintenance'
  | 'Security';

export type StaffRole =
  | 'Doctor'
  | 'Nurse'
  | 'Lab Technician'
  | 'Pharmacist'
  | 'Receptionist'
  | 'Accountant'
  | 'IT Support'
  | 'HR Manager'
  | 'Cleaner'
  | 'Security Guard'
  | 'Admin Officer';

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract';
export type StaffStatus = 'Active' | 'On Leave' | 'Suspended' | 'Resigned';

export interface Staff {
  id: string;
  dbId?: number; // Database ID for API operations
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  gender: Gender;
  email: string;
  phoneNumber: string;
  address: string;
  department: string; // Changed from StaffDepartment to string for flexibility
  departmentId?: number; // Database department ID
  role: string; // Changed from StaffRole to string for flexibility
  employmentType: string; // Changed from EmploymentType to string for flexibility
  salary?: number;
  dateOfBirth?: string;
  qualification?: string;
  licenseNumber?: string;
  dateJoined: string;
  status: StaffStatus;
  profilePhoto?: string;
}

// Staff Attendance Types
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'On Leave';

export interface AttendanceSession {
  loginTime: string;
  logoutTime?: string;
  duration?: number; // in minutes
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  role: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string; // First login of the day
  checkOutTime?: string; // Last logout of the day
  lateMinutes?: number;
  notes?: string;
  sessions?: AttendanceSession[]; // All login/logout sessions for the day
  totalHoursWorked?: number; // Total hours worked in the day
}

// Bed Management Types
export type BedStatus = 'Available' | 'Occupied';

export interface BedCategory {
  id: string;
  dbId?: number; // Database ID for API operations
  categoryName: string;
  pricePerDay: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  description?: string;
  dateCreated: string;
  lastUpdated: string;
}

// Roles & Permissions Types
export type RoleStatus = 'Active' | 'Disabled';

export type ModuleName =
  | 'Patients'
  | 'Appointments'
  | 'Finance'
  | 'Pharmacy'
  | 'Laboratory'
  | 'Beds'
  | 'Reports'
  | 'Attendance'
  | 'Administration';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve';

export interface ModulePermissions {
  module: ModuleName;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  approve: boolean;
}

export interface Role {
  id: string;
  roleName: string;
  departmentScope: string[];
  description: string;
  permissions: ModulePermissions[];
  status: RoleStatus;
  dateCreated: string;
  lastUpdated: string;
  createdBy: string;
}

// User Management Types
export type UserStatus = 'Active' | 'Suspended' | 'Pending';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  department: StaffDepartment;
  role: string; // Can link to Role.roleName
  roleId?: string;
  status: UserStatus;
  lastLogin?: string;
  dateCreated: string;
  lastUpdated: string;
  createdBy: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  action: 'Login' | 'Logout' | 'Password Reset' | 'Role Change';
  ipAddress: string;
  timestamp: string;
  userAgent?: string;
}

// Hospital Settings Types
export interface HospitalSettings {
  general?: {
    hospitalName: string;
    hospitalShortName: string;
    timeZone: string;
    dateFormat: string;
    currencySymbol: string;
    language: string;
    workingHoursStart: string;
    workingHoursEnd: string;
  };
  profile?: {
    logo: string;
    address: string;
    phoneNumber: string;
    email: string;
    website: string;
    cmdName: string;
    registrationNumber: string;
    hospitalType: string;
  };
  billing?: {
    individualFileFee: number;
    consultationFee: number;
    baseFee: number;             // Fixed base fee (e.g. ₦1,000)
    doctorConsultationFee: number; // Dynamic doctor fee (₦10,000 – ₦15,000)
    admissionDeposit: number;
    enableNHIS: boolean;
    familyFileFee: number;
    pharmacyFlexible: boolean;
    allowManualFeeOverride: boolean;
    allowInvoiceRegeneration: boolean;
  };
  notifications?: {
    enableSystemNotifications: boolean;
    enableEmailAlerts: boolean;
    enableSMSAlerts: boolean;
    appointmentReminder: boolean;
    paymentConfirmation: boolean;
    labResultReady: boolean;
    notificationSound: string;
  };
  security?: {
    passwordLength: number;
    sessionTimeout: number;
    enable2FA: boolean;
    enableIPRestriction: boolean;
    accountLockAttempts: number;
  };
  preferences?: {
    defaultLandingPage: string;
    tableRowsDefault: number;
    enableDarkMode: boolean;
    enableAnimations: boolean;
    printLayoutStyle: string;
  };
  lastUpdated?: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalEmail: string;
  hospitalLogo: string;
}