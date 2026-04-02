import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  Clock,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  CheckCircle2,
  Search,
  Download,
  Plus,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
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
import { Switch } from '@/app/components/ui/switch';

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  tooltip?: string;
}

interface LabTest {
  id: string;
  fileNumber: string;
  patientName: string;
  patientId: string;
  labTests: string[];
  date: string;
  status: string;
  fees: number;
  isPaid?: number;
  doctor?: string;
  patientPhone?: string;
  patientAge?: string;
  patientGender?: string;
  category?: 'OPD' | 'IPD' | 'Individual' | 'Family';
  requestedTests?: string[];
  isSubfile?: boolean;
}

interface AvailableTest {
  item_id: string;
  item_name: string;
  item_fees: number;
}

// Removed mock data for pending lab tests

// Removed mock available tests

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const duration = 1000;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(startValue));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-foreground">{displayValue}</h3>
                  </div>
                  <div
                    className={`p-3 rounded-xl`}
                    style={{
                      backgroundColor: color === 'primary' ? '#1e40af15' : '#05966915'
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{
                        color: color === 'primary' ? '#1e40af' : '#059669'
                      }}
                    />
                  </div>
                </div>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span>{trendValue}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TooltipTrigger>
        {tooltip && (
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export function PendingLabTests() {
  const { addNotification } = useEMRStore();
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [labKPIs, setLabKPIs] = useState({ awaitingPayment: 0, awaitingResult: 0 });
  const [isPaidToggle, setIsPaidToggle] = useState(false);

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch pending tests
        const pendingRes = await fetch('/api/laboratory.php?action=get_pending_tests');
        const pendingData = await pendingRes.json();
        if (Array.isArray(pendingData)) {
          setLabTests(pendingData.map(item => ({
            ...item,
            fees: Number(item.fees || 0),
            status: item.status === 'pending' ? (item.isPaid ? 'Awaiting Results' : 'Not Paid') : item.status
          })));
        }

        // Fetch available tests
        const itemsRes = await fetch('/api/laboratory.php?action=get_items');
        const itemsData = await itemsRes.json();
        if (Array.isArray(itemsData)) {
          setAvailableTests(itemsData.map(i => ({
            ...i,
            item_fees: Number(i.item_fees)
          })));
        }

        // Fetch laboratory KPIs
        const kpiRes = await fetch('/api/laboratory.php?action=get_lab_kpis');
        const kpiData = await kpiRes.json();
        if (kpiData && !kpiData.error) {
          setLabKPIs({
            awaitingPayment: kpiData.awaitingPayment || 0,
            awaitingResult: kpiData.awaitingResult || 0
          });
        }

      } catch (e) {
        console.error('Failed to fetch data:', e);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process Modal State
  const [selectedTests, setSelectedTests] = useState<AvailableTest[]>([]);

  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pending count from current visible pendings
  const pendingCount = labTests.length;

  // Filter tests based on search query and status
  const filteredTests = labTests.filter((test) => {
    const matchesSearch =
      (test.fileNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (test.patientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (test.id?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginate tests
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewTest = (test: LabTest) => {
    setSelectedTest(test);
    setSelectedTests([]);
    setViewModalOpen(true);
  };

  const handleProcessTest = (test: LabTest) => {
    setSelectedTest(test);
    setSelectedTests([]);
    setIsPaidToggle(test.isPaid === 1);
    setProcessModalOpen(true);
  };

  const handlePrintPOS = (invoiceId: string, prescribedTests: any[], selectedTests: any[], total: number) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const h = hospitalSettings || {};
    const hospitalName = h.hospitalName || 'Godiya Hospital';
    const hospitalAddress = h.hospitalAddress || 'No. 123 Hospital Road, Bauchi';
    const hospitalPhone = h.hospitalPhone || '0800 123 4567';

    const content = `
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              width: 80mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              padding: 5mm;
              line-height: 1.4;
            }
            .header { text-align: center; margin-bottom: 8px; border-bottom: 1pt dashed #000; padding-bottom: 5px; }
            .hospital-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }
            .info-line { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .divider { border-top: 1pt dashed #000; margin: 8px 0; }
            .section-header { font-weight: bold; margin: 8px 0 4px 0; border-bottom: 0.5pt solid #eee; font-size: 11px; text-transform: uppercase; }
            .test-item { margin-bottom: 1px; }
            .test-row { display: flex; justify-content: space-between; }
            .total-section { border-top: 1pt solid #000; margin-top: 10px; padding-top: 5px; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">${hospitalName}</div>
            <div>${hospitalAddress}</div>
            <div>Tel: ${hospitalPhone}</div>
          </div>
          
          <div class="info-line"><span>Invoice:</span> <span>#${invoiceId}</span></div>
          <div class="info-line"><span>Date:</span> <span>${new Date().toLocaleString()}</span></div>
          <div class="info-line"><span>File No:</span> <span>${selectedTest?.fileNumber}</span></div>
          <div class="info-line"><span>Patient:</span> <span>${selectedTest?.patientName}</span></div>
          
          <div class="divider"></div>
          <div style="text-align:center; font-weight:bold; margin-bottom:5px;">LABORATORY RECEIPT</div>

          ${prescribedTests.length > 0 ? `
            <div class="section-header">Prescribed Tests</div>
            ${prescribedTests.map(t => `
              <div class="test-item">
                <div class="test-row">
                  <span>${t.name}</span>
                  <span>₦${Number(t.price).toLocaleString()}</span>
                </div>
              </div>
            `).join('')}
          ` : ''}

          ${selectedTests.length > 0 ? `
            <div class="section-header">Selected Tests</div>
            ${selectedTests.map(t => `
              <div class="test-item">
                <div class="test-row">
                  <span>${t.name}</span>
                  <span>₦${Number(t.price).toLocaleString()}</span>
                </div>
              </div>
            `).join('')}
          ` : ''}
          
          <div class="total-section">
            <div class="total-row">
              <span>TOTAL PAID</span>
              <span>₦${Number(total).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing ${hospitalName}</p>
            <p>Get Well Soon!</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleConfirmProcessTest = async (shouldPrint: boolean = false) => {
    if (!selectedTest) return;

    try {
      setIsSaving(true);

      // Separate lists
      const prescribedList = (selectedTest.labTests || []).map(t => ({
        name: typeof t === 'string' ? t : (t as any).name || (t as any).item_name,
        price: 0
      }));

      const laboratorySelectedList = selectedTests.map(t => ({
        name: t.item_name,
        price: t.item_fees
      }));

      const totalAmount = selectedTest.fees + calculateTotalFees();

      // 1. Save Invoice to test_invoice (Selected tests ONLY as per request)
      const invoiceRes = await fetch('/api/laboratory.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_invoice',
          test_list: laboratorySelectedList, // Just selected tests
          total: totalAmount,
          inv_file_number: selectedTest.patientId, // Use patientId (e.g. SF-4) instead of fileNumber (parent)
          is_subfile: selectedTest.isSubfile ? 1 : (selectedTest.patientId.startsWith('SF-') || selectedTest.patientId.startsWith('sf-') ? 1 : 0),
          is_paid: isPaidToggle ? 1 : 0,
          performerId: 'Laboratory Staff'
        }),
      });

      const invoiceData = await invoiceRes.json();

      if (!invoiceData.success) {
        toast.error(invoiceData.error || 'Failed to generate invoice');
        return;
      }

      // 2. Update status in tbl_lab_tests
      await fetch('/api/laboratory.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_test_status',
          id: selectedTest.id,
          status: 'processed',
          performerId: 'Laboratory Staff'
        }),
      });

      // 3. Handle Printing (Includes both prescribed and selected with labels)
      if (shouldPrint) {
        handlePrintPOS(invoiceData.invoice_id, prescribedList, laboratorySelectedList, totalAmount);
      }

      // 4. Update local state
      setLabTests((prev) => prev.filter((test) => test.id !== selectedTest.id));

      toast.success('Lab Test Processed', {
        description: `Invoice #${invoiceData.invoice_id} created successfully.`,
      });

      addNotification({
        id: Date.now(),
        title: 'Laboratory Invoice Created',
        message: `Invoice #${invoiceData.invoice_id} generated for ${selectedTest.patientName}`,
        type: 'success',
        status: 'Unread',
        timestamp: new Date().toISOString(),
        priority: 'Medium',
      });

      setProcessModalOpen(false);
      setSelectedTest(null);
      setSelectedTests([]);

    } catch (e) {
      console.error('Error processing test:', e);
      toast.error('An error occurred during processing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTestToSelection = (test: AvailableTest) => {
    if (!selectedTests.find((t) => t.item_id === test.item_id)) {
      setSelectedTests((prev) => [...prev, test]);
    }
  };

  const handleRemoveTestFromSelection = (testId: string) => {
    setSelectedTests((prev) => prev.filter((t) => t.item_id !== testId));
  };

  const calculateTotalFees = () => {
    return selectedTests.reduce((total, test) => total + test.item_fees, 0);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Not Paid':
      case 'pending':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 uppercase text-[10px]">Pending Payment</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse uppercase text-[10px]">Processing</Badge>;
      case 'Awaiting Payment':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 uppercase text-[10px]">Awaiting Payment</Badge>;
      case 'Awaiting Results':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase text-[10px]">Ready for Testing</Badge>;
      case 'Paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px]">Paid</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 uppercase text-[10px]">Completed</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Pending Lab Tests</h1>
        <p className="text-muted-foreground">Manage pending laboratory tests and payments</p>
      </div>

      {/* KPI Mini Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Pending Count"
          value={pendingCount}
          icon={Clock}
          trend="up"
          trendValue="+8% from yesterday"
          color="primary"
          tooltip="Total number of pending lab tests"
        />
        <KPICard
          title="Awaiting Payment"
          value={labKPIs.awaitingPayment}
          icon={DollarSign}
          trend="down"
          trendValue="-3% from yesterday"
          color="secondary"
          tooltip="Tests in test_invoice awaiting payment"
        />
        <KPICard
          title="Awaiting Results"
          value={labKPIs.awaitingResult}
          icon={Activity}
          trend="neutral"
          trendValue="Same as yesterday"
          color="primary"
          tooltip="Tests in test_invoice awaiting results"
        />
      </div>

      {/* Pending Tests Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  Pending Lab Tests
                </CardTitle>
                <CardDescription>View and process pending laboratory tests</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Not Paid">Not Paid</SelectItem>
                    <SelectItem value="Awaiting Payment">Awaiting Payment</SelectItem>
                    <SelectItem value="Awaiting Results">Awaiting Results</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">File Number</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Patient Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Lab Tests</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedTests.map((test, index) => (
                      <motion.tr
                        key={test.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4 text-sm font-medium">#{test.id}</td>
                        <td className="py-4 px-4 text-sm font-semibold">{test.fileNumber}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-sm">{test.patientName}</p>
                            <p className="text-xs text-muted-foreground">{test.category} Patient</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {test.labTests.map((labTest: any, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] px-1 py-0">
                                {typeof labTest === 'string' ? labTest : (labTest.test_name || labTest.name || labTest.item_name)}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {new Date(test.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(test.status)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewTest(test)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                              onClick={() => handleProcessTest(test)}
                            >
                              Process
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {isLoading && (
                <div className="text-center py-12">
                  <Activity className="w-8 h-8 text-primary mx-auto mb-4 animate-spin-slow" />
                  <p className="text-muted-foreground animate-pulse">Loading tests...</p>
                </div>
              )}

              {!isLoading && paginatedTests.length === 0 && (
                <div className="text-center py-12">
                  <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No pending tests found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTests.length)} of {filteredTests.length} tests
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* View Test Modal */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => !open && setViewModalOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Test Details</DialogTitle>
                <DialogDescription>
                  Complete information about the laboratory test
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedTest && (
            <div className="space-y-6 py-4">
              {/* Test Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Test Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Test ID</Label>
                    <p className="font-semibold">{selectedTest.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Request Date</Label>
                    <p className="font-semibold">{new Date(selectedTest.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-semibold">{selectedTest.category}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Requested Doctor</Label>
                    <p className="font-semibold">{selectedTest.doctor}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Patient Name</Label>
                    <p className="font-semibold">{selectedTest.patientName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">File Number</Label>
                    <p className="font-semibold">{selectedTest.fileNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Age</Label>
                    <p className="font-semibold">{selectedTest.patientAge} years</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Gender</Label>
                    <p className="font-semibold">{selectedTest.patientGender}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedTest.patientPhone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tests Requested */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tests Requested</h3>
                <div className="space-y-2">
                  {selectedTest.labTests?.map((test, index) => {
                    const testName = typeof test === 'string' ? test : (test as any).test_name || (test as any).name || (test as any).item_name;
                    const availableTest = availableTests.find((t) => t.item_name === testName);
                    return (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <FlaskConical className="w-4 h-4 text-primary" />
                        <span className="font-medium flex-1">{testName}</span>
                        <Badge variant={availableTest ? 'default' : 'destructive'} className="text-xs">
                          {availableTest ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <p className="font-bold text-2xl text-primary">₦{selectedTest.fees.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTest.status)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Lab Test Modal */}
      <Dialog open={processModalOpen} onOpenChange={(open) => !open && setProcessModalOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600/10">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Process Lab Test</DialogTitle>
                <DialogDescription>
                  Review and process laboratory test payment
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedTest && (
            <div className="space-y-6 py-4">
              {/* Patient Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Patient Name:</span>
                    <span className="ml-2 text-blue-900">{selectedTest.patientName}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">File Number:</span>
                    <span className="ml-2 text-blue-900">{selectedTest.fileNumber}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-dashed border-primary/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Mark as Paid</Label>
                  <p className="text-xs text-muted-foreground">Enable if payment has been received</p>
                </div>
                <Switch
                  checked={isPaidToggle}
                  onCheckedChange={setIsPaidToggle}
                />
              </div>

              <Separator />

              {/* Prescribed Tests */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Prescribed Tests</h3>
                <div className="space-y-2">
                  {selectedTest.labTests.map((test, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <FlaskConical className="w-4 h-4 text-primary" />
                      <span className="font-medium flex-1">
                        {typeof test === 'string' ? test : (test as any).test_name || (test as any).name || (test as any).item_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Tests Panel */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Add Tests</h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search additional tests..."
                    className="pl-9"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      const items = document.querySelectorAll('.available-test-item');
                      items.forEach((item: any) => {
                        const name = item.getAttribute('data-name').toLowerCase();
                        item.style.display = name.includes(q) ? 'flex' : 'none';
                      });
                    }}
                  />
                </div>
                <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableTests.map((test) => (
                      <div
                        key={test.item_id}
                        data-name={test.item_name}
                        className="available-test-item flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div>
                          <div className="text-sm font-medium text-foreground">{test.item_name}</div>
                          <div className="text-xs text-muted-foreground">
                            ₦{Number(test.item_fees).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!selectedTests.find(t => t.item_id === test.item_id)) {
                              setSelectedTests(prev => [...prev, test]);
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Added Tests List */}
              {selectedTests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Additional Tests Added</h3>
                  <div className="space-y-2">
                    {selectedTests.map((test) => (
                      <div key={test.item_id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex items-center gap-3">
                          <FlaskConical className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{test.item_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold">₦{Number(test.item_fees).toLocaleString()}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTests(prev => prev.filter(t => t.item_id !== test.item_id))}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              <Separator />

              {/* Fees Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Fees Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Prescribed Tests Base</span>
                    <span className="text-sm font-semibold">₦{selectedTest.fees.toLocaleString()}</span>
                  </div>
                  {selectedTests.length > 0 && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Additional Tests</span>
                      <span className="text-sm font-semibold">₦{calculateTotalFees().toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg text-white">
                    <span className="text-lg font-bold">Total Amount</span>
                    <span className="text-2xl font-bold">
                      ₦{(selectedTest.fees + calculateTotalFees()).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setProcessModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => handleConfirmProcessTest(false)}
              disabled={isSaving}
            >
              {isSaving ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Process Only
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleConfirmProcessTest(true)}
              disabled={isSaving}
            >
              {isSaving ? <Activity className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Process and Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}