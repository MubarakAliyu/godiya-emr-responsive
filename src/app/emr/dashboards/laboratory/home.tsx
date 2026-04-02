import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertCircle, Calendar, CheckCircle, CheckCircle2, ClipboardList, Clock, DollarSign, Download, Edit, Eye, FileText, Filter, FlaskConical, Mail, MapPin, Minus, Phone, Plus, Search, Trash2, TrendingDown, TrendingUp, User, X } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { Textarea } from '@/app/components/ui/textarea';

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
  invoiceNumber: string;
  patientName: string;
  fileNumber: string;
  subFileNumber?: string;
  tests: any[];
  testsCount: number;
  requestDate: string;
  status: 'Pending' | 'Paid' | 'Completed';
  priority: 'Normal' | 'Urgent' | 'Critical';
  doctor: string;
  amount: number;
  isPaid: boolean;
  patientPhone?: string;
  is_subfile?: boolean;
}

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

interface QuickActionCardProps {
  title: string;
  count: number;
  icon: any;
  onClick: () => void;
  color?: string;
  highlight?: boolean;
}

function QuickActionCard({ title, count, icon: Icon, onClick, color = 'primary', highlight }: QuickActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg ${highlight ? 'border-primary border-2' : ''
          }`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className="p-3 rounded-xl"
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
            <Badge variant={highlight ? 'default' : 'secondary'} className="text-lg px-3 py-1">
              {count}
            </Badge>
          </div>
          <h4 className="text-lg font-semibold text-foreground">{title}</h4>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function LaboratoryDashboardHome() {
  const navigate = useNavigate();
  const { addNotification } = useEMRStore();

  // State for lab tests
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [kpis, setKpis] = useState({
    totalTests: 0,
    pendingTests: 0,
    completedTests: 0,
    testsToday: 0,
    awaitingPayment: 0,
    awaitingResult: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<LabTest | null>(null);

  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Edit form state
  const [editFormData, setEditFormData] = useState<Partial<LabTest>>({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch KPIs
      const kpisRes = await fetch('/api/laboratory.php?action=get_lab_kpis');
      const kpisData = await kpisRes.json();
      setKpis(kpisData);

      // Fetch Recent Invoices
      const testsRes = await fetch('/api/laboratory.php?action=get_invoice_records');
      const testsData = await testsRes.json();

      // Fetch Pending requests from tbl_lab_tests as requested
      const pendingRes = await fetch('/api/laboratory.php?action=get_pending_tests&sta=pending');
      const pendingData = await pendingRes.json();

      const mappedInvoices: LabTest[] = testsData.map((t: any) => ({
        id: t.id,
        invoiceNumber: t.invoiceNumber,
        patientName: t.patientName,
        fileNumber: t.fileNumber,
        subFileNumber: t.subFileNumber,
        tests: t.tests || [],
        testsCount: (t.tests || []).length,
        requestDate: t.date,
        status: t.status === 'Paid' ? ((t.sta === 1) ? 'Completed' : 'Paid') : 'Pending',
        priority: 'Normal',
        doctor: 'Medical Officer',
        amount: t.total,
        isPaid: t.status === 'Paid',
        patientPhone: t.phoneNumber,
        is_subfile: t.is_subfile
      }));

      const mappedPending: LabTest[] = Array.isArray(pendingData) ? pendingData.map((p: any) => ({
        id: p.id,
        invoiceNumber: `REQ-${p.id}`,
        patientName: p.patientName,
        fileNumber: p.fileNumber,
        subFileNumber: p.patientId.startsWith('SF-') ? p.patientId : undefined,
        tests: p.labTests || [],
        testsCount: (p.labTests || []).length,
        requestDate: p.date,
        status: 'Pending',
        priority: 'Normal',
        doctor: p.doctor || 'Doctor',
        amount: 0,
        isPaid: p.isPaid === 1,
        patientPhone: p.patientPhone,
        is_subfile: p.patientId.startsWith('SF-')
      })) : [];

      // Merge and sort by date descending
      const combined = [...mappedPending, ...mappedInvoices].sort((a, b) =>
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      );

      setLabTests(combined);
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate KPIs
  const totalTests = kpis.totalTests;
  const pendingTests = kpis.awaitingResult; // Awaiting Result are the actionable ones for staff
  const completedTests = kpis.completedTests;
  const testsToday = kpis.testsToday;
  const paidTests = kpis.awaitingResult + kpis.completedTests; // Roughly those that have been paid for

  // Filter tests
  const filteredTests = labTests.filter(test => {
    const matchesSearch =
      (test.patientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (test.id?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (test.fileNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginate tests
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle View
  const handleView = (test: LabTest) => {
    setSelectedTest(test);
    setViewModalOpen(true);
  };

  // Handle Edit
  const handleEdit = (test: LabTest) => {
    setSelectedTest(test);
    setEditFormData(test);
    setEditModalOpen(true);
  };

  // Handle Delete
  const handleDeleteClick = (test: LabTest) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (testToDelete) {
      setLabTests(labTests.filter(t => t.id !== testToDelete.id));
      toast.success('Test Deleted', {
        description: `Test ${testToDelete.id} for ${testToDelete.patientName} has been deleted.`,
      });
      addNotification({
        id: Date.now(),
        title: 'Test Deleted',
        message: `Test ${testToDelete.id} has been removed from the system`,
        type: 'info',
        status: 'Unread',
        timestamp: new Date().toISOString(),
        priority: 'Medium',
      });
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    }
  };

  // Handle Edit Save
  const handleEditSave = () => {
    if (selectedTest && editFormData) {
      setLabTests(labTests.map(t =>
        t.id === selectedTest.id ? { ...t, ...editFormData } : t
      ));
      toast.success('Test Updated', {
        description: `Test ${selectedTest.id} has been updated successfully.`,
      });
      addNotification({
        id: Date.now(),
        title: 'Test Updated',
        message: `Test ${selectedTest.id} for ${selectedTest.patientName} has been updated`,
        type: 'success',
        status: 'Unread',
        timestamp: new Date().toISOString(),
        priority: 'Low',
      });
      setEditModalOpen(false);
      setSelectedTest(null);
    }
  };

  // Process Test
  const handleProcessTest = (test: LabTest) => {
    const updatedTests = labTests.map(t =>
      t.id === test.id ? { ...t, status: 'Completed' as const } : t
    );
    setLabTests(updatedTests);
    toast.success('Test Processed', {
      description: `Test ${test.invoiceNumber} for ${test.patientName} has been marked as completed.`,
    });
    addNotification({
      id: Date.now(),
      title: 'Test Completed',
      message: `${test.patientName}'s lab tests have been completed`,
      type: 'success',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'High',
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'Paid':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Paid</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'Urgent':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Urgent</Badge>;
      case 'Normal':
        return <Badge variant="secondary">Normal</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Laboratory Dashboard</h1>
          <p className="text-muted-foreground">Manage lab tests, results, and diagnostic services</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={isLoading}>
          <Activity className="w-4 h-4 mr-2" />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Tests"
          value={totalTests}
          icon={FlaskConical}
          trend="up"
          trendValue="+12% from last week"
          color="primary"
          tooltip="Total number of lab tests in the system"
        />
        <KPICard
          title="Pending Tests"
          value={pendingTests}
          icon={Clock}
          trend="down"
          trendValue="-5% from yesterday"
          color="secondary"
          tooltip="Tests waiting to be processed"
        />
        <KPICard
          title="Completed Tests"
          value={completedTests}
          icon={CheckCircle2}
          trend="up"
          trendValue="+18% this week"
          color="secondary"
          tooltip="Tests that have been completed"
        />
        <KPICard
          title="Tests Today"
          value={testsToday}
          icon={Activity}
          trend="neutral"
          trendValue="Same as yesterday"
          color="primary"
          tooltip="Tests requested today"
        />
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            title="All Tests"
            count={totalTests}
            icon={ClipboardList}
            onClick={() => {
              navigate('/emr/laboratory-staff/all-lab-tests');
            }}
            color="primary"
            highlight={statusFilter === 'all'}
          />
          <QuickActionCard
            title="Pending Tests"
            count={pendingTests}
            icon={Clock}
            onClick={() => {
              navigate('/emr/laboratory-staff/pending-tests');
            }}
            color="secondary"
            highlight={statusFilter === 'Pending'}
          />
          <QuickActionCard
            title="Paid Tests"
            count={paidTests}
            icon={DollarSign}
            onClick={() => {
              setStatusFilter('Paid');
              toast.info('Showing Paid Tests');
            }}
            color="secondary"
            highlight={statusFilter === 'Paid'}
          />
          <QuickActionCard
            title="Invoices"
            count={labTests.filter(t => t.isPaid).length}
            icon={FileText}
            onClick={() => {
              navigate('/emr/laboratory/invoices');
              toast.info('Opening Invoices');
            }}
            color="primary"
          />
        </div>
      </div>

      {/* Recent Lab Tests Table */}
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
                  Recent Lab Tests
                </CardTitle>
                <CardDescription>View and manage all laboratory test requests</CardDescription>
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
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 animate-spin rounded-full border-4 border-primary border-t-transparent opacity-50" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice #</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Patient</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Tests</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                      <th className="py-3 px-8 font-semibold text-sm text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginatedTests.map((test, index) => (
                        <motion.tr
                          key={test.invoiceNumber}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-medium text-sm font-mono text-primary">{test.invoiceNumber}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-0.5">
                              <p className={`font-semibold text-sm ${test.is_subfile ? 'text-purple-700' : ''}`}>{test.patientName}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">File: {test.fileNumber}</p>
                              {test.is_subfile && test.subFileNumber && (
                                <p className="text-[10px] text-primary font-mono font-bold">ID: {test.subFileNumber}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary">{test.testsCount} {test.testsCount === 1 ? 'Test' : 'Tests'}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm">{new Date(test.requestDate).toLocaleDateString()}</p>
                          </td>

                          <td className="py-4 px-4">
                            {getStatusBadge(test.status)}
                          </td>
                          <td className="py-4 px-8 text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleView(test)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>

                {paginatedTests.length === 0 && (
                  <div className="text-center py-12">
                    <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No tests found</p>
                  </div>
                )}
              </div>
            )}

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
                    <p className="font-semibold">{new Date(selectedTest.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTest.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTest.priority)}</div>
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
                    <p className="font-semibold font-mono">{selectedTest.fileNumber}</p>
                  </div>
                  {selectedTest.is_subfile && selectedTest.subFileNumber && (
                    <div>
                      <Label className="text-muted-foreground">Member ID (Retrieval)</Label>
                      <p className="font-semibold font-mono text-primary">{selectedTest.subFileNumber}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-semibold">{selectedTest.is_subfile ? 'Family Member' : 'Direct Patient'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-semibold">{selectedTest.patientPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tests Requested */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tests Requested</h3>
                <div className="space-y-2">
                  {selectedTest.tests.map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-primary" />
                        <span className="font-medium">{test.test_name || test.name || test}</span>
                      </div>
                      {(test.test_price || test.price) && (
                        <span className="text-sm font-semibold">₦{(test.test_price || test.price).toLocaleString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* No clinical notes or results from live data */}

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-semibold text-lg">₦{selectedTest.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Status</Label>
                    <div className="mt-1">
                      <Badge variant={selectedTest.isPaid ? 'default' : 'destructive'}>
                        {selectedTest.isPaid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
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

      {/* Edit Test Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => !open && setEditModalOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Edit className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit Test</DialogTitle>
                <DialogDescription>
                  Update test information and details
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-secondary hover:bg-secondary/90"
              onClick={handleEditSave}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete test <strong>{testToDelete?.id}</strong> for <strong>{testToDelete?.patientName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}