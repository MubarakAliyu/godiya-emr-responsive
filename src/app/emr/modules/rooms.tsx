import { useState, useMemo } from 'react';
import { Bed, Plus, Download, Printer, Search, Filter, Eye, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useEMRStore } from '../store/emr-store';
import { BedCategory } from '../store/types';
import { toast } from 'sonner';

export function RoomsPage() {
  const { bedCategories, addBedCategory, updateBedCategory, deleteBedCategory } = useEMRStore();
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState<BedCategory | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'full'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form states
  const [formData, setFormData] = useState({
    categoryName: '',
    pricePerDay: '',
    totalBeds: '',
    occupiedBeds: '0',
    description: '',
  });
  
  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalCategories = bedCategories.length;
    const totalBeds = bedCategories.reduce((sum, bed) => sum + bed.totalBeds, 0);
    const occupiedBeds = bedCategories.reduce((sum, bed) => sum + bed.occupiedBeds, 0);
    const availableBeds = bedCategories.reduce((sum, bed) => sum + bed.availableBeds, 0);
    const dailyRevenue = bedCategories.reduce((sum, bed) => sum + (bed.occupiedBeds * bed.pricePerDay), 0);
    
    return { totalCategories, totalBeds, occupiedBeds, availableBeds, dailyRevenue };
  }, [bedCategories]);
  
  // Filter and search logic
  const filteredBeds = useMemo(() => {
    return bedCategories.filter(bed => {
      const matchesSearch = bed.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPrice = 
        (priceFilter.min === '' || bed.pricePerDay >= Number(priceFilter.min)) &&
        (priceFilter.max === '' || bed.pricePerDay <= Number(priceFilter.max));
      
      const matchesAvailability = 
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && bed.availableBeds > 0) ||
        (availabilityFilter === 'full' && bed.availableBeds === 0);
      
      return matchesSearch && matchesPrice && matchesAvailability;
    });
  }, [bedCategories, searchTerm, priceFilter, availabilityFilter]);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredBeds.length / itemsPerPage);
  const paginatedBeds = filteredBeds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handlers
  const handleAddBed = () => {
    if (!formData.categoryName || !formData.pricePerDay || !formData.totalBeds) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const totalBeds = Number(formData.totalBeds);
    const occupiedBeds = Number(formData.occupiedBeds);
    const price = Number(formData.pricePerDay);
    
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price. Please enter a valid number.');
      return;
    }
    
    if (totalBeds < occupiedBeds) {
      toast.error('Total beds cannot be less than occupied beds');
      return;
    }
    
    addBedCategory({
      categoryName: formData.categoryName,
      pricePerDay: price,
      totalBeds,
      occupiedBeds,
      description: formData.description,
    });
    
    toast.success('Bed Category Added Successfully');
    setShowAddModal(false);
    resetForm();
  };
  
  const handleUpdateBed = () => {
    if (!selectedBed) return;
    
    const totalBeds = Number(formData.totalBeds);
    const occupiedBeds = Number(formData.occupiedBeds);
    const price = Number(formData.pricePerDay);
    
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price. Please enter a valid number.');
      return;
    }
    
    if (totalBeds < occupiedBeds) {
      toast.error('Total beds cannot be less than occupied beds');
      return;
    }
    
    updateBedCategory(selectedBed.id, {
      categoryName: formData.categoryName,
      pricePerDay: price,
      totalBeds,
      occupiedBeds,
      description: formData.description,
    });
    
    toast.success('Bed Category Updated Successfully');
    setShowEditModal(false);
    setSelectedBed(null);
    resetForm();
  };
  
  const handleDeleteBed = () => {
    if (!selectedBed) return;
    
    deleteBedCategory(selectedBed.id);
    toast.success('Bed Category Deleted Successfully');
    setShowDeleteModal(false);
    setSelectedBed(null);
  };
  
  const resetForm = () => {
    setFormData({
      categoryName: '',
      pricePerDay: '',
      totalBeds: '',
      occupiedBeds: '0',
      description: '',
    });
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setPriceFilter({ min: '', max: '' });
    setAvailabilityFilter('all');
  };
  
  const openEditModal = (bed: BedCategory) => {
    setSelectedBed(bed);
    setFormData({
      categoryName: bed.categoryName,
      pricePerDay: bed.pricePerDay.toString(),
      totalBeds: bed.totalBeds.toString(),
      occupiedBeds: bed.occupiedBeds.toString(),
      description: bed.description || '',
    });
    setShowEditModal(true);
  };
  
  const openViewModal = (bed: BedCategory) => {
    setSelectedBed(bed);
    setShowViewModal(true);
  };
  
  const openDeleteModal = (bed: BedCategory) => {
    setSelectedBed(bed);
    setShowDeleteModal(true);
  };
  
  // Export CSV
  const exportCSV = () => {
    const headers = ['Category', 'Price (₦)', 'Total Beds', 'Occupied', 'Available'];
    const rows = filteredBeds.map(bed => [
      bed.categoryName,
      bed.pricePerDay,
      bed.totalBeds,
      bed.occupiedBeds,
      bed.availableBeds,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bed-categories-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('CSV exported successfully');
  };
  
  // Print PDF
  const printPDF = () => {
    window.print();
    toast.success('Print dialog opened');
  };
  
  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Bed Management</h1>
          <p className="text-muted-foreground mt-1">Manage hospital bed spaces and categories</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Bed Category
          </Button>
          
          <Button onClick={exportCSV} variant="secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          
          <Button onClick={printPDF} variant="outline">
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </motion.div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Bed Categories"
          value={kpis.totalCategories}
          icon={Bed}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          title="Total Beds"
          value={kpis.totalBeds}
          icon={Bed}
          color="bg-indigo-100 text-indigo-600"
          delay={0.1}
        />
        <KPICard
          title="Occupied Beds"
          value={kpis.occupiedBeds}
          icon={Bed}
          color="bg-red-100 text-red-600"
          delay={0.2}
        />
        <KPICard
          title="Available Beds"
          value={kpis.availableBeds}
          icon={Bed}
          color="bg-green-100 text-green-600"
          delay={0.3}
        />
        <KPICard
          title="Daily Revenue"
          value={`₦${kpis.dailyRevenue.toLocaleString()}`}
          icon={Bed}
          color="bg-purple-100 text-purple-600"
          delay={0.4}
          isNumeric={false}
        />
      </div>
      
      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-lg shadow-sm border border-border p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bed category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Price Range */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min Price"
              value={priceFilter.min}
              onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Max Price"
              value={priceFilter.max}
              onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value }))}
            />
          </div>
          
          {/* Availability Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full pl-9 pr-4 h-9 border border-input bg-background rounded-md focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
            >
              <option value="all">All Availability</option>
              <option value="available">Available Only</option>
              <option value="full">Full Only</option>
            </select>
          </div>
          
          {/* Reset Button */}
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </motion.div>
      
      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
      >
        {filteredBeds.length === 0 ? (
          <div className="p-12 text-center">
            <Bed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">
              {bedCategories.length === 0 ? 'No Bed Categories' : 'No Results Found'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {bedCategories.length === 0 
                ? 'Add a bed category to begin management.' 
                : 'Try adjusting your filters or search term.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">S/N</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bed Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price (₦)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Beds</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Occupied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {paginatedBeds.map((bed, index) => (
                    <motion.tr
                      key={bed.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{bed.categoryName}</div>
                        <div className="text-sm text-muted-foreground">{bed.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        ₦{bed.pricePerDay.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {bed.totalBeds}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {bed.occupiedBeds}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bed.availableBeds > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bed.availableBeds > 0 ? `${bed.availableBeds} Available` : 'Full'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(bed)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(bed)}
                            className="p-1.5 text-secondary hover:bg-secondary/10 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(bed)}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {paginatedBeds.map((bed, index) => (
                <motion.div
                  key={bed.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-foreground">{bed.categoryName}</div>
                      <div className="text-sm text-muted-foreground">{bed.id}</div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bed.availableBeds > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bed.availableBeds > 0 ? `${bed.availableBeds} Available` : 'Full'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2 font-medium text-foreground">₦{bed.pricePerDay.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-medium text-foreground">{bed.totalBeds} beds</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Occupied:</span>
                      <span className="ml-2 font-medium text-foreground">{bed.occupiedBeds}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available:</span>
                      <span className="ml-2 font-medium text-foreground">{bed.availableBeds}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewModal(bed)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(bed)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(bed)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBeds.length)} of {filteredBeds.length} results
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[36px]"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
      
      {/* Modals */}
      <AddBedModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleAddBed}
      />
      
      <EditBedModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBed(null);
          resetForm();
        }}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateBed}
      />
      
      <ViewBedModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedBed(null);
        }}
        bed={selectedBed}
      />
      
      <DeleteBedModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBed(null);
        }}
        bed={selectedBed}
        onConfirm={handleDeleteBed}
      />
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, delay, isNumeric = true }: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  delay: number;
  isNumeric?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-lg shadow-sm border border-border p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-semibold text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Add Bed Modal
