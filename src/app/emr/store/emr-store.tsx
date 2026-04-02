import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { Patient, Appointment, Invoice, Notification, ActivityLog, Doctor, Staff, Department, StaffAttendance, AttendanceStatus, BedCategory, HospitalSettings, AttendanceSession, Role, FamilySubfile } from './types';
import { getCurrentUser } from '../utils/auth';

interface EMRStoreContextType {
  // Data
  patients: Patient[];
  appointments: Appointment[];
  invoices: Invoice[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  doctors: Doctor[];
  staff: Staff[];
  departments: Department[];
  staffAttendance: StaffAttendance[];
  bedCategories: BedCategory[];
  settings: HospitalSettings;
  roles: Role[];
  subfiles: FamilySubfile[];

  // Actions
  addPatient: (patient: Omit<Patient, 'id' | 'fullName' | 'age' | 'dateRegistered'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string, reason: string) => void;
  markPatientAsDeceased: (id: string, dateOfDeath: string, causeOfDeath: string, remarks: string) => void;

  addAppointment: (appointment: Omit<Appointment, 'id'>) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'receiptId' | 'dateCreated'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;

  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'unread'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;

  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  // Staff Actions
  addStaff: (staff: Omit<Staff, 'id' | 'fullName'>) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;

  // Department Actions
  addDepartment: (department: Omit<Department, 'id' | 'dateCreated' | 'lastUpdated'>) => Department;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Staff Attendance Actions
  addStaffAttendance: (attendance: Omit<StaffAttendance, 'id'>) => StaffAttendance;
  updateStaffAttendance: (id: string, updates: Partial<StaffAttendance>) => void;
  deleteStaffAttendance: (id: string) => void;
  recordStaffLogin: (staffId: string) => void; // New: Record staff login with session tracking
  recordStaffLogout: (staffId: string) => void; // New: Record staff logout with session tracking
  getTodayAttendance: () => StaffAttendance[]; // New: Get today's attendance

  // Bed Management Actions
  addBedCategory: (bedCategory: Omit<BedCategory, 'id' | 'dateCreated' | 'lastUpdated' | 'availableBeds'>) => BedCategory;
  updateBedCategory: (id: string, updates: Partial<BedCategory>) => void;
  deleteBedCategory: (id: string) => void;

  // Settings Actions
  // Settings Actions
  updateSettings: (settings: Partial<HospitalSettings>) => void;

  // Subfile Actions
  addSubfile: (subfile: Omit<FamilySubfile, 'id' | 'createdAt'>) => void;
  updateSubfile: (id: number, updates: Partial<FamilySubfile>) => void;
  deleteSubfile: (id: number) => void;
  refreshData: () => Promise<void>;

  // Cashier PIN
  cashierPIN: string | null;
  setCashierPIN: (pin: string) => void;
}

const EMRStoreContext = createContext<EMRStoreContextType | undefined>(undefined);

export function EMRStoreProvider({ children }: { children: ReactNode }) {
  // Initialize state with error handling
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [bedCategories, setBedCategories] = useState<BedCategory[]>([]);
  const [settings, setSettings] = useState<HospitalSettings>({
    hospitalName: 'General Hospital',
    hospitalAddress: '123 Hospital Road, City, Country',
    hospitalPhone: '+1234567890',
    hospitalEmail: 'info@hospital.com',
    hospitalLogo: 'https://via.placeholder.com/150',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [subfiles, setSubfiles] = useState<FamilySubfile[]>([]);
  const [cashierPIN, setCashierPINState] = useState<string | null>(
    () => localStorage.getItem('cashier_pin') // persist across page refreshes
  );

  const setCashierPIN = (pin: string) => {
    setCashierPINState(pin);
    localStorage.setItem('cashier_pin', pin);
  };

  // Counters for ID generation to prevent duplicates
  let notificationCounter = 0;
  let activityLogCounter = 0;

  // Helper to calculate age
  const calculateAge = (dob: string | undefined): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fetch settings, staff, and departments
  const fetchData = async () => {
    try {
      // Fetch Settings
      const settingsRes = await fetch('/api/settings.php');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (Object.keys(settingsData).length > 0) {
          setSettings(prev => ({ ...prev, ...settingsData }));
        }
      }

      // Fetch Doctors
      const doctorRes = await fetch('/api/users.php?role=Doctor');
      let fetchedDoctors: Doctor[] = [];
      if (doctorRes.ok) {
        const doctorData = await doctorRes.json();
        fetchedDoctors = doctorData.map((d: any) => ({
          id: d.id,
          name: d.full_name,
          department: d.department || 'General Medicine',
          specialization: d.department || 'Medical Officer'
        }));
        setDoctors(fetchedDoctors);
        console.log('Doctors loaded:', fetchedDoctors.length);
      } else {
        console.error('Failed to fetch doctors:', doctorRes.status);
      }

      // Fetch Patients
      const patientRes = await fetch('/api/patients.php');
      let fetchedPatients: Patient[] = [];
      if (patientRes.ok) {
        const patientData = await patientRes.json();
        fetchedPatients = patientData.map((p: any) => ({
          id: p.patient_unique_id,
          dbId: parseInt(p.patient_id),
          firstName: p.first_name,
          middleName: p.middle_name,
          lastName: p.last_name,
          fullName: p.full_name,
          gender: p.gender,
          dateOfBirth: p.dob,
          age: calculateAge(p.dob),
          phoneNumber: p.phone_number,
          address: p.address,
          fileType: p.file_type,
          parentFileId: p.parent_file_id,
          patientType: p.patient_type === 'IPD' ? 'Inpatient' : 'Outpatient',
          status: p.status,
          isNHIS: p.is_nhis == 1,
          nhisNumber: p.nhis_number,
          nhisProvider: p.nhis_provider,
          bloodGroup: p.blood_group,
          allergies: p.allergies,
          emergencyContactName: p.emergency_contact_name,
          emergencyContactPhone: p.emergency_contact_phone,
          nextOfKin: p.next_of_kin,
          notes: p.notes,
          isPaid: p.is_paid == 1,
          totalPaid: p.total_paid ? parseFloat(p.total_paid) : 0,
          isDead: p.is_dead == 1,
          dateOfDeath: p.date_of_death,
          causeOfDeath: p.cause_of_death,
          deathRemarks: p.death_remarks,
          dateRegistered: p.created_at,
        }));
        setPatients(fetchedPatients);
        console.log('Patients loaded:', fetchedPatients.length);
      } else {
        console.error('Failed to fetch patients:', patientRes.status);
      }

      // Fetch Subfiles
      const subfileRes = await fetch('/api/subfiles.php');
      let fetchedSubfiles: FamilySubfile[] = [];
      if (subfileRes.ok) {
        const subfileData = await subfileRes.json();
        fetchedSubfiles = subfileData.map((s: any) => ({
          id: parseInt(s.subfile_id),
          fileId: s.subfile_file_id,
          firstName: s.subfile_fname,
          lastName: s.subfile_lname,
          gender: s.subfile_gender,
          maritalStatus: s.subfile_maritalstatus,
          allergies: s.subfile_knownallergies,
          dateOfBirth: s.subfile_dob,
          bloodGroup: s.subfile_bloodgroup,
          isDead: s.is_dead == 1,
          createdAt: s.created_at
        }));
        setSubfiles(fetchedSubfiles);
      }

      // Fetch Appointments (Now with data for mapping available)
      const appointmentRes = await fetch('/api/appointments.php');
      if (appointmentRes.ok) {
        const appointmentData = await appointmentRes.json();
        const mappedAppointments = appointmentData.map((a: any) => {
          const patient = fetchedPatients.find(p => p.id === a.appointment_fileid);
          const subfile = fetchedSubfiles.find(s => `SF-${s.id}` === a.appointment_fileid);

          return {
            id: a.appointment_number,
            dbId: parseInt(a.appointment_id),
            patientId: a.appointment_fileid, // Strictly use the specific ID (SF- or main)
            patientName: patient ? patient.fullName : (subfile ? `${subfile.firstName} ${subfile.lastName}` : 'Unknown'),
            appointmentType: 'Consultation',
            department: a.appointment_department,
            doctorName: fetchedDoctors.find(d => String(d.id) === String(a.appointment_doctor))?.name || 'Dr. Unknown',
            doctorId: a.appointment_doctor,
            date: a.appointment_date,
            time: a.appointment_shift,
            shift: a.appointment_shift,
            priority: a.appointment_priority,
            status: a.appointment_sta,
            isPaid: a.appointment_ispaid == 1,
            totalPaid: a.total_paid ? parseFloat(a.total_paid) : 0,
            totalFee: a.appointment_fee ? parseFloat(a.appointment_fee) : 0,
            isSubfile: a.is_subfile == 1,
            message: a.appointment_messege,
            alternateAddress: a.appointment_alternate_address,
            latestLabResult: a.latest_lab_result,
            latestLabResultPicture: a.latest_lab_result_picture,
            latestLabResultDate: a.latest_lab_result_date,
            notes: a.appointment_messege || '',
            createdAt: a.created_at,
          };
        });

        // Filter to "Live" appointments (only last 24 hours)
        const now = new Date();
        const liveAppointments = mappedAppointments.filter((a: any) => {
          if (!a.createdAt) return true; // Fallback for old records without createdAt
          const createdDate = new Date(a.createdAt);
          const diffInMs = now.getTime() - createdDate.getTime();
          const diffInHours = diffInMs / (1000 * 60 * 60);
          return diffInHours <= 24;
        });

        setAppointments(liveAppointments);
      }

      // Fetch Staff (Reading from Users table for Attendance & Staff management)
      const staffRes = await fetch('/api/users.php');
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        const mappedStaff = staffData.map((s: any) => ({
          id: s.id, // GH-US-xxx
          dbId: s.id,
          firstName: s.first_name,
          lastName: s.last_name,
          fullName: s.full_name || `${s.first_name} ${s.last_name}`,
          gender: s.gender || 'Not Specified',
          email: s.email,
          phoneNumber: s.phone || '',
          address: s.address || 'Not Specified',
          department: s.department || 'Unassigned',
          departmentId: s.role_id ? parseInt(s.role_id) : undefined,
          role: s.role_name || 'Staff',
          employmentType: 'Full-time',
          salary: 0,
          dateOfBirth: '',
          qualification: '',
          licenseNumber: '',
          dateJoined: s.created_at || new Date().toISOString(),
          status: s.status || 'Active',
          profilePhoto: undefined,
        }));
        setStaff(mappedStaff);
      }

      // Fetch Departments
      const deptRes = await fetch('/api/departments.php');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        const mappedDepts = deptData.map((d: any) => ({
          id: `DEPT-${d.department_id}`,
          dbId: parseInt(d.department_id),
          name: d.department_name,
          description: d.department_description,
          type: d.department_type,
          status: d.department_status == 1 ? 'Active' : 'Inactive',
          staffCount: parseInt(d.staffCount) || 0,
          dateCreated: d.created_at,
          lastUpdated: d.updated_at,
        }));
        setDepartments(mappedDepts);
      }

      // Fetch Roles
      const roleRes = await fetch('/api/roles.php');
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        const mappedRoles = roleData.map((r: any) => ({
          id: r.id,
          roleName: r.role_name,
          description: r.description,
          departmentScope: r.department_scope ? JSON.parse(r.department_scope) : [],
          permissions: r.permissions || [],
          status: r.status,
          dateCreated: r.created_at,
          lastUpdated: r.updated_at,
          createdBy: r.created_by,
        }));
        setRoles(mappedRoles);
      }

      // Fetch rooms
      const roomsRes = await fetch('/api/rooms.php');
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setBedCategories(roomsData);
      }

