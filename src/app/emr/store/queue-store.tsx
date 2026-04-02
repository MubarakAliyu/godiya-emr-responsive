/**
 * Queue Store - Zustand Store for Request Queue Management
 * Handles admission requests, surgery scheduling, and other queue-based workflows
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { addAuditLog } from './audit-store';

export type RequestType =
  | 'Admission'
  | 'Surgery'
  | 'Room Assignment'
  | 'Lab Test'
  | 'Pharmacy'
  | 'Consultation';

export type RequestStatus = 'Pending' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rejected';

export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Request {
  id: string;
  requestType: RequestType;
  patientId: string;
  patientName: string;
  patientType: 'IPD' | 'OPD';
  priority: RequestPriority;
  status: RequestStatus;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  completedBy?: string;
  completedAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface AdmissionRequest extends Request {
  requestType: 'Admission';
  diagnosis: string;
  wardPreference?: string;
  bedType?: string;
  estimatedDuration?: string;
}

export interface SurgeryRequest extends Request {
  requestType: 'Surgery';
  surgeryType: string;
  surgeonName: string;
  scheduledDate?: string;
  scheduledTime?: string;
  operationTheatre?: string;
  anesthesiaType?: string;
}

export interface RoomAssignment extends Request {
  requestType: 'Room Assignment';
  roomNumber: string;
  bedNumber: string;
  ward: string;
  assignedBy?: string;
}

interface QueueState {
  requests: Request[];

  // Actions
  addRequest: (request: Request) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus, metadata?: any) => void;
  approveRequest: (requestId: string, approvedBy: string, metadata?: any) => void;
  rejectRequest: (requestId: string, rejectedBy: string, reason: string) => void;
  completeRequest: (requestId: string, completedBy: string, metadata?: any) => void;
  cancelRequest: (requestId: string, cancelledBy: string, reason: string) => void;
  getRequestById: (requestId: string) => Request | undefined;
  getRequestsByType: (requestType: RequestType) => Request[];
  getRequestsByStatus: (status: RequestStatus) => Request[];
  getRequestsByPatient: (patientId: string) => Request[];
  getPendingRequests: () => Request[];
}

export const useQueueStore = create<QueueState>((set, get) => ({
  requests: [],

  addRequest: (request) => {
    set((state) => ({
      requests: [request, ...state.requests],
    }));

    toast.success('Request Created', {
      description: `${request.requestType} request for ${request.patientName}`,
    });

    addAuditLog({
      action: request.requestType === 'Admission' ? 'Admission Approved' : request.requestType === 'Surgery' ? 'Surgery Scheduled' : 'Room Assigned',
      module: request.requestType === 'Admission' ? 'Admission' : request.requestType === 'Surgery' ? 'Surgery' : 'Admission',
      patientId: request.patientId,
      patientName: request.patientName,
      metadata: {
        requestType: request.requestType,
        requestedBy: request.requestedBy,
      },
    });
  },

  updateRequestStatus: (requestId, status, metadata) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, status, ...metadata } : r
      ),
    }));
  },

  approveRequest: (requestId, approvedBy, metadata) => {
    const request = get().getRequestById(requestId);
    if (!request) return;

    get().updateRequestStatus(requestId, 'Approved', {
      approvedBy,
      approvedAt: new Date().toISOString(),
      ...metadata,
    });

    toast.success(`${request.requestType} Approved`, {
      description: `${request.requestType} request for ${request.patientName} has been approved`,
    });

    addAuditLog({
      action: request.requestType === 'Admission' ? 'Admission Approved' : request.requestType === 'Surgery' ? 'Surgery Scheduled' : 'Room Assigned',
      module: request.requestType === 'Admission' ? 'Admission' : request.requestType === 'Surgery' ? 'Surgery' : 'Admission',
      patientId: request.patientId,
      patientName: request.patientName,
      metadata: {
        requestType: request.requestType,
        approvedBy,
      },
    });
  },

  rejectRequest: (requestId, rejectedBy, reason) => {
    const request = get().getRequestById(requestId);
    if (!request) return;

    get().updateRequestStatus(requestId, 'Rejected', {
      rejectedBy,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
    });

    toast.error(`${request.requestType} Rejected`, {
      description: `${request.requestType} request for ${request.patientName} has been rejected`,
    });
  },

  completeRequest: (requestId, completedBy, metadata) => {
    const request = get().getRequestById(requestId);
    if (!request) return;

    get().updateRequestStatus(requestId, 'Completed', {
      completedBy,
      completedAt: new Date().toISOString(),
      ...metadata,
    });

    toast.success(`${request.requestType} Completed`, {
      description: `${request.requestType} for ${request.patientName} has been completed`,
    });

    if (request.requestType === 'Surgery') {
      addAuditLog({
        action: 'Surgery Completed',
        module: 'Surgery',
        patientId: request.patientId,
        patientName: request.patientName,
        metadata: { completedBy },
      });
    }
  },

  cancelRequest: (requestId, cancelledBy, reason) => {
    const request = get().getRequestById(requestId);
    if (!request) return;

    get().updateRequestStatus(requestId, 'Cancelled', {
      cancelledBy,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
    });

    toast.warning(`${request.requestType} Cancelled`, {
      description: `${request.requestType} request for ${request.patientName} has been cancelled`,
    });

    if (request.requestType === 'Admission') {
      addAuditLog({
        action: 'Admission Cancelled',
        module: 'Admission',
        patientId: request.patientId,
        patientName: request.patientName,
        metadata: { cancelledBy, reason },
      });
    } else if (request.requestType === 'Surgery') {
      addAuditLog({
        action: 'Surgery Cancelled',
        module: 'Surgery',
        patientId: request.patientId,
        patientName: request.patientName,
        metadata: { cancelledBy, reason },
      });
    }
  },

  getRequestById: (requestId) => {
    return get().requests.find((r) => r.id === requestId);
  },

  getRequestsByType: (requestType) => {
    return get().requests.filter((r) => r.requestType === requestType);
  },

  getRequestsByStatus: (status) => {
    return get().requests.filter((r) => r.status === status);
  },

  getRequestsByPatient: (patientId) => {
    return get().requests.filter((r) => r.patientId === patientId);
  },

  getPendingRequests: () => {
    return get().requests.filter((r) => r.status === 'Pending');
  },
}));
