/**
 * Pharmacy Store - Zustand Store for Prescription Management
 * Handles prescription state, cashier queue, and dispensing workflow
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { addAuditLog } from './audit-store';

export type PrescriptionStatus = 'Pending' | 'Processing' | 'Paid' | 'Dispensed' | 'Cancelled';

export interface PrescribedDrug {
  drugId: string;
  name: string;
  dosage: string;
  quantity: number;
  duration: string;
  instructions: string;
  price?: number;
}

export interface Prescription {
  id: string;
  prescriptionId: string;
  fileNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: string;
  patientGender: string;
  patientType: 'IPD' | 'OPD';
  prescribedDrugs: PrescribedDrug[];
  prescribedBy: string;
  prescriptionDate: string;
  status: PrescriptionStatus;
  notes?: string;
  totalAmount?: number;
  dispensedBy?: string;
  dispensedAt?: string;
  paidAt?: string;
  paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Insurance';
}

interface PharmacyState {
  prescriptions: Prescription[];
  cashierQueue: Prescription[];
  
  // Actions
  addPrescription: (prescription: Prescription) => void;
  updatePrescriptionStatus: (prescriptionId: string, status: PrescriptionStatus, metadata?: any) => void;
  sendToCashierQueue: (prescriptionId: string) => void;
  markAsPaid: (prescriptionId: string, paymentMethod: string, amount: number) => void;
  dispensePrescription: (prescriptionId: string, dispensedBy: string) => void;
  removePrescription: (prescriptionId: string) => void;
  getPrescriptionById: (prescriptionId: string) => Prescription | undefined;
  getPendingPrescriptions: () => Prescription[];
  getProcessingPrescriptions: () => Prescription[];
  getPaidPrescriptions: () => Prescription[];
  getDispensedPrescriptions: () => Prescription[];
}

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  prescriptions: [],
  cashierQueue: [],

  addPrescription: (prescription) => {
    set((state) => ({
      prescriptions: [...state.prescriptions, prescription],
    }));
    
    toast.success('Prescription Added', {
      description: `${prescription.prescriptionId} for ${prescription.patientName}`,
    });

    addAuditLog({
      action: 'Prescription Created',
      module: 'Pharmacy',
      patientId: prescription.patientId,
      metadata: {
        prescriptionId: prescription.prescriptionId,
        prescribedBy: prescription.prescribedBy,
      },
    });
  },

  updatePrescriptionStatus: (prescriptionId, status, metadata) => {
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.prescriptionId === prescriptionId
          ? { ...p, status, ...metadata }
          : p
      ),
    }));
  },

  sendToCashierQueue: (prescriptionId) => {
    const prescription = get().getPrescriptionById(prescriptionId);
    if (!prescription) return;

    // Update status to Processing
    get().updatePrescriptionStatus(prescriptionId, 'Processing');

    // Add to cashier queue
    set((state) => ({
      cashierQueue: [...state.cashierQueue, { ...prescription, status: 'Processing' }],
    }));

    toast.success('Sent to Cashier', {
      description: `${prescriptionId} is now in the cashier queue for payment processing.`,
    });

    addAuditLog({
      action: 'Prescription Sent to Cashier',
      module: 'Pharmacy',
      patientId: prescription.patientId,
      metadata: {
        prescriptionId: prescription.prescriptionId,
        totalAmount: prescription.totalAmount,
      },
    });
  },

  markAsPaid: (prescriptionId, paymentMethod, amount) => {
    const prescription = get().getPrescriptionById(prescriptionId);
    if (!prescription) return;

    get().updatePrescriptionStatus(prescriptionId, 'Paid', {
      paidAt: new Date().toISOString(),
      paymentMethod,
      totalAmount: amount,
    });

    // Remove from cashier queue
    set((state) => ({
      cashierQueue: state.cashierQueue.filter((p) => p.prescriptionId !== prescriptionId),
    }));

    toast.success('Payment Received', {
      description: `${prescriptionId} - ₦${amount.toLocaleString()} paid via ${paymentMethod}`,
    });

    addAuditLog({
      action: 'Prescription Paid',
      module: 'Pharmacy',
      patientId: prescription.patientId,
      metadata: {
        prescriptionId: prescription.prescriptionId,
        amount,
        paymentMethod,
      },
    });
  },

  dispensePrescription: (prescriptionId, dispensedBy) => {
    const prescription = get().getPrescriptionById(prescriptionId);
    if (!prescription) return;

    get().updatePrescriptionStatus(prescriptionId, 'Dispensed', {
      dispensedBy,
      dispensedAt: new Date().toISOString(),
    });

    toast.success('Prescription Dispensed', {
      description: `${prescriptionId} for ${prescription.patientName} has been dispensed.`,
    });

    addAuditLog({
      action: 'Prescription Dispensed',
      module: 'Pharmacy',
      patientId: prescription.patientId,
      metadata: {
        prescriptionId: prescription.prescriptionId,
        dispensedBy,
      },
    });
  },

  removePrescription: (prescriptionId) => {
    set((state) => ({
      prescriptions: state.prescriptions.filter((p) => p.prescriptionId !== prescriptionId),
      cashierQueue: state.cashierQueue.filter((p) => p.prescriptionId !== prescriptionId),
    }));
  },

  getPrescriptionById: (prescriptionId) => {
    return get().prescriptions.find((p) => p.prescriptionId === prescriptionId);
  },

  getPendingPrescriptions: () => {
    return get().prescriptions.filter((p) => p.status === 'Pending');
  },

  getProcessingPrescriptions: () => {
    return get().prescriptions.filter((p) => p.status === 'Processing');
  },

  getPaidPrescriptions: () => {
    return get().prescriptions.filter((p) => p.status === 'Paid');
  },

  getDispensedPrescriptions: () => {
    return get().prescriptions.filter((p) => p.status === 'Dispensed');
  },
}));
