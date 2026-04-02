import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Bell, Lock, Pill, Save, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { getCurrentUser } from '@/app/emr/utils/auth';

export function PharmacySettings() {
  const authData = getCurrentUser();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: authData?.name?.split(' ')[0] || '',
    lastName: authData?.name?.split(' ')[1] || '',
    email: authData?.email || '',
    phone: authData?.phone_number || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/auth.php?action=update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone_number: formData.phone,
        }),
      });

      const result = await response.json();
      if (result.message) {
        toast.success('Success', { description: result.message });
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/auth.php?action=change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();
      if (result.message) {
        toast.success('Success', { description: result.message });
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(result.error || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile information and account security</p>
      </div>

      {/* Profile Information */}
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
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={formData.email} disabled className="bg-muted cursor-not-allowed" />
                <p className="text-[10px] text-muted-foreground italic">Email cannot be changed by the user.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Change Password</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={formData.currentPassword} onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? 'Updating...' : <><Lock className="w-4 h-4 mr-2" />Update Password</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
