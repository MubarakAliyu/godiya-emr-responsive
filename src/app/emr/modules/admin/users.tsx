import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Edit, Eye, History, Key, Plus, Search, Shield, Trash2, User as UserIcon, UserCheck, UserCog, UserPlus, UserX, Users } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';
import type { User, UserStatus, StaffDepartment, AccessLog } from '../../store/types';

// Mock departments (should come from store)
const DEPARTMENTS: StaffDepartment[] = [
  'Medical',
  'Nursing',
  'Laboratory',
  'Pharmacy',
  'Administration',
  'Finance',
  'IT',
  'Human Resources',
];

// Initial mock users data
const INITIAL_USERS: User[] = [
  {
    id: 'GH-US-01',
    firstName: 'Aliyu',
    lastName: 'Muhammad',
    fullName: 'Aliyu Muhammad',
    email: 'ghaliyu@gmail.com',
    phone: '+234-803-456-7890',
    username: 'aliyu.muhammad',
    department: 'Administration',
    role: 'Super Administrator',
    status: 'Active',
    lastLogin: '2026-02-04 08:30:00',
    dateCreated: '2026-01-01',
    lastUpdated: '2026-02-04',
    createdBy: 'System',
  },
  {
    id: 'GH-US-02',
    firstName: 'Fatima',
    lastName: 'Abdullahi',
    fullName: 'Fatima Abdullahi',
    email: 'fatima.abdullahi@godiyahospital.ng',
    phone: '+234-805-123-4567',
    username: 'fatima.abdullahi',
    department: 'Medical',
    role: 'Doctor',
    status: 'Active',
    lastLogin: '2026-02-04 07:15:00',
    dateCreated: '2026-01-10',
    lastUpdated: '2026-02-03',
    createdBy: 'Admin',
  },
  {
    id: 'GH-US-03',
    firstName: 'Ibrahim',
    lastName: 'Sani',
    fullName: 'Ibrahim Sani',
    email: 'ibrahim.sani@godiyahospital.ng',
    phone: '+234-807-890-1234',
    username: 'ibrahim.sani',
    department: 'Laboratory',
    role: 'Lab Technician',
    status: 'Active',
    lastLogin: '2026-02-03 16:45:00',
    dateCreated: '2026-01-15',
    lastUpdated: '2026-02-01',
    createdBy: 'Admin',
  },
  {
    id: 'GH-US-04',
    firstName: 'Aisha',
    lastName: 'Usman',
    fullName: 'Aisha Usman',
    email: 'aisha.usman@godiyahospital.ng',
    phone: '+234-809-567-8901',
    username: 'aisha.usman',
    department: 'Nursing',
    role: 'Nurse',
    status: 'Active',
    lastLogin: '2026-02-04 06:00:00',
    dateCreated: '2026-01-12',
    lastUpdated: '2026-02-02',
    createdBy: 'Admin',
  },
  {
    id: 'GH-US-05',
    firstName: 'Musa',
    lastName: 'Ahmad',
    fullName: 'Musa Ahmad',
    email: 'musa.ahmad@godiyahospital.ng',
    phone: '+234-810-234-5678',
    username: 'musa.ahmad',
    department: 'Pharmacy',
    role: 'Pharmacist',
    status: 'Suspended',
    lastLogin: '2026-01-28 14:20:00',
    dateCreated: '2026-01-18',
    lastUpdated: '2026-01-30',
    createdBy: 'Admin',
  },
  {
    id: 'GH-US-06',
    firstName: 'Zainab',
    lastName: 'Ibrahim',
    fullName: 'Zainab Ibrahim',
    email: 'zainab.ibrahim@godiyahospital.ng',
    phone: '+234-812-345-6789',
    username: 'zainab.ibrahim',
    department: 'Administration',
    role: 'Receptionist',
    status: 'Pending',
    dateCreated: '2026-02-03',
    lastUpdated: '2026-02-03',
    createdBy: 'Admin',
  },
];

