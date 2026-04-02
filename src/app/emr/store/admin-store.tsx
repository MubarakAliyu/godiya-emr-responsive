/**
 * Admin Store - Zustand Store for Administrative Management
 * Handles room/bed management, staff, and other admin functions
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { addAuditLog } from './audit-store';

export type BedStatus = 'Available' | 'Occupied' | 'Reserved' | 'Maintenance' | 'Cleaning';
export type BedCategory = 'General' | 'Private' | 'ICU' | 'NICU' | 'Isolation';

export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  floor: string;
  category: BedCategory;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  assignedDate?: string;
  assignedBy?: string;
  rate: number; // Daily rate
  notes?: string;
}

export interface Ward {
  id: string;
  name: string;
  floor: string;
  department: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  category: BedCategory;
}

interface AdminState {
  beds: Bed[];
  wards: Ward[];

  // Bed Actions
  addBed: (bed: Bed) => void;
  updateBed: (bedId: string, bed: Partial<Bed>) => void;
  assignBed: (bedId: string, patientId: string, patientName: string, assignedBy: string) => void;
  releaseBed: (bedId: string, releasedBy: string) => void;
  changeBedStatus: (bedId: string, status: BedStatus) => void;
  getBedById: (bedId: string) => Bed | undefined;
  getAvailableBeds: () => Bed[];
  getOccupiedBeds: () => Bed[];
  getBedsByWard: (ward: string) => Bed[];
  getBedsByCategory: (category: BedCategory) => Bed[];

  // Ward Actions
  addWard: (ward: Ward) => void;
  updateWard: (wardId: string, ward: Partial<Ward>) => void;
  getWardById: (wardId: string) => Ward | undefined;
  updateWardStats: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  beds: [],
  wards: [],

  // Bed Actions
  addBed: (bed) => {
    set((state) => ({
      beds: [...state.beds, bed],
    }));

    toast.success('Bed Added', {
      description: `Bed ${bed.bedNumber} in ${bed.ward} has been added`,
    });

    get().updateWardStats();
  },

  updateBed: (bedId, updatedBed) => {
    set((state) => ({
      beds: state.beds.map((b) => (b.id === bedId ? { ...b, ...updatedBed } : b)),
    }));

    get().updateWardStats();
  },

  assignBed: (bedId, patientId, patientName, assignedBy) => {
    const bed = get().getBedById(bedId);
    if (!bed) return;

    if (bed.status === 'Occupied') {
      toast.error('Bed Already Occupied', {
        description: `Bed ${bed.bedNumber} is already occupied`,
      });
      return;
    }

    get().updateBed(bedId, {
      status: 'Occupied',
      patientId,
      patientName,
      assignedDate: new Date().toISOString(),
      assignedBy,
    });

    toast.success('Room Assigned', {
      description: `Bed ${bed.bedNumber} in ${bed.ward} assigned to ${patientName}`,
    });

    addAuditLog({
      action: 'Room Assigned',
      module: 'Admission',
      patientId,
      patientName,
      metadata: {
        bedNumber: bed.bedNumber,
        ward: bed.ward,
        assignedBy,
      },
    });

    get().updateWardStats();
  },

  releaseBed: (bedId, releasedBy) => {
    const bed = get().getBedById(bedId);
    if (!bed) return;

    const previousPatientName = bed.patientName;
    const previousPatientId = bed.patientId;

    get().updateBed(bedId, {
      status: 'Available',
      patientId: undefined,
      patientName: undefined,
      assignedDate: undefined,
      assignedBy: undefined,
    });

    toast.success('Bed Released', {
      description: `Bed ${bed.bedNumber} in ${bed.ward} is now available`,
    });

    if (previousPatientId && previousPatientName) {
      addAuditLog({
        action: 'Room Unassigned',
        module: 'Admission',
        patientId: previousPatientId,
        patientName: previousPatientName,
        metadata: {
          bedNumber: bed.bedNumber,
          ward: bed.ward,
          releasedBy,
        },
      });
    }

    get().updateWardStats();
  },

  changeBedStatus: (bedId, status) => {
    const bed = get().getBedById(bedId);
    if (!bed) return;

    get().updateBed(bedId, { status });

    toast.info('Bed Status Updated', {
      description: `Bed ${bed.bedNumber} status changed to ${status}`,
    });

    get().updateWardStats();
  },

  getBedById: (bedId) => {
    return get().beds.find((b) => b.id === bedId);
  },

  getAvailableBeds: () => {
    return get().beds.filter((b) => b.status === 'Available');
  },

  getOccupiedBeds: () => {
    return get().beds.filter((b) => b.status === 'Occupied');
  },

  getBedsByWard: (ward) => {
    return get().beds.filter((b) => b.ward === ward);
  },

  getBedsByCategory: (category) => {
    return get().beds.filter((b) => b.category === category);
  },

  // Ward Actions
  addWard: (ward) => {
    set((state) => ({
      wards: [...state.wards, ward],
    }));

    toast.success('Ward Added', {
      description: `Ward ${ward.name} has been added`,
    });
  },

  updateWard: (wardId, updatedWard) => {
    set((state) => ({
      wards: state.wards.map((w) => (w.id === wardId ? { ...w, ...updatedWard } : w)),
    }));
  },

  getWardById: (wardId) => {
    return get().wards.find((w) => w.id === wardId);
  },

  updateWardStats: () => {
    const wards = get().wards;
    const beds = get().beds;

    const updatedWards = wards.map((ward) => {
      const wardBeds = beds.filter((b) => b.ward === ward.name);
      const occupiedBeds = wardBeds.filter((b) => b.status === 'Occupied').length;
      const availableBeds = wardBeds.filter((b) => b.status === 'Available').length;

      return {
        ...ward,
        totalBeds: wardBeds.length,
        occupiedBeds,
        availableBeds,
      };
    });

    set({ wards: updatedWards });
  },
}));
