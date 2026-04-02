import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  Search,
  Download,
  Eye,
  Activity,
  FileText,
  PlusCircle,
  Edit,
  FileUp,
  ImageIcon,
  Loader2,
  X,
  AlertCircle,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
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
import { Textarea } from '@/app/components/ui/textarea';

interface PaidInvoice {
  id: string;
  invoice_id: string;
  fileNumber: string;
  patientName: string;
  total: number;
  date: string;
  status: 'Completed' | 'Awaiting Result';
  sta: number;
  test_list: any[];
  is_subfile?: boolean;
  subFileNumber?: string;
}

export function PaidLabTests() {
  const [invoices, setInvoices] = useState<PaidInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaidInvoice | null>(null);

  // Result entry states
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [resultData, setResultData] = useState<Record<string, string>>({});
  const [resultImages, setResultImages] = useState<Record<string, string>>({});
  const [viewingResult, setViewingResult] = useState<any>(null);
  const [viewingResultData, setViewingResultData] = useState<any>(null);
  const [isViewingLoading, setIsViewingLoading] = useState(false);
  const [isEditingResult, setIsEditingResult] = useState(false);

  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/laboratory.php?action=get_paid_invoices');
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data.map(inv => ({
          ...inv,
          status: Number(inv.sta) === 1 ? 'Completed' : 'Awaiting Result'
        })));
      }
    } catch (e) {
      console.error('Failed to fetch paid invoices:', e);
      toast.error('Failed to load paid tests');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.fileNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (inv.patientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (inv.id?.toString() || '').includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewInvoice = (inv: PaidInvoice) => {
    setSelectedInvoice(inv);
    setViewModalOpen(true);
  };

  const handleAddResult = (inv: PaidInvoice) => {
    setSelectedInvoice(inv);
    setResultData({});
    setResultImages({});
    setIsEditingResult(false);
    setResultModalOpen(true);
  };

  const handleViewResult = async (inv: any) => {
    setViewingResult(inv);
    setIsViewingLoading(true);
    try {
      const res = await fetch(`/api/laboratory.php?action=get_test_result&lab_invoice_id=${inv.id}`);
      const data = await res.json();
      if (!data || data.error) {
        toast.error('Error', { description: data?.error || 'Failed to fetch results' });
        setViewingResult(null);
      } else {
        setViewingResultData(data);
      }
    } catch (e) {
      toast.error('Error', { description: 'Connection failed' });
      setViewingResult(null);
    } finally {
      setIsViewingLoading(false);
    }
  };

  const handleEditResult = async (inv: PaidInvoice) => {
    setSelectedInvoice(inv);
    setIsEditingResult(true);
    setResultModalOpen(true);

    try {
      const res = await fetch(`/api/laboratory.php?action=get_test_result&lab_invoice_id=${inv.id}`);
      const data = await res.json();
      if (data && !data.error) {
        setResultData(data.result_list || {});

        // Try to parse images from result_picture
        try {
          if (data.result_picture && data.result_picture.startsWith('{')) {
            setResultImages(JSON.parse(data.result_picture));
          } else {
            // Old format: single photo, assign to nothing or handle specifically
            setResultImages({});
          }
        } catch (e) {
          setResultImages({});
        }
      }
    } catch (e) {
      console.error('Failed to fetch existing result:', e);
      toast.error('Failed to load existing results');
    }
  };

  const handleFileChange = (testName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large', { description: 'Maximum file size is 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setResultImages(prev => ({ ...prev, [testName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (testName: string) => {
    setResultImages(prev => {
      const updated = { ...prev };
      delete updated[testName];
      return updated;
    });
  };

  const handleSaveResult = async () => {
    if (!selectedInvoice) return;

    try {
      setIsSavingResult(true);
      const res = await fetch('/api/laboratory.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_test_result',
          lab_invoice_id: selectedInvoice.id,
          result_list: resultData,
          result_picture: JSON.stringify(resultImages)
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditingResult ? 'Result updated' : 'Result saved successfully');
        setResultModalOpen(false);
        fetchInvoices();
      } else {
        toast.error(data.error || 'Failed to save result');
      }
    } catch (e) {
      console.error('Error saving result:', e);
      toast.error('An error occurred');
    } finally {
      setIsSavingResult(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Awaiting Result':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 uppercase text-[10px]">Awaiting Result</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 uppercase text-[10px]">Completed</Badge>;
      default:
        return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Paid Lab Tests</h1>
          <p className="text-muted-foreground">Monitor and manage paid laboratory test invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchInvoices} disabled={isLoading}>
            <Activity className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card shadow="sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Paid Invoices
              </CardTitle>
              <CardDescription>All successfully paid laboratory test requests</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search file no, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Awaiting Result">Awaiting Result</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Invoice ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Patient Information</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Tests</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedInvoices.map((inv, index) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-4 px-4 font-medium text-sm text-primary">#{inv.invoice_id}</td>
                      <td className="py-4 px-4 text-sm whitespace-nowrap">
                        {new Date(inv.date).toLocaleDateString()}
                        <div className="text-[10px] text-muted-foreground">{new Date(inv.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`font-semibold text-sm ${inv.is_subfile ? 'text-primary' : ''}`}>{inv.patientName}</div>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <div className="text-[10px] text-muted-foreground font-mono">Parent: {inv.fileNumber}</div>
                          {inv.is_subfile && inv.subFileNumber && (
                            <div className="text-[10px] text-primary font-mono font-bold">Retr ID: {inv.subFileNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {inv.test_list?.slice(0, 2).map((t, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] whitespace-nowrap font-normal">
                              {t.name}
                            </Badge>
                          ))}
                          {inv.test_list?.length > 2 && (
                            <Badge variant="outline" className="text-[10px] font-normal">+{inv.test_list.length - 2} more</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-sm">₦{inv.total.toLocaleString()}</td>
                      <td className="py-4 px-4">{getStatusBadge(inv.status)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="hover:bg-primary/10 hover:text-primary transition-colors"
                                  onClick={() => handleViewInvoice(inv)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {inv.status === 'Awaiting Result' ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-600 hover:bg-blue-50 transition-colors"
                                    onClick={() => handleAddResult(inv)}
                                  >
                                    <PlusCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add Test Result</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-teal-600 hover:bg-teal-50 transition-colors"
                                      onClick={() => handleViewResult(inv)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Results</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-orange-600 hover:bg-orange-50 transition-colors"
                                      onClick={() => handleEditResult(inv)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Result</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {isLoading && (
              <div className="text-center py-20">
                <Activity className="w-10 h-10 text-primary mx-auto mb-4 animate-spin-slow" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading paid tests...</p>
              </div>
            )}

            {!isLoading && paginatedInvoices.length === 0 && (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-muted-foreground">No records found</h3>
                <p className="text-sm text-muted-foreground">Adjust your filters or try a different search term</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} records
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
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i));
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-9 h-9"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
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

      {/* Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={(open) => !open && setViewModalOpen(false)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Invoice Details</DialogTitle>
                <DialogDescription>Full record for Invoice #{selectedInvoice?.invoice_id}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Patient Name</Label>
                  <p className="font-semibold text-base">{selectedInvoice.patientName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">File Number</Label>
                  <p className="font-semibold text-base font-mono">{selectedInvoice.fileNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Generated Date</Label>
                  <p className="text-sm font-medium">{new Date(selectedInvoice.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Payment Status</Label>
                  <div className="mt-1">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 font-bold">PAID</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">Test Services Performed</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedInvoice.test_list?.map((test, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg group hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <FlaskConical className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">{test.name}</span>
                      </div>
                      <span className="font-bold text-sm">₦{Number(test.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-5 flex justify-between items-center border border-primary/10">
                <div>
                  <h4 className="text-sm font-medium text-primary uppercase tracking-widest">Total Amount</h4>
                  <p className="text-xs text-muted-foreground mt-1 text-balance">All inclusive charges for services rendered</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-primary tracking-tight">₦{selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close Record</Button>
            <Button className="bg-primary hover:bg-primary/90 shadow-md">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Entry Modal */}
      <Dialog open={resultModalOpen} onOpenChange={(open) => !open && setResultModalOpen(false)}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEditingResult ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {isEditingResult ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
              </div>
              <div>
                <DialogTitle>{isEditingResult ? 'Update Test Results' : 'Add Test Results'}</DialogTitle>
                <DialogDescription>Entering results for {selectedInvoice?.patientName} (Invoice #{selectedInvoice?.invoice_id})</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Test List with Inputs and Image Uploads */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider block">Laboratory Services & Results</Label>
                  <Badge variant="outline" className="text-[10px] font-medium opacity-70">
                    {selectedInvoice?.test_list.length} Service{selectedInvoice?.test_list.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedInvoice?.test_list.map((test, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-4 p-5 bg-muted/30 rounded-2xl border border-muted-foreground/10 hover:border-primary/20 hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-2 text-primary">
                          <FlaskConical className="w-4 h-4" />
                          {test.name}
                        </span>
                        <div className="text-[10px] font-mono text-muted-foreground">₦{Number(test.price).toLocaleString()}</div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-[10px] text-muted-foreground uppercase mb-1.5 block ml-1">Test Summary / Finding</Label>
                          <Textarea
                            placeholder={`Enter detailed finding for ${test.name}...`}
                            className="min-h-[100px] bg-background resize-none border-muted focus-visible:ring-primary/20 transition-all text-sm rounded-xl"
                            value={resultData[test.name] || ''}
                            onChange={(e) => setResultData(prev => ({ ...prev, [test.name]: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label className="text-[10px] text-muted-foreground uppercase mb-1.5 block ml-1">Attachment (Image)</Label>

                          {resultImages[test.name] ? (
                            <div className="relative rounded-xl overflow-hidden border shadow-sm h-32 group/img">
                              {resultImages[test.name].startsWith('data:application/pdf') ? (
                                <div className="w-full h-full bg-muted flex items-center justify-center flex-col gap-1">
                                  <FileText className="w-8 h-8 text-blue-600" />
                                  <span className="text-[10px] font-medium text-muted-foreground">PDF Attached</span>
                                </div>
                              ) : (
                                <img src={resultImages[test.name]} alt="Test Preview" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                <Button size="sm" variant="destructive" className="h-8 px-3 text-xs" onClick={() => removeImage(test.name)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="h-32 border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group/upload"
                              onClick={() => document.getElementById(`file-${index}`)?.click()}
                            >
                              <input
                                id={`file-${index}`}
                                type="file"
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileChange(test.name, e)}
                              />
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                                <FileUp className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground font-mono">UPLOAD SCAN</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mt-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Expert Confirmation</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Each test result and its corresponding attachment will be permanently linked to the patient's electronic health record. Please ensure scans are clear and summaries are accurate.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-background pt-4 border-t mt-4">
            <Button variant="ghost" className="hover:bg-muted" onClick={() => setResultModalOpen(false)}>Cancel Entry</Button>
            <Button
              className="min-w-[140px] shadow-lg shadow-primary/20"
              onClick={handleSaveResult}
              disabled={isSavingResult}
            >
              {isSavingResult ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isEditingResult ? 'Update Test Result' : 'Publish Test Result'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* View Result Modal */}
      <AnimatePresence>
        {viewingResult && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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
                  <p className="text-teal-100 text-sm mt-1">Invoice: {viewingResult.invoice_id} • Patient: {viewingResult.patientName}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setViewingResult(null); setViewingResultData(null); }} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {isViewingLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse font-medium">Retrieving results...</p>
                  </div>
                ) : !viewingResultData ? (
                  <div className="text-center py-20">
                    <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Results not yet available.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingResult.test_list?.map((test: any, idx: number) => {
                        const summaries = typeof viewingResultData.result_list === 'string'
                          ? JSON.parse(viewingResultData.result_list)
                          : viewingResultData.result_list;
                        const images = viewingResultData.result_picture?.startsWith('{')
                          ? JSON.parse(viewingResultData.result_picture)
                          : {};

                        const summary = summaries[test.name] || 'No summary provided';
                        const image = images[test.name];

                        return (
                          <Card key={idx} className="border-teal-100 shadow-sm">
                            <CardHeader className="py-3 bg-teal-50/30">
                              <CardTitle className="text-sm font-bold text-teal-900 border-b border-teal-100 pb-2">
                                {test.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Summary</p>
                                <div className="p-3 bg-muted/30 rounded-lg text-sm italic border border-dashed">
                                  {summary}
                                </div>
                              </div>
                              {image && (
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Attachment</p>
                                  <div className="rounded-xl border overflow-hidden bg-slate-100">
                                    {image.startsWith('data:application/pdf') ? (
                                      <div className="aspect-video flex flex-col items-center justify-center gap-2">
                                        <FileText className="w-8 h-8 text-red-500" />
                                        <Button size="sm" variant="outline" onClick={() => window.open(image)}>View PDF</Button>
                                      </div>
                                    ) : (
                                      <img src={image} className="w-full h-auto max-h-48 object-contain cursor-pointer" alt={test.name} onClick={() => window.open(image)} />
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setViewingResult(null); setViewingResultData(null); }}>Close</Button>
                <Button className="bg-primary" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" /> Print Result
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
