import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings as SettingsIcon, 
  Lock, 
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { toast } from 'sonner';
import { LogoutConfirmModal } from './logout-confirm-modal';
import { useEMRStore } from '../store/emr-store';

// Set PIN Modal (First Time)
function SetPINModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [errors, setErrors] = useState<{ newPIN?: string; confirmPIN?: string }>({});
  const [showNewPIN, setShowNewPIN] = useState(false);
  const [showConfirmPIN, setShowConfirmPIN] = useState(false);
  const { setCashierPIN } = useEMRStore();

  const validatePIN = () => {
    const newErrors: { newPIN?: string; confirmPIN?: string } = {};

    // Check if PINs are entered
    if (!newPIN) {
      newErrors.newPIN = 'PIN is required';
    } else if (newPIN.length !== 4) {
      newErrors.newPIN = 'PIN must be exactly 4 digits';
    } else if (!/^\d+$/.test(newPIN)) {
      newErrors.newPIN = 'PIN must contain only numbers';
    } else {
      // Check for sequential numbers
      const isSequential = 
        newPIN === '1234' || newPIN === '2345' || newPIN === '3456' || 
        newPIN === '4567' || newPIN === '5678' || newPIN === '6789' ||
        newPIN === '0123' || newPIN === '9876' || newPIN === '8765' ||
        newPIN === '7654' || newPIN === '6543' || newPIN === '5432' ||
        newPIN === '4321' || newPIN === '3210';
      
      const isRepeating = /^(\d)\1{3}$/.test(newPIN); // Like 1111, 2222, etc.

      if (isSequential) {
        newErrors.newPIN = 'PIN cannot be sequential (e.g., 1234, 4321)';
      } else if (isRepeating) {
        newErrors.newPIN = 'PIN cannot be repeating digits (e.g., 1111)';
      }
    }

    if (!confirmPIN) {
      newErrors.confirmPIN = 'Please confirm your PIN';
    } else if (newPIN !== confirmPIN) {
      newErrors.confirmPIN = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetPIN = () => {
    if (!validatePIN()) {
      return;
    }

    // Save PIN to store
    setCashierPIN(newPIN);

    // Show success message
    toast.success('PIN Set Successfully', {
      description: 'Your 4-digit PIN has been created. You can now confirm payments.',
    });

    // Reset form
    setNewPIN('');
    setConfirmPIN('');
    setErrors({});
    setShowNewPIN(false);
    setShowConfirmPIN(false);

    onSuccess();
    onClose();
  };

  const handleCancel = () => {
    setNewPIN('');
    setConfirmPIN('');
    setErrors({});
    setShowNewPIN(false);
    setShowConfirmPIN(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-primary" />
            Set Your Payment PIN
          </DialogTitle>
          <DialogDescription>
            Create a secure 4-digit PIN to authorize payment confirmations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">PIN Requirements:</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Must be exactly 4 digits</li>
              <li>Cannot be sequential (e.g., 1234, 4321)</li>
              <li>Cannot be repeating (e.g., 1111, 2222)</li>
              <li>Must contain only numbers</li>
            </ul>
          </div>

          {/* New PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="new-pin">New PIN *</Label>
            <div className="relative">
              <Input
                id="new-pin"
                type={showNewPIN ? 'text' : 'password'}
                maxLength={4}
                value={newPIN}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setNewPIN(value);
                  setErrors({ ...errors, newPIN: undefined });
                }}
                placeholder="••••"
                className={`text-center text-2xl tracking-[1em] font-bold pr-10 ${
                  errors.newPIN ? 'border-destructive' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPIN(!showNewPIN)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPIN && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.newPIN}
              </p>
            )}
          </div>

          {/* Confirm PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-pin">Confirm PIN *</Label>
            <div className="relative">
              <Input
                id="confirm-pin"
                type={showConfirmPIN ? 'text' : 'password'}
                maxLength={4}
                value={confirmPIN}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setConfirmPIN(value);
                  setErrors({ ...errors, confirmPIN: undefined });
                }}
                placeholder="••••"
                className={`text-center text-2xl tracking-[1em] font-bold pr-10 ${
                  errors.confirmPIN ? 'border-destructive' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPIN(!showConfirmPIN)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPIN && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.confirmPIN}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSetPIN}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Set PIN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Change PIN Modal
function ChangePINModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [oldPIN, setOldPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [errors, setErrors] = useState<{ oldPIN?: string; newPIN?: string; confirmPIN?: string }>({});
  const [showOldPIN, setShowOldPIN] = useState(false);
  const [showNewPIN, setShowNewPIN] = useState(false);
  const [showConfirmPIN, setShowConfirmPIN] = useState(false);
  const { cashierPIN, setCashierPIN } = useEMRStore();

  const validatePIN = () => {
    const newErrors: { oldPIN?: string; newPIN?: string; confirmPIN?: string } = {};

    // Check old PIN
    if (!oldPIN) {
      newErrors.oldPIN = 'Old PIN is required';
    } else if (oldPIN !== cashierPIN) {
      newErrors.oldPIN = 'Incorrect old PIN';
    }

    // Check new PIN
    if (!newPIN) {
      newErrors.newPIN = 'New PIN is required';
    } else if (newPIN.length !== 4) {
      newErrors.newPIN = 'PIN must be exactly 4 digits';
    } else if (!/^\d+$/.test(newPIN)) {
      newErrors.newPIN = 'PIN must contain only numbers';
    } else if (newPIN === oldPIN) {
      newErrors.newPIN = 'New PIN must be different from old PIN';
    } else {
      // Check for sequential numbers
      const isSequential = 
        newPIN === '1234' || newPIN === '2345' || newPIN === '3456' || 
        newPIN === '4567' || newPIN === '5678' || newPIN === '6789' ||
        newPIN === '0123' || newPIN === '9876' || newPIN === '8765' ||
        newPIN === '7654' || newPIN === '6543' || newPIN === '5432' ||
        newPIN === '4321' || newPIN === '3210';
      
      const isRepeating = /^(\d)\1{3}$/.test(newPIN);

      if (isSequential) {
        newErrors.newPIN = 'PIN cannot be sequential';
      } else if (isRepeating) {
        newErrors.newPIN = 'PIN cannot be repeating digits';
      }
    }

    // Check confirm PIN
    if (!confirmPIN) {
      newErrors.confirmPIN = 'Please confirm your new PIN';
    } else if (newPIN !== confirmPIN) {
      newErrors.confirmPIN = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePIN = () => {
    if (!validatePIN()) {
      if (errors.oldPIN) {
        toast.error('Wrong Old PIN', {
          description: 'The old PIN you entered is incorrect.',
        });
      }
      return;
    }

    // Update PIN in store
    setCashierPIN(newPIN);

    // Show success message
    toast.success('PIN Changed Successfully', {
      description: 'Your payment PIN has been updated.',
    });

    // Reset form
    setOldPIN('');
    setNewPIN('');
    setConfirmPIN('');
    setErrors({});
    setShowOldPIN(false);
    setShowNewPIN(false);
    setShowConfirmPIN(false);

    onSuccess();
    onClose();
  };

  const handleCancel = () => {
    setOldPIN('');
    setNewPIN('');
    setConfirmPIN('');
    setErrors({});
    setShowOldPIN(false);
    setShowNewPIN(false);
    setShowConfirmPIN(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            Change Payment PIN
          </DialogTitle>
          <DialogDescription>
            Update your 4-digit PIN for payment authorization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Old PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="old-pin">Old PIN *</Label>
            <div className="relative">
              <Input
                id="old-pin"
                type={showOldPIN ? 'text' : 'password'}
                maxLength={4}
                value={oldPIN}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setOldPIN(value);
                  setErrors({ ...errors, oldPIN: undefined });
                }}
                placeholder="••••"
                className={`text-center text-2xl tracking-[1em] font-bold pr-10 ${
                  errors.oldPIN ? 'border-destructive' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowOldPIN(!showOldPIN)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOldPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.oldPIN && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.oldPIN}
              </p>
            )}
          </div>

          {/* New PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="new-pin-change">New PIN *</Label>
            <div className="relative">
              <Input
                id="new-pin-change"
                type={showNewPIN ? 'text' : 'password'}
                maxLength={4}
                value={newPIN}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setNewPIN(value);
                  setErrors({ ...errors, newPIN: undefined });
                }}
                placeholder="••••"
                className={`text-center text-2xl tracking-[1em] font-bold pr-10 ${
                  errors.newPIN ? 'border-destructive' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPIN(!showNewPIN)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPIN && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.newPIN}
              </p>
            )}
          </div>

          {/* Confirm PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-pin-change">Confirm New PIN *</Label>
            <div className="relative">
              <Input
                id="confirm-pin-change"
                type={showConfirmPIN ? 'text' : 'password'}
                maxLength={4}
                value={confirmPIN}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setConfirmPIN(value);
                  setErrors({ ...errors, confirmPIN: undefined });
                }}
                placeholder="••••"
                className={`text-center text-2xl tracking-[1em] font-bold pr-10 ${
                  errors.confirmPIN ? 'border-destructive' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPIN(!showConfirmPIN)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPIN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPIN && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.confirmPIN}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleChangePIN}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Change PIN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Change Password Modal
function ChangePasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Simulate password change
    toast.success('Password Changed Successfully', {
      description: 'Your account password has been updated.',
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            Change Password
          </DialogTitle>
          <DialogDescription>
            Update your account login password
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password *</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password *</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password *</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View Profile Modal
function ViewProfileModal({
  isOpen,
  onClose,
  authData
}: {
  isOpen: boolean;
  onClose: () => void;
  authData: any;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Profile Information
          </DialogTitle>
          <DialogDescription>
            View your account details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-white text-2xl">
                {authData.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-semibold">{authData.name || 'Aliyu'}</p>
              <Badge variant="secondary" className="mt-1">
                {authData.role || 'Cashier'}
              </Badge>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4 border border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email Address</p>
              <p className="font-medium">{authData.email || 'ghaliyu@gmail.com'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Role</p>
              <p className="font-medium">{authData.role || 'Cashier'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Department</p>
              <p className="font-medium">Finance & Accounts</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Staff ID</p>
              <p className="font-medium font-mono">GH-STF-2024-001</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <Badge variant="default" className="bg-secondary">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Cashier Profile Dropdown Component
export function CashierProfileDropdown({
  authData: authDataProp,
  getSettingsPath: getSettingsPathProp,
  handleLogout: handleLogoutProp,
  setIsLogoutModalOpen: setIsLogoutModalOpenProp,
}: {
  authData?: any;
  getSettingsPath?: () => string;
  handleLogout?: () => void;
  setIsLogoutModalOpen?: (isOpen: boolean) => void;
}) {
  const navigate = useNavigate();
  const { cashierPIN } = useEMRStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSetPINModalOpen, setIsSetPINModalOpen] = useState(false);
  const [isChangePINModalOpen, setIsChangePINModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isViewProfileModalOpen, setIsViewProfileModalOpen] = useState(false);
  const authData = authDataProp || JSON.parse(localStorage.getItem('emr_auth') || '{}');

  const hasPIN = !!cashierPIN;

  const handleLogout = handleLogoutProp || (() => {
    localStorage.removeItem('emr_auth');
    toast.success('Logged out successfully.');
    navigate('/emr/login');
  });

  const openLogoutModal = setIsLogoutModalOpenProp || setIsLogoutModalOpen;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 md:gap-3 hover:bg-muted px-2 py-1.5 rounded-lg transition-colors flex-shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white text-sm">
                {authData.name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:block text-sm font-medium">
              {authData.name || 'Aliyu'}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{authData.name || 'Aliyu'}</p>
            <p className="text-xs text-muted-foreground">{authData.email || 'ghaliyu@gmail.com'}</p>
            <Badge className="mt-1 text-xs" variant="secondary">
              {authData.role || 'Cashier'}
            </Badge>
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setIsViewProfileModalOpen(true)}>
            <User className="w-4 h-4 mr-2" />
            View Profile
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsChangePasswordModalOpen(true)}>
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => hasPIN ? setIsChangePINModalOpen(true) : setIsSetPINModalOpen(true)}>
            <KeyRound className="w-4 h-4 mr-2" />
            {hasPIN ? 'Change PIN' : 'Set PIN'}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => navigate(getSettingsPathProp ? getSettingsPathProp() : '/emr/cashier/settings')}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => openLogoutModal(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <ViewProfileModal
        isOpen={isViewProfileModalOpen}
        onClose={() => setIsViewProfileModalOpen(false)}
        authData={authData}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      <SetPINModal
        isOpen={isSetPINModalOpen}
        onClose={() => setIsSetPINModalOpen(false)}
        onSuccess={() => {}}
      />

      <ChangePINModal
        isOpen={isChangePINModalOpen}
        onClose={() => setIsChangePINModalOpen(false)}
        onSuccess={() => {}}
      />

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}