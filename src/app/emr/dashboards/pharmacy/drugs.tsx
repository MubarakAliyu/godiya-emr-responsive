import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pill,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Edit,
  Trash2,
  Search,
  Download,
  Plus,
  X,
  AlertTriangle,
  Package,
  DollarSign,
  Calendar,
  Filter,
  FileText,
  CheckCircle2,
  XCircle,
  PackageX,
  PackageCheck,
  RotateCcw
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
  prefix?: string;
}

interface Drug {
  id: string;
  drugId: string;
  name: string;
  price: number;
  quantity: number;
  expiryDate: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expired';
}

const mockDrugs: Drug[] = []; // Replaced by API calls

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
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-foreground">
                      {prefix}{displayValue.toLocaleString()}
                    </h3>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: color === 'primary' ? '#1e40af15' : color === 'secondary' ? '#05966915' : color === 'destructive' ? '#dc262615' : '#f5900b15'
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{
                        color: color === 'primary' ? '#1e40af' : color === 'secondary' ? '#059669' : color === 'destructive' ? '#dc2626' : '#f59e0b'
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

export function DrugsPanel() {
  const { addNotification } = useEMRStore();

  // State
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expiryDateFrom, setExpiryDateFrom] = useState('');
  const [expiryDateTo, setExpiryDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // API base URL
  const API_URL = '/api/drugs.php';

  // Fetch drugs from API
  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}`);
      if (!response.ok) throw new Error('Failed to fetch drugs');
      const data = await response.json();

      // Map API fields to frontend Drug interface
      const mappedDrugs: Drug[] = data.map((d: any) => {
        const quantity = parseInt(d.drug_qty);
        const expiryDate = d.expiry_date;
        const now = new Date();
        const expiry = new Date(expiryDate);

        let status: Drug['status'] = 'In Stock';
        if (expiry < now) status = 'Expired';
        else if (quantity === 0) status = 'Out of Stock';
        else if (quantity < 10) status = 'Low Stock'; // Low stock threshold

        return {
          id: d.drug_id,
          drugId: `D-${String(d.drug_id).padStart(3, '0')}`,
          name: d.drug_name,
          price: parseFloat(d.drug_price),
          quantity: quantity,
          expiryDate: expiryDate,
          status: status,
        };
      });

      setDrugs(mappedDrugs);
    } catch (error) {
      console.error('Error fetching drugs:', error);
      toast.error('Fetch Error', {
        description: 'Could not load drugs from inventory.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    expiryDate: '',
  });

  // Calculate KPIs
  const totalDrugs = drugs.length;
  const inStockDrugs = drugs.filter(d => d.status === 'In Stock').length;
  const lowStockDrugs = drugs.filter(d => d.status === 'Low Stock').length;
  const outOfStockDrugs = drugs.filter(d => d.status === 'Out of Stock').length;
  const expiredDrugs = drugs.filter(d => d.status === 'Expired').length;
  const totalInventoryValue = drugs.reduce((sum, d) => sum + (d.price * d.quantity), 0);

  // Filter drugs
  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch = !searchQuery ||
      (drug.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (drug.drugId ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || drug.status === statusFilter;

    let matchesExpiry = true;
    if (expiryDateFrom || expiryDateTo) {
      const drugExpiry = new Date(drug.expiryDate);
      if (expiryDateFrom) {
        matchesExpiry = matchesExpiry && drugExpiry >= new Date(expiryDateFrom);
      }
      if (expiryDateTo) {
        matchesExpiry = matchesExpiry && drugExpiry <= new Date(expiryDateTo);
      }
    }

    return matchesSearch && matchesStatus && matchesExpiry;
  });

  // Paginate
  const totalPages = Math.ceil(filteredDrugs.length / itemsPerPage);
  const paginatedDrugs = filteredDrugs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setExpiryDateFrom('');
    setExpiryDateTo('');
    setCurrentPage(1);
    toast.info('Filters Reset', {
      description: 'All filters have been cleared.',
    });
  };

  // Handle add drug
  const handleAddDrug = async () => {
    if (!formData.name || !formData.price || !formData.quantity || !formData.expiryDate) {
      toast.error('Validation Error', {
        description: 'Please fill in all required fields.',
      });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_drug',
          drug_name: formData.name,
          drug_price: formData.price,
          drug_qty: formData.quantity,
          expiry_date: formData.expiryDate,
          performerId: 'System' // Should ideally come from auth
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Drug Added', {
          description: `${formData.name} has been added to inventory.`,
        });
        setAddModalOpen(false);
        resetForm();
        fetchDrugs(); // Refresh list
      } else {
        throw new Error(result.error || 'Failed to add drug');
      }
    } catch (error: any) {
      toast.error('Add Error', {
        description: error.message,
      });
    }
  };

  // Handle edit drug
  const handleEditDrug = async () => {
    if (!selectedDrug || !formData.name || !formData.price || !formData.quantity || !formData.expiryDate) {
      toast.error('Validation Error', {
        description: 'Please fill in all required fields.',
      });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_drug',
          drug_id: selectedDrug.id,
          drug_name: formData.name,
          drug_price: formData.price,
          drug_qty: formData.quantity,
          expiry_date: formData.expiryDate,
          performerId: 'System'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Drug Updated', {
          description: `${formData.name} has been updated successfully.`,
        });
        setEditModalOpen(false);
        setSelectedDrug(null);
        resetForm();
        fetchDrugs();
      } else {
        throw new Error(result.error || 'Failed to update drug');
      }
    } catch (error: any) {
      toast.error('Update Error', {
        description: error.message,
      });
    }
  };

  // Handle delete drug
  const handleDeleteDrug = async () => {
    if (!selectedDrug) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_drug',
          drug_id: selectedDrug.id,
          performerId: 'System'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Drug Deleted', {
          description: `${selectedDrug.name} has been removed from inventory.`,
        });
        setDeleteDialogOpen(false);
        setSelectedDrug(null);
        fetchDrugs();
      } else {
        throw new Error(result.error || 'Failed to delete drug');
      }
    } catch (error: any) {
      toast.error('Delete Error', {
        description: error.message,
      });
    }
  };

  // Open edit modal
  const openEditModal = (drug: Drug) => {
    setSelectedDrug(drug);
    setFormData({
      name: drug.name,
      price: String(drug.price),
      quantity: String(drug.quantity),
      expiryDate: drug.expiryDate,
    });
    setEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (drug: Drug) => {
    setSelectedDrug(drug);
    setViewModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (drug: Drug) => {
    setSelectedDrug(drug);
    setDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      quantity: '',
      expiryDate: '',
    });
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['Drug ID', 'Name', 'Price', 'Quantity', 'Expiry Date', 'Status'];
    const csvData = filteredDrugs.map(drug => [
      drug.drugId,
      drug.name,
      drug.price,
      drug.quantity,
      drug.expiryDate,
      drug.status
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drugs-inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('CSV Exported', {
      description: `${filteredDrugs.length} records exported successfully.`,
    });
  };

  // Export as PDF
  const exportAsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = filteredDrugs.map(drug => `
      <tr>
        <td>${drug.drugId}</td>
        <td>${drug.name}</td>
        <td>₦${drug.price.toLocaleString()}</td>
        <td>${drug.quantity}</td>
        <td>${new Date(drug.expiryDate).toLocaleDateString()}</td>
        <td>${drug.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Drug Inventory Report</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          h2 { text-align: center; margin-bottom: 4px; }
          p.subtitle { text-align: center; color: #666; margin-bottom: 16px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e40af; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
          td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tr:nth-child(even) td { background: #f9fafb; }
          .footer { margin-top: 16px; text-align: right; color: #888; font-size: 10px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h2>Godiya Hospital — Drug Inventory Report</h2>
        <p class="subtitle">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total records: ${filteredDrugs.length}</p>
        <table>
          <thead>
            <tr>
              <th>Drug ID</th><th>Name</th><th>Price</th><th>Quantity</th><th>Expiry Date</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Godiya Hospital Management System</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Stock':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            In Stock
          </Badge>
        );
      case 'Low Stock':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Low Stock
          </Badge>
        );
      case 'Out of Stock':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <PackageX className="w-3 h-3 mr-1" />
            Out of Stock
          </Badge>
        );
      case 'Expired':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Drugs Inventory</h1>
          <p className="text-muted-foreground">Manage and track pharmaceutical inventory</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Drug
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Drugs"
          value={totalDrugs}
          icon={Pill}
          trend="up"
          trendValue="+5 from last month"
          color="primary"
          tooltip="Total number of drugs in inventory"
        />
        <KPICard
          title="In Stock"
          value={inStockDrugs}
          icon={PackageCheck}
          trend="up"
          trendValue="Adequately stocked"
          color="secondary"
          tooltip="Drugs with sufficient stock"
        />
        <KPICard
          title="Low Stock"
          value={lowStockDrugs}
          icon={AlertTriangle}
          trend="down"
          trendValue="Requires attention"
          color="warning"
          tooltip="Drugs below reorder level"
        />
        <KPICard
          title="Total Value"
          value={totalInventoryValue}
          icon={DollarSign}
          trend="up"
          trendValue="+8% increase"
          color="primary"
          tooltip="Total inventory value"
          prefix="₦"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters
          </CardTitle>
          <CardDescription>Search and filter drugs inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, category..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Expiry From</Label>
              <Input
                type="date"
                value={expiryDateFrom}
                onChange={(e) => {
                  setExpiryDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div>
              <Label className="mb-2 block">Expiry To</Label>
              <Input
                type="date"
                value={expiryDateTo}
                onChange={(e) => {
                  setExpiryDateTo(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportAsCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportAsPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drugs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Drugs List</CardTitle>
              <CardDescription>
                Showing {paginatedDrugs.length} of {filteredDrugs.length} drugs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Drug ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Expiry Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedDrugs.map((drug, index) => (
                    <motion.tr
                      key={drug.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm text-primary">{drug.drugId}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm">{drug.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm">₦{drug.price.toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-sm">{drug.quantity}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{new Date(drug.expiryDate).toLocaleDateString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(drug.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => openViewModal(drug)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="ghost" onClick={() => openEditModal(drug)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Drug</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDeleteDialog(drug)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Drug</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {isLoading ? (
              <div className="text-center py-12">
                <RotateCcw className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-spin opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground mb-2">Loading inventory...</p>
              </div>
            ) : paginatedDrugs.length === 0 && (
              <div className="text-center py-12">
                <PackageX className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold text-muted-foreground mb-2">No drugs found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new drug</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {filteredDrugs.length} total records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Drug Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Drug
            </DialogTitle>
            <DialogDescription>
              Add a new drug to the inventory system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Drug Name *</Label>
              <Input
                placeholder="e.g., Paracetamol 500mg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₦) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddModalOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddDrug} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Drug
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Drug Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Drug
            </DialogTitle>
            <DialogDescription>
              Update drug information and inventory details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Drug Name *</Label>
              <Input
                placeholder="e.g., Paracetamol 500mg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₦) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditModalOpen(false);
              setSelectedDrug(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditDrug} className="bg-primary hover:bg-primary/90">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Update Drug
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Drug Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Drug Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this drug
            </DialogDescription>
          </DialogHeader>

          {selectedDrug && (
            <div className="space-y-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{selectedDrug.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedDrug.drugId}</p>
                </div>
                {getStatusBadge(selectedDrug.status)}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground">Price</Label>
                  <p className="font-semibold text-primary">₦{selectedDrug.price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Quantity in Stock</Label>
                  <p className="font-semibold">{selectedDrug.quantity} units</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                  <p className="font-semibold">{new Date(selectedDrug.expiryDate).toLocaleDateString()}</p>
                </div>
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Inventory Value:</span>
                  <span className="text-xl font-bold text-primary">
                    ₦{(selectedDrug.price * selectedDrug.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setViewModalOpen(false);
              setSelectedDrug(null);
            }}>
              Close
            </Button>
            {selectedDrug && (
              <Button onClick={() => {
                setViewModalOpen(false);
                openEditModal(selectedDrug);
              }} className="bg-primary hover:bg-primary/90">
                <Edit className="w-4 h-4 mr-2" />
                Edit Drug
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Drug
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedDrug?.name}</strong>? This action cannot be undone and the inventory record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDrug(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDrug}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Drug
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
