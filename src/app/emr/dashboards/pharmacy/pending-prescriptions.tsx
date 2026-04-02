"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  X,
  ClipboardList,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Package,
  Calendar,
  Filter,
  RotateCcw,
  Download,
  Eye,
  ShoppingCart,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';

// Interfaces based on the new API schema
interface PrescribedDrug {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: number;
  prescriptionDate: string;
  doctorName: string;
  patientName: string;
  fileNumber: string;
  subfileNumber?: string;
  parentFamilyFile?: string;
  isSubfile: boolean;
  dob: string;
  gender: string;
  phone: string;
  patientType: string;
  sta: string;
  drugs: PrescribedDrug[];
  notes?: string;
}

interface Drug {
  drug_id: string;
  drug_name: string;
  drug_qty: string;
  drug_price: string;
  status: string;
}

interface SelectedDrug {
  drugId: string;
  name: string;
  price: number;
  quantityPrescribed: number;
  quantityDispensed: number;
  available: number;
}

interface UnavailableDrug {
  drugName: string;
  dosage: string;
  instructions: string;
}

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: 'primary' | 'secondary' | 'warning' | 'danger';
  tooltip: string;
}

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip }: KPICardProps) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    warning: 'bg-orange-100 text-orange-600 border-orange-200',
    danger: 'bg-red-100 text-red-600 border-red-200',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`border ${colorMap[color]} shadow-sm hover:shadow-md transition-shadow cursor-help`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[10px] font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
                    {trendValue}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${colorMap[color]}`}>
                <Icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PendingPrescriptionsPanel() {
  const { addNotification } = useEMRStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<SelectedDrug[]>([]);
  const [unavailableDrugs, setUnavailableDrugs] = useState<UnavailableDrug[]>([]);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;

  // Fetch data from API
  const fetchData = async () => {
    try {
      const [prescRes, drugsRes] = await Promise.all([
        fetch('/api/prescriptions.php'),
        fetch('/api/drugs.php')
      ]);

      const prescData = await prescRes.json();
      const drugsData = await drugsRes.json();

      if (Array.isArray(prescData)) setPrescriptions(prescData);
      if (Array.isArray(drugsData)) setDrugs(drugsData);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate KPIs
  const totalPrescriptions = prescriptions.length;
  const pendingCount = prescriptions.filter(p => p.sta.toLowerCase() === 'pending').length;
  const processingCount = prescriptions.filter(p => p.sta.toLowerCase() === 'processing').length;
  const processedCount = prescriptions.filter(p => p.sta.toLowerCase() === 'processed').length;

  // Filter prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      const matchesSearch =
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toString().includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || p.sta.toLowerCase() === statusFilter.toLowerCase();
      const matchesDate = !dateFilter || p.prescriptionDate.startsWith(dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [prescriptions, searchQuery, statusFilter, dateFilter]);

  // Paginate prescriptions
  const paginatedPrescriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPrescriptions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPrescriptions, currentPage]);

  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('');
    setCurrentPage(1);
  };

  // Open view modal
  const openViewModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    // When opening, we don't auto-match anymore as per user request to "make a search"
    setSelectedDrugs([]);
    setUnavailableDrugs([]);
    setInventorySearchQuery('');
    setViewModalOpen(true);
  };

  // Toggle drug availability
  const toggleDrugAvailability = (pd: PrescribedDrug) => {
    const isCurrentlyUnavailable = unavailableDrugs.some(u => u.drugName === pd.drugName);

    if (isCurrentlyUnavailable) {
      setUnavailableDrugs(prev => prev.filter(u => u.drugName !== pd.drugName));
    } else {
      setUnavailableDrugs(prev => [...prev, {
        drugName: pd.drugName,
        dosage: pd.dosage,
        instructions: pd.instructions
      }]);
      // Remove from cart if it was there
      setSelectedDrugs(prev => prev.filter(sd => sd.name.toLowerCase() !== pd.drugName.toLowerCase()));
    }
  };

  // Add drug from inventory
  const handleAddDrugFromInventory = (drug: Drug) => {
    if (selectedDrugs.some(sd => sd.drugId === drug.drug_id)) {
      toast.info(`${drug.drug_name} is already in the list.`);
      return;
    }

    const available = parseInt(drug.drug_qty);
    if (available <= 0) {
      toast.error(`${drug.drug_name} is out of stock.`);
      return;
    }

    setSelectedDrugs(prev => [...prev, {
      drugId: drug.drug_id,
      name: drug.drug_name,
      price: parseFloat(drug.drug_price),
      quantityPrescribed: 1,
      quantityDispensed: 1,
      available: available
    }]);

    toast.success('Added to dispensing list');
  };

  // Remove drug from cart
  const handleRemoveSelectedDrug = (drugId: string) => {
    setSelectedDrugs(prev => prev.filter(sd => sd.drugId !== drugId));
  };

  // Update quantity in cart
  const handleUpdateDispensedQuantity = (drugId: string, quantity: number) => {
    const drug = selectedDrugs.find(d => d.drugId === drugId);
    if (!drug) return;

    if (quantity < 1) return;
    if (quantity > drug.available) {
      toast.error(`Only ${drug.available} units available.`);
      return;
    }

    setSelectedDrugs(prev =>
      prev.map(d => d.drugId === drugId ? { ...d, quantityDispensed: quantity } : d)
    );
  };

  // Submit dispensing
  const handleSubmitPrescription = async (shouldPrint = false) => {
    if (!selectedPrescription) return;

    const totalCost = selectedDrugs.reduce((sum, sd) => sum + (sd.price * sd.quantityDispensed), 0);

    const drugList = {
      available: selectedDrugs.map(sd => ({
        id: sd.drugId,
        name: sd.name,
        price: sd.price,
        quantity: sd.quantityDispensed,
        total: sd.price * sd.quantityDispensed
      })),
      unavailable: unavailableDrugs.map(ud => ({
        name: ud.drugName,
        dosage: ud.dosage,
        instructions: ud.instructions
      }))
    };

    const invFileNumber = selectedPrescription.isSubfile && selectedPrescription.subfileNumber
      ? selectedPrescription.subfileNumber
      : selectedPrescription.fileNumber;

    setIsLoading(true);
    try {
      const response = await fetch('/api/prescriptions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_dispense',
          id: selectedPrescription.id,
          drug_list: drugList,
          inv_file_number: invFileNumber,
          total: totalCost
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Prescription Processed');
        if (shouldPrint) {
          handlePrintPOS(selectedPrescription, drugList.available, drugList.unavailable, totalCost);
        }
        fetchData();
        setViewModalOpen(false);
        addNotification({
          id: Date.now(),
          title: 'Dispensing Complete',
          message: `Invoice generated for ${selectedPrescription.patientName} (₦${(totalCost || 0).toLocaleString()})`,
          type: 'success',
          status: 'Unread',
          timestamp: new Date().toISOString(),
          priority: 'High'
        });
      } else {
        toast.error(data.error || 'Submission failed');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // POS Receipt Printing
  const handlePrintPOS = async (p: Prescription, items: any[], unavailableItems: any[], total: number) => {
    // Attempt to fetch hospital settings for branding
    let hospitalName = "GODIYA HOSPITAL";
    let hospitalAddress = "Birnin Kebbi, Kebbi State";
    let hospitalPhone = "08123456789";

    try {
      const res = await fetch('/api/settings.php');
      const settings = await res.json();
      if (settings?.hospital_info) {
        hospitalName = settings.hospital_info.name || hospitalName;
        hospitalAddress = settings.hospital_info.address || hospitalAddress;
        hospitalPhone = settings.hospital_info.phone || hospitalPhone;
      }
    } catch (e) {
      console.warn("Could not load hospital settings for receipt");
    }

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - #${p.id}</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 80mm; 
            margin: 0; 
            padding: 5mm; 
            font-size: 12px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .header { margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
          .hospital-name { font-size: 14px; margin-bottom: 1mm; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
          .divider { border-top: 1px dashed #000; margin: 2mm 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 1mm; font-size: 11px; }
          td { padding: 1mm 0; font-size: 11px; vertical-align: top; }
          .total-section { margin-top: 3mm; border-top: 1px solid #000; padding-top: 1mm; }
          .footer { margin-top: 5mm; font-size: 10px; border-top: 1px dashed #000; padding-top: 2mm; }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="hospital-name bold">${hospitalName}</div>
          <div>${hospitalAddress}</div>
          <div>Tel: ${hospitalPhone}</div>
          <div class="bold" style="margin-top: 2mm;">PHARMACY DISPENSING SLIP</div>
        </div>

        <div class="info-row">
          <span>Date:</span>
          <span>${new Date().toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span>Patient:</span>
          <span class="bold">${p.patientName}</span>
        </div>
        <div class="info-row">
          <span>File No:</span>
          <span>${p.isSubfile ? p.subfileNumber : p.fileNumber}</span>
        </div>
        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th>ITEM</th>
              <th style="text-align: center;">QTY</th>
              <th style="text-align: right;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${(item.total || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
            ${unavailableItems.length > 0 ? `
              <tr>
                <td colspan="3" style="font-weight: bold; border-top: 1px dashed #000; padding-top: 2mm;">UNAVAILABLE ITEMS:</td>
              </tr>
              ${unavailableItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">-</td>
                  <td style="text-align: right; color: #666;">N/A</td>
                </tr>
              `).join('')}
            ` : ''}
          </tbody>
        </table>

        <div class="total-section">
          <div class="info-row bold" style="font-size: 14px;">
            <span>TOTAL:</span>
            <span>₦${(total || 0).toLocaleString()}</span>
          </div>
        </div>

        <div class="footer center">
          <p>Thank you for choosing ${hospitalName}</p>
          <p>Dispensed by: Pharmacy Terminal</p>
          <p>${new Date().toLocaleString()}</p>
        </div>

        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // PDF Export
  const exportAsPDF = (p: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription #${p.id}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          .hdr { text-align: center; border-bottom: 2px solid #1e40af; margin-bottom: 30px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { background: #f3f4f6; text-align: left; padding: 12px; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <h1>GODIYA HOSPITAL</h1>
          <p>Electronic Prescription Record</p>
        </div>
        <div class="grid">
          <div><strong>PATIENT:</strong> ${p.patientName}</div>
          <div><strong>FILE NO:</strong> ${p.fileNumber}</div>
          <div><strong>DATE:</strong> ${new Date(p.prescriptionDate).toLocaleDateString()}</div>
          <div><strong>DOCTOR:</strong> ${p.doctorName}</div>
        </div>
        <table>
          <thead><tr><th>Medication</th><th>Dosage</th><th>Instructions</th></tr></thead>
          <tbody>
            ${p.drugs.map(d => `<tr><td>${d.drugName}</td><td>${d.dosage}</td><td>${d.instructions}</td></tr>`).join('')}
          </tbody>
        </table>
        <script>window.onload=()=>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Pending Prescriptions</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button variant="outline" onClick={() => {
            const csv = prescriptions.map(p => `${p.id},${p.patientName},${p.fileNumber},${p.sta}`).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prescriptions.csv';
            a.click();
          }}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex flex-col md:flex-row gap-6">
        <KPICard title="Pending" value={pendingCount} icon={Clock} trend="up" trendValue="In Queue" color="warning" tooltip="Awaiting pharmacist" className="w-full md:w-1/2" />
      </div>

      {/* Filters & Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search Patient name, File number or ID..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-11"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="Processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left py-4 px-6 font-bold text-xs uppercase text-slate-500 tracking-wider">ID</th>
                  <th className="text-left py-4 px-6 font-bold text-xs uppercase text-slate-500 tracking-wider">Patient & File</th>
                  <th className="text-left py-4 px-6 font-bold text-xs uppercase text-slate-500 tracking-wider">Medications</th>
                  <th className="text-left py-4 px-6 font-bold text-xs uppercase text-slate-500 tracking-wider">Date</th>
                  <th className="text-left py-4 px-6 font-bold text-xs uppercase text-slate-500 tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 font-bold text-xs uppercase text-slate-500 tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPrescriptions.map(p => (
                  <tr key={p.id} className="border-b hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-6 font-bold text-primary">#{p.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{p.patientName}</div>
                      <div className="text-[11px] font-medium text-slate-500 uppercase">{p.fileNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {p.drugs.slice(0, 2).map((d, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-white">{d.drugName}</Badge>
                        ))}
                        {p.drugs.length > 2 && <span className="text-[10px] text-slate-400">+{p.drugs.length - 2} more</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">{new Date(p.prescriptionDate).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      {p.sta.toLowerCase() === 'pending' ? <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Pending</Badge> :
                        p.sta.toLowerCase() === 'processing' ? <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Processing</Badge> :
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">{p.sta}</Badge>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-primary hover:bg-primary/90 text-white shadow-sm font-bold"
                          onClick={() => openViewModal(p)}
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="bg-white border-t py-3 flex justify-between items-center">
          <p className="text-xs text-slate-500 font-medium">Showing {paginatedPrescriptions.length} of {filteredPrescriptions.length} records</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button size="sm" variant="outline" onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </CardFooter>
      </Card>

      {/* Advanced Dispensing Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="!fixed !inset-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen p-0 flex flex-col overflow-hidden bg-white !border-none !shadow-none !rounded-none !duration-0">
          {/* Header */}
          <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">Process Prescription</DialogTitle>
                <DialogDescription className="text-[10px] font-medium text-slate-500">Patient: {selectedPrescription?.patientName}</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prescribed Date</p>
                <p className="text-sm font-bold text-slate-700">{selectedPrescription ? format(new Date(selectedPrescription.prescriptionDate), 'dd MMM yyyy') : ''}</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Doctor</p>
                <p className="text-sm font-bold text-slate-700">{selectedPrescription?.doctorName}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* LEFT SIDE (30%) - Original Prescription */}
            <div className="w-[30%] border-r bg-slate-50/50 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    Doctor's Prescription
                  </h3>
                  <Badge className="bg-white text-primary border-primary/20 shadow-sm text-[10px]">{selectedPrescription?.drugs.length} Items</Badge>
                </div>

                <div className="space-y-4">
                  {selectedPrescription?.drugs.map((drug, idx) => {
                    const isUnavailable = unavailableDrugs.some(u => u.drugName === drug.drugName);
                    return (
                      <Card key={idx} className={`border-2 transition-all shadow-sm ${isUnavailable ? 'opacity-60 grayscale border-destructive/20 bg-destructive/5' : 'border-slate-200 hover:border-primary/30 bg-white'}`}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-sm text-slate-900 leading-snug">{drug.drugName}</p>
                            <Button
                              size="sm"
                              variant={isUnavailable ? "destructive" : "outline"}
                              className={`h-7 px-3 text-[10px] font-bold tracking-tight rounded-full ${!isUnavailable && 'hover:bg-destructive hover:text-white hover:border-destructive'}`}
                              onClick={() => toggleDrugAvailability(drug)}
                            >
                              {isUnavailable ? "UNAVAILABLE" : "MARK N/A"}
                            </Button>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="font-bold text-slate-400 uppercase w-14">Dosage:</span>
                              <span className="font-bold text-slate-700">{drug.dosage}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="font-bold text-slate-400 uppercase w-14">Regimen:</span>
                              <span className="font-bold text-slate-700">{drug.frequency} &times; {drug.duration}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Patient Details</p>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium italic">Patient:</span>
                      <span className="font-bold text-slate-900">{selectedPrescription?.patientName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium italic">File Number:</span>
                      <span className="font-bold text-primary">
                        {selectedPrescription?.isSubfile ? selectedPrescription.subfileNumber : selectedPrescription?.fileNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE (70%) - Dispensing Area */}
            <div className="w-[70%] flex flex-col overflow-hidden">
              <div className="flex-1 p-8 space-y-8 overflow-y-auto bg-white">
                {/* Search Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      Search Sub-Inventory
                    </h3>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search items (e.g. Paracetamol...)"
                      className="pl-10 h-10 text-sm border-2 border-slate-100 focus:border-primary/50 shadow-sm rounded-xl bg-slate-50/50"
                      value={inventorySearchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearchQuery(e.target.value)}
                    />
                  </div>

                  {inventorySearchQuery.length > 0 && (
                    <Card className="shadow-2xl border border-slate-200 overflow-hidden rounded-2xl">
                      <ScrollArea className="h-[300px]">
                        <div className="divide-y border-t">
                          {drugs
                            .filter(d => d.drug_name.toLowerCase().includes(inventorySearchQuery.toLowerCase()))
                            .map(drug => (
                              <div
                                key={drug.drug_id}
                                className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-all"
                                onClick={() => {
                                  handleAddDrugFromInventory(drug);
                                  setInventorySearchQuery('');
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Pill className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900 text-sm">{drug.drug_name}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">STOCK: <span className={parseInt(drug.drug_qty) < 50 ? 'text-orange-500' : 'text-emerald-500'}>{drug.drug_qty}</span></span>
                                      <span className="text-[10px] font-bold text-primary italic">₦{parseFloat(drug.drug_price).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all font-black" />
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  )}
                </div>

                {/* Dispensing List (The Cart) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      Dispensing List (Summary)
                    </h3>
                  </div>

                  <Card className="border-2 border-slate-100 shadow-xl rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50/50 border-b">
                            <th className="text-left py-2 px-4 font-bold text-[9px] uppercase text-slate-400 tracking-widest">Selected Item</th>
                            <th className="text-center py-2 px-4 font-bold text-[9px] uppercase text-slate-400 tracking-widest">Dispense Qty</th>
                            <th className="text-right py-2 px-4 font-bold text-[9px] uppercase text-slate-400 tracking-widest">Unit Price</th>
                            <th className="text-right py-2 px-4 font-bold text-[9px] uppercase text-slate-400 tracking-widest">Subtotal</th>
                            <th className="text-right py-2 px-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y relative min-h-[160px]">
                          {selectedDrugs.map(sd => (
                            <tr key={sd.drugId} className="hover:bg-slate-50/30 transition-colors group">
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900 text-sm">{sd.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase flex items-center gap-1">
                                  <Package className="w-2.5 h-2.5" /> Stability: {sd.available} units
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-3">
                                  <Button size="icon" variant="outline" className="h-7 w-7 border-slate-200 rounded-lg hover:text-primary" onClick={() => handleUpdateDispensedQuantity(sd.drugId, sd.quantityDispensed - 1)} disabled={sd.quantityDispensed <= 1}>
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="text-sm font-black w-6 text-center tabular-nums">{sd.quantityDispensed}</span>
                                  <Button size="icon" variant="outline" className="h-7 w-7 border-slate-200 rounded-lg hover:text-primary" onClick={() => handleUpdateDispensedQuantity(sd.drugId, sd.quantityDispensed + 1)} disabled={sd.quantityDispensed >= sd.available}>
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-600 text-xs">₦{sd.price.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-black text-primary text-sm">₦{(sd.price * sd.quantityDispensed).toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => handleRemoveSelectedDrug(sd.drugId)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {selectedDrugs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-24 text-center">
                                <div className="flex flex-col items-center gap-3 opacity-20">
                                  <ShoppingCart className="w-16 h-16" />
                                  <p className="font-bold text-xl tracking-tighter uppercase">No items selected to dispense</p>
                                  <p className="text-xs font-medium italic">Match drugs from search above</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Unavailable List Highlight */}
                  {unavailableDrugs.length > 0 && (
                    <div className="p-6 bg-orange-50/50 border-2 border-orange-100 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-orange-500" />
                        <h4 className="font-black text-orange-800 tracking-tight uppercase">Out of Stock / Unavailable Records</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {unavailableDrugs.map((ud, i) => (
                          <Badge key={i} className="bg-white text-orange-600 border-orange-200 shadow-sm py-1.5 px-3 rounded-full font-bold uppercase text-[10px] tracking-wide">
                            {ud.drugName} (N/A)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-8 border-t bg-slate-50/80 backdrop-blur-md">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 group overflow-hidden relative">
                      <div className="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Bill Amount</p>
                      <p className="text-2xl font-black text-primary tracking-tighter leading-none">
                        ₦{selectedDrugs.reduce((sum, sd) => sum + (sd.price * sd.quantityDispensed), 0).toLocaleString()}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 italic tracking-tight uppercase">Cashier Terminal Sync Enabled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button variant="outline" size="sm" className="h-12 px-6 text-sm font-bold border-2 rounded-xl tracking-tight flex-1 md:flex-none" onClick={() => setViewModalOpen(false)}>
                      CANCEL
                    </Button>
                    <Button
                      size="sm"
                      className="h-12 px-8 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl rounded-xl flex-1 md:flex-none tracking-tight transition-all"
                      onClick={() => handleSubmitPrescription(false)}
                      disabled={isLoading || (selectedDrugs.length === 0 && unavailableDrugs.length === 0)}
                    >
                      {isLoading ? "SYNCING..." : "SUBMIT"}
                    </Button>
                    <Button
                      size="sm"
                      className="h-12 px-8 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/30 rounded-xl flex-1 md:flex-none tracking-tight transform-gpu active:scale-95 transition-all"
                      onClick={() => handleSubmitPrescription(true)}
                      disabled={isLoading || (selectedDrugs.length === 0 && unavailableDrugs.length === 0)}
                    >
                      {isLoading ? "SYNCING..." : "SUBMIT & PRINT"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}