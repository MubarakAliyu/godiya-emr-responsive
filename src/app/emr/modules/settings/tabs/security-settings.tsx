import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Lock, Shield, Key } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { ChangePasswordModal } from '../components/change-password-modal';
import { Enable2FAModal } from '../components/enable-2fa-modal';

interface SecuritySettingsProps {
  onUpdate: () => void;
}

export function SecuritySettings({ onUpdate }: SecuritySettingsProps) {
  const { settings, updateSettings } = useEMRStore();
  
  const [formData, setFormData] = useState({
    passwordLength: settings?.security?.passwordLength || 8,
    sessionTimeout: settings?.security?.sessionTimeout || 30,
    enable2FA: settings?.security?.enable2FA || false,
    enableIPRestriction: settings?.security?.enableIPRestriction || false,
    accountLockAttempts: settings?.security?.accountLockAttempts || 5,
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  useEffect(() => {
    if (settings?.security) {
      setFormData({
        passwordLength: settings.security.passwordLength || 8,
        sessionTimeout: settings.security.sessionTimeout || 30,
        enable2FA: settings.security.enable2FA || false,
        enableIPRestriction: settings.security.enableIPRestriction || false,
        accountLockAttempts: settings.security.accountLockAttempts || 5,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate();
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      security: formData,
      lastUpdated: new Date().toISOString(),
    });
    toast.success('Security settings updated successfully');
  };

  const handle2FAToggle = (checked: boolean) => {
    if (checked) {
      setIs2FAModalOpen(true);
    } else {
      handleChange('enable2FA', false);
      toast.success('Two-Factor Authentication disabled');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Password Policy */}
      <div className="space-y-4">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Password Policy</h3>
          <p className="text-sm text-muted-foreground">Configure password requirements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Password Length */}
          <div className="space-y-2">
            <Label htmlFor="passwordLength">Minimum Password Length</Label>
            <Input
              id="passwordLength"
              type="number"
              min="6"
              max="20"
              value={formData.passwordLength}
              onChange={(e) => handleChange('passwordLength', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Minimum characters required (6-20)
            </p>
          </div>

          {/* Account Lock Attempts */}
          <div className="space-y-2">
            <Label htmlFor="accountLockAttempts">Account Lock Attempts</Label>
            <Input
              id="accountLockAttempts"
              type="number"
              min="3"
              max="10"
              value={formData.accountLockAttempts}
              onChange={(e) => handleChange('accountLockAttempts', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Failed login attempts before lock (3-10)
            </p>
          </div>
        </div>

        {/* Change Password Button */}
        <div className="pt-2">
          <Button 
            variant="outline" 
            onClick={() => setIsChangePasswordOpen(true)}
            className="gap-2"
          >
            <Key className="w-4 h-4" />
            Change Password
          </Button>
        </div>
      </div>

      {/* Session Management */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Session Management</h3>
          <p className="text-sm text-muted-foreground">Configure session timeout settings</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            min="5"
            max="120"
            value={formData.sessionTimeout}
            onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Auto-logout after inactivity (5-120 minutes)
          </p>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="enable2FA" className="cursor-pointer">
                Enable Two-Factor Authentication
              </Label>
              <p className="text-sm text-muted-foreground">
                {formData.enable2FA 
                  ? '2FA is currently enabled for your account'
                  : 'Require verification code for login'}
              </p>
            </div>
          </div>
          <Switch
            id="enable2FA"
            checked={formData.enable2FA}
            onCheckedChange={handle2FAToggle}
          />
        </div>

        {formData.enable2FA && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">2FA is Active</p>
                <p className="text-sm mt-1">
                  Your account is protected with two-factor authentication. You'll need to enter a verification code when logging in.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IP Restriction */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Access Control</h3>
          <p className="text-sm text-muted-foreground">Restrict access by IP address</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enableIPRestriction" className="cursor-pointer">
              Enable IP Restriction
            </Label>
            <p className="text-sm text-muted-foreground">
              Only allow access from specific IP addresses
            </p>
          </div>
          <Switch
            id="enableIPRestriction"
            checked={formData.enableIPRestriction}
            onCheckedChange={(checked) => handleChange('enableIPRestriction', checked)}
          />
        </div>

        {formData.enableIPRestriction && (
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">IP Restriction Enabled</p>
                <p className="text-sm mt-1">
                  Contact your system administrator to configure allowed IP addresses.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Security Settings
        </Button>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
      <Enable2FAModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onConfirm={() => {
          handleChange('enable2FA', true);
          setIs2FAModalOpen(false);
          toast.success('Two-Factor Authentication enabled successfully');
        }}
      />
    </motion.div>
  );
}