function AddBedModal({ isOpen, onClose, formData, setFormData, onSubmit }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold">Add Bed Category</h2>
                  <p className="text-sm text-muted-foreground mt-1">Create a new bed category</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryName">
                    Bed Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="categoryName"
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    placeholder="e.g., General Ward"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerDay">
                      Price per Day (₦) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pricePerDay"
                      type="number"
                      value={formData.pricePerDay}
                      onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                      placeholder="e.g., 5000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalBeds">
                      Total Beds <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="totalBeds"
                      type="number"
                      value={formData.totalBeds}
                      onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                      placeholder="e.g., 20"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="occupiedBeds">Occupied Beds</Label>
                  <Input
                    id="occupiedBeds"
                    type="number"
                    value={formData.occupiedBeds}
                    onChange={(e) => setFormData({ ...formData, occupiedBeds: e.target.value })}
                    placeholder="e.g., 0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Enter bed category description..."
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="sticky bottom-0 bg-muted/30 border-t border-border px-6 py-4 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={onSubmit}>
                  <Plus className="w-4 h-4" />
                  Add Bed Category
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Edit Bed Modal
function EditBedModal({ isOpen, onClose, formData, setFormData, onSubmit }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold">Edit Bed Category</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update bed category details</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-categoryName">
                    Bed Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-categoryName"
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-pricePerDay">
                      Price per Day (₦) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-pricePerDay"
                      type="number"
                      value={formData.pricePerDay}
                      onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-totalBeds">
                      Total Beds <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-totalBeds"
                      type="number"
                      value={formData.totalBeds}
                      onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-occupiedBeds">Occupied Beds</Label>
                  <Input
                    id="edit-occupiedBeds"
                    type="number"
                    value={formData.occupiedBeds}
                    onChange={(e) => setFormData({ ...formData, occupiedBeds: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description (Optional)</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="sticky bottom-0 bg-muted/30 border-t border-border px-6 py-4 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={onSubmit}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// View Bed Modal
function ViewBedModal({ isOpen, onClose, bed }: { isOpen: boolean; onClose: () => void; bed: BedCategory | null }) {
  return (
    <AnimatePresence>
      {isOpen && bed && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Bed Category Details</h2>
                  <p className="text-sm text-muted-foreground mt-1">View bed category information</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                <div>
                  <Label className="text-muted-foreground">Category Name</Label>
                  <p className="text-lg font-medium text-foreground mt-1">{bed.categoryName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground">Price per Day</Label>
                    <p className="text-lg font-medium text-foreground mt-1">₦{bed.pricePerDay.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Beds</Label>
                    <p className="text-lg font-medium text-foreground mt-1">{bed.totalBeds}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground">Occupied Beds</Label>
                    <p className="text-lg font-medium text-destructive mt-1">{bed.occupiedBeds}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Available Beds</Label>
                    <p className="text-lg font-medium text-secondary mt-1">{bed.availableBeds}</p>
                  </div>
                </div>
                
                {bed.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-foreground mt-1">{bed.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
                  <div>
                    <Label className="text-muted-foreground">Created Date</Label>
                    <p className="text-foreground mt-1">
                      {new Date(bed.dateCreated).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="text-foreground mt-1">
                      {new Date(bed.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Delete Bed Modal
function DeleteBedModal({ isOpen, onClose, bed, onConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  bed: BedCategory | null;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && bed && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="bg-destructive/10 border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-destructive">Confirm Deletion</h2>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <p className="text-foreground">
                  Are you sure you want to delete the bed category <strong>{bed.categoryName}</strong>? This action cannot be undone.
                </p>
              </div>
              
              {/* Footer */}
              <div className="bg-muted/30 border-t border-border px-6 py-4 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={onConfirm}>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}