      // Fetch Notifications
      const user = getCurrentUser();
      if (user?.id) {
        const isClinicalRole = user.role === 'Doctor' || user.role === 'Nurse';
        const notifUrl = `/api/notifications.php?user_id=${user.id}${isClinicalRole ? '&category=clinical' : ''}`;
        const notifRes = await fetch(notifUrl);
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.map((n: any) => ({
            id: String(n.id),
            user_id: n.user_id,
            type: n.type,
            category: n.category,
            title: n.title,
            description: n.description,
            icon: n.icon,
            unread: n.is_read == 0,
            timestamp: n.created_at
          })));
        }
      }

      // Fetch Invoices
      const invoiceRes = await fetch('/api/invoices.php');
      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        const mappedInvoices = invoiceData.map((inv: any) => ({
          id: String(inv.id),
          receiptId: inv.invoiceId,
          patientId: inv.fileNumber,
          patientName: inv.patientName,
          invoiceType: 'Pharmacy', // For now, all from this API are pharmacy
          amount: inv.amount,
          amountPaid: inv.amount,
          balance: 0,
          paymentStatus: inv.status,
          dateCreated: inv.raw_date
        }));
        setInvoices(mappedInvoices);
        console.log('Invoices loaded:', mappedInvoices.length);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh notifications every 60 seconds
    const interval = setInterval(() => {
      const user = getCurrentUser();
      if (user?.id) {
        const isClinicalRole = user.role === 'Doctor' || user.role === 'Nurse';
        const notifUrl = `/api/notifications.php?user_id=${user.id}${isClinicalRole ? '&category=clinical' : ''}`;
        fetch(notifUrl)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setNotifications(data.map((n: any) => ({
                id: String(n.id),
                userId: n.user_id,
                type: n.type,
                category: n.category,
                module: n.module || 'System',
                title: n.title,
                description: n.description,
                icon: n.icon,
                unread: n.is_read == 0,
                timestamp: n.created_at
              })));
            }
          });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Generate ID
  const generatePatientId = () => {
    const monthYear = new Date().toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' }).replace('/', '');
    const prefix = `GH-${monthYear}`;
    const lastId = patients.length > 0
      ? parseInt(patients[patients.length - 1].id.split('-')[2])
      : 0;
    return `${prefix}-${String(lastId + 1).padStart(5, '0')}`;
  };

  const generateAppointmentId = () => {
    const lastId = appointments.length > 0
      ? parseInt(appointments[appointments.length - 1].id.split('-')[2])
      : 0;
    return `GH-AP-${String(lastId + 1).padStart(4, '0')}`;
  };

  const generateInvoiceId = () => {
    const lastId = invoices.length > 0
      ? parseInt(invoices[invoices.length - 1].id.split('-')[1])
      : 0;
    return `INV-${String(lastId + 1).padStart(3, '0')}`;
  };

  const generateReceiptId = () => {
    const lastId = invoices.length > 0
      ? parseInt(invoices[invoices.length - 1].receiptId.split('-')[2])
      : 0;
    return `GH-RC-${String(lastId + 1).padStart(4, '0')}`;
  };

  const generateStaffId = () => {
    const lastId = staff.length > 0
      ? parseInt(staff[staff.length - 1].id.split('-')[2])
      : 0;
    return `GH-ST-${String(lastId + 1).padStart(3, '0')}`;
  };

  const generateDepartmentId = () => {
    const lastId = departments.length > 0
      ? parseInt(departments[departments.length - 1].id.split('-')[2])
      : 0;
    return `GH-DEPT-${String(lastId + 1).padStart(3, '0')}`;
  };

  const generateStaffAttendanceId = () => {
    // Use current array length to get next ID
    const nextId = staffAttendance.length + 1;
    return `GH-ATT-${String(nextId).padStart(3, '0')}`;
  };

  const generateBedCategoryId = () => {
    const lastId = bedCategories.length > 0
      ? parseInt(bedCategories[bedCategories.length - 1].id.split('-')[2])
      : 0;
    return `GH-BED-${String(lastId + 1).padStart(3, '0')}`;
  };

  // Patient Actions
  const addPatient = (patientData: Omit<Patient, 'id' | 'fullName' | 'age' | 'dateRegistered'>): Patient => {
    const user = getCurrentUser();
    const newPatient: Patient = {
      ...patientData,
      id: generatePatientId(), // Temporary ID until backend responds
      fullName: `${patientData.firstName} ${patientData.lastName}`,
      age: calculateAge(patientData.dateOfBirth),
      dateRegistered: new Date().toISOString(),
    };

    // Optimistic update
    setPatients(prev => [...prev, newPatient]);

    // Persist to backend
    const persistPatient = async () => {
      try {
        const response = await fetch('/api/patients.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: patientData.firstName,
            middle_name: patientData.middleName,
            last_name: patientData.lastName,
            gender: patientData.gender,
            dob: patientData.dateOfBirth,
            phone_number: patientData.phoneNumber,
            address: patientData.address,
            file_type: patientData.fileType,
            parent_file_id: patientData.parentFileId,
            patient_type: patientData.patientType === 'Inpatient' ? 'IPD' : 'OPD',
            status: patientData.status || 'Active',
            is_nhis: patientData.isNHIS ? 1 : 0,
            nhis_number: patientData.nhisNumber,
            nhis_provider: patientData.nhisProvider,
            blood_group: patientData.bloodGroup,
            allergies: patientData.allergies,
            emergency_contact_name: patientData.emergencyContactName,
            emergency_contact_phone: patientData.emergencyContactPhone,
            next_of_kin: patientData.nextOfKin,
            notes: patientData.notes,
            performerId: user?.email || 'System'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Update the optimistic entry with real IDs from the backend
          setPatients(prev => prev.map(p =>
            p.id === newPatient.id ? { ...p, id: result.patient_unique_id, dbId: result.id } : p
          ));

          // If it's a family file, the backend auto-creates the first subfile.
          // Refresh subfiles so we get the correct subfile linked to the real patient_unique_id
          // (the optimistic frontend subfile would have the wrong temp ID).
          if (patientData.fileType === 'Family') {
            try {
              const subfileRes = await fetch('/api/subfiles.php');
              if (subfileRes.ok) {
                const subfileData = await subfileRes.json();
                setSubfiles(subfileData.map((s: any) => ({
                  id: parseInt(s.subfile_id),
                  fileId: s.subfile_file_id,
                  firstName: s.subfile_fname,
                  lastName: s.subfile_lname,
                  gender: s.subfile_gender,
                  maritalStatus: s.subfile_maritalstatus,
                  allergies: s.subfile_knownallergies,
                  dateOfBirth: s.subfile_dob,
                  bloodGroup: s.subfile_bloodgroup,
                  isDead: s.is_dead == 1,
                  createdAt: s.created_at,
                })));
              }
            } catch (subErr) {
              console.error('Error refreshing subfiles after family registration:', subErr);
            }
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to persist patient:', response.status, errorText);
          toast.error('Failed to save patient to database');
        }
      } catch (error) {
        console.error('Error persisting patient:', error);
      }
    };
    persistPatient();

    // Add notification
    addNotification({
      type: 'info',
      category: 'clinical',
      module: 'Patients',
      icon: 'UserPlus',
      title: 'New Patient Registered',
      description: `Patient ${newPatient.fullName} (${newPatient.id}) has been registered`,
    });

    // Add activity log
    addActivityLog({
      action: `New patient registered: ${newPatient.fullName}`,
      module: 'Patients',
      user: user?.name || 'Super Admin',
      icon: 'UserPlus',
    });

    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    const user = getCurrentUser();
    const isSubfile = id.startsWith('SF-') || id.startsWith('sf-');

    if (isSubfile) {
      const subId = parseInt(id.replace(/SF-|sf-/i, ''));
      const subfile = subfiles.find(s => s.id === subId);
      if (!subfile) return;

      // Optimistic update
      setSubfiles(prev => prev.map(s => s.id === subId ? {
        ...s,
        firstName: updates.firstName || s.firstName,
        lastName: updates.lastName || s.lastName,
        gender: updates.gender || s.gender,
        dateOfBirth: updates.dateOfBirth || s.dateOfBirth,
        bloodGroup: updates.bloodGroup || s.bloodGroup,
        allergies: updates.allergies || s.allergies,
        isDead: updates.isDead !== undefined ? updates.isDead : s.isDead,
        dateOfDeath: updates.dateOfDeath || s.dateOfDeath,
        causeOfDeath: updates.causeOfDeath || s.causeOfDeath,
        deathRemarks: updates.deathRemarks || s.deathRemarks,
      } : s));

      // Persist to backend
      const persistUpdate = async () => {
        try {
          await fetch('/api/subfiles.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subfile_id: subId,
              subfile_fname: updates.firstName,
              subfile_lname: updates.lastName,
              subfile_gender: updates.gender,
              subfile_dob: updates.dateOfBirth,
              is_dead: updates.isDead !== undefined ? (updates.isDead ? 1 : 0) : undefined,
              date_of_death: updates.dateOfDeath,
              cause_of_death: updates.causeOfDeath,
              death_remarks: updates.deathRemarks,
              performerId: user?.email || 'System'
            }),
          });
        } catch (error) {
          console.error('Error updating subfile:', error);
        }
      };
      persistUpdate();
      return;
    }

    const patient = patients.find(p => p.id === id);
    if (!patient) return;

    // Optimistic update
    setPatients(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        if (updates.firstName || updates.lastName) {
          updated.fullName = `${updated.firstName || p.firstName} ${updated.lastName || p.lastName}`;
        }
        if (updates.dateOfBirth) {
          updated.age = calculateAge(updates.dateOfBirth);
        }
        return updated;
      }
      return p;
    }));

    // Persist to backend
    const persistUpdate = async () => {
      try {
        await fetch('/api/patients.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patient.dbId,
            first_name: updates.firstName,
            middle_name: updates.middleName,
            last_name: updates.lastName,
            gender: updates.gender,
            dob: updates.dateOfBirth,
            phone_number: updates.phoneNumber,
            address: updates.address,
            file_type: updates.fileType,
            parent_file_id: updates.parentFileId,
            patient_type: updates.patientType ? (updates.patientType === 'Inpatient' ? 'IPD' : 'OPD') : undefined,
            status: updates.status,
            is_nhis: updates.isNHIS !== undefined ? (updates.isNHIS ? 1 : 0) : undefined,
            nhis_number: updates.nhisNumber,
            nhis_provider: updates.nhisProvider,
            blood_group: updates.bloodGroup,
            allergies: updates.allergies,
            emergency_contact_name: updates.emergencyContactName,
            emergency_contact_phone: updates.emergencyContactPhone,
            next_of_kin: updates.nextOfKin,
            notes: updates.notes,
            is_dead: updates.isDead !== undefined ? (updates.isDead ? 1 : 0) : undefined,
            date_of_death: updates.dateOfDeath,
            cause_of_death: updates.causeOfDeath,
            death_remarks: updates.deathRemarks,
            performerId: user?.email || 'System'
          }),
        });
      } catch (error) {
        console.error('Error updating patient:', error);
      }
    };
    persistUpdate();

    // Add activity log for status changes
    if (updates.status && updates.status !== patient.status) {
      addActivityLog({
        action: `Patient status updated: ${patient.fullName} - ${updates.status}`,
        module: 'Patients',
        user: user?.name || 'Super Admin',
        icon: 'UserCheck',
      });
    }
  };

  const deletePatient = (id: string, reason: string) => {
    const user = getCurrentUser();
    const patient = patients.find(p => p.id === id);
    if (patient) {
      // Optimistic update
      setPatients(prev => prev.filter(p => p.id !== id));

      // Persist to backend
      const persistDelete = async () => {
        try {
          await fetch('/api/patients.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: patient.dbId,
              performerId: user?.email || 'System',
              reason: reason
            }),
          });
        } catch (error) {
          console.error('Error deleting patient:', error);
        }
      };
      persistDelete();

      addActivityLog({
        action: `Patient removed: ${patient.fullName} - Reason: ${reason}`,
        module: 'Patients',
        user: user?.name || 'Super Admin',
        icon: 'UserMinus',
      });
    }
  };

  const markPatientAsDeceased = (id: string, dateOfDeath: string, causeOfDeath: string, remarks: string) => {
    updatePatient(id, {
      isDead: true,
      dateOfDeath,
      causeOfDeath,
      deathRemarks: remarks,
      status: 'Deceased'
    });
  };

  // Appointment Actions
  const addAppointment = (appointmentData: Omit<Appointment, 'id'>): Appointment => {
    const user = getCurrentUser();
    const newAppointment: Appointment = {
      ...appointmentData,
      id: generateAppointmentId(), // Temporary
    };

    setAppointments(prev => [...prev, newAppointment]);

    // Persist to backend
    const persistAppointment = async () => {
      try {
        const response = await fetch('/api/appointments.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointment_fileid: appointmentData.patientId,
            appointment_doctor: appointmentData.doctorId,
            appointment_shift: appointmentData.time,
            appointment_date: appointmentData.date,
            appointment_priority: appointmentData.priority,
            appointment_sta: appointmentData.status,
            appointment_ispaid: appointmentData.isPaid ? 1 : 0,
            appointment_messege: appointmentData.message || appointmentData.notes,
            appointment_alternate_address: appointmentData.alternateAddress,
            is_subfile: appointmentData.isSubfile ? 1 : 0,
            appointment_department: appointmentData.department,
            appointment_fee: appointmentData.totalFee || 0,
            performerId: user?.email || 'System'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setAppointments(prev => prev.map(a =>
            a.id === newAppointment.id ? { ...a, id: result.appointment_number, dbId: result.appointment_id } : a
          ));
        }
      } catch (error) {
        console.error('Error persisting appointment:', error);
      }
    };
    persistAppointment();

    addNotification({
      type: 'info',
      category: 'clinical',
      module: 'Appointments',
      icon: 'Calendar',
      title: 'New Appointment Created',
      description: `Appointment for ${newAppointment.patientName} scheduled with ${newAppointment.doctorName}`,
    });

    addActivityLog({
      action: `Appointment created for ${newAppointment.patientName}`,
      module: 'Appointments',
      user: user?.name || 'Super Admin',
      icon: 'Calendar',
    });

    return newAppointment;
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    const user = getCurrentUser();
    const appointment = appointments.find(a => a.id === id);

    if (appointment) {
      // Optimistic update
      setAppointments(prev => prev.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ));

      // Persist to backend
      const persistUpdate = async () => {
        try {
          await fetch('/api/appointments.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appointment_id: appointment.dbId,
              appointment_doctor: updates.doctorId !== undefined ? updates.doctorId : appointment.doctorId,
              appointment_shift: updates.time !== undefined ? updates.time : appointment.time,
              appointment_date: updates.date !== undefined ? updates.date : appointment.date,
              appointment_priority: updates.priority !== undefined ? updates.priority : appointment.priority,
              appointment_sta: updates.status !== undefined ? updates.status : appointment.status,
              appointment_ispaid: (updates.isPaid !== undefined ? (updates.isPaid ? 1 : 0) : (appointment.isPaid ? 1 : 0)),
              appointment_messege: updates.message !== undefined ? updates.message : appointment.message,
              appointment_alternate_address: updates.alternateAddress !== undefined ? updates.alternateAddress : appointment.alternateAddress,
              is_subfile: updates.isSubfile !== undefined ? (updates.isSubfile ? 1 : 0) : (appointment.isSubfile ? 1 : 0),
              appointment_department: updates.department !== undefined ? updates.department : appointment.department,
              appointment_fee: updates.totalFee !== undefined ? updates.totalFee : appointment.totalFee,
              performerId: user?.email || 'System'
            }),
          });
        } catch (error) {
          console.error('Error updating appointment:', error);
        }
      };
      persistUpdate();

      // Add activity log for status changes
      if (updates.status && updates.status !== appointment.status) {
        addActivityLog({
          action: `Appointment ${appointment.id} status updated to: ${updates.status}`,
          module: 'Appointments',
          user: user?.name || 'Super Admin',
          icon: 'Calendar',
        });
      }
    }
  };

  const deleteAppointment = (id: string, reason: string = 'User requested') => {
    const user = getCurrentUser();
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      // Optimistic delete
      setAppointments(prev => prev.filter(a => a.id !== id));

      // Persist delete
      const persistDelete = async () => {
        try {
          await fetch(`/api/appointments.php?appointment_id=${appointment.dbId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              performerId: user?.email || 'System',
              reason: reason
            })
          });
        } catch (error) {
          console.error('Error deleting appointment:', error);
        }
      };
      persistDelete();

      addActivityLog({
        action: `Appointment cancelled: ${appointment.patientName}`,
        module: 'Appointments',
        user: user?.name || 'Super Admin',
        icon: 'Calendar',
      });
    }
  };

  // Invoice Actions
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'receiptId' | 'dateCreated'>): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateInvoiceId(),
      receiptId: generateReceiptId(),
      dateCreated: new Date().toISOString(),
    };

    setInvoices(prev => [...prev, newInvoice]);

    addNotification({
      type: 'info',
      category: 'billing',
      module: 'Billing',
      icon: 'DollarSign',
      title: 'Invoice Generated',
      description: `Invoice ${newInvoice.receiptId} generated for ${newInvoice.patientName} - ₦${newInvoice.amount.toLocaleString()}`,
    });

    addActivityLog({
      action: `Invoice generated: ${newInvoice.receiptId} for ${newInvoice.patientName}`,
      module: 'Billing',
      user: 'Super Admin',
      icon: 'DollarSign',
    });

    return newInvoice;
  };

  const addPayment = (paymentData: {
    patient_unique_id: string;
    amount_expected: number;
    amount_paid: number;
    payment_method: string;
    payment_description: string;
    reference_id?: string;
    appointment_number?: string;
  }) => {
    const user = getCurrentUser();

    // Add to invoices state locally for immediate feedback
    const newInvoice: Invoice = {
      id: generateInvoiceId(),
      receiptId: generateReceiptId(),
      patientId: paymentData.patient_unique_id,
      patientName: patients.find(p => p.id === paymentData.patient_unique_id)?.fullName || 'Unknown',
      invoiceType: 'Receipt',
      amount: paymentData.amount_paid,
      amountPaid: paymentData.amount_paid,
      balance: paymentData.amount_expected - paymentData.amount_paid,
      paymentStatus: (paymentData.amount_paid >= paymentData.amount_expected) ? 'Paid' : 'Partial',
      paymentMethod: paymentData.payment_method,
      dateCreated: new Date().toISOString(),
    };

    setInvoices(prev => [...prev, newInvoice]);

    // If it's an appointment payment, update the appointment state as well
    if (paymentData.appointment_number || paymentData.payment_description.toLowerCase().includes('consultation')) {
      const appNumber = paymentData.appointment_number || paymentData.reference_id;
      if (appNumber && paymentData.amount_paid >= paymentData.amount_expected) {
        setAppointments(prev => prev.map(a =>
          a.id === appNumber ? { ...a, isPaid: true } : a
        ));
      }
    }

    // Persist to backend
    const persistPayment = async () => {
      try {
        const response = await fetch('/api/payments.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...paymentData,
            cashier_id: user?.name || 'System'
          }),
        });

        if (response.ok) {
          // You might want to refresh data here or just rely on optimistic update
          console.log('Payment persisted successfully');
        }
      } catch (error) {
        console.error('Error persisting payment:', error);
      }
    };
    persistPayment();

    addActivityLog({
      action: `Payment recorded: ${paymentData.amount_paid} for ${newInvoice.patientName}`,
      module: 'Billing',
      user: user?.name || 'Super Admin',
      icon: 'DollarSign',
    });

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, ...updates };

        if (updates.paymentStatus && updates.paymentStatus !== i.paymentStatus) {
          addActivityLog({
            action: `Invoice ${updated.receiptId} payment status: ${updates.paymentStatus}`,
            module: 'Billing',
            user: 'Super Admin',
            icon: 'DollarSign',
          });
        }

        return updated;
      }
      return i;
    }));
  };

  // Notification Actions
  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'unread'>) => {
    // Add locally for instant UI response
    const tempId = `TEMP-${Date.now()}`;
    const newNotification: Notification = {
      ...notificationData,
      id: tempId,
      timestamp: new Date().toISOString(),
      unread: true,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Persist to backend
    const persistNotification = async () => {
      try {
        await fetch('/api/notifications.php?action=add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: notificationData.userId,
            type: notificationData.type,
            category: notificationData.category,
            module: notificationData.module,
            title: notificationData.title,
            description: notificationData.description,
            icon: notificationData.icon
          }),
        });
        // We don't necessarily need to update the temp ID here 
        // as the next poll will replace everything with real DB IDs
      } catch (error) {
        console.error('Error persisting notification:', error);
      }
    };
    persistNotification();
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));

    // Persist to backend
    fetch('/api/notifications.php?action=mark_read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(e => console.error('Error marking as read:', e));
  };

  const clearAllNotifications = () => {
    const user = getCurrentUser();
    if (!user?.id) return;

    setNotifications([]);

    // Persist to backend
    fetch(`/api/notifications.php?action=clear_all&user_id=${user.id}`, {
      method: 'POST'
    }).catch(e => console.error('Error clearing notifications:', e));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Persist to backend
    fetch(`/api/notifications.php?id=${id}`, {
      method: 'DELETE'
    }).catch(e => console.error('Error deleting notification:', e));
  };

  // Activity Log Actions
  const addActivityLog = (logData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...logData,
      id: `LOG-${Date.now()}-${activityLogCounter++}`,
      timestamp: new Date().toISOString(),
    };

    setActivityLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Staff Actions
  const addStaff = (staffData: Omit<Staff, 'id' | 'fullName'>): Staff => {
    const user = getCurrentUser();
    const fullName = staffData.middleName
      ? `${staffData.firstName} ${staffData.middleName} ${staffData.lastName}`
      : `${staffData.firstName} ${staffData.lastName}`;

    const newStaff: Staff = {
      ...staffData,
      id: generateStaffId(), // Temporary ID until backend responds
      fullName,
      dateJoined: new Date().toISOString(),
    };

    // Optimistic update
    setStaff(prev => [...prev, newStaff]);

    // Persist to backend
    const persistStaff = async () => {
      try {
        const response = await fetch('/api/users.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: staffData.firstName,
            lastName: staffData.lastName,
            fullName: fullName,
            email: staffData.email,
            phone: staffData.phoneNumber,
            username: staffData.email.split('@')[0], // Default username
            password: 'Password123!', // Default password
            department: staffData.department,
            roleId: staffData.departmentId,
            status: staffData.status,
            performerId: user?.email || 'System'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('User persisted successfully:', result);
          // Update the optimistic entry with real IDs
          setStaff(prev => prev.map(s =>
            s.id === newStaff.id ? { ...s, id: result.id, dbId: result.id } : s
          ));
        } else {
          const errorText = await response.text();
          console.error('Failed to persist staff:', response.status, errorText);
          toast.error('Failed to persist staff to database: ' + errorText);
        }
      } catch (error) {
        console.error('Error persisting staff:', error);
      }
    };
    persistStaff();

    addNotification({
      type: 'info',
      category: 'admin',
      module: 'Staff',
      icon: 'UserPlus',
      title: 'New Staff Registered',
      description: `Staff ${newStaff.fullName} has been registered`,
    });

    addActivityLog({
      action: `New staff registered: ${newStaff.fullName}`,
      module: 'Staff',
      user: user?.name || 'Super Admin',
      icon: 'UserPlus',
    });

    return newStaff;
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    const user = getCurrentUser();
    const staffMember = staff.find(s => s.id === id);
    if (!staffMember) return;

    // Optimistic update
    setStaff(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        if (updates.firstName || updates.middleName || updates.lastName) {
          const middleName = updates.middleName !== undefined ? updates.middleName : s.middleName;
          updated.fullName = middleName
            ? `${updated.firstName} ${middleName} ${updated.lastName}`
            : `${updated.firstName} ${updated.lastName}`;
        }
        return updated;
      }
      return s;
    }));

    const persistUpdate = async () => {
      try {
        await fetch('/api/users.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: staffMember.dbId,
            firstName: updates.firstName,
            lastName: updates.lastName,
            email: updates.email,
            phone: updates.phoneNumber,
            department: updates.department,
            status: updates.status,
            performerId: user?.email || 'System'
          }),
        });
      } catch (error) {
        console.error('Error updating staff:', error);
      }
    };
    persistUpdate();

    if (updates.status && updates.status !== staffMember.status) {
      addActivityLog({
        action: `Staff status updated: ${staffMember.fullName} - ${updates.status}`,
        module: 'Staff',
        user: user?.name || 'Super Admin',
        icon: 'UserCheck',
      });

      addNotification({
        type: 'info',
        category: 'clinical',
        module: 'Staff',
        icon: 'UserCheck',
        title: 'Staff Status Updated',
        description: `${staffMember.fullName} status changed to ${updates.status}`,
      });
    }
  };

  const deleteStaff = (id: string) => {
    const user = getCurrentUser();
    const staffMember = staff.find(s => s.id === id);
    if (staffMember) {
      // Optimistic update
      setStaff(prev => prev.filter(s => s.id !== id));

      // Persist to backend
      const persistDelete = async () => {
        try {
          await fetch('/api/users.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: staffMember.dbId,
              performerId: user?.email || 'System'
            }),
          });
        } catch (error) {
          console.error('Error deleting staff:', error);
        }
      };
      persistDelete();

      addActivityLog({
        action: `Staff removed: ${staffMember.fullName}`,
        module: 'Staff',
        user: user?.name || 'Super Admin',
        icon: 'UserMinus',
      });
    }
  };

  // Department Actions
  const addDepartment = (departmentData: Omit<Department, 'id' | 'dateCreated' | 'lastUpdated'>): Department => {
    const user = getCurrentUser();
    const newDepartment: Department = {
      ...departmentData,
      id: generateDepartmentId(), // Temporary ID
      dateCreated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Optimistic update
    setDepartments(prev => [...prev, newDepartment]);

    // Persist to backend
    const persistDept = async () => {
      try {
        const response = await fetch('/api/departments.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department_name: departmentData.name,
            department_description: departmentData.description,
            department_type: departmentData.type,
            department_status: departmentData.status === 'Active' ? 1 : 0,
            performerId: user?.email || 'System'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Update the optimistic entry with real ID
          setDepartments(prev => prev.map(d =>
            d.id === newDepartment.id ? { ...d, id: `DEPT-${result.id}`, dbId: result.id } : d
          ));
        }
      } catch (error) {
        console.error('Error persisting department:', error);
      }
    };
    persistDept();

    addNotification({
      type: 'info',
      category: 'admin',
      module: 'Departments',
      icon: 'Building',
      title: 'New Department Created',
      description: `Department ${newDepartment.name} has been created`,
    });

    addActivityLog({
      action: `New department created: ${newDepartment.name}`,
      module: 'Departments',
      user: user?.name || 'Super Admin',
      icon: 'Building',
    });

    return newDepartment;
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    const user = getCurrentUser();
    const department = departments.find(d => d.id === id);
    if (!department) return;

    // Optimistic update
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

    // Persist to backend
    const persistUpdate = async () => {
      try {
        await fetch('/api/departments.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department_id: department.dbId,
            department_name: updates.name,
            department_description: updates.description,
            department_type: updates.type,
            department_status: updates.status ? (updates.status === 'Active' ? 1 : 0) : undefined,
            performerId: user?.email || 'System'
          }),
        });
      } catch (error) {
        console.error('Error updating department:', error);
      }
    };
    persistUpdate();

    if (updates.status && updates.status !== department.status) {
      addActivityLog({
        action: `Department ${department.name} status updated: ${updates.status}`,
        module: 'Departments',
        user: user?.name || 'Super Admin',
        icon: 'Building',
      });
    }
  };

  const deleteDepartment = (id: string) => {
    const user = getCurrentUser();
    const department = departments.find(d => d.id === id);
    if (department) {
      // Optimistic update
      setDepartments(prev => prev.filter(d => d.id !== id));

      // Persist to backend
      const persistDelete = async () => {
        try {
          await fetch('/api/departments.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              department_id: department.dbId,
              performerId: user?.email || 'System'
            }),
          });
        } catch (error) {
          console.error('Error deleting department:', error);
        }
      };
      persistDelete();

      addActivityLog({
        action: `Department removed: ${department.name}`,
        module: 'Departments',
        user: user?.name || 'Super Admin',
        icon: 'Building',
      });
    }
  };

  // Staff Attendance Actions
  const addStaffAttendance = (attendanceData: Omit<StaffAttendance, 'id'>): StaffAttendance => {
    const newAttendance: StaffAttendance = {
      ...attendanceData,
      id: generateStaffAttendanceId(),
    };

    setStaffAttendance(prev => [...prev, newAttendance]);

    addNotification({
      type: 'info',
      category: 'admin',
      module: 'Staff',
      icon: 'Clock',
      title: 'Staff Attendance Recorded',
      description: `Attendance for ${newAttendance.staffName} (${newAttendance.staffId}) recorded`,
    });

    addActivityLog({
      action: `Staff attendance recorded: ${newAttendance.staffName}`,
      module: 'System',
      user: 'Super Admin',
      icon: 'Clock',
    });

    return newAttendance;
  };

  const updateStaffAttendance = (id: string, updates: Partial<StaffAttendance>) => {
    setStaffAttendance(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates };

        // Add activity log for status changes
        if (updates.status && updates.status !== a.status) {
          addActivityLog({
            action: `Staff attendance ${updated.id} status: ${updates.status}`,
            module: 'System',
            user: 'Super Admin',
            icon: 'Clock',
          });
        }

        return updated;
      }
      return a;
    }));
  };

  const deleteStaffAttendance = (id: string) => {
    const attendance = staffAttendance.find(a => a.id === id);
    if (attendance) {
      setStaffAttendance(prev => prev.filter(a => a.id !== id));
      addActivityLog({
        action: `Staff attendance removed: ${attendance.staffName}`,
        module: 'System',
        user: 'Super Admin',
        icon: 'Clock',
      });
    }
  };

  // New: Record staff login with session tracking
  const recordStaffLogin = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const loginTime = now.toISOString();

    // Find if there's already an attendance record for today
    const todayAttendance = staffAttendance.find(
      a => a.staffId === staffId && a.date.startsWith(today)
    );

    if (todayAttendance) {
      // Add new session to existing attendance (no notification for additional sessions)
      const newSession: AttendanceSession = {
        loginTime,
        logoutTime: undefined,
        duration: undefined,
      };

      const updatedSessions = [...(todayAttendance.sessions || []), newSession];

      setStaffAttendance(prev => prev.map(a =>
        a.id === todayAttendance.id
          ? { ...a, sessions: updatedSessions }
          : a
      ));
    } else {
      // Create new attendance record for today (first login)
      const checkInTime = loginTime;
      const checkInHour = now.getHours();
      const checkInMinute = now.getMinutes();

      // Determine if late (after 8:00 AM)
      const isLate = checkInHour > 8 || (checkInHour === 8 && checkInMinute > 0);
      const lateMinutes = isLate
        ? (checkInHour - 8) * 60 + checkInMinute
        : 0;

      const newAttendance: StaffAttendance = {
        id: generateStaffAttendanceId(),
        staffId,
        staffName: staffMember.fullName,
        department: staffMember.department,
        role: staffMember.role,
        date: loginTime,
        status: isLate ? 'Late' : 'Present',
        checkInTime,
        checkOutTime: undefined,
        lateMinutes: isLate ? lateMinutes : undefined,
        sessions: [{
          loginTime,
          logoutTime: undefined,
          duration: undefined,
        }],
        totalHoursWorked: 0,
      };

      setStaffAttendance(prev => [...prev, newAttendance]);

      // Only notify on FIRST login of the day
      addNotification({
        type: 'info',
        category: 'admin',
        module: 'Staff',
        icon: 'Clock',
        title: 'Staff Checked In',
        description: `${staffMember.fullName} checked in at ${now.toLocaleTimeString()}${isLate ? ' (Late)' : ''}`,
      });
    }
  };

  // New: Record staff logout with session tracking
  const recordStaffLogout = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const logoutTime = now.toISOString();

    // Find today's attendance record
    const todayAttendance = staffAttendance.find(
      a => a.staffId === staffId && a.date.startsWith(today)
    );

    if (todayAttendance && todayAttendance.sessions) {
      // Update the last session's logout time (only if it's not already logged out)
      const lastSession = todayAttendance.sessions[todayAttendance.sessions.length - 1];

      // Only update if last session doesn't have a logout time
      if (lastSession && !lastSession.logoutTime) {
        const updatedSessions = todayAttendance.sessions.map((session, index) => {
          if (index === todayAttendance.sessions!.length - 1) {
            const loginDate = new Date(session.loginTime);
            const logoutDate = new Date(logoutTime);
            const duration = Math.floor((logoutDate.getTime() - loginDate.getTime()) / (1000 * 60)); // in minutes

            return {
              ...session,
              logoutTime,
              duration,
            };
          }
          return session;
        });

        // Calculate total hours worked
        const totalMinutes = updatedSessions.reduce(
          (sum, session) => sum + (session.duration || 0),
          0
        );
        const totalHoursWorked = parseFloat((totalMinutes / 60).toFixed(2));

        setStaffAttendance(prev => prev.map(a =>
          a.id === todayAttendance.id
            ? {
              ...a,
              sessions: updatedSessions,
              checkOutTime: logoutTime,
              totalHoursWorked,
            }
            : a
        ));

        // Removed notification to prevent spam
      }
    }
  };

  // New: Get today's attendance
  const getTodayAttendance = (): StaffAttendance[] => {
    const today = new Date().toISOString().split('T')[0];
    return staffAttendance.filter(a => a.date.startsWith(today));
  };

  // Bed Management Actions
  const addBedCategory = (bedCategoryData: Omit<BedCategory, 'id' | 'dateCreated' | 'lastUpdated' | 'availableBeds'>): BedCategory => {
    const availableBeds = bedCategoryData.totalBeds - bedCategoryData.occupiedBeds;

    const newBedCategory: BedCategory = {
      ...bedCategoryData,
      id: generateBedCategoryId(),
      dateCreated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      availableBeds,
    };

    setBedCategories(prev => [...prev, newBedCategory]);

    // Add notification
    addNotification({
      type: 'info',
      category: 'admin',
      module: 'Beds',
      icon: 'Bed',
      title: 'New Bed Category Created',
      description: `Bed Category ${newBedCategory.categoryName} (${newBedCategory.id}) has been created`,
    });

    // Add activity log
    addActivityLog({
      action: `New bed category created: ${newBedCategory.categoryName}`,
      module: 'System',
      user: 'Super Admin',
      icon: 'Bed',
    });

    // Persist to backend
    const user = getCurrentUser();
    const persistBed = async () => {
      try {
        const response = await fetch('/api/rooms.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_name: bedCategoryData.categoryName,
            price_per_day: bedCategoryData.pricePerDay,
            total_beds: bedCategoryData.totalBeds,
            occupied_beds: bedCategoryData.occupiedBeds,
            description: bedCategoryData.description,
            performerId: user?.email || 'System'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Update optimistic entry with real ID and DB ID
          setBedCategories(prev => prev.map(b =>
            b.id === newBedCategory.id ? { ...b, id: result.category_unique_id, dbId: result.id } : b
          ));
          toast.success('Bed category saved to database');
        } else {
          const errorData = await response.json();
          console.error('Error persisting bed category:', errorData.error);
          toast.error(`Database Error: ${errorData.error || 'Failed to save'}`);
          // Optional: Remove the optimistic entry or mark it as failed
          setBedCategories(prev => prev.filter(b => b.id !== newBedCategory.id));
        }
      } catch (error) {
        console.error('Error persisting bed category:', error);
      }
    };
    persistBed();

    return newBedCategory;
  };

  const updateBedCategory = (id: string, updates: Partial<BedCategory>) => {
    setBedCategories(prev => prev.map(b => {
      if (b.id === id) {
        const updated = { ...b, ...updates };

        // Recalculate available beds if total or occupied changed
        if (updates.totalBeds !== undefined || updates.occupiedBeds !== undefined) {
          updated.availableBeds = updated.totalBeds - updated.occupiedBeds;
        }

        updated.lastUpdated = new Date().toISOString();

        // Add activity log
        addActivityLog({
          action: `Bed category updated: ${updated.categoryName}`,
          module: 'System',
          user: 'Super Admin',
          icon: 'Bed',
        });

        return updated;
      }
      return b;
    }));

    // Persist to backend
    const bedToUpdate = bedCategories.find(b => b.id === id);
    if (bedToUpdate) {
      const user = getCurrentUser();
      const persistUpdate = async () => {
        try {
          await fetch('/api/rooms.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dbId: bedToUpdate.dbId,
              category_name: updates.categoryName,
              price_per_day: updates.pricePerDay,
              total_beds: updates.totalBeds,
              occupied_beds: updates.occupiedBeds,
              description: updates.description,
              performerId: user?.email || 'System'
            }),
          });
        } catch (error) {
          console.error('Error updating bed category:', error);
        }
      };
      persistUpdate();
    }
  };

  const deleteBedCategory = (id: string) => {
    const bedCategory = bedCategories.find(b => b.id === id);
    if (bedCategory) {
      // Guard: if dbId is not set, we can't delete from the database
      if (!bedCategory.dbId) {
        toast.error('Cannot delete: item not yet saved to database. Please try again in a moment.');
        return;
      }

      // Optimistic update
      setBedCategories(prev => prev.filter(b => b.id !== id));

      // Persist to backend
      const user = getCurrentUser();
      const persistDelete = async () => {
        try {
          const response = await fetch('/api/rooms.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dbId: bedCategory.dbId,
              performerId: user?.email || 'System'
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error deleting bed category:', errorData.error);
            toast.error('Failed to delete from database');
            // Rollback: restore the entry
            setBedCategories(prev => [...prev, bedCategory]);
          }
        } catch (error) {
          console.error('Error deleting bed category:', error);
          toast.error('Network error. Restoring entry.');
          // Rollback: restore the entry
          setBedCategories(prev => [...prev, bedCategory]);
        }
      };
      persistDelete();

      addActivityLog({
        action: `Bed category removed: ${bedCategory.categoryName}`,
        module: 'System',
        user: 'Super Admin',
        icon: 'Bed',
      });
    }
  };


  // Settings Actions
  const updateSettings = async (newSettings: Partial<HospitalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    // Identify which category was updated and persist to backend
    const user = getCurrentUser();
    const categories: (keyof HospitalSettings)[] = ['general', 'profile', 'billing', 'notifications', 'security', 'preferences'];

    for (const key of categories) {
      if (newSettings[key]) {
        try {
          await fetch('/api/settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              value: newSettings[key],
              performerId: user?.email || 'System'
            }),
          });
        } catch (error) {
          console.error(`Error updating settings category ${key}:`, error);
        }
      }
    }
  };

  const addSubfile = (subfileData: Omit<FamilySubfile, 'id' | 'createdAt'>) => {
    const user = getCurrentUser();

    // Generate incremental subfile ID
    const nextId = subfiles.length > 0 ? Math.max(...subfiles.map(s => s.id)) + 1 : 1;

    const newSubfile: FamilySubfile = {
      ...subfileData,
      id: nextId,
      createdAt: new Date().toISOString()
    };

    setSubfiles(prev => [...prev, newSubfile]);

    const persistSubfile = async () => {
      try {
        const response = await fetch('/api/subfiles.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subfile_file_id: subfileData.fileId,
            subfile_fname: subfileData.firstName,
            subfile_lname: subfileData.lastName,
            subfile_gender: subfileData.gender,
            subfile_maritalstatus: subfileData.maritalStatus,
            subfile_knownallergies: subfileData.allergies,
            subfile_dob: subfileData.dateOfBirth,
            subfile_bloodgroup: subfileData.bloodGroup,
            is_dead: subfileData.isDead ? 1 : 0,
            performerId: user?.email || 'System'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setSubfiles(prev => prev.map(s =>
            s.id === newSubfile.id ? { ...s, id: parseInt(result.id) } : s
          ));
        }
      } catch (error) {
        console.error('Error adding subfile:', error);
      }
    };
    persistSubfile();
  };

  const updateSubfile = (id: number, updates: Partial<FamilySubfile>) => {
    const user = getCurrentUser();
    setSubfiles(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

    const persistUpdate = async () => {
      try {
        await fetch('/api/subfiles.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subfile_id: id,
            subfile_fname: updates.firstName,
            subfile_lname: updates.lastName,
            subfile_gender: updates.gender,
            subfile_maritalstatus: updates.maritalStatus,
            subfile_knownallergies: updates.allergies,
            subfile_dob: updates.dateOfBirth,
            subfile_bloodgroup: updates.bloodGroup,
            is_dead: updates.isDead !== undefined ? (updates.isDead ? 1 : 0) : undefined,
            performerId: user?.email || 'System'
          }),
        });
      } catch (error) {
        console.error('Error updating subfile:', error);
      }
    };
    persistUpdate();
  };

  const deleteSubfile = (id: number) => {
    const user = getCurrentUser();
    setSubfiles(prev => prev.filter(s => s.id !== id));

    const persistDelete = async () => {
      try {
        await fetch('/api/subfiles.php', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subfile_id: id,
            performerId: user?.email || 'System'
          }),
        });
      } catch (error) {
        console.error('Error deleting subfile:', error);
      }
    };
    persistDelete();
  };

  return (
    <EMRStoreContext.Provider
      value={{
        patients,
        appointments,
        invoices,
        notifications,
        activityLogs,
        doctors,
        staff,
        departments,
        staffAttendance,
        bedCategories,
        settings,
        roles,
        subfiles,
        addPatient,
        updatePatient,
        deletePatient,
        markPatientAsDeceased,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addInvoice,
        updateInvoice,
        addNotification,
        markNotificationAsRead,
        clearAllNotifications,
        deleteNotification,
        addActivityLog,
        addStaff,
        updateStaff,
        deleteStaff,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addStaffAttendance,
        updateStaffAttendance,
        deleteStaffAttendance,
        recordStaffLogin,
        recordStaffLogout,
        getTodayAttendance,
        addBedCategory,
        updateBedCategory,
        deleteBedCategory,
        updateSettings,
        addSubfile,
        updateSubfile,
        deleteSubfile,
        refreshData: fetchData,
        cashierPIN,
        setCashierPIN,
      }}
    >
      {children}
    </EMRStoreContext.Provider>
  );
}

export function useEMRStore() {
  const context = useContext(EMRStoreContext);
  if (!context) {
    throw new Error('useEMRStore must be used within EMRStoreProvider');
  }
  return context;
}