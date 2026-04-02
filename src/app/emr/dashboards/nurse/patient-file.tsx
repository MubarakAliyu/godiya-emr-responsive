import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, User, Calendar, Phone, MapPin, Activity,
  Stethoscope, Pill, FlaskConical, DollarSign, FileText,
  Heart, TrendingUp, Users, AlertTriangle, Edit3, Save,
  Droplets, Clock, CheckCircle2, Eye, ClipboardList, Bed,
  TestTube, Syringe, Scissors, UserPlus, Lock, X, Info,
  Trash2, Plus, MessageSquare, ListTodo, Skull, UserMinus, PlusCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { format } from 'date-fns';
import { getCurrentUser } from '@/app/emr/utils/auth';
import type { Appointment, Invoice, FamilySubfile, Patient } from '../../store/types';

export function NursePatientFilePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patients, subfiles, appointments, invoices } = useEMRStore();
  const currentUser = getCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isDoctor = currentUser?.role?.toLowerCase() === 'doctor';
  const roleBasePath = isDoctor ? '/emr/doctor' : '/emr/nurse';

  // Determine if we're viewing a subfile (case-insensitive check)
  const isSubfile = patientId?.toLowerCase().startsWith('sf-');
  const subfileIdNum = isSubfile ? parseInt(patientId!.toLowerCase().replace('sf-', '')) : null;

  // Find patient or subfile
  const rawPatient = patients.find((p: Patient) => p.id === patientId);
  const rawSubfile = isSubfile ? subfiles.find((s: FamilySubfile) => s.id === subfileIdNum) : null;

  // Normalize patient object for UI
  const patient = useMemo(() => {
    if (isSubfile && rawSubfile) {
      return {
        id: patientId, // Keep original SF- format
        fullName: `${rawSubfile.firstName} ${rawSubfile.lastName}`,
        gender: rawSubfile.gender,
        dateOfBirth: rawSubfile.dateOfBirth || '',
        age: (() => {
          if (!rawSubfile.dateOfBirth) return 0;
          const dob = new Date(rawSubfile.dateOfBirth);
          if (isNaN(dob.getTime())) return 0;
          return new Date().getFullYear() - dob.getFullYear();
        })(),
        phoneNumber: 'N/A',
        address: 'Family Member',
        fileType: 'Individual' as any,
        patientType: 'Outpatient' as any,
        status: 'Active' as any,
        isDead: rawSubfile.isDead,
        dateRegistered: rawSubfile.createdAt,
        parentFileId: rawSubfile.fileId,
        isNHIS: false,
        nextOfKin: 'Parent File',
        emergencyContactName: 'Parent File',
        emergencyContactPhone: 'N/A'
      } as any;
    }
    return rawPatient;
  }, [isSubfile, rawSubfile, rawPatient, patientId]);

  // Clinical Data States
  const [activeAdmission, setActiveAdmission] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [drugChart, setDrugChart] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [findings, setFindings] = useState<{ prescriptions: any[], tests: any[] }>({ prescriptions: [], tests: [] });
  const [operations, setOperations] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [consultation, setConsultation] = useState<any>(null);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [patientLabTests, setPatientLabTests] = useState<any[]>([]);
  const [admissionCharges, setAdmissionCharges] = useState<any[]>([]);
  const [vitalsData, setVitalsData] = useState({
    bp: 'N/A',
    temp: 'N/A',
    pulse: 'N/A',
    weight: 'N/A',
    height: 'N/A',
    oxygenSat: 'N/A',
    respRate: 'N/A',
    bloodSugar: 'N/A',
  });
  const [loadingClinical, setLoadingClinical] = useState(false);

  // UI Selection States
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [editingDrug, setEditingDrug] = useState<any>(null);
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [showAddDoctorNoteModal, setShowAddDoctorNoteModal] = useState(false);
  const [editingDoctorNote, setEditingDoctorNote] = useState<any>(null);

  // Discharge & Death States
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showDeathModal, setShowDeathModal] = useState(false);
  const [deathForm, setDeathForm] = useState({ cause: '', remarks: '' });
  const [showAddChargeModal, setShowAddChargeModal] = useState(false);
  const [findingForm, setFindingForm] = useState<{ type: 'rx' | 'test', itemId: any } | null>(null);
  const [viewingLabResult, setViewingLabResult] = useState<any>(null);
  const [labResultData, setLabResultData] = useState<any>(null);
  const [isLoadingLabResult, setIsLoadingLabResult] = useState(false);

  // Treatment Modal States
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    finding: '',
    prescriptions: [] as any[],
    labTests: [] as string[]
  });
  const [newPrescribing, setNewPrescribing] = useState({
    drugName: '',
    dosage: '',
    frequency: 'Twice daily',
    duration: '',
    note: ''
  });
  const [newTestRequest, setNewTestRequest] = useState('');

  const handleViewLabResult = async (test: any) => {
    setViewingLabResult(test);
    setIsLoadingLabResult(true);
    try {
      const res = await fetch(`/api/laboratory.php?action=get_test_result&lab_invoice_id=${test.id}`, { credentials: 'include' });
      const data = await res.json();
      if (!data || data.error) {
        toast.error('Error', { description: data?.error || 'Failed to fetch results' });
        setViewingLabResult(null);
      } else {
        setLabResultData(data);
      }
    } catch (e) {
      toast.error('Error', { description: 'Connection failed' });
      setViewingLabResult(null);
    } finally {
      setIsLoadingLabResult(false);
    }
  };

  // Clinical Data Fetching
  const fetchClinicalData = async () => {
    if (!patientId) return;
    setLoadingClinical(true);
    try {
      const safeFetch = async (url: string) => {
        const r = await fetch(url, { credentials: 'include' });
        const t = await r.text();
        try { return JSON.parse(t); } catch (e) {
          console.error(`Malformed JSON from ${url}:`, t.substring(0, 200));
          return null;
        }
      };

      // ── STEP 1: Check for active IPD admission ──────────────────────
      const admRes = await fetch(`/api/nurse_requests.php?type=ipd_patients`, { credentials: 'include' });
      if (admRes.ok) {
        const adms = await admRes.json();
        const active = adms.find((a: any) => a.admission_patient?.toLowerCase() === patientId.toLowerCase());
        if (active) {
          setActiveAdmission(active);
          const [notesRes, drugRes, timeRes, findRes, medRes, opsRes, vitalsRes, consRes, labsRes, chargesRes] = await Promise.all([
            safeFetch(`/api/medical_records.php?action=nurse_notes&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=drug_chart&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=timeline&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=findings&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=medications&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=operations&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=get_vitals&patient_id=${patientId}`),
            safeFetch(`/api/medical_records.php?action=consultation_details&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=all_patient_lab_tests&patient_id=${patientId}&admission_id=${active.admission_id}`),
            safeFetch(`/api/medical_records.php?action=get_admission_charges&admission_id=${active.admission_id}`),
          ]);
          setNotes(Array.isArray(notesRes) ? notesRes : []);
          setDrugChart(Array.isArray(drugRes) ? drugRes : []);
          setTimeline(Array.isArray(timeRes) ? timeRes : []);
          setFindings(findRes?.prescriptions ? findRes : { prescriptions: [], tests: [] });
          setOperations(Array.isArray(opsRes) ? opsRes : []);
          setMedications(Array.isArray(medRes) ? medRes : []);
          if (consRes && !consRes.error) {
            setConsultation({
              ...consRes.consultation,
              prescriptions: Array.isArray(consRes.prescriptions) ? consRes.prescriptions : [],
              labTests: Array.isArray(consRes.labTests) ? consRes.labTests : [],
            });
          }
          setPatientLabTests(Array.isArray(labsRes) ? labsRes : []);
          setAdmissionCharges(Array.isArray(chargesRes) ? chargesRes : []);
          if (Array.isArray(vitalsRes) && vitalsRes.length > 0) {
            setVitalsHistory(vitalsRes);
            const latest = vitalsRes[0];
            setVitalsData({
              bp: latest.vital_bloodpressure || 'N/A',
              temp: latest.vital_temperature || 'N/A',
              pulse: latest.vital_heartrate || 'N/A',
              weight: latest.vital_weight || 'N/A',
              height: latest.vital_height || 'N/A',
              oxygenSat: latest.vital_oxygen || 'N/A',
              respRate: latest.vital_respiratory || 'N/A',
              bloodSugar: latest.vital_rbs || 'N/A',
            });
          } else {
            setVitalsHistory([]);
          }
          return; // IPD data loaded — done
        }
      }

      // ── STEP 2: No active IPD admission → OPD fallback ─────────────
      const [vitalsRes, labsRes, consRes] = await Promise.all([
        safeFetch(`/api/medical_records.php?action=get_vitals&patient_id=${patientId}`),
        safeFetch(`/api/medical_records.php?action=all_patient_lab_tests&patient_id=${patientId}`),
        safeFetch(`/api/medical_records.php?action=consultation_details&patient_id=${patientId}`)
      ]);
      if (Array.isArray(vitalsRes) && vitalsRes.length > 0) {
        setVitalsHistory(vitalsRes);
        const latest = vitalsRes[0];
        setVitalsData({
          bp: latest.vital_bloodpressure || 'N/A',
          temp: latest.vital_temperature || 'N/A',
          pulse: latest.vital_heartrate || 'N/A',
          weight: latest.vital_weight || 'N/A',
          height: latest.vital_height || 'N/A',
          oxygenSat: latest.vital_oxygen || 'N/A',
          respRate: latest.vital_respiratory || 'N/A',
          bloodSugar: latest.vital_rbs || 'N/A',
        });
      }
      setPatientLabTests(Array.isArray(labsRes) ? labsRes : []);
      if (consRes && !consRes.error) {
        setConsultation({
          ...consRes.consultation,
          prescriptions: Array.isArray(consRes.prescriptions) ? consRes.prescriptions : [],
          labTests: Array.isArray(consRes.labTests) ? consRes.labTests : [],
        });
        setFindings({
          prescriptions: Array.isArray(consRes.prescriptions) ? consRes.prescriptions : [],
          tests: Array.isArray(consRes.labTests) ? consRes.labTests : [],
        });
      }
    } catch (e) {
      console.error('Refresh failed', e);
    } finally {
      setLoadingClinical(false);
    }
  };

  const refreshClinical = () => fetchClinicalData();

  useEffect(() => {
    fetchClinicalData();
  }, [patientId]);

  // Handle clinical record addition
  const formatDate = (dateString: string | undefined, formatStr: string = 'MMM dd, yyyy') => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, formatStr);
    } catch {
      return 'N/A';
    }
  };

  const calculateAge = (dob: string | undefined): number | string => {
    if (!dob) return 'N/A';
    try {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return 'N/A';
      return new Date().getFullYear() - birthDate.getFullYear();
    } catch {
      return 'N/A';
    }
  };

  const handleAddNurseNote = async (note: string, comment: string) => {
    if (!activeAdmission) {
      toast.error('No active admission found');
      return;
    }
    try {
      const res = await fetch('/api/medical_records.php?action=add_nurse_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admission_id: activeAdmission.admission_id,
          note,
          comment,
          nurse_id: currentUser?.id || 1
        })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Nursing note added successfully');
        refreshClinical();
      } else {
        toast.error(result?.error || 'Failed to add note');
      }
    } catch (e) { toast.error('Failed to add note. Check connection.'); }
  };

  const handleEditNurseNote = async (noteId: number, note: string, comment: string) => {
    try {
      const res = await fetch('/api/medical_records.php?action=edit_nurse_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, note, comment })
      });
      const result = await res.json();
      if (res.ok) { toast.success('Note updated'); setEditingNote(null); refreshClinical(); }
      else toast.error(result?.error || 'Failed to update note');
    } catch (e) { toast.error('Failed to update note'); }
  };

  const handleDeleteNurseNote = async (noteId: number) => {
    if (!confirm('Delete this nursing note?')) return;
    try {
      const res = await fetch('/api/medical_records.php?action=delete_nurse_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId })
      });
      if (res.ok) { toast.success('Note deleted'); refreshClinical(); }
      else toast.error('Failed to delete note');
    } catch (e) { toast.error('Failed to delete note'); }
  };

  const handleAddDoctorNote = async (note: string) => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=add_doctor_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admission_id: activeAdmission.admission_id, note, doctor_id: currentUser?.id || 1 })
      });
      const result = await res.json();
      if (res.ok) { toast.success('Doctor note added'); setShowAddDoctorNoteModal(false); refreshClinical(); }
      else toast.error(result?.error || 'Failed to add doctor note');
    } catch (e) { toast.error('Failed to add doctor note'); }
  };

  const handleEditDoctorNote = async (noteId: number, note: string) => {
    try {
      const res = await fetch('/api/medical_records.php?action=edit_doctor_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, note })
      });
      if (res.ok) { toast.success('Doctor note updated'); setEditingDoctorNote(null); refreshClinical(); }
      else toast.error('Failed to update doctor note');
    } catch (e) { toast.error('Failed to update doctor note'); }
  };

  const handleDeleteDoctorNote = async (noteId: number) => {
    if (!confirm('Delete this doctor note?')) return;
    try {
      const res = await fetch('/api/medical_records.php?action=delete_doctor_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId })
      });
      if (res.ok) { toast.success('Doctor note deleted'); refreshClinical(); }
      else toast.error('Failed to delete doctor note');
    } catch (e) { toast.error('Failed to delete doctor note'); }
  };

  // --- Treatment Order Handlers (Doctor Only) ---
  const handleAddDrugToTreatment = () => {
    if (!newPrescribing.drugName) return;
    setTreatmentForm(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { ...newPrescribing, id: Date.now() }]
    }));
    setNewPrescribing({ drugName: '', dosage: '', frequency: 'Twice daily', duration: '', note: '' });
  };

  const handleRemoveDrugFromTreatment = (id: number) => {
    setTreatmentForm(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id)
    }));
  };

  const handleAddTestToTreatment = () => {
    if (!newTestRequest) return;
    if (treatmentForm.labTests.includes(newTestRequest)) return toast.error('Test already added');
    setTreatmentForm(prev => ({
      ...prev,
      labTests: [...prev.labTests, newTestRequest]
    }));
    setNewTestRequest('');
  };

  const handleRemoveTestFromTreatment = (test: string) => {
    setTreatmentForm(prev => ({
      ...prev,
      labTests: prev.labTests.filter(t => t !== test)
    }));
  };

  const handleSaveTreatment = async () => {
    if (!activeAdmission || !treatmentForm.finding) {
      toast.error('Clinical finding/diagnosis is required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/medical_records.php?action=add_treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admission_id: activeAdmission.admission_id,
          appointment_id: activeAdmission.admission_appointment,
          patient_id: patientId,
          doctor_id: currentUser?.id,
          finding: treatmentForm.finding,
          prescriptions: treatmentForm.prescriptions,
          lab_tests: treatmentForm.labTests
        })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Clinical record & orders saved');
        setShowTreatmentModal(false);
        setTreatmentForm({ finding: '', prescriptions: [], labTests: [] });
        refreshClinical();
      } else {
        toast.error(result?.error || 'Failed to save treatment record');
      }
    } catch (e) {
      toast.error('Network error saving treatment');
    } finally {
      setIsSaving(false);
    }
  };



  const handleAdministerDrug = async (id: number) => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=administer_drug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nurse_name: 'Staff' }) // Should be from session
      });
      if (res.ok) {
        toast.success('Drug administered');
        refreshClinical();
      }
    } catch (e) { toast.error('Failed to administer drug'); }
  };

  const handleAddDrugEntry = async (data: any) => {
    try {
      const res = await fetch('/api/medical_records.php?action=add_drug_chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, admission_id: activeAdmission.admission_id })
      });
      if (res.ok) {
        toast.success('Drug added to chart');
        refreshClinical();
      }
    } catch (e) { toast.error('Failed to add drug'); }
  };

  const handleUpdateDrugEntry = async (data: any) => {
    try {
      const res = await fetch('/api/medical_records.php?action=update_drug_chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('Record updated');
        refreshClinical();
      }
    } catch (e) { toast.error('Update failed'); }
  };

  const handleDeleteDrugEntry = async (id: number) => {
    if (!confirm('Are you sure you want to delete this drug entry?')) return;
    try {
      const res = await fetch('/api/medical_records.php?action=delete_drug_chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        toast.success('Entry deleted');
        refreshClinical();
      }
    } catch (e) { toast.error('Delete failed'); }
  };

  const handleAddFinding = async (type: 'rx' | 'test', itemId: number, description: string) => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=add_finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          item_id: itemId,
          description,
          appointment_id: activeAdmission.appointment_id
        })
      });
      if (res.ok) {
        toast.success('Finding added');
        refreshClinical();
      }
    } catch (e) { toast.error('Failed to add finding'); }
  };

  const handleAddOperation = async (data: any) => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=add_operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, admission_id: activeAdmission.admission_id })
      });
      if (res.ok) {
        toast.success('Operation recorded');
        refreshClinical();
      }
    } catch (e) { toast.error('Failed to record operation'); }
  };

  const handleSaveVitals = async (data: any) => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=save_vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, admission_id: activeAdmission.admission_id })
      });
      if (res.ok) {
        toast.success('Vitals recorded');
        refreshClinical();
        setShowVitalsModal(false);
      }
    } catch (e) { toast.error('Failed to save vitals'); }
  };

  const handleAddTimelineEntry = async (title: string, description: string) => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=add_timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admission_id: activeAdmission.admission_id,
          title,
          description,
          nurse_id: currentUser?.id || 'GH-US-001'
        })
      });
      if (res.ok) {
        toast.success('Timeline updated');
        refreshClinical();
      }
    } catch (e) { toast.error('Failed to update timeline'); }
  };

  const handleAddAdmissionCharge = async (description: string, total: string) => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=add_admission_charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admission_id: activeAdmission.admission_id,
          patient_id: patientId,
          description,
          total
        })
      });
      if (res.ok) {
        toast.success('Charge added');
        refreshClinical();
      }
    } catch (e) { toast.error('Failed to add charge'); }
  };

  const handleDeleteAdmissionCharge = async (chargeId: number) => {
    if (!confirm('Are you sure you want to delete this charge?')) return;
    try {
      const res = await fetch('/api/medical_records.php?action=delete_admission_charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charge_id: chargeId })
      });
      if (res.ok) {
        toast.success('Charge deleted');
        refreshClinical();
      }
    } catch (e) { toast.error('Failed to delete charge'); }
  };

  const handleDischarge = async () => {
    if (!activeAdmission) return;
    try {
      const res = await fetch('/api/medical_records.php?action=discharge_patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admission_id: activeAdmission.admission_id,
          user_id: currentUser?.id || 1
        })
      });
      if (res.ok) {
        toast.success('Patient discharged successfully');
        setShowDischargeModal(false);
        navigate(currentUser?.role === 'doctor' ? '/emr/doctor/patients/ipd' : '/emr/nurse/patients/ipd');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to discharge patient');
      }
    } catch (e: any) { toast.error(e.message || 'Failed to discharge patient'); }
  };

  const handleRecordDeath = async () => {
    if (!activeAdmission || !patient) return;
    try {
      const res = await fetch('/api/medical_records.php?action=record_death', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admission_id: activeAdmission.admission_id,
          patient_id: patient.id,
          is_subfile: isSubfile ? 1 : 0,
          cause_of_death: deathForm.cause,
          remarks: deathForm.remarks,
          doctor_id: currentUser?.id || 1
        })
      });
      if (res.ok) {
        toast.success('Death recorded and patient discharged');
        setShowDeathModal(false);
        navigate(currentUser?.role === 'doctor' ? '/emr/doctor/patients/ipd' : '/emr/nurse/patients/ipd');
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record death');
      }
    } catch (e: any) { toast.error(e.message || 'Action failed'); }
  };

  // Get patient invoices
  const patientInvoices = patient
    ? invoices.filter((i: Invoice) => i.patientId === patient.id)
    : [];

  // Handle save changes
  const handleSaveChanges = () => {
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      toast.success('Patient Records Updated', {
        description: 'All changes have been saved successfully',
      });
    }, 1000);
  };

  // Get family members
  const getFamilyMembers = () => {
    if (!patient) return null;

    // If it's a subfile, return its parent and siblings
    if (isSubfile && patient.parentFileId) {
      const familyFile = patients.find((p: Patient) => p.id === patient.parentFileId);
      const siblings = subfiles.filter((s: FamilySubfile) => s.fileId === patient.parentFileId && `sf-${s.id}` !== patient.id);
      return { familyFile, siblings };
    }

    // If this is a Family file, get all individual members (subfiles)
    if (patient.fileType === 'Family') {
      return subfiles.filter((s: FamilySubfile) => s.fileId === patient.id);
    }

    // If it's an Individual with a parent file
    if (patient.parentFileId) {
      const familyFile = patients.find((p: Patient) => p.id === patient.parentFileId);
      const siblings = subfiles.filter((s: FamilySubfile) => s.fileId === patient.parentFileId && `sf-${s.id}` !== patient.id);
      return { familyFile, siblings };
    }

    return null;
  };

  // Visibility flags
  const isFamilyParent = patient?.fileType === 'Family' && !isSubfile;
  const hasClinicalData = !!activeAdmission || isSubfile || patient?.patientType === 'Inpatient';

  const familyData = getFamilyMembers();

  if (!patient) {
    return (
      <div className="min-h-screen bg-muted/30 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate('/emr/nurse/patients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patients
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Patient File Not Found</h2>
              <p className="text-muted-foreground">
                The patient file with ID {patientId} could not be found in the system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              const role = currentUser?.role;
              const backPath =
                role === 'Doctor' ? '/emr/doctor/dashboard' :
                  role === 'Nurse' ? '/emr/nurse/patients' :
                    role === 'Receptionist' ? '/emr/reception/patients/inpatient' :
                      (role === 'Super Administrator' || role === 'Super Admin') ? '/emr/dashboard/patients/inpatient' :
                        '/emr/nurse/patients';
              navigate(backPath);
            }}
            className="hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={isFamilyParent}
              onClick={() => {
                const role = currentUser?.role;
                const basePath =
                  role === 'Doctor' ? '/emr/doctor' :
                    role === 'Nurse' ? '/emr/nurse' :
                      role === 'Receptionist' ? '/emr/reception' :
                        (role === 'Super Administrator' || role === 'Super Admin') ? '/emr/dashboard' :
                          '/emr/nurse';
                navigate(`${basePath}/patients/${patientId}/full-file`);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Eye className="w-4 h-4 mr-2" />
              Full Patient File
            </Button>

            {activeAdmission && currentUser?.role?.toLowerCase() === 'nurse' && (
              <Button
                variant="outline"
                className="text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100"
                onClick={() => setShowDischargeModal(true)}
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Discharge
              </Button>
            )}
          </div>
        </div>

        {/* Patient Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{patient.fullName}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      File Number: <span className="font-mono font-semibold">{patient.id}</span>
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{patient.age} years • {patient.gender}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{patient.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{patient.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge
                    variant={patient.status === 'Active' ? 'default' : 'secondary'}
                    className={patient.status === 'Active' ? 'bg-secondary' : ''}
                  >
                    {patient.status}
                  </Badge>
                  {patient.fileType === 'Family' && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 block">
                      <Users className="w-3 h-3 mr-1 inline" />
                      Family File
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold">{formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patient Type</p>
                  <p className="font-semibold">{patient.patientType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration Date</p>
                  <p className="font-semibold">{formatDate(patient.dateRegistered)}</p>
                </div>
              </div>

              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Emergency Contact</p>
                  <p className="font-semibold">{patient.emergencyContactName}</p>
                  <p className="text-xs text-muted-foreground">{patient.emergencyContactPhone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next of Kin</p>
                  <p className="font-semibold">{patient.nextOfKin}</p>
                </div>
                {patient.isNHIS && (
                  <div>
                    <p className="text-muted-foreground">NHIS Provider</p>
                    <p className="font-semibold">{patient.nhisProvider}</p>
                    <p className="text-xs text-muted-foreground">{patient.nhisNumber}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Family Members Section */}
        {familyData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Family Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.fileType === 'Family' && Array.isArray(familyData) && (
                  <div className="space-y-3">
                    {familyData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No family members added yet
                      </p>
                    ) : (
                      familyData.map((member: FamilySubfile) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{member.firstName} {member.lastName}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.gender} • sf-{member.id}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/emr/nurse/patients/sf-${member.id}/file`)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View File
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {patient.parentFileId && typeof familyData === 'object' && !Array.isArray(familyData) && (
                  <div className="space-y-4">
                    {familyData.familyFile && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Parent Family File</h4>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">{familyData.familyFile.fullName}</p>
                              <p className="text-sm text-muted-foreground">Family File • {familyData.familyFile.id}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/emr/nurse/patients/${familyData.familyFile!.id}/file`)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View File
                          </Button>
                        </div>
                      </div>
                    )}

                    {familyData.siblings && familyData.siblings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Siblings</h4>
                        <div className="space-y-2">
                          {familyData.siblings.map((sibling: FamilySubfile) => (
                            <div key={sibling.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{sibling.firstName} {sibling.lastName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {calculateAge(sibling.dateOfBirth)} years, {sibling.gender} • SF-{sibling.id}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/emr/nurse/patients/sf-${sibling.id}/file`)}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View File
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Medical Records Section */}
        {(isFamilyParent || !isFamilyParent) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                {isFamilyParent ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <Info className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h3 className="text-xl font-bold">Administrative File View</h3>
                      <p className="text-muted-foreground mt-2">
                        This is a parent Family File used for administrative grouping.
                        Clinical records (vitals, notes, prescriptions) are stored on the **Individual Member Files** listed above.
                      </p>
                    </div>
                  </div>
                ) : !activeAdmission ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                      <Bed className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h3 className="text-xl font-bold font-heading">No Active Admission</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        This patient is currently not admitted. Medical records (Nurse Notes, Drug Charts, etc.) are only accessible while the patient has an active bed admission.
                      </p>
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`${roleBasePath}/patients`)}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to All Patients
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Tabs defaultValue="vitals" className="w-full">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-primary" />
                          Active Admission Record
                        </h2>
                        {activeAdmission && (
                          <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
                            <Activity className="w-3 h-3" />
                            Actively Admitted: {activeAdmission.ward_name} (Bed #{activeAdmission.admission_bed})
                          </p>
                        )}
                      </div>
                      <VitalsModal
                        isOpen={showVitalsModal}
                        onClose={() => setShowVitalsModal(false)}
                        onSave={handleSaveVitals}
                        initialData={vitalsData}
                      />
                      <TabsList className="inline-flex h-auto flex-wrap gap-2 bg-transparent p-0">
                        <TabsTrigger
                          value="vitals"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Vitals
                        </TabsTrigger>
                        <TabsTrigger
                          value="nurse-notes"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <Stethoscope className="w-4 h-4 mr-2" />
                          Nurse Notes
                        </TabsTrigger>
                        <TabsTrigger
                          value="findings"
                          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <FlaskConical className="w-4 h-4 mr-2" />
                          Findings
                        </TabsTrigger>
                        <TabsTrigger
                          value="prescriptions"
                          className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <Pill className="w-4 h-4 mr-2" />
                          Prescription
                        </TabsTrigger>
                        <TabsTrigger
                          value="lab-tests"
                          className="data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <FlaskConical className="w-4 h-4 mr-2" />
                          Lab Test
                        </TabsTrigger>
                        <TabsTrigger
                          value="drug-chart"
                          className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <Syringe className="w-4 h-4 mr-2" />
                          Drug Chart
                        </TabsTrigger>
                        <TabsTrigger
                          value="operations"
                          className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <Scissors className="w-4 h-4 mr-2" />
                          Operation
                        </TabsTrigger>
                        <TabsTrigger
                          value="billing"
                          className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg px-4 py-2.5 font-medium transition-all hover:bg-muted"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Billing
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Vitals Tab */}
                    <TabsContent value="vitals" className="mt-6 space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Activity className="w-5 h-5 text-primary" />
                          Patient Vital Signs
                        </h3>
                        <Button onClick={() => setShowVitalsModal(true)} size="sm" className="gap-2 bg-primary text-white shadow-lg hover:shadow-primary/20" disabled={isDoctor}>
                          <Plus className="w-4 h-4" /> Record New Vitals
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Vitals Cards */}
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-red-500">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                              <Heart className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Blood Pressure</p>
                              <p className="text-xl font-bold">{vitalsData.bp} <span className="text-xs font-normal text-muted-foreground">mmHg</span></p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-orange-500">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                              <Droplets className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Temperature</p>
                              <p className="text-xl font-bold">{vitalsData.temp} <span className="text-xs font-normal text-muted-foreground">°C</span></p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Pulse Rate</p>
                              <p className="text-xl font-bold">{vitalsData.pulse} <span className="text-xs font-normal text-muted-foreground">bpm</span></p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-indigo-500">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Resp. Rate</p>
                              <p className="text-xl font-bold">{vitalsData.respRate} <span className="text-xs font-normal text-muted-foreground">cpm</span></p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-teal-500">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Oxygen Sat.</p>
                              <p className="text-xl font-bold">{vitalsData.oxygenSat} <span className="text-xs font-normal text-muted-foreground">%</span></p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-emerald-500">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Weight</p>
                              <p className="text-xl font-bold">{vitalsData.weight} <span className="text-xs font-normal text-muted-foreground">kg</span></p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-slate-500">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Height</p>
                              <p className="text-xl font-bold">{vitalsData.height} <span className="text-xs font-normal text-muted-foreground">cm</span></p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="hover:shadow-md transition-all border-l-4 border-l-red-600">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-red-100 text-red-700 rounded-xl">
                              <Droplets className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium uppercase">Blood Sugar</p>
                              <p className="text-xl font-bold">{vitalsData.bloodSugar} <span className="text-xs font-normal text-muted-foreground">mg/dL</span></p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Vitals History Table */}
                      <Card className="border-none shadow-none bg-slate-50/50">
                        <CardHeader className="px-4 pb-2">
                          <CardTitle className="text-md font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" />
                            Vitals Observation History
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4">
                          <div className="border rounded-xl bg-white overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-50">
                                <TableRow>
                                  <TableHead className="w-[180px]">Date/Time</TableHead>
                                  <TableHead>BP</TableHead>
                                  <TableHead>Temp</TableHead>
                                  <TableHead>Pulse</TableHead>
                                  <TableHead>Resp</TableHead>
                                  <TableHead>SpO2</TableHead>
                                  <TableHead>Sugar</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {vitalsHistory.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                                      No historical vitals recorded
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  vitalsHistory.map((v, i) => (
                                    <TableRow key={i} className="hover:bg-slate-50 transition-colors">
                                      <TableCell className="font-medium whitespace-nowrap">
                                        {formatDate(v.date_time, 'MMM dd, HH:mm')}
                                      </TableCell>
                                      <TableCell>{v.vital_bloodpressure}</TableCell>
                                      <TableCell>{v.vital_temperature}°C</TableCell>
                                      <TableCell>{v.vital_heartrate}</TableCell>
                                      <TableCell>{v.vital_respiratory}</TableCell>
                                      <TableCell>{v.vital_oxygen}%</TableCell>
                                      <TableCell>{v.vital_rbs}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Nurse Notes Tab */}
                    <TabsContent value="nurse-notes" className="mt-6 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">Nursing Observations</h3>
                        <Button size="sm" onClick={() => { setEditingNote(null); setShowAddNoteModal(true); }} className="gap-2" disabled={isDoctor}>
                          <ClipboardList className="w-4 h-4" /> New Note
                        </Button>
                      </div>

                      {notes.length === 0 ? (
                        <div className="p-12 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>No nursing notes recorded for this admission</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {notes.map((n) => (
                            <Card key={n.note_id} className="border-l-4 border-l-primary">
                              <CardContent className="p-4">
                                {editingNote?.note_id === n.note_id ? (
                                  <div className="space-y-3">
                                    <Textarea defaultValue={n.note_note} id={`edit-note-${n.note_id}`} rows={3} className="text-sm" />
                                    <Input defaultValue={n.note_comment} id={`edit-comment-${n.note_id}`} placeholder="Comment (optional)" className="text-sm" />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => {
                                        const note = (document.getElementById(`edit-note-${n.note_id}`) as HTMLTextAreaElement)?.value;
                                        const comment = (document.getElementById(`edit-comment-${n.note_id}`) as HTMLInputElement)?.value;
                                        handleEditNurseNote(n.note_id, note, comment);
                                      }}><Save className="w-3 h-3 mr-1" /> Save</Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}><X className="w-3 h-3 mr-1" /> Cancel</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                      <p className="text-sm font-bold text-primary flex items-center gap-2">
                                        <User className="w-3 h-3" />
                                        Nurse {n.nurse_name || 'Staff'}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                                          <Clock className="w-3 h-3" />
                                          {formatDate(n.date_time, 'MMM dd, yyyy • HH:mm')}
                                        </p>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600 hover:bg-blue-50" onClick={() => setEditingNote(n)} disabled={isDoctor}>
                                          <Edit3 className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:bg-red-50" onClick={() => handleDeleteNurseNote(n.note_id)} disabled={isDoctor}>
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{n.note_note}</p>
                                    {n.note_comment && (
                                      <div className="mt-3 p-2 bg-muted/50 rounded-md text-xs border">
                                        <span className="font-bold uppercase text-primary/70">Comment:</span> {n.note_comment}
                                      </div>
                                    )}
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Doctor Notes Section */}
                      <div className="mt-8 pt-6 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-purple-600" />
                            Doctor Notes
                          </h3>
                          {isDoctor && (
                            <Button size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 gap-2"
                              onClick={() => { setEditingDoctorNote(null); setShowAddDoctorNoteModal(true); }}>
                              <Plus className="w-4 h-4" /> Add Doctor Note
                            </Button>
                          )}
                        </div>
                        {timeline.filter((t: any) => t.timeline_title === 'Doctor Note').length === 0 ? (
                          <div className="p-8 border-2 border-dashed border-purple-100 rounded-xl text-center">
                            <Stethoscope className="w-7 h-7 mx-auto mb-2 opacity-20 text-purple-600" />
                            <p className="text-sm text-muted-foreground">No doctor notes recorded</p>
                            {!isDoctor && <p className="text-xs mt-1 text-muted-foreground/60">Only doctors can add notes here</p>}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {timeline.filter((t: any) => t.timeline_title === 'Doctor Note').map((t: any) => (
                              <Card key={t.timeline_id} className="border-l-4 border-l-purple-500">
                                <CardContent className="p-4">
                                  {editingDoctorNote?.timeline_id === t.timeline_id ? (
                                    <div className="space-y-3">
                                      <Textarea defaultValue={t.timeline_description} id={`edit-dnote-${t.timeline_id}`} rows={3} className="text-sm" />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => {
                                          const note = (document.getElementById(`edit-dnote-${t.timeline_id}`) as HTMLTextAreaElement)?.value;
                                          handleEditDoctorNote(t.timeline_id, note);
                                        }}><Save className="w-3 h-3 mr-1" /> Save</Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingDoctorNote(null)}><X className="w-3 h-3 mr-1" /> Cancel</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                        <p className="text-sm font-bold text-purple-700 flex items-center gap-2">
                                          <Stethoscope className="w-3 h-3" />
                                          Dr. {t.nurse_name || 'Unknown'}
                                        </p>
                                        <div className="flex items-center gap-1">
                                          <p className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(t.timeline_date, 'MMM dd, yyyy • HH:mm')}
                                          </p>
                                          {isDoctor && (
                                            <>
                                              <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600 hover:bg-blue-50" onClick={() => setEditingDoctorNote(t)}>
                                                <Edit3 className="w-3 h-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:bg-red-50" onClick={() => handleDeleteDoctorNote(t.timeline_id)}>
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{t.timeline_description}</p>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Prescriptions Tab */}
                    <TabsContent value="prescriptions" className="mt-6 space-y-4">
                      {consultation && consultation.prescriptions && consultation.prescriptions.length > 0 && (
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl mb-6">
                          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-3">
                            <Pill className="w-4 h-4" /> Consultation Prescriptions
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {consultation.prescriptions.map((rx: any, idx: number) => (
                              <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm">
                                <div>
                                  <p className="font-bold text-sm text-blue-900">{rx.drugName}</p>
                                  <p className="text-xs text-muted-foreground">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                                  {rx.note && <p className="text-[10px] text-blue-600 italic mt-1 bg-blue-100/50 px-2 py-0.5 rounded">Note: {rx.note}</p>}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => setFindingForm({ type: 'rx', itemId: rx.row_id })}
                                >
                                  <ClipboardList className="w-4 h-4 mr-1" /> Findings
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Pill className="w-5 h-5 text-blue-600" />
                          Admission Prescriptions
                        </div>
                        {isDoctor && (
                          <Button size="sm" onClick={() => setShowTreatmentModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <PlusCircle className="w-4 h-4" /> New Treatment Record
                          </Button>
                        )}
                      </div>
                      <div className="border rounded-xl overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Drug Name</TableHead>
                              <TableHead>Dosage/Freq</TableHead>
                              <TableHead>Finding/Outcome</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {medications.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                  No specific medications listed for this admission
                                </TableCell>
                              </TableRow>
                            ) : (
                              medications.map((med, idx) => {
                                const finding = findings.prescriptions.find(f => f.finding_prescription_id === med.medication_id);
                                return (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{med.medication_medicine}</TableCell>
                                    <TableCell>{med.medication_dosage}</TableCell>
                                    <TableCell>
                                      {finding ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          {finding.finding_description}
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">Pending finding</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => setFindingForm({ type: 'rx', itemId: med.medication_id })}
                                      >
                                        <MessageSquare className="w-4 h-4 mr-1" />
                                        Add Finding
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Lab Test Tab */}
                    <TabsContent value="lab-tests" className="mt-6 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-5 h-5 text-teal-600" />
                          Lab Investigation History
                        </div>
                        {isDoctor && (
                          <Button size="sm" onClick={() => setShowTreatmentModal(true)} className="bg-teal-600 hover:bg-teal-700 gap-2">
                            <PlusCircle className="w-4 h-4" /> Request Investigation
                          </Button>
                        )}
                      </div>

                      {patientLabTests.length === 0 ? (
                        <div className="p-12 border border-dashed rounded-xl text-center text-muted-foreground">
                          <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>No lab tests found for this patient across all visits</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {patientLabTests.map((test, idx) => (
                            <Card key={idx} className="hover:shadow-md transition-all border-l-4 border-l-teal-500 overflow-hidden">
                              <CardHeader className="py-3 bg-teal-50/30">
                                <CardTitle className="text-xs uppercase tracking-wider text-teal-900 flex justify-between">
                                  Ordered: {formatDate(test.date)}
                                  <Badge variant="outline" className="bg-white">{test.sta || 'pending'}</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 space-y-3">
                                <div>
                                  <p className="font-bold text-teal-900">{test.testName}</p>
                                  <p className="text-[10px] text-muted-foreground italic">Dr. {test.doctor}</p>
                                </div>
                                {test.note && (
                                  <div className="p-2 bg-teal-50/50 rounded text-xs border border-teal-100 text-teal-700 italic">
                                    Inst: {test.note}
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">{test.cat}</span>
                                  {test.sta === 'finished' && (
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="h-7 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                      onClick={() => handleViewLabResult(test)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" /> Results
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Drug Chart Tab */}
                    <TabsContent value="drug-chart" className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Syringe className="w-5 h-5 text-orange-600" />
                          24-Hour Observation Drug Chart
                        </h3>
                        <Button size="sm" onClick={() => setShowAddDrug(true)} className="bg-orange-600 hover:bg-orange-700 gap-2" disabled={isDoctor}>
                          <Plus className="w-4 h-4" /> Add Drug
                        </Button>
                      </div>

                      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                        <Table>
                          <TableHeader className="bg-orange-50/50">
                            <TableRow>
                              <TableHead className="w-32">Date/Time</TableHead>
                              <TableHead>Medicine Name</TableHead>
                              <TableHead>Dosage</TableHead>
                              <TableHead>Route</TableHead>
                              <TableHead className="text-center">Administer</TableHead>
                              <TableHead className="text-right">Manage</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {drugChart.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                  <Droplets className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                  No entries in drug chart for this admission
                                </TableCell>
                              </TableRow>
                            ) : (
                              drugChart.map((d) => (
                                <TableRow key={d.id} className={d.administered ? 'bg-green-50/30' : ''}>
                                  <TableCell className="text-xs">
                                    <div className="font-bold">{formatDate(d.date, 'dd/MM/yy')}</div>
                                    <div className="text-muted-foreground">{d.time}</div>
                                  </TableCell>
                                  <TableCell className="font-semibold">{d.drug_name}</TableCell>
                                  <TableCell>{d.dosage}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">{d.route}</Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {d.administered ? (
                                      <div className="flex flex-col items-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <span className="text-[10px] font-bold text-green-700 mt-0.5 uppercase">
                                          {d.administered_by} @ {formatDate(d.administered_at, 'HH:mm')}
                                        </span>
                                      </div>
                                    ) : (
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        className="h-8 border-orange-200 hover:bg-orange-600 hover:text-white"
                                        onClick={() => handleAdministerDrug(d.id)}
                                        disabled={isDoctor}
                                      >
                                        Mark Admin
                                      </Button>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right py-2">
                                    <div className="flex justify-end gap-1">
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingDrug(d)} disabled={isDoctor}>
                                        <Edit3 className="w-4 h-4" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDrugEntry(d.id)} disabled={isDoctor}>
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {/* Operations Tab */}
                    <TabsContent value="operations" className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Scissors className="w-5 h-5 text-red-600" />
                          Surgical Records (OT)
                        </h3>
                        <Button size="sm" onClick={() => setShowAddOperation(true)} className="bg-red-600 hover:bg-red-700 gap-2" disabled={isDoctor}>
                          <Plus className="w-4 h-4" /> Record Operation
                        </Button>
                      </div>

                      {operations.length === 0 ? (
                        <div className="p-12 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>No surgical records found for this admission</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {operations.map((op) => (
                            <Card key={op.id} className="border-l-4 border-l-red-500 overflow-hidden">
                              <CardContent className="p-0">
                                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between bg-muted/20 gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none uppercase text-[10px]">
                                        {op.operation_category}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">{op.operation_date}</span>
                                    </div>
                                    <h4 className="font-bold text-lg">{op.operation_name}</h4>
                                    <p className="text-sm text-primary font-medium flex items-center gap-2 mt-1">
                                      <User className="w-4 h-4" />
                                      Surgeon: {op.consultant_doctor}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant={op.sta ? 'default' : 'secondary'} className="px-3 py-1">
                                      {op.sta ? 'Completed' : 'Scheduled'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t text-sm">
                                  <div className="space-y-2">
                                    <p className="font-bold text-xs uppercase text-muted-foreground">Team</p>
                                    <div className="flex flex-wrap gap-2">
                                      {op.anesthetist && <Badge variant="outline" className="text-[10px]">Anes: {op.anesthetist}</Badge>}
                                      {op.ot_technician && <Badge variant="outline" className="text-[10px]">Tech: {op.ot_technician}</Badge>}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="font-bold text-xs uppercase text-muted-foreground">Outcome/Result</p>
                                    <p className="text-muted-foreground italic">{op.result || 'No outcome recorded yet'}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Findings Tab (Legacy/Hidden or repurposed) */}
                    <TabsContent value="findings" className="mt-6 space-y-4">
                      <div className="p-12 border border-dashed rounded-xl text-center text-muted-foreground">
                        <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>Clinical findings are now integrated into the **Prescription** and **Lab Test** tabs for better context.</p>
                      </div>
                    </TabsContent>


                    {/* Billing Tab */}
                    <TabsContent value="billing" className="mt-6 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                          Admission Charges & Billing
                        </h3>
                        <Button
                          size="sm"
                          onClick={() => setShowAddChargeModal(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                          disabled={isDoctor}
                        >
                          <Plus className="w-4 h-4" /> Add Charge
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {admissionCharges.map((charge: any) => (
                          <Card key={charge.charge_id} className="border-emerald-100 bg-emerald-50/10 hover:shadow-md transition-all">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                  <DollarSign className="w-4 h-4" />
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                  onClick={() => handleDeleteAdmissionCharge(charge.charge_id)}
                                  disabled={isDoctor}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="font-bold text-emerald-900 line-clamp-2 min-h-[2.5rem]">{charge.charge_description}</p>
                              <div className="flex justify-between items-end mt-4">
                                <p className="text-2xl font-black text-emerald-700">
                                  ₦{parseFloat(charge.charge_total).toLocaleString()}
                                </p>
                                <div className="text-right">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status</p>
                                  <Badge variant="outline" className="bg-white text-[10px] h-5">
                                    {parseFloat(charge.amount_paid) >= parseFloat(charge.charge_total) ? 'Settled' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {admissionCharges.length === 0 ? (
                        <div className="p-12 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-10" />
                          <h4 className="font-bold text-lg text-foreground">No charges recorded</h4>
                          <p className="max-w-xs mx-auto mt-1">This patient has no recorded admission charges for the current stay.</p>
                        </div>
                      ) : (
                        <div className="mt-8 p-6 bg-emerald-900 text-white rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/10 rounded-2xl">
                              <DollarSign className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-emerald-100/70 font-medium text-sm">Accumulated Total</p>
                              <p className="text-3xl font-black tracking-tight">
                                ₦{admissionCharges.reduce((acc, c) => acc + parseFloat(c.charge_total), 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden md:block">
                              <p className="text-emerald-100/70 text-xs">Entries Recorded</p>
                              <p className="font-bold">{admissionCharges.length} Charges</p>
                            </div>
                            <Separator orientation="vertical" className="h-10 bg-white/20 hidden md:block" />
                            <Button className="bg-white text-emerald-900 hover:bg-emerald-50 px-8 py-6 rounded-xl font-bold shadow-lg">
                              Generate Final Invoice
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>

            {/* Add/Edit Drug Modal */}
            <AnimatePresence>
              {(showAddDrug || editingDrug) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                  >
                    <div className="p-6 border-b bg-orange-50 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                        <Syringe className="w-5 h-5" />
                        {editingDrug ? 'Edit Drug Entry' : 'Add New Drug to Chart'}
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => { setShowAddDrug(false); setEditingDrug(null); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const data = {
                        date: formData.get('date'),
                        time: formData.get('time'),
                        drug_name: formData.get('drug_name'),
                        dosage: formData.get('dosage'),
                        route: formData.get('route'),
                        id: editingDrug?.id
                      };
                      editingDrug ? handleUpdateDrugEntry(data) : handleAddDrugEntry(data);
                      setShowAddDrug(false);
                      setEditingDrug(null);
                    }} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input name="date" type="date" required defaultValue={editingDrug?.date || format(new Date(), 'yyyy-MM-dd')} />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input name="time" type="time" required defaultValue={editingDrug?.time || format(new Date(), 'HH:mm')} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Drug Name</Label>
                        <Input name="drug_name" placeholder="e.g. Paracetamol" required defaultValue={editingDrug?.drug_name} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dosage</Label>
                          <Input name="dosage" placeholder="e.g. 500mg" required defaultValue={editingDrug?.dosage} />
                        </div>
                        <div className="space-y-2">
                          <Label>Route</Label>
                          <Input name="route" placeholder="e.g. Oral / IV" required defaultValue={editingDrug?.route} />
                        </div>
                      </div>
                      <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowAddDrug(false); setEditingDrug(null); }}>Cancel</Button>
                        <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                          {editingDrug ? 'Update Record' : 'Add to Chart'}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Add Finding Modal */}
            <AnimatePresence>
              {findingForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                  >
                    <div className="p-6 border-b bg-purple-50 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Add Clinical Finding
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => setFindingForm(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Record your observation or result for this {findingForm.type === 'rx' ? 'prescription' : 'lab request'}.
                      </p>
                      <Textarea
                        id="finding-text"
                        placeholder="Describe the clinical outcome, improvement, or result..."
                        className="min-h-[120px]"
                      />
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setFindingForm(null)}>Cancel</Button>
                        <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => {
                          const text = (document.getElementById('finding-text') as HTMLTextAreaElement).value;
                          if (!text) return toast.error('Finding description is required');
                          handleAddFinding(findingForm.type, findingForm.itemId, text);
                          setFindingForm(null);
                        }}>
                          Save Finding
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Record Operation Modal */}
            <AnimatePresence>
              {showAddOperation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8"
                  >
                    <div className="p-6 border-b bg-red-50 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                        <Scissors className="w-5 h-5" />
                        Record Surgical Operation
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => setShowAddOperation(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleAddOperation(Object.fromEntries(formData));
                      setShowAddOperation(false);
                    }} className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input name="category" placeholder="e.g. Major / Minor / Emergency" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Operation Name</Label>
                          <Input name="name" placeholder="e.g. Appendectomy" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                        </div>
                        <div className="space-y-2">
                          <Label>Surgeon / Consultant</Label>
                          <Input name="consultant" placeholder="Name of primary surgeon" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Anesthetist</Label>
                          <Input name="anesthetist" placeholder="Name of anesthetist" />
                        </div>
                        <div className="space-y-2">
                          <Label>Anesthesia Type</Label>
                          <Input name="anesthesia_type" placeholder="e.g. General / Spinal" />
                        </div>
                        <div className="space-y-2">
                          <Label>OT Technician</Label>
                          <Input name="technician" placeholder="Name of technician" />
                        </div>
                        <div className="space-y-2">
                          <Label>OT Assistant</Label>
                          <Input name="assistant" placeholder="Name of assistant" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Operation Result / Outcome</Label>
                        <Textarea name="result" placeholder="Describe the outcome of the surgery" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Remarks</Label>
                        <Textarea name="remark" placeholder="Any additional observations or post-op instructions" />
                      </div>
                      <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddOperation(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">Save Operation</Button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Nursing Note Modal */}
            <AnimatePresence>
              {showAddNoteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                  >
                    <div className="p-6 border-b bg-primary/5 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        Add Nursing Observation
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => setShowAddNoteModal(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      await handleAddNurseNote(formData.get('note') as string, formData.get('comment') as string);
                      setShowAddNoteModal(false);
                    }} className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Nursing Note / Observation</Label>
                        <textarea
                          name="note"
                          required
                          rows={4}
                          placeholder="Enter detailed nursing observation..."
                          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Management / Comments (Optional)</Label>
                        <textarea
                          name="comment"
                          rows={2}
                          placeholder="Enter management actions or comments..."
                          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setShowAddNoteModal(false)}>Cancel</Button>
                        <Button type="submit" className="bg-primary text-white">Save Observation</Button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Doctor Note Modal — only visible for doctors */}
            {isDoctor && (
              <AnimatePresence>
                {showAddDoctorNoteModal && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                    >
                      <div className="p-6 border-b bg-purple-50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-purple-700 flex items-center gap-2">
                          <Stethoscope className="w-5 h-5" />
                          Add Doctor Note
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowAddDoctorNoteModal(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        await handleAddDoctorNote(formData.get('note') as string);
                      }} className="p-6 space-y-4">
                        <div className="space-y-2">
                          <Label>Clinical Note / Doctor's Observation</Label>
                          <textarea
                            name="note"
                            required
                            rows={5}
                            placeholder="Enter clinical observations, assessment, or treatment plan..."
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-purple-200"
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <Button type="button" variant="outline" onClick={() => setShowAddDoctorNoteModal(false)}>Cancel</Button>
                          <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Save Doctor Note</Button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            )}

            {/* Treatment Modal — Doctor Only assessment + orders */}
            <AnimatePresence>
              {showTreatmentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8"
                  >
                    <div className="p-6 border-b bg-blue-600 flex items-center justify-between text-white">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Stethoscope className="w-6 h-6" />
                        New Clinical Record & Treatment Orders
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => setShowTreatmentModal(false)} className="text-white hover:bg-white/20">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="p-6 max-h-[80vh] overflow-y-auto space-y-8">
                      {/* Section 1: Clinical assessment */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-800 font-bold border-b pb-2">
                          <FileText className="w-5 h-5" />
                          1. CLINICAL ASSESSMENT & DIAGNOSIS
                        </div>
                        <Textarea
                          required
                          placeholder="Document patient presenting complaints, findings, assessment and primary diagnosis..."
                          className="min-h-[120px] text-base border-blue-100 focus:ring-blue-500"
                          value={treatmentForm.finding}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, finding: e.target.value })}
                        />
                      </section>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Section 2: Prescriptions */}
                        <section className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-blue-800 font-bold border-b border-blue-100 pb-2">
                            <Pill className="w-5 h-5" />
                            2. MEDICATION ORDERS
                          </div>

                          <div className="space-y-3 bg-white p-4 rounded-lg border shadow-sm">
                            <div className="space-y-2">
                              <Label>Drug Name / Strength</Label>
                              <Input
                                placeholder="e.g. Tab Ciprofloxacin 500mg"
                                value={newPrescribing.drugName}
                                onChange={(e) => setNewPrescribing({ ...newPrescribing, drugName: e.target.value })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Dosage</Label>
                                <Input
                                  placeholder="1 tab"
                                  value={newPrescribing.dosage}
                                  onChange={(e) => setNewPrescribing({ ...newPrescribing, dosage: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Duration</Label>
                                <Input
                                  placeholder="5 days"
                                  value={newPrescribing.duration}
                                  onChange={(e) => setNewPrescribing({ ...newPrescribing, duration: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Frequency</Label>
                              <Select
                                value={newPrescribing.frequency}
                                onValueChange={(val) => setNewPrescribing({ ...newPrescribing, frequency: val })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Once daily">Once daily (OD)</SelectItem>
                                  <SelectItem value="Twice daily">Twice daily (BD)</SelectItem>
                                  <SelectItem value="Thrice daily">Thrice daily (TDS)</SelectItem>
                                  <SelectItem value="Four times daily">Four times daily (QDS)</SelectItem>
                                  <SelectItem value="When necessary">When necessary (PRN)</SelectItem>
                                  <SelectItem value="Immediately">Stat (Immediately)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                              onClick={handleAddDrugToTreatment}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add to Order
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {treatmentForm.prescriptions.map((p) => (
                              <div key={p.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-blue-100 group">
                                <div className="text-sm">
                                  <span className="font-bold">{p.drugName}</span>
                                  <p className="text-xs text-muted-foreground">{p.dosage} — {p.frequency} — {p.duration}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveDrugFromTreatment(p.id)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Section 3: Lab Tests */}
                        <section className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 text-teal-800 font-bold border-b border-teal-100 pb-2">
                            <FlaskConical className="w-5 h-5" />
                            3. LABORATORY INVESTIGATIONS
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search or enter lab test name..."
                              className="bg-white"
                              value={newTestRequest}
                              onChange={(e) => setNewTestRequest(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTestToTreatment()}
                            />
                            <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={handleAddTestToTreatment}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {treatmentForm.labTests.length === 0 && (
                              <p className="text-xs text-muted-foreground italic p-4 text-center w-full bg-white rounded-lg border-2 border-dashed">
                                No lab tests requested yet
                              </p>
                            )}
                            {treatmentForm.labTests.map((test) => (
                              <Badge key={test} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-200 py-1.5 px-3 gap-2">
                                {test}
                                <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => handleRemoveTestFromTreatment(test)} />
                              </Badge>
                            ))}
                          </div>
                        </section>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setShowTreatmentModal(false)} className="h-12 px-6">Cancel</Button>
                      <Button
                        disabled={isSaving || !treatmentForm.finding}
                        onClick={handleSaveTreatment}
                        className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg"
                      >
                        {isSaving ? 'Processing...' : 'Complete Record & Authorize Orders'}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>



            <AnimatePresence>
              {showAddChargeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                  >
                    <div className="p-6 border-b bg-emerald-50 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Add Admission Charge
                      </h3>
                      <Button variant="ghost" size="icon" onClick={() => setShowAddChargeModal(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      handleAddAdmissionCharge(
                        formData.get('description') as string,
                        formData.get('total') as string
                      );
                      setShowAddChargeModal(false);
                    }} className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Charge Description</Label>
                        <Input name="description" placeholder="e.g. Daily Bed Occupancy" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (₦)</Label>
                        <Input name="total" type="number" placeholder="5000" required />
                      </div>
                      <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddChargeModal(false)}>Cancel</Button>
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">Add Charge</Button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>


            {/* Lab Result Viewer Modal */}
            <AnimatePresence>
              {viewingLabResult && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col"
                  >
                    <div className="p-6 border-b bg-teal-600 flex items-center justify-between text-white shrink-0">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <FlaskConical className="w-6 h-6" />
                          Laboratory Test Results
                        </h3>
                        <p className="text-teal-100 text-sm mt-1">Invoice: {viewingLabResult.inv_id} • Date: {viewingLabResult.date}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => { setViewingLabResult(null); setLabResultData(null); }} className="text-white hover:bg-white/20">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {isLoadingLabResult ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
                          <p className="text-muted-foreground animate-pulse font-medium">Retrieving laboratory findings...</p>
                        </div>
                      ) : !labResultData ? (
                        <div className="text-center py-20">
                          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                          <p className="text-muted-foreground">Results not yet available or found.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {viewingLabResult.test_list?.map((test: any, idx: number) => {
                              const summaries = typeof labResultData.result_list === 'string'
                                ? JSON.parse(labResultData.result_list)
                                : labResultData.result_list;
                              const images = labResultData.result_picture?.startsWith('{')
                                ? JSON.parse(labResultData.result_picture)
                                : {};

                              const summary = summaries[test.name] || 'No summary provided';
                              const image = images[test.name];

                              return (
                                <Card key={idx} className="border-teal-100 shadow-sm hover:shadow-md transition-shadow">
                                  <CardHeader className="py-3 bg-teal-50/50">
                                    <CardTitle className="text-sm font-bold text-teal-900 flex items-center justify-between">
                                      {test.name}
                                      <Badge variant="outline" className="text-[10px] bg-white">{test.cat}</Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 space-y-4">
                                    <div className="space-y-1">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Finding Summary</p>
                                      <div className="p-3 bg-muted/30 rounded-lg text-sm italic border border-dashed text-teal-950">
                                        {summary}
                                      </div>
                                    </div>
                                    {image && (
                                      <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Attachment</p>
                                        <div className="rounded-xl border overflow-hidden bg-slate-100">
                                          {image.startsWith('data:application/pdf') ? (
                                            <div className="aspect-video flex flex-col items-center justify-center gap-3">
                                              <div className="p-4 bg-red-100 text-red-600 rounded-full">
                                                <FileText className="w-10 h-10" />
                                              </div>
                                              <div className="text-center">
                                                <p className="font-bold text-sm">PDF Document Attached</p>
                                                <Button size="sm" variant="outline" className="mt-2" onClick={() => window.open(image)}>
                                                  Open PDF Viewer
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="relative group cursor-zoom-in" onClick={() => window.open(image)}>
                                              <img src={image} className="w-full h-auto max-h-60 object-contain" alt={test.name} />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <div className="p-2 bg-white rounded-full shadow-lg">
                                                  <Eye className="w-5 h-5 text-teal-600" />
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                          <Separator />
                          <div className="p-4 bg-slate-50 rounded-xl border flex items-center justify-between text-xs">
                            <div className="flex gap-4">
                              <p><span className="text-muted-foreground font-medium">Technician ID:</span> <span className="font-bold">{labResultData.technician_id || 'N/A'}</span></p>
                              <p><span className="text-muted-foreground font-medium">Result Date:</span> <span className="font-bold">{labResultData.result_date}</span></p>
                            </div>
                            <Button size="sm" variant="ghost" className="text-primary font-bold" onClick={() => window.print()}>
                              <Printer className="w-4 h-4 mr-2" /> Print Full Report
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end">
                      <Button onClick={() => { setViewingLabResult(null); setLabResultData(null); }} className="bg-teal-600 hover:bg-teal-700 px-8">
                        Close Result Viewer
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <Dialog open={showDischargeModal} onOpenChange={setShowDischargeModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserMinus className="w-6 h-6 text-orange-600" />
                    Discharge Patient
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to discharge <strong>{patient?.fullName}</strong>?
                    This will release the bed and mark the admission as completed.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-4">
                  <p className="text-sm text-orange-700 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Ensure all treatment summaries and prescriptions are completed before discharge.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDischargeModal(false)}>Cancel</Button>
                  <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleDischarge}>Confirm Discharge</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeathModal} onOpenChange={setShowDeathModal}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <Skull className="w-6 h-6" />
                    Record Patient Death
                  </DialogTitle>
                  <DialogDescription>
                    This is a permanent action. Recording a patient death will discharge them from the system and update their global status.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Cause of Death</Label>
                    <Input
                      placeholder="Medical cause of death..."
                      value={deathForm.cause}
                      onChange={(e) => setDeathForm({ ...deathForm, cause: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Remarks</Label>
                    <Textarea
                      placeholder="Observations, time of death, certificates issued..."
                      value={deathForm.remarks}
                      onChange={(e) => setDeathForm({ ...deathForm, remarks: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeathModal(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleRecordDeath}>Save & Close Record</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div >
        )
        }
      </div >
    </div >
  );
}
function VitalsModal({ isOpen, onClose, onSave, initialData }: any) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-6 border-b flex justify-between items-center bg-primary text-white">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-white" />
                Record Vitals
              </h3>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Blood Pressure (mmHg)</Label>
                  <Input value={data.bp} onChange={(e: any) => setData({ ...data, bp: e.target.value })} placeholder="e.g. 120/80" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Temperature (°C)</Label>
                  <Input value={data.temp} onChange={(e: any) => setData({ ...data, temp: e.target.value })} placeholder="e.g. 36.5" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Pulse (bpm)</Label>
                  <Input value={data.pulse} onChange={(e: any) => setData({ ...data, pulse: e.target.value })} placeholder="e.g. 72" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Respiratory Rate (cpm)</Label>
                  <Input value={data.respRate} onChange={(e: any) => setData({ ...data, respRate: e.target.value })} placeholder="e.g. 18" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Oxygen Saturation (%)</Label>
                  <Input value={data.oxygenSat} onChange={(e: any) => setData({ ...data, oxygenSat: e.target.value })} placeholder="e.g. 98" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Weight (kg)</Label>
                  <Input value={data.weight} onChange={(e: any) => setData({ ...data, weight: e.target.value })} placeholder="e.g. 70" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Height (cm)</Label>
                  <Input value={data.height} onChange={(e: any) => setData({ ...data, height: e.target.value })} placeholder="e.g. 175" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Blood Sugar (mg/dL)</Label>
                  <Input value={data.bloodSugar} onChange={(e: any) => setData({ ...data, bloodSugar: e.target.value })} placeholder="e.g. 110" className="bg-slate-50 border-slate-200 focus:ring-primary h-11" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 border-slate-200 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" className="h-11 px-8 bg-primary text-white font-bold shadow-lg hover:shadow-primary/20 transition-all">Save Vitals</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

