/**
 * Audit Log Store - Zustand Store for Audit Trail Management
 * Tracks all critical actions across the system with user, timestamp, and metadata
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuditActionType =
  | 'Patient Created'
  | 'Patient Updated'
  | 'Patient Deleted'
  | 'Admission Approved'
  | 'Admission Cancelled'
  | 'Room Assigned'
  | 'Room Unassigned'
  | 'Surgery Scheduled'
  | 'Surgery Completed'
  | 'Surgery Cancelled'
  | 'Vitals Saved'
  | 'Vitals Updated'
  | 'Prescription Created'
  | 'Prescription Sent to Cashier'
  | 'Prescription Paid'
  | 'Prescription Dispensed'
  | 'Prescription Submitted'
  | 'Lab Test Requested'
  | 'Lab Result Added'
  | 'Appointment Created'
  | 'Appointment Updated'
  | 'Appointment Cancelled'
  | 'Invoice Created'
  | 'Payment Received'
  | 'User Login'
  | 'User Logout'
  | 'Settings Updated'
  | 'Staff Created'
  | 'Staff Updated'
  | 'Department Created'
  | 'Department Updated';

export type AuditModule =
  | 'Patients'
  | 'Appointments'
  | 'Billing'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Admission'
  | 'Surgery'
  | 'Vitals'
  | 'Staff'
  | 'Departments'
  | 'System'
  | 'Authentication';

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Doctor'
  | 'Nurse'
  | 'Pharmacist'
  | 'Cashier'
  | 'Receptionist'
  | 'Lab Technician';

export interface AuditLog {
  id: string;
  action: AuditActionType;
  module: AuditModule;
  userRole: UserRole;
  userName: string;
  userId: string;
  timestamp: string;
  patientId?: string;
  patientName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditState {
  logs: AuditLog[];
  currentUser: {
    id: string;
    name: string;
    role: UserRole;
  } | null;

  // Actions
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp' | 'userRole' | 'userName' | 'userId'>) => void;
  setCurrentUser: (user: { id: string; name: string; role: UserRole }) => void;
  getLogsByModule: (module: AuditModule) => AuditLog[];
  getLogsByPatient: (patientId: string) => AuditLog[];
  getLogsByUser: (userId: string) => AuditLog[];
  getLogsByDateRange: (startDate: string, endDate: string) => AuditLog[];
  clearLogs: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      logs: [],
      currentUser: {
        id: 'user-001',
        name: 'Dr. Muhammad Bello',
        role: 'Doctor',
      }, // Default user for demo

      addLog: (logData) => {
        const currentUser = get().currentUser;
        if (!currentUser) {
          console.warn('No current user set for audit log');
          return;
        }

        const newLog: AuditLog = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          userRole: currentUser.role,
          userName: currentUser.name,
          userId: currentUser.id,
          ...logData,
        };

        set((state) => ({
          logs: [newLog, ...state.logs], // Most recent first
        }));
      },

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      getLogsByModule: (module) => {
        return get().logs.filter((log) => log.module === module);
      },

      getLogsByPatient: (patientId) => {
        return get().logs.filter((log) => log.patientId === patientId);
      },

      getLogsByUser: (userId) => {
        return get().logs.filter((log) => log.userId === userId);
      },

      getLogsByDateRange: (startDate, endDate) => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return get().logs.filter((log) => {
          const logTime = new Date(log.timestamp).getTime();
          return logTime >= start && logTime <= end;
        });
      },

      clearLogs: () => {
        set({ logs: [] });
      },
    }),
    {
      name: 'audit-log-storage',
      partialize: (state) => ({ logs: state.logs.slice(0, 1000) }), // Keep last 1000 logs in storage
    }
  )
);

// Helper function to add audit logs (can be imported anywhere)
export const addAuditLog = (
  logData: Omit<AuditLog, 'id' | 'timestamp' | 'userRole' | 'userName' | 'userId'>
) => {
  useAuditStore.getState().addLog(logData);
};
