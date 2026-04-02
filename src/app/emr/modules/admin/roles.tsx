import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Plus,
  Download,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  Building2,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
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
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';
import type { Role, ModuleName, ModulePermissions } from '../../store/types';

// Mock data for departments (this should come from your store)
const DEPARTMENTS = [
  'Medical',
  'Nursing',
  'Laboratory',
  'Pharmacy',
  'Administration',
  'Finance',
  'IT',
  'Human Resources',
];

const MODULES: ModuleName[] = [
  'Patients',
  'Appointments',
  'Finance',
  'Pharmacy',
  'Laboratory',
  'Beds',
  'Reports',
  'Attendance',
  'Administration',
];

// Initial mock roles data
const INITIAL_ROLES: Role[] = [
  {
    id: 'GH-RL-01',
    roleName: 'Super Administrator',
    departmentScope: ['All Departments'],
    description: 'Full system access with all permissions',
    permissions: MODULES.map(module => ({
      module,
      view: true,
      create: true,
      edit: true,
      delete: true,
      export: true,
      approve: true,
    })),
    status: 'Active',
    dateCreated: '2026-01-15',
    lastUpdated: '2026-01-15',
    createdBy: 'System',
  },
  {
    id: 'GH-RL-02',
    roleName: 'Doctor',
    departmentScope: ['Medical'],
    description: 'Medical staff with patient care permissions',
    permissions: [
      { module: 'Patients', view: true, create: true, edit: true, delete: false, export: true, approve: false },
      { module: 'Appointments', view: true, create: true, edit: true, delete: false, export: false, approve: true },
      { module: 'Finance', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Pharmacy', view: true, create: true, edit: false, delete: false, export: false, approve: false },
      { module: 'Laboratory', view: true, create: true, edit: false, delete: false, export: true, approve: false },
      { module: 'Beds', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Reports', view: true, create: false, edit: false, delete: false, export: true, approve: false },
      { module: 'Attendance', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Administration', view: false, create: false, edit: false, delete: false, export: false, approve: false },
    ],
    status: 'Active',
    dateCreated: '2026-01-15',
    lastUpdated: '2026-01-20',
    createdBy: 'Admin',
  },
  {
    id: 'GH-RL-03',
    roleName: 'Nurse',
    departmentScope: ['Nursing'],
    description: 'Nursing staff with patient monitoring permissions',
    permissions: [
      { module: 'Patients', view: true, create: true, edit: true, delete: false, export: false, approve: false },
      { module: 'Appointments', view: true, create: true, edit: true, delete: false, export: false, approve: false },
      { module: 'Finance', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Pharmacy', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Laboratory', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Beds', view: true, create: true, edit: true, delete: false, export: false, approve: false },
      { module: 'Reports', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Attendance', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Administration', view: false, create: false, edit: false, delete: false, export: false, approve: false },
    ],
    status: 'Active',
    dateCreated: '2026-01-16',
    lastUpdated: '2026-01-16',
    createdBy: 'Admin',
  },
  {
    id: 'GH-RL-04',
    roleName: 'Receptionist',
    departmentScope: ['Administration'],
    description: 'Front desk operations and appointments',
    permissions: [
      { module: 'Patients', view: true, create: true, edit: true, delete: false, export: false, approve: false },
      { module: 'Appointments', view: true, create: true, edit: true, delete: false, export: false, approve: false },
      { module: 'Finance', view: true, create: true, edit: false, delete: false, export: false, approve: false },
      { module: 'Pharmacy', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Laboratory', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Beds', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Reports', view: false, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Attendance', view: true, create: false, edit: false, delete: false, export: false, approve: false },
      { module: 'Administration', view: false, create: false, edit: false, delete: false, export: false, approve: false },
    ],
    status: 'Active',
    dateCreated: '2026-01-18',
    lastUpdated: '2026-01-18',
    createdBy: 'Admin',
  },
];

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/roles.php');
      const data = await response.json();
      if (Array.isArray(data)) {
        const parsedData = data.map(role => {
          let departmentScope = [];
          try {
            if (typeof role.department_scope === 'string') {
              departmentScope = JSON.parse(role.department_scope);
            } else if (Array.isArray(role.department_scope)) {
              departmentScope = role.department_scope;
            }
          } catch (e) {
            console.error('Error parsing department scope:', e);
          }

          return {
            ...role,
            roleName: role.role_name,
            departmentScope: Array.isArray(departmentScope) ? departmentScope : [],
            permissions: role.permissions || [], // Ensure permissions is an array
            dateCreated: role.created_at,
            lastUpdated: role.updated_at,
          };
        });
        setRoles(parsedData);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const totalRoles = roles.length;
    const activeRoles = roles.filter((r) => r.status === 'Active').length;
    const modulesCovered = MODULES.length;
    const permissionRules = roles.reduce((sum, role) => {
      return sum + role.permissions.filter(p =>
        p.view || p.create || p.edit || p.delete || p.export || p.approve
      ).length;
    }, 0);

    return {
      totalRoles,
      activeRoles,
      modulesCovered,
      permissionRules,
    };
  }, [roles]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) =>
      role.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  // Pagination
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoles, currentPage]);

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  // Handlers
  const handleAddRole = async (roleData: Omit<Role, 'id' | 'dateCreated' | 'lastUpdated' | 'createdBy'>) => {
    try {
      const user = getCurrentUser();
      const response = await fetch('/api/roles.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roleData, performerId: user?.email || 'System' }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Role created successfully');
        fetchRoles();
        setIsAddModalOpen(false);
      } else {
        toast.error(result.error || 'Failed to create role');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleEditRole = async (roleData: Role) => {
    try {
      const user = getCurrentUser();
      const response = await fetch('/api/roles.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roleData, performerId: user?.email || 'System' }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Role updated successfully');
        fetchRoles();
        setIsEditModalOpen(false);
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleDeleteRole = async () => {
    if (selectedRole) {
      try {
        const response = await fetch(`/api/roles.php?id=${selectedRole.id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (response.ok) {
          toast.success('Role deleted successfully');
          fetchRoles();
          setIsDeleteModalOpen(false);
          setSelectedRole(null);
        } else {
          toast.error(result.error || 'Failed to delete role');
        }
      } catch (error) {
        toast.error('Connection error');
      }
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Role ID', 'Role Name', 'Department Scope', 'Permissions Count', 'Status', 'Created Date'].join(','),
      ...roles.map((role) => [
        role.id,
        role.roleName,
        role.departmentScope.join('; '),
        role.permissions.filter(p => p.view || p.create || p.edit || p.delete || p.export || p.approve).length,
        role.status,
        role.dateCreated,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Roles exported to CSV');
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
          <h1 className="text-3xl font-semibold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage system access and authority levels</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Export Roles CSV
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Role
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Roles"
          value={kpis.totalRoles}
          icon={Shield}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          title="Active Roles"
          value={kpis.activeRoles}
          icon={Check}
          color="bg-green-100 text-green-600"
          delay={0.1}
        />
        <KPICard
          title="System Modules Covered"
          value={kpis.modulesCovered}
          icon={Building2}
          color="bg-purple-100 text-purple-600"
          delay={0.2}
        />
        <KPICard
          title="Permission Rules Count"
          value={kpis.permissionRules}
          icon={Shield}
          color="bg-orange-100 text-orange-600"
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
            placeholder="Search roles by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Roles Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
      >
        {paginatedRoles.length === 0 ? (
          <div className="text-center py-16 bg-muted/20">
            <Shield className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-medium text-foreground">No roles configured yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create a role to begin managing system access
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Role
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
                      Role ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Role Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Department Scope
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Permissions Count
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {paginatedRoles.map((role, idx) => {
                    const permCount = role.permissions.reduce((total, p) => {
                      return total + [p.view, p.create, p.edit, p.delete, p.export, p.approve].filter(Boolean).length;
                    }, 0);

                    return (
                      <motion.tr
                        key={role.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-sm text-foreground">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium text-primary">{role.id}</td>
                        <td className="px-4 py-3.5 text-sm font-medium text-foreground">{role.roleName}</td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">
                          {role.departmentScope.join(', ')}
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {permCount} / {MODULES.length * 6}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <Badge
                            variant="secondary"
                            className={
                              role.status === 'Active'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            }
                          >
                            {role.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedRole(role);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedRole(role);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedRole(role);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredRoles.length)} of{' '}
                  {filteredRoles.length} roles
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
      <AddRoleModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddRole}
      />

      <EditRoleModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        role={selectedRole}
        onSave={handleEditRole}
      />

      <ViewPermissionsModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        role={selectedRole}
      />

      <DeleteRoleModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        role={selectedRole}
        onConfirm={handleDeleteRole}
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

// Add Role Modal - Compact Card-Based Layout
function AddRoleModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, 'id' | 'dateCreated' | 'lastUpdated' | 'createdBy'>) => void;
}) {
  const [formData, setFormData] = useState({
    roleName: '',
    departmentScope: [] as string[],
    description: '',
    status: 'Active' as 'Active' | 'Disabled',
  });

  const [permissions, setPermissions] = useState<ModulePermissions[]>(
    MODULES.map((module) => ({
      module,
      view: false,
      create: false,
      edit: false,
      delete: false,
      export: false,
      approve: false,
    }))
  );

  const handlePermissionChange = (moduleIndex: number, action: keyof Omit<ModulePermissions, 'module'>) => {
    const newPermissions = [...permissions];
    newPermissions[moduleIndex][action] = !newPermissions[moduleIndex][action];
    setPermissions(newPermissions);
  };

  const handleSubmit = () => {
    if (!formData.roleName || formData.departmentScope.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      permissions,
    });

    // Reset form
    setFormData({
      roleName: '',
      departmentScope: [],
      description: '',
      status: 'Active',
    });
    setPermissions(
      MODULES.map((module) => ({
        module,
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false,
        approve: false,
      }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Add New Role
          </DialogTitle>
          <DialogDescription>Create a new role with specific permissions</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Role Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g., Senior Doctor"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Disabled') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Department Scope <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEPARTMENTS.map((dept) => (
                <div key={dept} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${dept}`}
                    checked={formData.departmentScope.includes(dept)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          departmentScope: [...formData.departmentScope, dept],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          departmentScope: formData.departmentScope.filter((d) => d !== dept),
                        });
                      }
                    }}
                  />
                  <label
                    htmlFor={`dept-${dept}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {dept}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description of this role's responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Permission Matrix - Compact Card Layout */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Permission Matrix</Label>
            <div className="space-y-3">
              {permissions.map((perm, idx) => (
                <div
                  key={perm.module}
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <div className="font-medium text-sm">{perm.module}</div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.view}
                          onCheckedChange={() => handlePermissionChange(idx, 'view')}
                        />
                        <span className="text-xs font-medium">View</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.create}
                          onCheckedChange={() => handlePermissionChange(idx, 'create')}
                        />
                        <span className="text-xs font-medium">Create</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.edit}
                          onCheckedChange={() => handlePermissionChange(idx, 'edit')}
                        />
                        <span className="text-xs font-medium">Edit</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.delete}
                          onCheckedChange={() => handlePermissionChange(idx, 'delete')}
                        />
                        <span className="text-xs font-medium">Delete</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.export}
                          onCheckedChange={() => handlePermissionChange(idx, 'export')}
                        />
                        <span className="text-xs font-medium">Export</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.approve}
                          onCheckedChange={() => handlePermissionChange(idx, 'approve')}
                        />
                        <span className="text-xs font-medium">Approve</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Role Modal
function EditRoleModal({
  open,
  onClose,
  role,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  onSave: (role: Role) => void;
}) {
  const [formData, setFormData] = useState({
    roleName: '',
    departmentScope: [] as string[],
    description: '',
    status: 'Active' as 'Active' | 'Disabled',
  });

  const [permissions, setPermissions] = useState<ModulePermissions[]>([]);

  // Initialize form when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        roleName: role.roleName || '',
        departmentScope: Array.isArray(role.departmentScope) ? role.departmentScope : [],
        description: role.description || '',
        status: (role.status as 'Active' | 'Disabled') || 'Active',
      });
      setPermissions(role.permissions || []);
    }
  }, [role, open]);

  const handlePermissionChange = (moduleIndex: number, action: keyof Omit<ModulePermissions, 'module'>) => {
    const newPermissions = [...permissions];
    newPermissions[moduleIndex][action] = !newPermissions[moduleIndex][action];
    setPermissions(newPermissions);
  };

  const handleSubmit = () => {
    if (!role) return;

    onSave({
      ...role,
      ...formData,
      permissions,
    });
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Edit Role: {role.roleName}
          </DialogTitle>
          <DialogDescription>Update role permissions and settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Active' | 'Disabled') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department Scope</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEPARTMENTS.map((dept) => (
                <div key={dept} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-dept-${dept}`}
                    checked={formData.departmentScope.includes(dept)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          departmentScope: [...formData.departmentScope, dept],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          departmentScope: formData.departmentScope.filter((d) => d !== dept),
                        });
                      }
                    }}
                  />
                  <label htmlFor={`edit-dept-${dept}`} className="text-sm font-medium cursor-pointer">
                    {dept}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Permission Matrix - Compact Card Layout */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Permission Matrix</Label>
            <div className="space-y-3">
              {permissions.map((perm, idx) => (
                <div
                  key={perm.module}
                  className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <div className="font-medium text-sm">{perm.module}</div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.view}
                          onCheckedChange={() => handlePermissionChange(idx, 'view')}
                        />
                        <span className="text-xs font-medium">View</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.create}
                          onCheckedChange={() => handlePermissionChange(idx, 'create')}
                        />
                        <span className="text-xs font-medium">Create</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.edit}
                          onCheckedChange={() => handlePermissionChange(idx, 'edit')}
                        />
                        <span className="text-xs font-medium">Edit</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.delete}
                          onCheckedChange={() => handlePermissionChange(idx, 'delete')}
                        />
                        <span className="text-xs font-medium">Delete</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.export}
                          onCheckedChange={() => handlePermissionChange(idx, 'export')}
                        />
                        <span className="text-xs font-medium">Export</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={perm.approve}
                          onCheckedChange={() => handlePermissionChange(idx, 'approve')}
                        />
                        <span className="text-xs font-medium">Approve</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

