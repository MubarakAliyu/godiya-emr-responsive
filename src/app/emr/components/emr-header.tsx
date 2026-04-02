import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb';
import { SidebarTrigger } from '@/app/components/ui/sidebar';
import { toast } from 'sonner';
import { LogoutConfirmModal } from './logout-confirm-modal';
import { NotificationsDrawer } from './notifications-drawer';
import { CashierProfileDropdown } from './cashier-profile-dropdown';
import { ProfileDropdown } from './profile-dropdown';
import { ChangePasswordModal } from './change-password-modal';
import { useEMRStore } from '../store/emr-store';

import {
  getAuthState,
  logoutUser
} from '../utils/auth';

interface EMRHeaderProps {
  breadcrumbs: { label: string; path?: string }[];
}

export function EMRHeader({ breadcrumbs }: EMRHeaderProps) {
  const navigate = useNavigate();
  const { notifications } = useEMRStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const authState = getAuthState();
  const user = authState?.user;
  const unreadNotifications = notifications.filter((notification) => notification.unread).length;
  const currentLabel = useMemo(
    () => (breadcrumbs[breadcrumbs.length - 1] ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard'),
    [breadcrumbs]
  );

  const getSettingsPath = () => {
    const role = user?.role || 'Super Administrator';

    // Map roles to their correct settings paths
    switch (role) {
      case 'Doctor':
        return '/emr/doctor/settings';
      case 'Nurse':
        return '/emr/nurse/settings';
      case 'Receptionist':
        return '/emr/reception/settings';
      case 'Cashier':
        return '/emr/cashier/settings';
      case 'Laboratory':
        return '/emr/laboratory-staff/settings';
      case 'Pharmacy':
        return '/emr/pharmacy-staff/settings';
      default:
        return '/emr/dashboard/settings'; // Super Admin
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/emr/login');
    toast.success('Logged out successfully');
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <SidebarTrigger className="h-9 w-9 rounded-lg border border-border bg-white shadow-sm hover:bg-muted" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground sm:hidden">{currentLabel}</p>
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList className="flex-wrap gap-y-1">
                  {breadcrumbs.map((breadcrumb, index) => (
                    <div key={`${breadcrumb.label}-${index}`} className="flex items-center gap-2">
                      <BreadcrumbItem>
                        {breadcrumb.path ? (
                          <BreadcrumbLink asChild>
                            <Link to={breadcrumb.path}>{breadcrumb.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg border border-border bg-white shadow-sm hover:bg-muted"
              onClick={() => setIsNotificationsOpen(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Button>
            {user?.role === 'Cashier' || user?.role === 'Receptionist' ? (
              <CashierProfileDropdown
                authData={user}
                getSettingsPath={getSettingsPath}
                handleLogout={handleLogout}
                setIsLogoutModalOpen={setIsLogoutModalOpen}
              />
            ) : (
              <ProfileDropdown
                authData={user}
                getSettingsPath={getSettingsPath}
                handleLogout={handleLogout}
                setIsLogoutModalOpen={setIsLogoutModalOpen}
                setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
              />
            )}
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </>
  );
}