// Mock access logs
const MOCK_ACCESS_LOGS: Record<string, AccessLog[]> = {
  'GH-US-01': [
    {
      id: 'AL-001',
      userId: 'GH-US-01',
      action: 'Login',
      ipAddress: '192.168.1.10',
      timestamp: '2026-02-04 08:30:00',
      userAgent: 'Chrome 120 on Windows',
    },
    {
      id: 'AL-002',
      userId: 'GH-US-01',
      action: 'Logout',
      ipAddress: '192.168.1.10',
      timestamp: '2026-02-03 17:45:00',
    },
    {
      id: 'AL-003',
      userId: 'GH-US-01',
      action: 'Password Reset',
      ipAddress: '192.168.1.10',
      timestamp: '2026-01-20 10:15:00',
    },
  ],
};

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [dynamicRoles, setDynamicRoles] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch users and roles on mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles.php');
      const data = await response.json();
      if (Array.isArray(data)) {
        setDynamicRoles(data.map(r => ({ id: r.id, name: r.role_name })));
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users.php');
      const data = await response.json();
      if (Array.isArray(data)) {
        const parsedUsers = data.map(user => ({
          ...user,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          fullName: user.full_name || `${user.first_name} ${user.last_name}` || 'N/A',
          phone: user.phone || '',
          roleId: user.role_id,
          dateCreated: user.created_at || new Date().toISOString(),
          lastUpdated: user.updated_at || new Date().toISOString(),
          lastLogin: user.last_login || 'Never',
          role: user.role_name || user.role_id || 'Staff',
        }));
        setUsers(parsedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'Active').length;
    const disabledUsers = users.filter((u) => u.status === 'Suspended').length;
    const adminAccounts = users.filter((u) => u.role.toLowerCase().includes('admin')).length;

    return {
      totalUsers,
      activeUsers,
      disabledUsers,
      adminAccounts,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handlers
  const handleAddUser = async (userData: Omit<User, 'id' | 'dateCreated' | 'lastUpdated' | 'createdBy'>) => {
    try {
      const user = getCurrentUser();
      const response = await fetch('/api/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          password: '123456', // Fixed default password as requested
          performerId: user?.email || 'System',
        }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('User created successfully. Default password: 123456');
        fetchUsers();
        setIsAddModalOpen(false);
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleEditUser = async (userData: User) => {
    try {
      const user = getCurrentUser();
      const response = await fetch('/api/users.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, performerId: user?.email || 'System' }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('User updated successfully');
        fetchUsers();
        setIsEditModalOpen(false);
      } else {
        toast.error(result.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        const user = getCurrentUser();
        const response = await fetch(`/api/users.php`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedUser.id, performerId: user?.email || 'System' }),
        });
        const result = await response.json();
        if (response.ok) {
          toast.success('User deleted successfully');
          fetchUsers();
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        } else {
          toast.error(result.error || 'Failed to delete user');
        }
      } catch (error) {
        toast.error('Connection error');
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus: UserStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    try {
      const currentUser = getCurrentUser();
      const response = await fetch('/api/users.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, status: newStatus, performerId: currentUser?.email || 'System' }),
      });
      if (response.ok) {
        fetchUsers();
        toast.success(
          newStatus === 'Active' ? 'User enabled successfully' : 'User disabled successfully'
        );
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleResetPassword = async () => {
    if (selectedUser) {
      try {
        const response = await fetch('/api/users.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedUser.id, password: '123456' }), // Reset to default
        });
        if (response.ok) {
          toast.success('Password reset to 123456 successfully');
          setIsResetPasswordModalOpen(false);
          setSelectedUser(null);
        } else {
          toast.error('Failed to reset password');
        }
      } catch (error) {
        toast.error('Connection error');
      }
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['User ID', 'Full Name', 'Email', 'Phone', 'Department', 'Role', 'Status', 'Last Login'].join(','),
      ...users.map((user) =>
        [
          user.id,
          user.fullName,
          user.email,
          user.phone,
          user.department,
          user.role,
          user.status,
          user.lastLogin || 'Never',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Users exported to CSV');
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
          <h1 className="text-3xl font-semibold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and system access</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={kpis.totalUsers}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          title="Active Users"
          value={kpis.activeUsers}
          icon={UserCheck}
          color="bg-green-100 text-green-600"
          delay={0.1}
        />
        <KPICard
          title="Disabled Users"
          value={kpis.disabledUsers}
          icon={UserX}
          color="bg-red-100 text-red-600"
          delay={0.2}
        />
        <KPICard
          title="Admin Accounts"
          value={kpis.adminAccounts}
          icon={Shield}
          color="bg-purple-100 text-purple-600"
          delay={0.3}
        />
      </div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, ID, email, or department..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
      >
        {paginatedUsers.length === 0 ? (
          <div className="text-center py-16 bg-muted/20">
            <UserCog className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-medium text-foreground">No users found</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create a user to begin managing system access
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First User
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      S/N
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {paginatedUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-sm text-foreground">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-primary">{user.id}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-foreground">
                        {user.fullName}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3.5 text-sm">{user.role}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">
                        {user.department}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <Badge
                          variant="secondary"
                          className={
                            user.status === 'Active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : user.status === 'Suspended'
                                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsViewModalOpen(true);
                            }}
                            title="View User"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsResetPasswordModalOpen(true);
                            }}
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === 'Active' ? 'Disable User' : 'Enable User'}
                          >
                            {user.status === 'Active' ? (
                              <UserX className="w-4 h-4 text-orange-600" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{' '}
                  {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Modals */}
      <AddUserModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddUser}
        roles={dynamicRoles}
      />

      <EditUserModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSave={handleEditUser}
        roles={dynamicRoles}
      />

      <ViewUserModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedUser}
      />

      <DeleteUserModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={selectedUser}
        onConfirm={handleDeleteUser}
      />

      <ResetPasswordModal
        open={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        user={selectedUser}
        onConfirm={handleResetPassword}
      />
    </div>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  color,
  delay,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Add User Modal
function AddUserModal({
  open,
  onClose,
  onSave,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id' | 'dateCreated' | 'lastUpdated' | 'createdBy'>) => void;
  roles: { id: string, name: string }[];
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '' as StaffDepartment,
    role: '',
    roleId: '',
    status: 'Active' as UserStatus,
  });

  const [generateTempPassword, setGenerateTempPassword] = useState(true);

  // Auto-generate username from first and last name
  const username = useMemo(() => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`;
    }
    return '';
  }, [formData.firstName, formData.lastName]);

  const handleSubmit = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.department ||
      !formData.role
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`,
      username,
    });

    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '' as StaffDepartment,
      role: '',
      roleId: '',
      status: 'Active' as UserStatus,
    });
    setGenerateTempPassword(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New User
          </DialogTitle>
          <DialogDescription>Create a new user account with system access</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                placeholder="user@godiyahospital.ng"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="+234-XXX-XXX-XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Department <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value: StaffDepartment) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => {
                  const role = roles.find(r => r.id === value);
                  setFormData({ ...formData, roleId: value, role: role?.name || '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Username (Auto-generated)</Label>
            <Input value={username} disabled className="bg-muted" />
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="text-sm font-medium">Generate Temporary Password</p>
              <p className="text-xs text-muted-foreground">
                User must change password on first login
              </p>
            </div>
            <Switch checked={generateTempPassword} onCheckedChange={setGenerateTempPassword} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: UserStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit User Modal
function EditUserModal({
  open,
  onClose,
  user,
  onSave,
  roles,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: User) => void;
  roles: { id: string, name: string }[];
}) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '' as StaffDepartment,
    role: '',
    roleId: '',
    status: 'Active' as UserStatus,
  });

  // Sync form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '' as StaffDepartment,
        role: user.role || '',
        roleId: user.roleId || '',
        status: user.status || 'Active' as UserStatus,
      });
    }
  }, [user, open]);

  const handleSubmit = () => {
    if (!user) return;

    onSave({
      ...user,
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`,
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Edit User: {user.fullName}
          </DialogTitle>
          <DialogDescription>Update user information and role assignment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value: StaffDepartment) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => {
                  const role = roles.find(r => r.id === value);
                  setFormData({ ...formData, roleId: value, role: role?.name || '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: UserStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View User Modal
function ViewUserModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
}) {
  if (!user) return null;

  const accessLogs = MOCK_ACCESS_LOGS[user.id] || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            View User: {user.fullName}
          </DialogTitle>
          <DialogDescription>Detailed user information and activity logs</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">User ID</p>
                <p className="text-sm font-medium">{user.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                  Username
                </p>
                <p className="text-sm font-medium">{user.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Phone</p>
                <p className="text-sm">{user.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                  Department
                </p>
                <p className="text-sm">{user.department}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Role</p>
                <p className="text-sm">{user.role}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Status</p>
                <Badge
                  className={
                    user.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : user.status === 'Suspended'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }
                >
                  {user.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                  Date Created
                </p>
                <p className="text-sm">
                  {new Date(user.dateCreated).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          </div>

          {/* Access Logs */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Access Logs
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              {accessLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No access logs available
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Action
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        IP Address
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {accessLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2 text-sm">{log.action}</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">
                          {log.ipAddress}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('en-GB')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Assigned Roles & Permissions */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Assigned Role & Permissions
            </h3>
            <div className="p-4 border border-border rounded-lg bg-muted/20">
              <p className="text-sm">
                <span className="font-medium">Role:</span> {user.role}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Permission details are managed in the Roles & Permissions panel
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Reset Password Modal
function ResetPasswordModal({
  open,
  onClose,
  user,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
}) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Key className="w-5 h-5" />
            Reset Password
          </DialogTitle>
          <DialogDescription>Generate a new temporary password</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-foreground">
              A temporary password will be generated and sent to{' '}
              <strong>{user.email}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The user must change this password on their first login.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase font-medium">User Details</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span> {user.fullName}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {user.email}
              </p>
              <p>
                <span className="text-muted-foreground">Username:</span> {user.username}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-orange-600 hover:bg-orange-700">
            <Key className="w-4 h-4 mr-2" />
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete User Modal
function DeleteUserModal({
  open,
  onClose,
  user,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: () => void;
}) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>This action cannot be undone</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-foreground">
              Deleting <strong>{user.fullName}</strong> will permanently remove their system
              access and cannot be recovered.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase font-medium">User Details</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">User ID:</span> {user.id}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {user.email}
              </p>
              <p>
                <span className="text-muted-foreground">Role:</span> {user.role}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this user? This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="w-4 h-4 mr-2" />
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
