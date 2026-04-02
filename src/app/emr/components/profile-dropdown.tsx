import { useState } from 'react';
import { User, Settings, Lock, LogOut, Bell, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEMRStore } from '../store/emr-store';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

interface ProfileDropdownProps {
  authData: any;
  getSettingsPath: () => string;
  handleLogout: () => void;
  setIsLogoutModalOpen: (open: boolean) => void;
  setIsChangePasswordModalOpen: (open: boolean) => void;
}

export function ProfileDropdown({
  authData,
  getSettingsPath,
  handleLogout,
  setIsLogoutModalOpen,
  setIsChangePasswordModalOpen
}: ProfileDropdownProps) {
  const navigate = useNavigate();
  const { notifications } = useEMRStore();

  const unreadNotifications = notifications.filter(n => n.unread).length;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = () => {
    const role = authData.role || 'User';
    switch (role) {
      case 'Doctor':
        return 'bg-blue-100 text-blue-700';
      case 'Nurse':
        return 'bg-green-100 text-green-700';
      case 'Reception':
      case 'Receptionist':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const userName = authData.name || 'User';
  const userEmail = authData.email || 'user@godiyahospital.ng';
  const userRole = authData.role || 'User';

  const handleViewProfile = () => {
    toast.info('View Profile', {
      description: 'Opening your profile page...',
    });
    navigate(getSettingsPath() + '?tab=account');
  };

  const handleSettings = () => {
    navigate(getSettingsPath());
  };

  const handleChangePassword = () => {
    setIsChangePasswordModalOpen(true);
  };

  const handleNotifications = () => {
    // Determine the correct notifications path based on role
    const role = authData.role || 'User';
    let notificationsPath = '/emr/dashboard/notifications'; // Default to Super Admin

    if (role === 'Doctor') notificationsPath = '/emr/doctor/notifications';
    else if (role === 'Nurse') notificationsPath = '/emr/nurse/notifications';
    else if (role === 'Reception' || role === 'Receptionist') notificationsPath = '/emr/reception/notifications';
    else if (role === 'Cashier') notificationsPath = '/emr/cashier/notifications';
    else if (role === 'Laboratory') notificationsPath = '/emr/laboratory-staff/notifications';
    else if (role === 'Pharmacy') notificationsPath = '/emr/pharmacy-staff/notifications';
    else if (role === 'Super Administrator' || role === 'Super Admin' || role === 'Admin') notificationsPath = '/emr/dashboard/notifications';

    navigate(notificationsPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="relative">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-white font-semibold text-sm">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{unreadNotifications}</span>
              </div>
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
          <ChevronDown className="hidden md:block w-4 h-4 text-muted-foreground" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3 py-2">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-white font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm">{userName}</p>
              <p className="text-xs text-muted-foreground mb-1">{userEmail}</p>
              <Badge className={`text-xs ${getRoleBadgeColor()}`}>
                {userRole}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer py-2.5">
          <User className="w-4 h-4 mr-3 text-primary" />
          <span>View Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer py-2.5">
          <Settings className="w-4 h-4 mr-3 text-primary" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleChangePassword}
          className="cursor-pointer py-2.5"
        >
          <Lock className="w-4 h-4 mr-3 text-primary" />
          <span>Change Password</span>
        </DropdownMenuItem>

        {unreadNotifications > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleNotifications}
              className="cursor-pointer py-2.5"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-3 text-primary" />
                  <span>Notifications</span>
                </div>
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications}
                </Badge>
              </div>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setIsLogoutModalOpen(true)}
          className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}