import { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, CheckCheck, Trash2, Filter, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';

export function NotificationsPage() {
  const { notifications, markNotificationAsRead, deleteNotification } = useEMRStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (notification.message && notification.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      notification.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'Unread' && notification.unread) ||
      (statusFilter === 'Read' && !notification.unread);
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    toast.success('Notification marked as read');
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
      if (n.unread) {
        markNotificationAsRead(n.id);
      }
    });
    toast.success('All notifications marked as read');
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    toast.success('Notification deleted');
  };

  const getNotificationIcon = (type: string) => {
    return <Bell className="w-5 h-5" />;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500';
      case 'warning':
        return 'border-l-4 border-l-yellow-500';
      case 'critical':
        return 'border-l-4 border-l-red-500';
      case 'info':
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Badge variant="destructive">High</Badge>;
      case 'Medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case 'Low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </p>
        </div>
        <Button 
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="bg-primary hover:bg-primary/90"
        >
          <CheckCheck className="w-4 h-4 mr-2" />
          Mark All as Read
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Unread">Unread</SelectItem>
                <SelectItem value="Read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No notifications found</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`transition-all hover:shadow-md ${getNotificationColor(notification.type)} ${
                  notification.unread ? 'bg-blue-50/50' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className={`p-3 rounded-lg flex-shrink-0 ${
                        notification.type === 'success' ? 'bg-green-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' :
                        notification.type === 'critical' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                            {notification.unread && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.message || notification.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {notification.module}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          {notification.unread && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notification.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}