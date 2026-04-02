import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Eye,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import type { Notification } from '@/app/emr/store/types';
import { ViewNotificationModal } from './components/view-notification-modal';
import { DeleteNotificationModal } from './components/delete-notification-modal';

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  delay?: number;
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
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Notification Badge Component
function NotificationBadge({ type }: { type: Notification['type'] }) {
  const badgeStyles: Record<Notification['type'], { bg: string; text: string; label: string }> = {
    info: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Info' },
    success: { bg: 'bg-green-100', text: 'text-green-700', label: 'Success' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Warning' },
    critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
  };

  const style = badgeStyles[type];

  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

// Notification Icon Component
function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconStyles: Record<Notification['type'], { Icon: any; color: string }> = {
    info: { Icon: Info, color: 'text-blue-600' },
    success: { Icon: CheckCircle2, color: 'text-green-600' },
    warning: { Icon: AlertTriangle, color: 'text-yellow-600' },
    critical: { Icon: XCircle, color: 'text-red-600' },
  };

  const { Icon, color } = iconStyles[type];

  return <Icon className={`w-5 h-5 ${color}`} />;
}

export function NotificationsPage() {
  const { notifications, markNotificationAsRead, clearAllNotifications, addNotification } = useEMRStore();

  // State
  const [categoryTab, setCategoryTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Calculate KPIs
  const totalNotifications = notifications.length;
  const unreadNotifications = notifications.filter(n => n.unread).length;
  const today = new Date().toISOString().split('T')[0];
  const alertsToday = notifications.filter(n => n.timestamp.startsWith(today)).length;
  const criticalAlerts = notifications.filter(n => n.type === 'critical').length;

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesCategory = categoryTab === 'all' || notification.category === categoryTab;
      
      const matchesSearch = searchTerm === '' || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || notification.type === typeFilter;
      const matchesModule = moduleFilter === 'all' || notification.module === moduleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'unread' && notification.unread) ||
        (statusFilter === 'read' && !notification.unread);

      return matchesCategory && matchesSearch && matchesType && matchesModule && matchesStatus;
    });
  }, [notifications, categoryTab, searchTerm, typeFilter, moduleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Time ago helper
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Handlers
  const handleMarkAllRead = () => {
    notifications.filter(n => n.unread).forEach(n => markNotificationAsRead(n.id));
    toast.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearAllNotifications();
      toast.success('All notifications cleared');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setModuleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
    if (notification.unread) {
      markNotificationAsRead(notification.id);
    }
  };

  const handleDeleteNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Notification Center</h1>
          <p className="text-muted-foreground mt-1">
            View and manage system alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleMarkAllRead}
            className="gap-2"
            disabled={unreadNotifications === 0}
          >
            <CheckCircle className="w-4 h-4" />
            Mark All Read
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClearAll}
            className="gap-2"
            disabled={totalNotifications === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Bell}
          label="Total Notifications"
          value={totalNotifications}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          icon={AlertCircle}
          label="Unread Notifications"
          value={unreadNotifications}
          color="bg-orange-100 text-orange-600"
          delay={0.1}
        />
        <KPICard
          icon={Clock}
          label="Alerts Today"
          value={alertsToday}
          color="bg-green-100 text-green-600"
          delay={0.2}
        />
        <KPICard
          icon={AlertTriangle}
          label="Critical Alerts"
          value={criticalAlerts}
          color="bg-red-100 text-red-600"
          delay={0.3}
        />
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-xl p-4 border border-border shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          {/* Module Filter */}
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="Patients">Patients</SelectItem>
              <SelectItem value="Appointments">Appointments</SelectItem>
              <SelectItem value="Billing">Billing</SelectItem>
              <SelectItem value="Laboratory">Laboratory</SelectItem>
              <SelectItem value="Pharmacy">Pharmacy</SelectItem>
              <SelectItem value="Staff">Staff</SelectItem>
              <SelectItem value="System">System</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="read">Read Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </motion.div>

      {/* Notifications Table with Category Tabs */}
      <Tabs value={categoryTab} onValueChange={setCategoryTab} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white rounded-xl border border-border shadow-sm p-4"
        >
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="clinical">Clinical</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value={categoryTab} className="mt-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      S/N
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Bell className="w-12 h-12 mb-3 opacity-50" />
                          <p className="text-lg font-medium">No notifications yet</p>
                          <p className="text-sm">System alerts will appear here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedNotifications.map((notification, index) => (
                      <motion.tr
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`hover:bg-muted/30 transition-colors ${
                          notification.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <NotificationIcon type={notification.type} />
                            <NotificationBadge type={notification.type} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {notification.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                            {notification.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {timeAgo(notification.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {notification.unread ? (
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                              Unread
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                              Read
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewNotification(notification)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification)}
                              className="gap-1 text-destructive hover:text-destructive"
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
            {filteredNotifications.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ViewNotificationModal
        notification={selectedNotification}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedNotification(null);
        }}
      />
      <DeleteNotificationModal
        notification={selectedNotification}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedNotification(null);
        }}
      />
    </div>
  );
}