// View Permissions Modal - Compact Card Layout
function ViewPermissionsModal({
  open,
  onClose,
  role,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}) {
  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            View Permissions: {role.roleName}
          </DialogTitle>
          <DialogDescription>Read-only view of role permissions</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Role Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Role ID</p>
              <p className="text-sm font-medium">{role.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Status</p>
              <Badge
                className={
                  role.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }
              >
                {role.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Department Scope
              </p>
              <p className="text-sm">{role.departmentScope.join(', ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Created</p>
              <p className="text-sm">{new Date(role.dateCreated).toLocaleDateString('en-GB')}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Description</p>
              <p className="text-sm">{role.description || 'No description provided'}</p>
            </div>
          </div>

          {/* Permission Matrix - Compact Card Layout */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Permission Matrix</Label>
            <div className="space-y-2">
              {role.permissions.map((perm) => (
                <div
                  key={perm.module}
                  className="p-4 border border-border rounded-lg bg-muted/20"
                >
                  <div className="flex flex-col gap-3">
                    <div className="font-medium text-sm">{perm.module}</div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground min-w-[45px]">View:</span>
                        {perm.view ? (
                          <Badge className="bg-green-100 text-green-700 h-5 px-2">✓</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground min-w-[45px]">Create:</span>
                        {perm.create ? (
                          <Badge className="bg-green-100 text-green-700 h-5 px-2">✓</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground min-w-[45px]">Edit:</span>
                        {perm.edit ? (
                          <Badge className="bg-green-100 text-green-700 h-5 px-2">✓</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground min-w-[45px]">Delete:</span>
                        {perm.delete ? (
                          <Badge className="bg-green-100 text-green-700 h-5 px-2">✓</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground min-w-[45px]">Export:</span>
                        {perm.export ? (
                          <Badge className="bg-green-100 text-green-700 h-5 px-2">✓</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground min-w-[45px]">Approve:</span>
                        {perm.approve ? (
                          <Badge className="bg-green-100 text-green-700 h-5 px-2">✓</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

// Delete Role Confirmation Modal
function DeleteRoleModal({
  open,
  onClose,
  role,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  onConfirm: () => void;
}) {
  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Role
          </DialogTitle>
          <DialogDescription>This action cannot be undone</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-foreground">
              Deleting <strong>{role.roleName}</strong> may revoke access for assigned users.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase font-medium">Role Details</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Role ID:</span> {role.id}
              </p>
              <p>
                <span className="text-muted-foreground">Department Scope:</span>{' '}
                {role.departmentScope.join(', ')}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this role? This action cannot be undone.
          </p>
        </div>

        <DialogFooter className="mt-6">
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
