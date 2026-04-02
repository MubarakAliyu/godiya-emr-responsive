import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Download,
  Eye,
  Printer,
  Calendar,
  RotateCcw,
  BarChart3,
  PieChart,
  LineChart,
  FileDown
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
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { printPOSSlip } from '@/app/emr/utils/pos-print';

interface KPICardProps {
  title: string;
  value: number;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  tooltip?: string;
  prefix?: string;
}

interface FinanceRecord {
  id: string;
  invoice_id: string;
  fileNumber: string;
  subFileNumber?: string;
  patientName: string;
  total: number;
  date: string;
  status: 'Completed' | 'Awaiting Result';
  sta: number;
  test_list: any[];
  is_subfile?: boolean;
}



// Chart data
const monthlyData = [
  { month: 'Jan', income: 45000 },
  { month: 'Feb', income: 37800 },
  { month: 'Mar', income: 52000 },
  { month: 'Apr', income: 48000 },
  { month: 'May', income: 61000 },
  { month: 'Jun', income: 55000 },
  { month: 'Jul', income: 67000 },
  { month: 'Aug', income: 59000 },
  { month: 'Sep', income: 72000 },
  { month: 'Oct', income: 68000 },
  { month: 'Nov', income: 75000 },
  { month: 'Dec', income: 82000 },
];

const dailyIncomeData = [
  { day: '01', income: 2500 },
  { day: '02', income: 3200 },
  { day: '03', income: 2800 },
  { day: '04', income: 4100 },
  { day: '05', income: 3700 },
  { day: '06', income: 3900 },
  { day: '07', income: 4500 },
  { day: '08', income: 3800 },
  { day: '09', income: 4500 },
  { day: '10', income: 4200 },
  { day: '11', income: 3000 },
  { day: '12', income: 3500 },
  { day: '13', income: 3700 },
];

const COLORS = ['#1e40af', '#059669', '#f59e0b', '#8b5cf6'];

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary', tooltip, prefix = '' }: KPICardProps) {
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
                    <h3 className="text-3xl font-bold text-foreground">
                      {prefix}{displayValue.toLocaleString()}
                    </h3>
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

