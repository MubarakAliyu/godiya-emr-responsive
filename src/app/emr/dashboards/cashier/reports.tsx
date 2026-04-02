import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  Pill,
  FlaskConical,
  Stethoscope,
  Bed,
  Filter,
  BarChart3,
  PieChart,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';

// Report Type
type ReportType =
  | 'daily-summary'
  | 'payment-breakdown'
  | 'revenue-analysis'
  | 'patient-payments'
  | 'service-wise'
  | 'payment-methods';

interface ReportTemplate {
  id: ReportType;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'daily-summary',
    title: 'Daily Payment Summary',
    description: 'Overview of all payments collected today',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'payment-breakdown',
    title: 'Payment Breakdown',
    description: 'Detailed breakdown by payment categories',
    icon: PieChart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    id: 'revenue-analysis',
    title: 'Revenue Analysis',
    description: 'Revenue trends and analysis over time',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    id: 'patient-payments',
    title: 'Patient Payment History',
    description: 'Complete payment history by patient',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'service-wise',
    title: 'Service-wise Report',
    description: 'Payments grouped by service type',
    icon: Activity,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    id: 'payment-methods',
    title: 'Payment Methods Report',
    description: 'Analysis of payment methods used',
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  }
];

export function CashierReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransaction: 0,
    topService: 'N/A'
  });

  const [reportData, setReportData] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/cashier_reports.php?type=stats&from=${dateFrom}&to=${dateTo}`);
      const data = await response.json();
      setStats({
        totalRevenue: parseFloat(data.totalRevenue) || 0,
        totalTransactions: parseInt(data.totalTransactions) || 0,
        avgTransaction: parseFloat(data.avgTransaction) || 0,
        topService: data.topService || 'N/A'
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateFrom, dateTo]);



  const handleGenerateReport = async (reportType: ReportType) => {
    try {
      setIsLoading(true);
      setSelectedReport(reportType);

      let dataType = reportType as string;
      if (reportType === 'daily-summary' || reportType === 'patient-payments') {
        dataType = 'transactions';
      }

      const response = await fetch(`/api/cashier_reports.php?type=${dataType}&from=${dateFrom}&to=${dateTo}`);
      const data = await response.json();

      setReportData(data);

      toast.success('Report Generated', {
        description: `${reportTemplates.find(r => r.id === reportType)?.title} has been generated successfully`,
      });
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintReport = () => {
    if (!selectedReport) {
      toast.error('No Report Selected', {
        description: 'Please select a report to print',
      });
      return;
    }
    toast.success('Printing Report', {
      description: 'Report has been sent to the printer',
    });
  };

  const handleExportPDF = () => {
    if (!selectedReport) {
      toast.error('No Report Selected', {
        description: 'Please select a report to export',
      });
      return;
    }
    toast.success('Exporting PDF', {
      description: 'Report is being exported as PDF',
    });
  };

  const handleExportExcel = () => {
    if (!selectedReport) {
      toast.error('No Report Selected', {
        description: 'Please select a report to export',
      });
      return;
    }
    toast.success('Exporting Excel', {
      description: 'Report is being exported as Excel file',
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Reports</h1>
          <p className="text-muted-foreground">
            Generate and view comprehensive payment reports
          </p>
        </div>
        {selectedReport && (
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={handlePrintReport}>
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Service</p>
                  <p className="text-lg font-bold">{stats.topService}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Transaction</p>
                  <p className="text-lg font-bold">₦{Math.round(stats.avgTransaction).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Date Range
          </CardTitle>
          <CardDescription>Select date range for reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-bold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTemplates.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedReport === report.id ? 'ring-2 ring-primary' : ''
                  }`}
                onClick={() => handleGenerateReport(report.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${report.bgColor}`}>
                      <report.icon className={`w-6 h-6 ${report.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                      <Button
                        size="sm"
                        variant={selectedReport === report.id ? 'default' : 'outline'}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleGenerateReport(report.id);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Report Display Area */}
      {selectedReport && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {reportTemplates.find(r => r.id === selectedReport)?.title}
                  </CardTitle>
                  <CardDescription>
                    Report Period: {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm">
                  Generated: {new Date().toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {selectedReport === 'daily-summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Revenue Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Revenue</span>
                            <span className="font-bold text-xl text-primary">₦{stats.totalRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Transactions</span>
                            <span className="font-semibold">{stats.totalTransactions}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Average per Transaction</span>
                            <span className="font-semibold">₦{Math.round(stats.avgTransaction).toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Daily Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            This summary shows collecting activities between {dateFrom} and {dateTo}.
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-muted-foreground">Top Performing Service</span>
                            <Badge variant="secondary">{stats.topService}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reportData && Array.isArray(reportData) ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Patient</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.map((txn: any) => (
                              <TableRow key={txn.id}>
                                <TableCell className="font-medium text-xs">
                                  {new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[10px]">{txn.type}</Badge>
                                </TableCell>
                                <TableCell className="text-sm">{txn.patient}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="capitalize text-[10px]">{txn.method}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold">₦{(parseFloat(txn.amount) || 0).toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">No transactions found</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedReport === 'service-wise' && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData && Array.isArray(reportData) ? (
                        reportData.map((service: any) => (
                          <TableRow key={service.service}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-muted-foreground" />
                                <span className="font-semibold">{service.service}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{service.count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-secondary">
                              ₦{(parseFloat(service.amount) || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">
                                {((parseFloat(service.amount) / (stats.totalRevenue || 1)) * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No data available</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-center">{stats.totalTransactions}</TableCell>
                        <TableCell className="text-right text-primary">₦{stats.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedReport === 'payment-methods' && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData && Array.isArray(reportData) ? (
                        reportData.map((method: any) => (
                          <TableRow key={method.method}>
                            <TableCell className="font-semibold uppercase">{method.method}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{method.count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-secondary">
                              ₦{(parseFloat(method.amount) || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-medium">
                                {((parseFloat(method.amount) / (stats.totalRevenue || 1)) * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No data available</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-center">{stats.totalTransactions}</TableCell>
                        <TableCell className="text-right text-primary">₦{stats.totalRevenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedReport === 'revenue-analysis' && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Transactions</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData && Array.isArray(reportData) ? (
                        reportData.map((day: any, idx: number) => {
                          const prevRevenue = idx > 0 ? parseFloat(reportData[idx - 1].revenue) : 0;
                          const currentRevenue = parseFloat(day.revenue) || 0;
                          const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

                          return (
                            <TableRow key={day.date}>
                              <TableCell className="font-medium">
                                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{day.transactions}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-primary">
                                ₦{currentRevenue.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {idx > 0 && (
                                  <span className={growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedReport === 'patient-payments' && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient Details</TableHead>
                        <TableHead className="text-center">Payments</TableHead>
                        <TableHead className="text-right">Total Contributed</TableHead>
                        <TableHead className="text-right">Last Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData && Array.isArray(reportData) ? (
                        // We reuse transactions data but group it on client side for this view
                        Object.values(reportData.reduce((acc: any, txn: any) => {
                          if (!acc[txn.patient]) {
                            acc[txn.patient] = { name: txn.patient, count: 0, total: 0, last: txn.created_at };
                          }
                          acc[txn.patient].count++;
                          acc[txn.patient].total += parseFloat(txn.amount) || 0;
                          return acc;
                        }, {})).map((p: any) => (
                          <TableRow key={p.name}>
                            <TableCell className="font-semibold">{p.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{p.count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-secondary">
                              ₦{p.total.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {new Date(p.last).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedReport === 'payment-breakdown' && (
                <div className="text-center py-12 text-muted-foreground">
                  <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50 text-purple-500" />
                  <p className="text-lg font-semibold mb-2">Category Breakdown</p>
                  <p>Category-wise analysis is available in the "Service-wise Report".</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => handleGenerateReport('service-wise')}
                  >
                    View Service Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!selectedReport && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No Report Selected</p>
            <p>Select a report template above to generate and view reports</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
