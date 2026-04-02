import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCheck, Trash2, DollarSign, FlaskConical, UserPlus, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { toast } from 'sonner';
import { useEMRStore } from '../store/emr-store';
import { formatDistanceToNow } from 'date-fns';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, any> = {
  DollarSign,
  FlaskConical,
  UserPlus,
  AlertCircle,
  Calendar,
  UserCheck: UserPlus,
  UserMinus: UserPlus,
};

export function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useEMRStore();
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
      if (n.unread) markNotificationAsRead(n.id);
    });
    toast.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    clearAllNotifications();
    toast.success('All notifications cleared');
  };

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeTab);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            style={{ height: '100vh', width: '100vw' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">System Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex-1 gap-2"
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all as read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex-1 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </Button>
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="w-full grid grid-cols-4 mx-4 mt-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="clinical">Clinical</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => {
                        const Icon = iconMap[notification.icon] || AlertCircle;
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                              notification.unread ? 'bg-primary/5 border-primary/20' : 'bg-white border-border'
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                notification.category === 'billing' ? 'bg-green-100 text-green-600' :
                                notification.category === 'clinical' ? 'bg-red-100 text-red-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-sm font-medium">{notification.title}</h3>
                                  {notification.unread && (
                                    <Badge className="h-2 w-2 p-0 bg-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}