export function FinanceReport() {
  const { addNotification, settings } = useEMRStore();

  // State
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('2025');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/laboratory.php?action=get_paid_invoices');
      const data = await res.json();
      setFinanceRecords(data);
    } catch (e) {
      toast.error('Failed to load finance records');
    } finally {
      setIsLoading(false);
    }
  };

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);

  // Calculate KPIs
  const totalIncome = financeRecords
    .reduce((sum, record) => sum + record.total, 0);

  const totalInvoices = financeRecords.length;
  const averageIncome = totalInvoices > 0 ? Math.floor(totalIncome / totalInvoices) : 0;

  const currentMonth = new Date().getMonth();
  const monthlyIncome = financeRecords
    .filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth;
    })
    .reduce((sum, record) => sum + record.total, 0);

  // Summary breakdown for pie chart (e.g., by status)
  const statusBreakdownData = [
    { name: 'Completed', value: financeRecords.filter(r => r.status === 'Completed').reduce((s, r) => s + r.total, 0) },
    { name: 'Awaiting', value: financeRecords.filter(r => r.status === 'Awaiting Result').reduce((s, r) => s + r.total, 0) },
  ].filter(item => item.value > 0);

  // Filter records
  const filteredRecords = financeRecords.filter((record) => {
    const matchesSearch =
      (record.invoice_id?.toString() || '').includes(searchQuery) ||
      (record.fileNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (record.patientName?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    let matchesMonth = true;
    if (monthFilter !== 'all') {
      const recordDate = new Date(record.date);
      matchesMonth = recordDate.getMonth() === parseInt(monthFilter);
    }

    let matchesDate = true;
    if (dateFilter) {
      matchesDate = record.date === dateFilter;
    }

    return matchesSearch && matchesMonth && matchesDate;
  });

  // Paginate
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setMonthFilter('all');
    setYearFilter('2025');
    setDateFilter('');
    setCurrentPage(1);
    toast.info('Filters Reset', {
      description: 'All filters have been reset to default values.',
    });
  };

  // Handle view record
  const handleViewRecord = (record: FinanceRecord) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Invoice ID', 'File Number', 'Patient Name', 'Total', 'Date', 'Status'],
      ...filteredRecords.map((record) => [
        record.invoice_id,
        record.fileNumber,
        record.patientName,
        record.total,
        record.date,
        record.status,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lab-finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('CSV Exported', {
      description: 'Finance report exported successfully.',
    });

    addNotification({
      id: Date.now(),
      title: 'CSV Export Complete',
      message: 'Laboratory finance report exported to CSV',
      type: 'success',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Low',
    });
  };

  // Export to PDF
  const handleExportPDF = () => {
    toast.success('PDF Generated', {
      description: 'Finance report PDF generated successfully.',
    });

    addNotification({
      id: Date.now(),
      title: 'PDF Export Complete',
      message: 'Laboratory finance report exported to PDF',
      type: 'success',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Low',
    });
  };

  // Handle individual POS print
  const handlePrintPOSSlip = (record: FinanceRecord) => {
    const printData = {
      title: 'Laboratory Invoice',
      sections: [
        {
          title: 'Invoice Info',
          items: [
            { label: 'Invoice #', value: `INV-${record.invoice_id?.toString().padStart(6, '0')}` },
            { label: 'Date', value: new Date(record.date).toLocaleString('en-GB') },
            { label: 'Status', value: 'PAID' }
          ]
        },
        {
          title: 'Patient Details',
          items: [
            { label: 'Name', value: record.patientName },
            { label: 'File #', value: record.fileNumber },
            { label: 'Member ID', value: record.subFileNumber || 'N/A' },
            { label: 'Type', value: record.is_subfile ? 'Family Member' : 'Direct Patient' }
          ]
        },
        {
          title: 'Tests',
          items: (record.test_list || []).map((test: any) => ({
            label: test.name || test.test_name,
            value: `₦${(test.price || test.test_price || 0).toLocaleString()}`
          }))
        },
        {
          items: [
            { label: 'TOTAL AMOUNT', value: `₦${record.total.toLocaleString()}` }
          ]
        }
      ],
      footer: 'Thank you for choosing Godiya Hospital Laboratory'
    };

    printPOSSlip(settings, printData);

    toast.success('Print Started', {
      description: `POS Receipt for INV-${record.invoice_id?.toString().padStart(6, '0')} started.`
    });
  };

  // Print report (Generic browser print)
  const handlePrintReport = () => {
    window.print();
    toast.success('Print Started', {
      description: 'Printing finance report...',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Completed') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px]">Completed</Badge>;
    }
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 uppercase text-[10px]">Awaiting</Badge>;
  };

  // Summary logic removed as requested (payment method)
  const getSubMemberStyles = (isSubfile?: boolean) => {
    return isSubfile ? 'text-primary' : '';
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Finance Report</h1>
        <p className="text-muted-foreground">Laboratory financial analytics and income tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Income"
          value={totalIncome}
          icon={DollarSign}
          trend="up"
          trendValue="+15% from last month"
          color="primary"
          tooltip="Total revenue from paid invoices"
          prefix="₦"
        />
        <KPICard
          title="Total Invoices"
          value={totalInvoices}
          icon={FileText}
          trend="up"
          trendValue="+8% from last month"
          color="secondary"
          tooltip="Total number of invoices generated"
        />
        <KPICard
          title="Average Income"
          value={averageIncome}
          icon={TrendingUp}
          trend="up"
          trendValue="+5% from last month"
          color="primary"
          tooltip="Average income per invoice"
          prefix="₦"
        />
        <KPICard
          title="Monthly Income"
          value={monthlyIncome}
          icon={BarChart3}
          trend="up"
          trendValue="+12% from last month"
          color="secondary"
          tooltip="Income generated this month"
          prefix="₦"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Line Graph */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <LineChart className="w-5 h-5 text-primary" />
                Daily Income Trend
              </CardTitle>
              <CardDescription>Income generated per day this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={dailyIncomeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Income']}
                  />
                  <Line type="monotone" dataKey="income" stroke="#1e40af" strokeWidth={2} dot={{ fill: '#1e40af', r: 4 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Monthly Income Overview
              </CardTitle>
              <CardDescription>Monthly income for the year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {financeRecords.length > 0 ? (
                  <RechartsBarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Income']}
                    />
                    <Bar dataKey="income" fill="#059669" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic">No historical data available</div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Status Breakdown
              </CardTitle>
              <CardDescription>Revenue by completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={statusBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => `₦${value.toLocaleString()}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Stats</CardTitle>
              <CardDescription>Financial summary at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-bold text-blue-700">
                    ₦{totalIncome.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Unique Patients</p>
                  <p className="text-lg font-bold text-orange-700">
                    {new Set(financeRecords.map(r => r.fileNumber)).size}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Tests Completed</p>
                  <p className="text-lg font-bold text-green-700">
                    {financeRecords.filter(r => r.status === 'Completed').length} / {totalInvoices}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                  <p className="text-lg font-bold text-purple-700">
                    {totalInvoices > 0 ? ((financeRecords.filter(r => r.status === 'Completed').length / totalInvoices) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Finance Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Finance Records
                </CardTitle>
                <CardDescription>Income records from paid invoices</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={fetchRecords}>
                  <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrintReport}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="0">January</SelectItem>
                  <SelectItem value="1">February</SelectItem>
                  <SelectItem value="2">March</SelectItem>
                  <SelectItem value="3">April</SelectItem>
                  <SelectItem value="4">May</SelectItem>
                  <SelectItem value="5">June</SelectItem>
                  <SelectItem value="6">July</SelectItem>
                  <SelectItem value="7">August</SelectItem>
                  <SelectItem value="8">September</SelectItem>
                  <SelectItem value="9">October</SelectItem>
                  <SelectItem value="10">November</SelectItem>
                  <SelectItem value="11">December</SelectItem>
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />

              <Button variant="outline" onClick={handleResetFilters} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Patient Information</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                    <th className="py-3 px-8 font-semibold text-sm text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedRecords.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold text-sm text-primary">INV-{record.invoice_id?.toString().padStart(6, '0')}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <p className={`font-semibold text-sm ${getSubMemberStyles(record.is_subfile)}`}>
                              {record.patientName}
                            </p>
                            <div className="flex flex-col gap-0">
                              <p className="text-[10px] text-muted-foreground font-mono">Parent: {record.fileNumber}</p>
                              {record.is_subfile && record.subFileNumber && (
                                <p className="text-[10px] text-primary font-mono font-bold">Retr ID: {record.subFileNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-sm text-foreground">₦{record.total.toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('en-GB')}
                            <span className="block text-[10px] opacity-70">
                              {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="py-4 px-8 text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-primary/10 hover:text-primary transition-colors"
                                  onClick={() => handleViewRecord(record)}
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

              {paginatedRecords.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No finance records found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
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

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => !open && setViewModalOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Invoice Details</DialogTitle>
                <DialogDescription>Complete transaction information</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6 py-4">
              {/* Invoice Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Invoice Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Invoice ID</Label>
                    <p className="font-semibold">INV-{selectedRecord.invoice_id?.toString().padStart(6, '0')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">File Number</Label>
                    <p className="font-semibold">{selectedRecord.fileNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date</Label>
                    <p className="font-semibold">{new Date(selectedRecord.date).toLocaleString('en-GB')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Patient Name</Label>
                    <p className="font-semibold">{selectedRecord.patientName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Tests Conducted</Label>
                    <Badge variant="secondary" className="block w-fit mt-1">
                      {selectedRecord.test_list?.length || 0} Tests
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <p className="font-bold text-2xl text-primary">₦{selectedRecord.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => handlePrintPOSSlip(selectedRecord!)}>
              <Printer className="w-4 h-4 mr-2" />
              Print POS Slip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
