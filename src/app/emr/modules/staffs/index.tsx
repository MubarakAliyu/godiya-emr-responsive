import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users, UserCog, UserPlus, User, Search, Filter, Download, FileText,
  MoreVertical, Eye, Edit, Trash2, Stethoscope, Activity, FlaskConical,
  Pill, DollarSign, Ban, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
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
import { useEMRStore } from '@/app/emr/store/emr-store';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddStaffModal } from './components/add-staff-modal';
import { EditStaffModal } from './components/edit-staff-modal';
import { ViewStaffModal } from './components/view-staff-modal';
import { DeleteConfirmModal } from './components/delete-confirm-modal';
import { DeactivateStaffModal } from './components/deactivate-staff-modal';
import { ReactivateStaffModal } from './components/reactivate-staff-modal';
import type { Staff } from '@/app/emr/store/types';

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

export function StaffsPage() {
  const { staff, departments, roles, updateStaff } = useEMRStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate KPIs - All 7 required
  const totalStaff = staff.length;
  const doctors = staff.filter(s => s.role === 'Doctor').length;
  const nurses = staff.filter(s => s.role === 'Nurse').length;
  const adminStaff = staff.filter(s => s.department === 'Administration').length;
  const pharmacyStaff = staff.filter(s => s.department === 'Pharmacy').length;
  const laboratoryStaff = staff.filter(s => s.department === 'Laboratory').length;
  const cashiers = staff.filter(s => s.role === 'Accountant' || s.role === 'Receptionist').length;

  // Filter staff
  let filteredStaff = staff.filter(s => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phoneNumber.includes(searchQuery);
    const matchesDepartment = departmentFilter === 'all' || s.department === departmentFilter;
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'Active': { variant: 'default', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
      'On Leave': { variant: 'default', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
      'Suspended': { variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
      'Resigned': { variant: 'secondary' },
    };
    return variants[status] || { variant: 'default' };
  };

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsEditModalOpen(true);
  };

  const handleView = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsViewModalOpen(true);
  };

  const handleDelete = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsDeleteModalOpen(true);
  };

  const handleDeactivate = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsDeactivateModalOpen(true);
  };

  const handleReactivate = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsReactivateModalOpen(true);
  };

  const handleDeactivateConfirm = () => {
    if (selectedStaff) {
      updateStaff(selectedStaff.id, { status: 'Suspended' });
      toast.success(`${selectedStaff.fullName} has been deactivated successfully`);
      setIsDeactivateModalOpen(false);
      setSelectedStaff(null);
    }
  };

  const handleReactivateConfirm = () => {
    if (selectedStaff) {
      updateStaff(selectedStaff.id, { status: 'Active' });
      toast.success(`${selectedStaff.fullName} has been reactivated successfully`);
      setIsReactivateModalOpen(false);
      setSelectedStaff(null);
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    if (type === 'csv') {
      const headers = ['S/N', 'Staff ID', 'Full Name', 'Department', 'Role', 'Email', 'Phone', 'Status'];
      const rows = filteredStaff.map((s, index) => [
        index + 1,
        s.id,
        s.fullName,
        s.department,
        s.role,
        s.email,
        s.phoneNumber,
        s.status
      ]);

      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `staff_list_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Staff list exported to CSV');
    } else {
      // PDF Export via Print
      window.print();
      toast.success('Print dialog opened');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 print:p-0 print:m-0 print:space-y-0">
      {/* Print-only Header (Hidden in UI) */}
      <div className="hidden print:block mb-6">
        <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">GODIYA HOSPITAL EMR</h1>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Staff Management Report</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Report Date:</p>
            <p>{format(new Date(), 'PPP p')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-6 bg-muted/20 p-4 rounded-lg border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Total Staff</p>
            <p className="text-lg font-semibold">{totalStaff}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Active Records</p>
            <p className="text-lg font-semibold">{filteredStaff.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Filtered By</p>
            <p className="text-sm font-medium">
              {departmentFilter !== 'all' ? `Dept: ${departmentFilter}` : 'All Depts'} |
              {roleFilter !== 'all' ? ` Role: ${roleFilter}` : ' All Roles'}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden"
      >
        <div>
          <h1 className="text-3xl font-semibold">Staffs Management</h1>
          <p className="text-muted-foreground mt-1">Manage hospital staff and personnel records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Staff
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 print:hidden">
        <KPICard
          title="Total Staff"
          value={totalStaff}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <KPICard
          title="Doctors"
          value={doctors}
          icon={Stethoscope}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <KPICard
          title="Nurses"
          value={nurses}
          icon={Activity}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <KPICard
          title="Admin"
          value={adminStaff}
          icon={UserCog}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <KPICard
          title="Pharmacy"
          value={pharmacyStaff}
          icon={Pill}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <KPICard
          title="Laboratory"
          value={laboratoryStaff}
          icon={FlaskConical}
          color="text-cyan-600"
          bgColor="bg-cyan-100"
        />
        <KPICard
          title="Cashiers"
          value={cashiers}
          icon={DollarSign}
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>

      {/* Staff Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="print:shadow-none print:border-0 print:m-0"
      >
        <Card className="print:shadow-none print:border-none print:bg-transparent">
          <CardHeader className="print:hidden">
            <CardTitle>All Staff Members</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 print:hidden">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.roleName}>
                      {role.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">S/N</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Staff ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Full Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Address</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground print:hidden">Actions</th>
                  </tr>
                </thead>
                {/* UI Body (Paginated) */}
                <tbody className="print:hidden">
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-12 h-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No staff members found</p>
                          <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add First Staff
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((staffMember, index) => (
                      <motion.tr
                        key={staffMember.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                        className="border-b border-border last:border-0 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{staffMember.id}</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {staffMember.profilePhoto ? (
                                <img src={staffMember.profilePhoto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <span>{staffMember.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{staffMember.department}</td>
                        <td className="py-3 px-4 text-sm">
                          <Badge variant="outline">{staffMember.role}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{staffMember.email}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{staffMember.phoneNumber}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                          {staffMember.address}
                        </td>
                        <td className="py-3 px-4">
                          <Badge {...getStatusBadge(staffMember.status)}>{staffMember.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm print:hidden">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(staffMember)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(staffMember)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(staffMember)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                {staffMember.status === 'Active' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeactivate(staffMember)}
                                      className="text-orange-600"
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {staffMember.status === 'Suspended' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleReactivate(staffMember)}
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

                {/* Print Body (Full List) */}
                <tbody className="hidden print:table-row-group">
                  {filteredStaff.map((staffMember, index) => (
                    <tr
                      key={staffMember.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3 px-4 text-sm">{index + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium">{staffMember.id}</td>
                      <td className="py-3 px-4 text-sm">{staffMember.fullName}</td>
                      <td className="py-3 px-4 text-sm">{staffMember.department}</td>
                      <td className="py-3 px-4 text-sm">{staffMember.role}</td>
                      <td className="py-3 px-4 text-sm">{staffMember.email}</td>
                      <td className="py-3 px-4 text-sm">{staffMember.phoneNumber}</td>
                      <td className="py-3 px-4 text-sm">{staffMember.address}</td>
                      <td className="py-3 px-4 text-sm">{staffMember.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="print:hidden">
              {paginatedStaff.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      <AddStaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditStaffModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />
      <ViewStaffModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />
      <DeactivateStaffModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setSelectedStaff(null);
        }}
        onConfirm={handleDeactivateConfirm}
        staff={selectedStaff}
      />
      <ReactivateStaffModal
        isOpen={isReactivateModalOpen}
        onClose={() => {
          setIsReactivateModalOpen(false);
          setSelectedStaff(null);
        }}
        onConfirm={handleReactivateConfirm}
        staff={selectedStaff}
      />
    </div >
  );
}
