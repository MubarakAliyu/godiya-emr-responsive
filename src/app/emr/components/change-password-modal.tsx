import { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';

import { getAuthState } from '@/app/emr/utils/auth';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user name from auth state
  const authState = getAuthState();
  const userName = authState?.user?.name || 'User';

  interface PasswordStrength {
    score: number;
    label: string;
    color: string;
  }

  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 40, label: 'Fair', color: 'bg-orange-500' };
    if (score === 3) return { score: 60, label: 'Good', color: 'bg-yellow-500' };
    if (score === 4) return { score: 80, label: 'Strong', color: 'bg-green-500' };
    return { score: 100, label: 'Very Strong', color: 'bg-green-600' };
  };

  const strength = getPasswordStrength(newPassword);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'Contains uppercase & lowercase', met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
    { label: 'Contains numbers', met: /\d/.test(newPassword) },
    { label: 'Contains special characters', met: /[^a-zA-Z0-9]/.test(newPassword) },
  ];

  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';
  const allRequirementsMet = passwordRequirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!currentPassword) {
      toast.error('Validation Error', {
        description: 'Please enter your current password.',
      });
      return;
    }

    if (!newPassword) {
      toast.error('Validation Error', {
        description: 'Please enter a new password.',
      });
      return;
    }

    if (!allRequirementsMet) {
      toast.error('Password Requirements Not Met', {
        description: 'Please ensure your password meets all requirements.',
      });
      return;
    }

    if (!passwordsMatch) {
      toast.error('Passwords Do Not Match', {
        description: 'New password and confirm password must match.',
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('Invalid Password', {
        description: 'New password must be different from current password.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth.php?action=change_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // Success
      toast.success('Password Changed Successfully', {
        description: 'Your password has been updated. Please use your new password for future logins.',
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);
      onClose();
    } catch (error: any) {
      toast.error('Change Password Failed', {
        description: error.message || 'An unexpected error occurred.',
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Change Password</DialogTitle>
              <DialogDescription>
                Update your account password for security
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10"
                disabled={isSubmitting}
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

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Password Strength:</span>
                  <span className={`font-semibold ${strength.color.replace('bg-', 'text-')}`}>
                    {strength.label}
                  </span>
                </div>
                <Progress value={strength.score} className={`h-2 ${strength.color}`} />
              </div>
            )}

            {/* Requirements Checklist */}
            {newPassword && (
              <div className="space-y-1.5 pt-2">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="pr-10"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className="flex items-center gap-2 text-xs pt-1">
                {passwordsMatch ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Security Tips</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>Use a unique password you don't use elsewhere</li>
                  <li>Avoid using personal information</li>
                  <li>Change your password regularly</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting || !currentPassword || !allRequirementsMet || !passwordsMatch}
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}