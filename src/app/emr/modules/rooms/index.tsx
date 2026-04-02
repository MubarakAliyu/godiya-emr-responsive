import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bed, Building, CheckCircle, ChevronLeft, ChevronRight, Clock, DollarSign, Download, Edit, Eye, Filter, Plus, Printer, RotateCcw, Search, Trash2, TrendingUp, User, Users, XCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { AddBedCategoryModal } from './components/add-bed-category-modal';
import { EditBedCategoryModal } from './components/edit-bed-category-modal';
import { DeleteBedCategoryModal } from './components/delete-bed-category-modal';
import { ViewBedDetailsModal } from './components/view-bed-details-modal';
import type { BedCategory } from '@/app/emr/store/types';

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
  subtitle,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  delay?: number;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export function RoomsPage() {
  const { bedCategories, addNotification } = useEMRStore();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BedCategory | null>(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Apply filters
  const filteredCategories = useMemo(() => {
    return bedCategories.filter((category) => {
      const matchesSearch =
        searchTerm === '' ||
        category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && category.availableBeds > 0) ||
        (statusFilter === 'full' && category.availableBeds === 0);

      return matchesSearch && matchesStatus;
    });
  }, [bedCategories, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  // Calculate KPIs
  const totalCategories = bedCategories.length;
  const totalBeds = bedCategories.reduce((sum, cat) => sum + cat.totalBeds, 0);
  const occupiedBeds = bedCategories.reduce((sum, cat) => sum + cat.occupiedBeds, 0);
  const availableBeds = bedCategories.reduce((sum, cat) => sum + cat.availableBeds, 0);
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';
  const totalRevenue = bedCategories.reduce(
    (sum, cat) => sum + cat.occupiedBeds * cat.pricePerDay,
    0
  );

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
    toast.success('Filters reset successfully');
  };

  // Action handlers
  const handleView = (category: BedCategory) => {
    setSelectedCategory(category);
    setIsViewModalOpen(true);
  };

  const handleEdit = (category: BedCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDelete = (category: BedCategory) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Export as CSV
  const exportAsCSV = () => {
    const headers = ['S/N', 'Category ID', 'Category Name', 'Total Beds', 'Occupied', 'Available', 'Price/Day', 'Status'];
    const csvData = filteredCategories.map((category, index) => [
      index + 1,
      category.id,
      category.categoryName,
      category.totalBeds,
      category.occupiedBeds,
      category.availableBeds,
      `₦${category.pricePerDay.toLocaleString()}`,
      category.availableBeds > 0 ? 'Available' : 'Full'
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bed-categories-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('CSV Exported', {
      description: `${filteredCategories.length} bed categories exported successfully.`,
    });

    addNotification({
      id: Date.now(),
      title: 'Bed Report Exported',
      message: `Bed categories CSV report generated (${filteredCategories.length} categories)`,
      type: 'info',
      status: 'Unread',
      timestamp: new Date().toISOString(),
      priority: 'Low',
    });
  };

  // Print report
  const handlePrintReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bed Categories Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: white; color: #000; }
            .report-container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
            .header h1 { color: #1e40af; font-size: 32px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 14px; }
            .beds-table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 12px; }
            .beds-table th { background: #1e40af; color: white; padding: 10px; text-align: left; }
            .beds-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .beds-table tr:nth-child(even) { background: #f9fafb; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>GODIYA HOSPITAL</h1>
              <p>Bed Categories Report - ${new Date().toLocaleDateString()}</p>
              <p>Birnin Kebbi, Kebbi State, Nigeria</p>
            </div>
            <table class="beds-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Category Name</th>
                  <th>Total Beds</th>
                  <th>Occupied</th>
                  <th>Available</th>
                  <th>Price/Day</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredCategories.map((category, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${category.categoryName}</strong></td>
                    <td>${category.totalBeds}</td>
                    <td>${category.occupiedBeds}</td>
                    <td>${category.availableBeds}</td>
                    <td>₦${category.pricePerDay.toLocaleString()}</td>
                    <td>${category.availableBeds > 0 ? 'Available' : 'Full'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    if (frameDoc) {
      const doc = frameDoc.document || frameDoc;
      doc.open();
      doc.write(reportHTML);
      doc.close();

      setTimeout(() => {
        try {
          if (printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          }

          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);

          toast.success('Report Printing');

          addNotification({
            id: Date.now(),
            title: 'Bed Report Printed',
            message: 'Bed categories report generated and sent to printer',
            type: 'info',
            status: 'Unread',
            timestamp: new Date().toISOString(),
            priority: 'Low',
          });
        } catch (error) {
          toast.error('Print Error', {
            description: 'Unable to print report. Please try again.',
          });
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Hospital Bed Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage hospital bed categories and capacity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrintReport}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={exportAsCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bed Category
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KPICard
          icon={Building}
          label="Total Categories"
          value={totalCategories}
          color="bg-primary/10 text-primary"
          delay={0}
        />
        <KPICard
          icon={Bed}
          label="Total Beds"
          value={totalBeds}
          color="bg-blue-100 text-blue-600"
          delay={0.05}
        />
        <KPICard
          icon={Users}
          label="Occupied Beds"
          value={occupiedBeds}
          color="bg-red-100 text-red-600"
          delay={0.1}
          subtitle={`${occupancyRate}% occupancy`}
        />
        <KPICard
          icon={CheckCircle}
          label="Available Beds"
          value={availableBeds}
          color="bg-green-100 text-green-600"
          delay={0.15}
        />
        <KPICard
          icon={DollarSign}
          label="Daily Revenue"
          value={`₦${totalRevenue.toLocaleString()}`}
          color="bg-purple-100 text-purple-600"
          delay={0.2}
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Price"
          value={`₦${bedCategories.length > 0 ? Math.round(bedCategories.reduce((sum, cat) => sum + cat.pricePerDay, 0) / bedCategories.length).toLocaleString() : 0}`}
          color="bg-orange-100 text-orange-600"
          delay={0.25}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search category name or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Availability Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Has Available Beds</SelectItem>
              <SelectItem value="full">Fully Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {currentCategories.length} of {filteredCategories.length} categories
          </p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </motion.div>

      {/* Bed Categories Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">S/N</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Category Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Total Beds</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Occupied</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Available</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Price/Day</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentCategories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Bed className="w-12 h-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {bedCategories.length === 0
                          ? 'No bed categories found. Add a new category to get started.'
                          : 'No categories match your search criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentCategories.map((category, index) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{category.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{category.categoryName}</td>
                    <td className="px-4 py-3 text-sm">{category.totalBeds}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-red-600 font-medium">{category.occupiedBeds}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-green-600 font-medium">{category.availableBeds}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ₦{category.pricePerDay.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {category.availableBeds > 0 ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          Available
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          Full
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(category)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(category)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(category)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} • {filteredCategories.length} total categories
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AddBedCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditBedCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={selectedCategory}
      />

      <DeleteBedCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        category={selectedCategory}
      />

      <ViewBedDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        category={selectedCategory}
      />
    </div>
  );
}
