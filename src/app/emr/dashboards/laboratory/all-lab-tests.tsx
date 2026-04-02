import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Edit,
  Trash2,
  FileText,
  DollarSign,
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

// Interface for Laboratory Test Items
interface AvailableTest {
  item_id: string;
  item_name: string;
  item_fees: string | number;
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

export function AllLabTests() {
  const { addNotification } = useEMRStore();
  const [labTests, setLabTests] = useState<AvailableTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<AvailableTest | null>(null);
  const [testToDelete, setTestToDelete] = useState<AvailableTest | null>(null);
  const [editFormData, setEditFormData] = useState({
    itemName: '',
    itemFees: '',
  });

  // Add Test Item Modal State
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    itemName: '',
    itemFees: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tests from backend
  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/laboratory.php?action=get_items');
      const data = await response.json();
      if (Array.isArray(data)) {
        setLabTests(data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Error', { description: 'Failed to load test items from server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // View Modal State (No longer used)

  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate KPIs
  const totalTests = labTests.length;

  const handleViewTest = (test: AvailableTest) => {
    setSelectedTest(test);
    setViewModalOpen(true);
  };

  const handleEditTest = (test: AvailableTest) => {
    setSelectedTest(test);
    setEditFormData({
      itemName: test.item_name,
      itemFees: test.item_fees.toString(),
    });
    setEditModalOpen(true);
  };

  const handleDeleteClick = (test: AvailableTest) => {
    setTestToDelete(test);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/laboratory.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_test_item',
          item_id: testToDelete.item_id,
          performerId: 'Laboratory Staff'
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Test Deleted', { description: `Test ${testToDelete.item_id} has been deleted.` });
        fetchTests();
      } else {
        toast.error('Error', { description: result.error || 'Failed to delete test.' });
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Connection Error');
    } finally {
      setIsSubmitting(false);
      setDeleteDialogOpen(false);
      setTestToDelete(null);
    }
  };

  const handleUpdateTest = async () => {
    if (!selectedTest) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/laboratory.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_test_item',
          item_id: selectedTest.item_id,
          item_name: editFormData.itemName,
          item_fees: editFormData.itemFees,
          performerId: 'Laboratory Staff'
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Test Updated', { description: `Test ${selectedTest.item_id} has been updated.` });
        fetchTests();
        setEditModalOpen(false);
        setSelectedTest(null);
      } else {
        toast.error('Error', { description: result.error || 'Failed to update test.' });
      }
    } catch (error) {
      console.error('Error updating test:', error);
      toast.error('Connection Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTestItem = async () => {
    if (!newItemForm.itemName || !newItemForm.itemFees) {
      toast.error('Required Fields', { description: 'Please enter at least the test name and fees.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/laboratory.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_test_item',
          item_name: newItemForm.itemName,
          item_fees: newItemForm.itemFees,
          performerId: 'Laboratory Staff'
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Test Item Added', { description: `Test "${newItemForm.itemName}" has been added successfully.` });
        setAddItemModalOpen(false);
        setNewItemForm({ itemName: '', itemFees: '' });
        fetchTests();
      } else {
        toast.error('Error', { description: result.error || 'Failed to add test.' });
      }
    } catch (error) {
      console.error('Error adding test:', error);
      toast.error('Connection Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (labTests.length === 0) {
      toast.error('No data', { description: 'There are no tests to export.' });
      return;
    }

    const headers = ['ID', 'Test Name', 'Fees (₦)'];
    const csvRows = labTests.map(test => [
      test.item_id,
      `"${test.item_name.replace(/"/g, '""')}"`, // Escape quotes and handle commas
      test.item_fees
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laboratory_tests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export Successful', { description: 'The test catalog has been exported to CSV.' });
  };

  const calculateTotalFees = () => {
    return labTests.reduce((total, test) => total + Number(test.item_fees), 0);
  };

  // Filter and pagination logic...
  const filteredTests = labTests.filter((test) => {
    const matchesSearch =
      (test.item_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (test.item_id?.toString() || '').includes(searchQuery);

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">All Lab Tests</h1>
        <p className="text-muted-foreground">Manage and monitor all laboratory test items</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Available Tests"
          value={totalTests}
          icon={FlaskConical}
          color="primary"
          tooltip="Total number of laboratory tests available in the system"
        />
      </div>

      {/* Lab Tests Table */}
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
                  Test Catalog
                </CardTitle>
                <CardDescription>View and manage the catalog of available laboratory tests</CardDescription>
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
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" onClick={() => setAddItemModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Test
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
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Test Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">Fees</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground text-right pr-8">Actions</th>
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
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <p className="font-medium text-sm">{test.item_id}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-sm">{test.item_name}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-sm">₦{Number(test.item_fees).toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2 pr-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditTest(test)}
                                  >
                                    <Edit className="w-4 h-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Test</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteClick(test)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Test</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
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


      {/* Edit Test Modal */}
      <Dialog open={editModalOpen} onOpenChange={(open) => !open && setEditModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Edit className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edit Test Item</DialogTitle>
                <DialogDescription>
                  Update the details of the laboratory test
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-item-name">Test Name</Label>
              <Input
                id="edit-item-name"
                value={editFormData.itemName}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, itemName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-fees">Fees (₦)</Label>
              <Input
                id="edit-item-fees"
                type="number"
                value={editFormData.itemFees}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, itemFees: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleUpdateTest}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Test'}
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
              Are you sure you want to delete test <strong>{testToDelete?.item_id}</strong> (<strong>{testToDelete?.item_name}</strong>)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Test Item Modal */}
      <Dialog open={addItemModalOpen} onOpenChange={(open) => !open && setAddItemModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Add New Test</DialogTitle>
                <DialogDescription>
                  Enter the details of the new test item
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Test Name</Label>
              <Input
                id="item-name"
                placeholder="e.g. Full Blood Count"
                value={newItemForm.itemName}
                onChange={(e) =>
                  setNewItemForm((prev) => ({ ...prev, itemName: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-fees">Fees (₦)</Label>
              <Input
                id="item-fees"
                type="number"
                placeholder="e.g. 5000"
                value={newItemForm.itemFees}
                onChange={(e) =>
                  setNewItemForm((prev) => ({ ...prev, itemFees: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleAddTestItem}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
