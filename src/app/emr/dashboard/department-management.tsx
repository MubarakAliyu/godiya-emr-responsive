import { useState } from 'react';
import { motion } from 'motion/react';
import { Ban, Building2, Edit, Eye, HeadphonesIcon, MoreVertical, Plus, RefreshCw, Search, Stethoscope, Trash2, User, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useEMRStore } from '../store/emr-store';
import {
  ViewDepartmentModal,
  AddDepartmentModal,
  EditDepartmentModal,
  DeleteDepartmentModal,
  DeactivateDepartmentModal,
  ReactivateDepartmentModal,
} from './components/department-modals';
import type { Department } from '../store/types';
import { toast } from 'sonner';

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <h3 className="text-3xl font-semibold">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bgColor}`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DepartmentManagement() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useEMRStore();

  // Modal states
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isReactivateOpen, setIsReactivateOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate KPIs
  const totalDepartments = departments.length;
  const clinicalUnits = departments.filter((d) => d.type === 'Clinical').length;
  const supportUnits = departments.filter((d) => d.type === 'Support').length;
  const activeDepartments = departments.filter((d) => d.status === 'Active').length;

  // Filter departments
  let filteredDepartments = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleAddDepartment = (data: any) => {
    addDepartment(data);
    toast.success('Department added successfully');
  };

  const handleEditDepartment = (data: any) => {
    if (selectedDepartment) {
      updateDepartment(selectedDepartment.id, { ...data, lastUpdated: new Date().toISOString() });
      toast.success('Department updated successfully');
    }
  };

  const handleDeleteDepartment = () => {
    if (selectedDepartment) {
      deleteDepartment(selectedDepartment.id);
      toast.success('Department deleted successfully');
    }
  };

  const handleDeactivateDepartment = () => {
    if (selectedDepartment) {
      updateDepartment(selectedDepartment.id, {
        status: 'Inactive',
        lastUpdated: new Date().toISOString(),
      });
      toast.success(`${selectedDepartment.name} has been deactivated successfully`);
    }
  };

  const handleReactivateDepartment = () => {
    if (selectedDepartment) {
      updateDepartment(selectedDepartment.id, {
        status: 'Active',
        lastUpdated: new Date().toISOString(),
      });
      toast.success(`${selectedDepartment.name} has been reactivated successfully`);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active'
      ? { variant: 'default' as const, className: 'bg-green-100 text-green-700 hover:bg-green-100' }
      : { variant: 'secondary' as const };
  };

  const getTypeBadge = (type: string) => {
    return type === 'Clinical'
      ? { variant: 'default' as const, className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' }
      : { variant: 'default' as const, className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' };
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-semibold">Department Management</h1>
          <p className="text-muted-foreground mt-1">Manage hospital departments and operational units</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Department
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Departments"
          value={totalDepartments}
          icon={Building2}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <KPICard
          title="Clinical Units"
          value={clinicalUnits}
          icon={Stethoscope}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <KPICard
          title="Support Units"
          value={supportUnits}
          icon={HeadphonesIcon}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <KPICard
          title="Active Departments"
          value={activeDepartments}
          icon={Users}
          color="text-cyan-600"
          bgColor="bg-cyan-100"
        />
      </div>

      {/* Main Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>Browse and manage hospital departments</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search department name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Clinical">Clinical</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">S/N</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Dept ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Staff Count</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    paginatedDepartments.map((department, index) => (
                      <motion.tr
                        key={department.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                        className="border-b border-border last:border-0 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium">{department.id}</td>
                        <td className="py-3 px-4 text-sm font-medium">{department.name}</td>
                        <td className="py-3 px-4">
                          <Badge {...getTypeBadge(department.type)}>{department.type}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                          {department.description}
                        </td>
                        <td className="py-3 px-4 text-sm">{department.staffCount}</td>
                        <td className="py-3 px-4">
                          <Badge {...getStatusBadge(department.status)}>{department.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDepartment(department);
                                    setIsViewOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDepartment(department);
                                    setIsEditOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDepartment(department);
                                    setIsDeleteOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                {department.status === 'Active' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDepartment(department);
                                        setIsDeactivateOpen(true);
                                      }}
                                      className="text-orange-600"
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {department.status === 'Inactive' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDepartment(department);
                                        setIsReactivateOpen(true);
                                      }}
                                      className="text-green-600"
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredDepartments.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredDepartments.length)} of{' '}
                  {filteredDepartments.length} entries
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Modals */}
      <ViewDepartmentModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        department={selectedDepartment}
      />
      <AddDepartmentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddDepartment}
        existingDepartments={departments}
      />
      <EditDepartmentModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditDepartment}
        department={selectedDepartment}
        existingDepartments={departments}
      />
      <DeleteDepartmentModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteDepartment}
        department={selectedDepartment}
      />
      <DeactivateDepartmentModal
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleDeactivateDepartment}
        department={selectedDepartment}
      />
      <ReactivateDepartmentModal
        isOpen={isReactivateOpen}
        onClose={() => setIsReactivateOpen(false)}
        onConfirm={handleReactivateDepartment}
        department={selectedDepartment}
      />
    </div>
  );
}