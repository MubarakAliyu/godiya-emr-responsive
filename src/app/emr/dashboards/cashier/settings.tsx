import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Save, Loader2, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { getCurrentUser, storeAuthData, getAuthState } from '@/app/emr/utils/auth';

export function CashierSettings() {
  const authData = getCurrentUser();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [minPasswordLength, setMinPasswordLength] = useState<number>(8);

  // PIN state
  const [hasPin, setHasPin] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: '', confirmPin: '' });
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Fetch security settings + PIN status on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [settingsRes, pinRes] = await Promise.all([
          fetch('/api/settings.php', { credentials: 'include' }),
          fetch('/api/cashier_pin.php?action=status', { credentials: 'include' }),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data?.security?.passwordMinLength) {
            setMinPasswordLength(Number(data.security.passwordMinLength));
          }
        }
        if (pinRes.ok) {
          const pinData = await pinRes.json();
          setHasPin(!!pinData.has_pin);
        }
      } catch {
        // silently fail — keep defaults
      }
    };
    init();
  }, []);

  // Profile form
  const nameParts = (authData?.name || '').split(' ');
  const [profileForm, setProfileForm] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone_number: authData?.phone_number || '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    if (!profileForm.firstName || !profileForm.lastName) {
      toast.error('First name and last name are required.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const response = await fetch('/api/auth.php?action=update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone_number: profileForm.phone_number,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile.');

      const currentState = getAuthState();
      if (currentState?.user) {
        storeAuthData(
          {
            ...currentState,
            user: {
              ...currentState.user,
              name: `${profileForm.firstName} ${profileForm.lastName}`,
              phone_number: profileForm.phone_number,
            },
          },
          !!localStorage.getItem('emr_auth')
        );
      }
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    if (passwordForm.newPassword.length < minPasswordLength) {
      toast.error(`Password must be at least ${minPasswordLength} characters long.`);
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth.php?action=change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password.');
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSavePin = async () => {
    const pinValue = pinForm.pin.trim();
    if (!/^\d{4,6}$/.test(pinValue)) {
      toast.error('PIN must be 4–6 digits.');
      return;
    }
    if (pinValue !== pinForm.confirmPin) {
      toast.error('PINs do not match!');
      return;
    }
    setIsSavingPin(true);
    try {
      const response = await fetch('/api/cashier_pin.php?action=set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin: pinValue }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to set PIN.');
      toast.success(hasPin ? 'Cashier PIN updated!' : 'Cashier PIN set successfully!');
      setHasPin(true);
      setPinForm({ pin: '', confirmPin: '' });
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.');
    } finally {
      setIsSavingPin(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Account Settings</h1>
        <p className="text-muted-foreground">Manage your cashier profile, password and transaction PIN.</p>
      </div>

      {/* ── Profile Information ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal information and contact details.</CardDescription>
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
                  value={authData?.email || ''}
                  disabled
                  className="bg-muted/40 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Change Password ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password. Minimum length: <strong>{minPasswordLength} characters</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder={`Min. ${minPasswordLength} characters`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Cashier PIN ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <CardTitle>Cashier PIN</CardTitle>
              </div>
              {hasPin ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                  <CheckCircle2 className="w-3 h-3" /> PIN Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-yellow-700 bg-yellow-100 hover:bg-yellow-100">
                  No PIN Set
                </Badge>
              )}
            </div>
            <CardDescription>
              {hasPin
                ? 'Your cashier PIN is active. Enter a new PIN below to update it.'
                : 'Set a 4–6 digit PIN used to authorise sensitive cashier actions (e.g. discounts, voids).'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pin">{hasPin ? 'New PIN' : 'PIN'}</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    value={pinForm.pin}
                    onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4–6 digits"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <div className="relative">
                  <Input
                    id="confirmPin"
                    type={showConfirmPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    value={pinForm.confirmPin}
                    onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                    placeholder="Re-enter PIN"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* PIN strength indicator */}
            {pinForm.pin.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${pinForm.pin.length >= i * 2
                        ? i === 1 ? 'bg-red-400' : i === 2 ? 'bg-yellow-400' : 'bg-green-400'
                        : 'bg-muted'
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pinForm.pin.length < 4 ? 'Too short — enter at least 4 digits' :
                    pinForm.pin.length === 4 ? 'Basic (4 digits)' :
                      pinForm.pin.length === 5 ? 'Good (5 digits)' :
                        'Strong (6 digits)'}
                </p>
              </div>
            )}

            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSavePin} disabled={isSavingPin}>
                {isSavingPin ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                {isSavingPin ? 'Saving...' : hasPin ? 'Update PIN' : 'Set PIN'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
