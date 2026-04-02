import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';

export function LaboratorySettings() {
  const authData = getCurrentUser();

  // ── Profile form ─────────────────────────────────────────────────────────
  const fullName = authData?.name || '';
  const nameParts = fullName.trim().split(' ');
  const [profileForm, setProfileForm] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: authData?.email || '',
    phone: authData?.phone_number || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      toast.error('First name and last name are required.');
      return;
    }
    try {
      setIsSavingProfile(true);
      const res = await fetch('/api/auth.php?action=update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          phone_number: profileForm.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      toast.success('Profile updated successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    try {
      setIsSavingPassword(true);
      const res = await fetch('/api/auth.php?action=change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      toast.error(e.message || 'Could not change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
        <p className="text-muted-foreground">Update your personal information and account password</p>
      </div>

      {/* ── Profile Information ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="bg-muted/50 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground">Email cannot be changed here. Contact admin.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                <Save className="w-4 h-4 mr-2" />
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Change Password ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Change Password</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter your new password"
                    className={`pr-10 ${passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                      ? 'border-red-400 focus-visible:ring-red-400'
                      : ''
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={isSavingPassword}>
                <Lock className="w-4 h-4 mr-2" />
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
