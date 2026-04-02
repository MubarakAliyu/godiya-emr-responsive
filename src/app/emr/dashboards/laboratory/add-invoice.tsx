import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  ArrowLeft,
  Search,
  Plus,
  X,
  Save,
  FileText,
  Download,
  Send,
  DollarSign,
  User,
  Phone,
  Calendar,
  Building,
  Trash2,
  Eye,
  Filter,
  CheckCircle2,
  AlertCircle,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';

interface AvailableTest {
  item_id: string;
  item_name: string;
  item_fees: string | number;
}

interface SelectedTest {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Patient {
  patient_id?: string | number;
  file_number: string;
  name: string;
  phone: string;
  dob?: string;
  gender: string;
  file_type: 'Individual' | 'Family';
}

interface Subfile {
  id: string;
  name: string;
  gender: string;
  relationship: string;
}


export function AddInvoice() {
  const navigate = useNavigate();
  const { addNotification } = useEMRStore();

  // Invoice Information State
  const [invoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [technicianName] = useState('Lab Technician');
  const [department] = useState('Laboratory');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [fileNumber, setFileNumber] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Subfile handling
  const [subfiles, setSubfiles] = useState<Subfile[]>([]);
  const [selectedSubfileId, setSelectedSubfileId] = useState<string>('');
  const [isFamilyFile, setIsFamilyFile] = useState(false);

  // Patient Auto-Suggest
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Test Inventory State
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected Tests State
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [discount, setDiscount] = useState(0);

  // Hospital Settings
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);

  // Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Unpaid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubfiles, setIsLoadingSubfiles] = useState(false);
  const [patientLock, setPatientLock] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchTests();
    fetchSettings();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/laboratory.php?action=get_items');
      const data = await res.json();
      if (Array.isArray(data)) setAvailableTests(data);
    } catch (e) {
      console.error('Failed to fetch tests:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings.php');
      const data = await res.json();
      setHospitalSettings(data);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  };

  // Search patients
  useEffect(() => {
    if (fileNumber.trim() && !isWalkIn && fileNumber.length > 1 && !patientLock) {
      const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/laboratory.php?action=search_patients&query=${encodeURIComponent(fileNumber)}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            setFilteredPatients(data);
            setShowSuggestions(data.length > 0);
          }
        } catch (e) {
          console.error('Failed to search patients:', e);
        } finally {
          setIsLoading(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowSuggestions(false);
    }
  }, [fileNumber, isWalkIn]);

  // Fetch subfiles when a family patient is selected
  const fetchSubfiles = async (fileId: string) => {
    setIsLoadingSubfiles(true);
    try {
      const res = await fetch(`/api/laboratory.php?action=get_subfiles&file_id=${fileId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubfiles(data);
        if (data.length > 0) {
          setIsFamilyFile(true);
          toast.info(`Found ${data.length} family members`);
        } else {
          toast.info('No family members found for this file');
        }
      } else {
        setSubfiles([]);
      }
    } catch (e) {
      console.error('Failed to fetch subfiles:', e);
      setSubfiles([]);
      toast.error('Failed to load family members');
    } finally {
      setIsLoadingSubfiles(false);
    }
  };

  // Handle patient selection from suggestions
  const handleSelectPatient = (patient: Patient) => {
    setPatientLock(true);
    setFileNumber(patient.file_number);
    setPatientName(patient.name);
    setPhoneNumber(patient.phone);

    // Even more robust check for family file
    const fType = (patient.file_type || '').toString().toLowerCase().trim();
    const isFamily = fType === 'family' || patient.file_number?.includes('FAM');

    setIsFamilyFile(isFamily);
    setShowSuggestions(false);

    if (isFamily || patient.file_type) {
      // Always try to fetch if it might be family
      fetchSubfiles(patient.patient_id ? String(patient.patient_id) : patient.file_number);
    } else {
      setSubfiles([]);
      setSelectedSubfileId('');
    }
  };

  // Handle walk-in toggle
  const handleWalkInToggle = (checked: boolean) => {
    setIsWalkIn(checked);
    if (checked) {
      setPatientLock(false);
      setFileNumber(`WALK-${Date.now().toString().slice(-6)}`);
      setPatientName('');
      setPhoneNumber('');
      setIsFamilyFile(false);
      setSubfiles([]);
      setSelectedSubfileId('');
      setShowSuggestions(false);
    } else {
      setPatientLock(false);
      setFileNumber('');
      setPatientName('');
      setPhoneNumber('');
    }
  };

  // Filter available tests
  const filteredTests = availableTests.filter((test) => {
    const matchesSearch = (test.item_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (test.item_id?.toString() || '').includes(searchQuery);
    return matchesSearch;
  });

  // Paginate tests
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Add test to selected
  const handleAddTest = (test: AvailableTest) => {
    const existing = selectedTests.find((t) => t.id === test.item_id);
    if (existing) {
      toast.warning('Test Already Added', {
        description: `${test.item_name} is already in the invoice.`,
      });
      return;
    }

    setSelectedTests((prev) => [
      ...prev,
      { id: test.item_id, name: test.item_name, price: Number(test.item_fees), quantity: 1 },
    ]);

    toast.success('Test Added', {
      description: `${test.item_name} added to invoice.`,
    });
  };

  // Remove test from selected
  const handleRemoveTest = (testId: string) => {
    const test = selectedTests.find((t) => t.id === testId);
    setSelectedTests((prev) => prev.filter((t) => t.id !== testId));

    if (test) {
      toast.info('Test Removed', {
        description: `${test.name} removed from invoice.`,
      });
    }
  };

  // Update test quantity
  const handleUpdateQuantity = (testId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedTests((prev) =>
      prev.map((test) => (test.id === testId ? { ...test, quantity } : test))
    );
  };

  // Calculate totals
  const subtotal = selectedTests.reduce((sum, test) => sum + test.price * test.quantity, 0);
  const total = subtotal - discount;

  // Validate form
  const validateForm = () => {
    if (!patientName.trim()) {
      toast.error('Validation Error', { description: 'Patient name is required.' });
      return false;
    }
    if (!isWalkIn && !fileNumber.trim()) {
      toast.error('Validation Error', { description: 'File number is required for registered patients.' });
      return false;
    }
    if (selectedTests.length === 0) {
      toast.error('Validation Error', { description: 'Please add at least one test to the invoice.' });
      return false;
    }
    return true;
  };

  // Save as draft
  const handleSaveDraft = () => {
    if (!validateForm()) return;

    toast.success('Draft Saved', {
      description: `Invoice ${invoiceNumber} saved as draft.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Invoice Draft Saved',
      message: `Invoice ${invoiceNumber} for ${patientName} saved as draft`,
      type: 'info',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Low',
    });
  };

