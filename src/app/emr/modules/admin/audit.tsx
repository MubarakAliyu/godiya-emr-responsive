import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ScrollText,
  Download,
  Printer,
  Eye,
  Filter,
  RotateCcw,
  TrendingUp,
  FileEdit,
  Trash2,
  FilePlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { toast } from 'sonner';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  // Fetch logs on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (userFilter !== 'all') queryParams.append('user_id', userFilter);
      if (moduleFilter !== 'all') queryParams.append('module', moduleFilter);
      if (actionFilter !== 'all') queryParams.append('action', actionFilter);

      const response = await fetch(`/api/audit.php?${queryParams.toString()}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const parsedLogs = data.map(log => ({
          ...log,
          id: typeof log.id === 'number' ? `GH-LG-${String(log.id).padStart(6, '0')}` : log.id,
          user: log.user_name || log.user_id,
          role: 'System User', // Default if role not joined
          device: log.device_info,
          oldValue: typeof log.old_value === 'object' ? JSON.stringify(log.old_value) : log.old_value,
          newValue: typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value,
        }));
        setLogs(parsedLogs);
        setFilteredLogs(parsedLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toDateString();
    const logsToday = logs.filter(log => new Date(log.timestamp).toDateString() === today);
    const createActions = logsToday.filter(log => log.action === 'Create').length;
    const editActions = logsToday.filter(log => log.action === 'Edit').length;
    const deleteActions = logsToday.filter(log => log.action === 'Delete').length;

    return {
      totalLogsToday: logsToday.length,
      createActions,
      editActions,
      deleteActions,
    };
  }, [logs]);

  // Apply filters
  const applyFilters = () => {
    fetchLogs();
    toast.success('Filters Applied');
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setUserFilter('all');
    setRoleFilter('all');
    setModuleFilter('all');
    setActionFilter('all');
    fetchLogs();
    setCurrentPage(1);
    toast.success('Filters Reset');
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Log ID', 'User', 'Role', 'Action', 'Module', 'Timestamp', 'IP Address'];
    const csvData = filteredLogs.map(log => [
      log.id,
      log.user,
      log.role,
      log.action,
      log.module,
      new Date(log.timestamp).toLocaleString(),
      log.ipAddress,
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Logs Exported', {
      description: 'CSV file downloaded successfully',
    });
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print Dialog Opened');
  };

  // Get action badge variant
  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      Create: 'bg-green-100 text-green-700 hover:bg-green-100',
      Edit: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
      Delete: 'bg-red-100 text-red-700 hover:bg-red-100',
      Login: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
      Logout: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    };

    return colors[action] || 'bg-gray-100 text-gray-700 hover:bg-gray-100';
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // Get unique values for filters
  const uniqueUsers = Array.from(new Set(logs.map(log => log.user)));
  const uniqueRoles = Array.from(new Set(logs.map(log => log.role)));
  const uniqueModules = Array.from(new Set(logs.map(log => log.module)));

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor system activities and user actions</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Logs Today"
          value={kpis.totalLogsToday}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          title="Create Actions"
          value={kpis.createActions}
          icon={FilePlus}
          color="bg-green-100 text-green-600"
          delay={0.1}
        />
        <KPICard
          title="Edit Actions"
          value={kpis.editActions}
          icon={FileEdit}
          color="bg-blue-100 text-blue-600"
          delay={0.2}
        />
        <KPICard
          title="Delete Actions"
          value={kpis.deleteActions}
          icon={Trash2}
          color="bg-red-100 text-red-600"
          delay={0.3}
        />
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-lg shadow-sm border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filter Logs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Date From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>User Filter</Label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Role Filter</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Module Filter</Label>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {uniqueModules.map(module => (
                  <SelectItem key={module} value={module}>{module}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="Create">Create</SelectItem>
                <SelectItem value="Edit">Edit</SelectItem>
                <SelectItem value="Delete">Delete</SelectItem>
                <SelectItem value="Login">Login</SelectItem>
                <SelectItem value="Logout">Logout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={applyFilters}>
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
          <Button onClick={resetFilters} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      </motion.div>

      {/* Audit Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
      >
        {paginatedLogs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      S/N
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Log ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {paginatedLogs.map((log, idx) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-sm text-foreground">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-primary">{log.id}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-foreground">{log.user}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">{log.role}</td>
                      <td className="px-4 py-3.5 text-sm">
                        <Badge
                          variant="secondary"
                          className={getActionBadgeColor(log.action)}
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-foreground">{log.module}</td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-muted-foreground font-mono">{log.ipAddress}</td>
                      <td className="px-4 py-3.5 text-sm">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
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
                  Showing {startIndex + 1} to{' '}
                  {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of{' '}
                  {filteredLogs.length} logs
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
        ) : (
          <div className="text-center py-16 bg-muted/20">
            <ScrollText className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-medium text-foreground">No audit records available</p>
            <p className="text-sm text-muted-foreground mt-1">
              No audit records available for selected filters.
            </p>
            <Button onClick={resetFilters} variant="outline" size="sm" className="mt-4">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        )}
      </motion.div>

      {/* View Log Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Log ID</Label>
                  <p className="text-sm font-mono font-medium">{selectedLog.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">User</Label>
                  <p className="text-sm font-medium">{selectedLog.user}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <p className="text-sm">{selectedLog.role}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Action</Label>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className={getActionBadgeColor(selectedLog.action)}
                    >
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Module</Label>
                  <p className="text-sm">{selectedLog.module}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date & Time</Label>
                  <p className="text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="text-sm font-mono">{selectedLog.ipAddress}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Device / Browser</Label>
                  <p className="text-sm">{selectedLog.device}</p>
                </div>
              </div>

              {selectedLog.oldValue && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Old Value Snapshot</Label>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm font-mono">{selectedLog.oldValue}</p>
                  </div>
                </div>
              )}

              {selectedLog.newValue && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">New Value Snapshot</Label>
                  <div className="p-3 bg-muted/50 rounded-lg border border-border">
                    <p className="text-sm font-mono">{selectedLog.newValue}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
