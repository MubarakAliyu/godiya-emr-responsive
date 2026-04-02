/**
 * Medical Store - Zustand Store for Medical Records Management
 * Handles vitals, drug charts, lab results, and medical history
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { addAuditLog } from './audit-store';

export interface VitalSigns {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  bloodPressure: string; // e.g., "120/80"
  temperature: string; // e.g., "36.5" (°C)
  pulse: string; // e.g., "72" (bpm)
  respiratoryRate: string; // e.g., "18"
  oxygenSaturation: string; // e.g., "98" (%)
  weight: string; // e.g., "65" (kg)
  height: string; // e.g., "165" (cm)
  bmi?: string;
  recordedBy: string;
  recordedByRole: string;
  notes?: string;
}

export interface DrugAdministration {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  drugName: string;
  dosage: string;
  route: string; // Oral, IV, IM, etc.
  frequency: string; // TID, BID, OD, PRN, etc.
  prescribedBy: string;
  administeredBy: string;
  administeredByRole: string;
  status: 'Administered' | 'Missed' | 'Refused' | 'Pending';
  notes?: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  testType: string;
  requestDate: string;
  resultDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  results?: Record<string, any>;
  requestedBy: string;
  performedBy?: string;
  notes?: string;
}

interface MedicalState {
  vitals: VitalSigns[];
  drugAdministrations: DrugAdministration[];
  labResults: LabResult[];

  // Vitals Actions
  addVitals: (vitals: VitalSigns) => void;
  updateVitals: (id: string, vitals: Partial<VitalSigns>) => void;
  getVitalsByPatient: (patientId: string) => VitalSigns[];
  deleteVitals: (id: string) => void;

  // Drug Administration Actions
  addDrugAdministration: (drug: DrugAdministration) => void;
  updateDrugAdministration: (id: string, drug: Partial<DrugAdministration>) => void;
  getDrugAdministrationsByPatient: (patientId: string) => DrugAdministration[];
  deleteDrugAdministration: (id: string) => void;

  // Lab Results Actions
  addLabResult: (labResult: LabResult) => void;
  updateLabResult: (id: string, labResult: Partial<LabResult>) => void;
  getLabResultsByPatient: (patientId: string) => LabResult[];
  deleteLabResult: (id: string) => void;
}

export const useMedicalStore = create<MedicalState>((set, get) => ({
  vitals: [],
  drugAdministrations: [],
  labResults: [],

  // Vitals Actions
  addVitals: (vitals) => {
    set((state) => ({
      vitals: [vitals, ...state.vitals],
    }));

    toast.success('Vitals Saved', {
      description: `Vitals recorded for ${vitals.patientName} at ${vitals.time}`,
    });

    addAuditLog({
      action: 'Vitals Saved',
      module: 'Vitals',
      patientId: vitals.patientId,
      patientName: vitals.patientName,
      metadata: {
        bp: vitals.bloodPressure,
        temp: vitals.temperature,
        pulse: vitals.pulse,
        recordedBy: vitals.recordedBy,
      },
    });
  },

  updateVitals: (id, updatedVitals) => {
    set((state) => ({
      vitals: state.vitals.map((v) => (v.id === id ? { ...v, ...updatedVitals } : v)),
    }));

    toast.success('Vitals Updated', {
      description: 'Vital signs have been updated successfully',
    });

    addAuditLog({
      action: 'Vitals Updated',
      module: 'Vitals',
      patientId: updatedVitals.patientId || '',
      metadata: { vitalId: id },
    });
  },

  getVitalsByPatient: (patientId) => {
    return get().vitals.filter((v) => v.patientId === patientId);
  },

  deleteVitals: (id) => {
    set((state) => ({
      vitals: state.vitals.filter((v) => v.id !== id),
    }));
  },

  // Drug Administration Actions
  addDrugAdministration: (drug) => {
    set((state) => ({
      drugAdministrations: [drug, ...state.drugAdministrations],
    }));

    toast.success('Drug Administered', {
      description: `${drug.drugName} administered to ${drug.patientName}`,
    });

    addAuditLog({
      action: 'Prescription Submitted',
      module: 'Pharmacy',
      patientId: drug.patientId,
      patientName: drug.patientName,
      metadata: {
        drugName: drug.drugName,
        dosage: drug.dosage,
        administeredBy: drug.administeredBy,
      },
    });
  },

  updateDrugAdministration: (id, updatedDrug) => {
    set((state) => ({
      drugAdministrations: state.drugAdministrations.map((d) =>
        d.id === id ? { ...d, ...updatedDrug } : d
      ),
    }));
  },

  getDrugAdministrationsByPatient: (patientId) => {
    return get().drugAdministrations.filter((d) => d.patientId === patientId);
  },

  deleteDrugAdministration: (id) => {
    set((state) => ({
      drugAdministrations: state.drugAdministrations.filter((d) => d.id !== id),
    }));
  },

  // Lab Results Actions
  addLabResult: (labResult) => {
    set((state) => ({
      labResults: [labResult, ...state.labResults],
    }));

    toast.success('Lab Test Requested', {
      description: `${labResult.testName} requested for ${labResult.patientName}`,
    });

    addAuditLog({
      action: 'Lab Test Requested',
      module: 'Laboratory',
      patientId: labResult.patientId,
      patientName: labResult.patientName,
      metadata: {
        testName: labResult.testName,
        requestedBy: labResult.requestedBy,
      },
    });
  },

  updateLabResult: (id, updatedLabResult) => {
    set((state) => ({
      labResults: state.labResults.map((l) => (l.id === id ? { ...l, ...updatedLabResult } : l)),
    }));

    if (updatedLabResult.status === 'Completed') {
      toast.success('Lab Result Added', {
        description: 'Lab test results have been recorded',
      });

      addAuditLog({
        action: 'Lab Result Added',
        module: 'Laboratory',
        patientId: updatedLabResult.patientId || '',
        metadata: { labResultId: id },
      });
    }
  },

  getLabResultsByPatient: (patientId) => {
    return get().labResults.filter((l) => l.patientId === patientId);
  },

  deleteLabResult: (id) => {
    set((state) => ({
      labResults: state.labResults.filter((l) => l.id !== id),
    }));
  },
}));