  // Save logic
  const saveInvoiceToDB = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/laboratory.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_invoice',
          test_list: selectedTests,
          total: total,
          inv_file_number: isWalkIn
            ? `${invoiceNumber} | ${patientName}`
            : (isFamilyFile && selectedSubfileId)
              ? selectedSubfileId
              : fileNumber,
          is_subfile: (isFamilyFile && selectedSubfileId) ? 1 : 0,
          performerId: 'Laboratory Staff'
        }),
      });

      const result = await response.json();
      if (result.success) {
        return result.invoice_id;
      } else {
        toast.error('Error', { description: result.error || 'Failed to save invoice.' });
        return null;
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Connection Error');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate invoice
  const handleGenerateInvoice = () => {
    if (!validateForm()) return;
    setPreviewModalOpen(true);
  };

  // Confirm and finalize invoice
  const handleConfirmInvoice = async () => {
    const invoiceId = await saveInvoiceToDB();
    if (!invoiceId) return;

    toast.success('Invoice Saved', {
      description: `Invoice ${invoiceNumber} created successfully.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Lab Invoice Created',
      message: `Invoice ${invoiceNumber} - ₦${total.toLocaleString()} - ${patientName}`,
      type: 'success',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'High',
    });

    setPreviewModalOpen(false);
    navigate('/emr/laboratory-staff/dashboard');
  };

  // Save and Print POS logic
  const handleSaveAndPrint = async () => {
    const invoiceId = await saveInvoiceToDB();
    if (!invoiceId) return;

    handlePrintPOS();

    toast.success('Invoice Saved & Printing', {
      description: `Invoice ${invoiceNumber} processed successfully.`,
    });

    setPreviewModalOpen(false);
    navigate('/emr/laboratory-staff/dashboard');
  };

  const handlePrintPOS = () => {
    const hospitalName = hospitalSettings?.general?.hospitalName || 'GODIYA HOSPITAL';
    const hospitalAddress = hospitalSettings?.profile?.address || 'BIRNIN KEBBI, KEBBI STATE';
    const hospitalPhone = hospitalSettings?.profile?.phoneNumber || 'N/A';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>POS Receipt - ${invoiceNumber}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; 
              margin: 0 auto; 
              padding: 5mm; 
              font-size: 12px; 
              line-height: 1.2;
              color: #000;
            }
            .header { text-align: center; margin-bottom: 5mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
            .hospital-name { font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; }
            .info-line { display: flex; justify-content: space-between; margin-bottom: 1mm; }
            .items-table { width: 100%; border-bottom: 1px dashed #000; margin-bottom: 3mm; padding-bottom: 2mm; }
            .total-section { text-align: right; margin-top: 2mm; font-size: 14px; font-weight: bold; }
            .footer { text-align: center; margin-top: 5mm; font-size: 10px; border-top: 1px dashed #000; padding-top: 3mm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="hospital-name">${hospitalName}</h1>
            <p>LABORATORY RECEIPT</p>
            <p>${hospitalAddress}</p>
            <p>Tel: ${hospitalPhone}</p>
          </div>
          <div style="margin-bottom: 4mm;">
            <div class="info-line"><span>Invoice:</span> <span>${invoiceNumber}</span></div>
            <div class="info-line"><span>Date:</span> <span>${new Date().toLocaleString()}</span></div>
            <div class="info-line"><span>Patient:</span> <span>${patientName}</span></div>
            <div class="info-line">
              <span>File No:</span> 
              <span>${isWalkIn
        ? 'WALK-IN'
        : (isFamilyFile && selectedSubfileId) ? selectedSubfileId : fileNumber}
              </span>
            </div>
          </div>
          <div class="items-table">
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 1mm;">
              <span>Test Name</span>
              <span>Price</span>
            </div>
            ${selectedTests.map(item => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 1mm;">
                <span>${item.name} x${item.quantity}</span>
                <span>₦${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div class="total-section">
            <div class="info-line"><span>Subtotal:</span> <span>₦${subtotal.toLocaleString()}</span></div>
            ${discount > 0 ? `<div class="info-line"><span>Discount:</span> <span>-₦${discount.toLocaleString()}</span></div>` : ''}
            <div class="info-line" style="font-size: 16px; margin-top: 2mm;"><span>TOTAL:</span> <span>₦${total.toLocaleString()}</span></div>
          </div>
          <div class="footer">
            <p>Awaiting Test Processing</p>
            <p>Thank you for your patronage</p>
            <p>Software by Antigravity</p>
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    const frameContent = printFrame.contentWindow;
    if (frameContent) {
      frameContent.document.open();
      frameContent.document.write(printContent);
      frameContent.document.close();
      setTimeout(() => {
        frameContent.focus();
        frameContent.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      }, 500);
    }
  };

  // Send to cashier
  const handleSendToCashier = () => {
    toast.success('Sent to Cashier', {
      description: `Invoice ${invoiceNumber} sent to cashier for payment processing.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Invoice Sent to Cashier',
      message: `Invoice ${invoiceNumber} - ₦${total.toLocaleString()} sent for payment`,
      type: 'info',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Medium',
    });

    setPreviewModalOpen(false);

    setTimeout(() => {
      navigate('/emr/laboratory-staff/dashboard');
    }, 1500);
  };

  // Download PDF
  const handleDownloadPDF = () => {
    toast.success('PDF Downloaded', {
      description: `Invoice ${invoiceNumber} downloaded successfully.`,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/emr/laboratory-staff/dashboard')}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Add New Test Invoice</h1>
          <p className="text-muted-foreground">Create invoice for walk-in or existing patient</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL - Invoice Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Invoice Information
              </CardTitle>
              <CardDescription>Auto-generated and patient details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-Generated Fields */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-sm text-muted-foreground">Auto-Generated</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                    <p className="font-semibold text-primary">{invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="font-semibold">{new Date(invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Technician</Label>
                    <p className="font-semibold">{technicianName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Department</Label>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Building className="w-3 h-3 mr-1" />
                      {department}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Walk-In Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-semibold">Walk-In Patient</Label>
                  <p className="text-xs text-muted-foreground">Enable for non-registered patients</p>
                </div>
                <Switch checked={isWalkIn} onCheckedChange={handleWalkInToggle} />
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="relative">
                  <Label>Patient File Number</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={fileNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFileNumber(e.target.value);
                        setPatientLock(false);
                      }}
                      placeholder={isWalkIn ? 'Auto-generated for walk-in' : 'Search by file number or name...'}
                      disabled={isWalkIn}
                      className="pl-9"
                    />
                  </div>

                  {/* Auto-Suggest Dropdown */}
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {filteredPatients.map((patient) => (
                        <div
                          key={patient.file_number}
                          onClick={() => handleSelectPatient(patient)}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-sm">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.file_number}</p>
                          </div>
                          {patient.file_type && (
                            <Badge variant="outline" className="text-[10px] h-5">
                              {patient.file_type}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {isWalkIn && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <Label>Patient Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={patientName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value)}
                        placeholder="Enter patient name"
                        className="pl-9"
                      />
                    </div>
                  </motion.div>
                )}

                {isFamilyFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <Label>Select Sub-File (Family Member)</Label>
                    <Select
                      value={selectedSubfileId}
                      onValueChange={(value: string) => {
                        setSelectedSubfileId(value);
                        const sub = subfiles.find(s => String(s.id) === value);
                        if (sub) {
                          setPatientName(sub.name);
                          setFileNumber(String(sub.id)); // Use subfile ID as file number as requested
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingSubfiles ? "Loading members..." : "Select family member..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingSubfiles ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">Loading members...</div>
                        ) : subfiles.length > 0 ? (
                          subfiles.map((sub) => (
                            <SelectItem key={sub.id} value={String(sub.id)}>
                              {sub.name} ({sub.relationship})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">No members found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT PANEL - Test Inventory */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                Test Inventory
              </CardTitle>
              <CardDescription>Search and add tests to invoice</CardDescription>

              {/* Search */}
              <div className="flex items-center gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests by name or ID..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-semibold text-xs text-muted-foreground">Test Name</th>
                        <th className="text-left py-2 px-3 font-semibold text-xs text-muted-foreground">Price</th>
                        <th className="text-left py-2 px-3 font-semibold text-xs text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {paginatedTests.map((test, index) => (
                          <motion.tr
                            key={test.item_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.03 }}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <div>
                                <p className="font-semibold text-sm">{test.item_name}</p>
                                <p className="text-xs text-muted-foreground">ID: {test.item_id}</p>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-sm">₦{Number(test.item_fees).toLocaleString()}</p>
                            </td>
                            <td className="py-3 px-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAddTest(test)}
                                className="h-8"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {paginatedTests.length === 0 && (
                    <div className="text-center py-8">
                      <FlaskConical className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">No tests found</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8"
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Selected Tests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Selected Tests ({selectedTests.length})
            </CardTitle>
            <CardDescription>Tests added to this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Test Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Subtotal</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTests.map((test, index) => (
                      <motion.tr
                        key={test.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold text-sm">{test.name}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-sm">₦{test.price.toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <Input
                            type="number"
                            min="1"
                            value={test.quantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateQuantity(test.id, parseInt(e.target.value) || 1)}
                            className="w-20 h-9"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-sm text-primary">
                            ₦{(test.price * test.quantity).toLocaleString()}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveTest(test.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No tests added yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add tests from the inventory above</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Summary Card */}
      {selectedTests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <Card className="w-full lg:w-96">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-semibold">₦{subtotal.toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Discount</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-32 h-9"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <p className="font-bold text-lg">Total Amount</p>
                <p className="font-bold text-2xl text-primary">₦{total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-end gap-3 pt-6 border-t"
      >
        <Button
          variant="outline"
          onClick={() => navigate('/emr/laboratory-staff/dashboard')}
        >
          Cancel
        </Button>

        <Button
          onClick={handleGenerateInvoice}
          disabled={selectedTests.length === 0}
          className="bg-primary hover:bg-primary/90"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Invoice
        </Button>
      </motion.div>

      {/* Generate Invoice Modal */}
      <Dialog open={previewModalOpen} onOpenChange={(open: boolean) => !open && setPreviewModalOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Invoice Preview</DialogTitle>
                <DialogDescription>Review and finalize laboratory invoice</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Invoice Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-primary">{hospitalSettings?.general?.hospitalName || 'Godiya Hospital'}</h2>
              <p className="text-sm text-muted-foreground">Laboratory Department</p>
              <p className="text-xs text-muted-foreground mt-1">{hospitalSettings?.profile?.address || 'Birnin Kebbi, Nigeria'}</p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                <p className="font-bold text-primary">{invoiceNumber}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <p className="font-semibold">{new Date(invoiceDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Patient Name</Label>
                <p className="font-semibold">{patientName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">File Number</Label>
                <p className="font-semibold">
                  {isWalkIn
                    ? `${invoiceNumber} | ${patientName}`
                    : (isFamilyFile && selectedSubfileId) ? selectedSubfileId : fileNumber}
                </p>
              </div>
            </div>

            <Separator />

            {/* Tests List */}
            <div>
              <h3 className="font-semibold mb-3">Tests Ordered</h3>
              <div className="space-y-2">
                {selectedTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{test.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {test.quantity}</p>
                    </div>
                    <p className="font-bold">₦{(test.price * test.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-semibold">₦{subtotal.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Discount</p>
                <p className="font-semibold text-red-600">-₦{discount.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="font-bold text-lg">Total Amount</p>
                <p className="font-bold text-2xl text-primary">₦{total.toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            {/* Payment Status Selection */}
            <div>
              <Label>Payment Status</Label>
              <Select value={paymentStatus} onValueChange={(value: 'Paid' | 'Unpaid') => setPaymentStatus(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleConfirmInvoice} disabled={isSubmitting} className="bg-primary/20 text-primary hover:bg-primary/30 w-full sm:w-auto">
              {isSubmitting ? <span className="animate-spin mr-2">...</span> : <Save className="w-4 h-4 mr-2" />}
              Save Only
            </Button>
            <Button onClick={handleSaveAndPrint} disabled={isSubmitting} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              {isSubmitting ? <span className="animate-spin mr-2">...</span> : <Printer className="w-4 h-4 mr-2" />}
              Save & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
