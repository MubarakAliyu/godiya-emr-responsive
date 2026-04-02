import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Volume2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  onUpdate: () => void;
}

export function NotificationSettings({ onUpdate }: NotificationSettingsProps) {
  const { settings, updateSettings } = useEMRStore();
  
  const [formData, setFormData] = useState({
    enableSystemNotifications: settings?.notifications?.enableSystemNotifications ?? true,
    enableEmailAlerts: settings?.notifications?.enableEmailAlerts ?? true,
    enableSMSAlerts: settings?.notifications?.enableSMSAlerts ?? false,
    appointmentReminder: settings?.notifications?.appointmentReminder ?? true,
    paymentConfirmation: settings?.notifications?.paymentConfirmation ?? true,
    labResultReady: settings?.notifications?.labResultReady ?? true,
    notificationSound: settings?.notifications?.notificationSound || 'default',
  });

  useEffect(() => {
    if (settings?.notifications) {
      setFormData({
        enableSystemNotifications: settings.notifications.enableSystemNotifications ?? true,
        enableEmailAlerts: settings.notifications.enableEmailAlerts ?? true,
        enableSMSAlerts: settings.notifications.enableSMSAlerts ?? false,
        appointmentReminder: settings.notifications.appointmentReminder ?? true,
        paymentConfirmation: settings.notifications.paymentConfirmation ?? true,
        labResultReady: settings.notifications.labResultReady ?? true,
        notificationSound: settings.notifications.notificationSound || 'default',
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: boolean | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate();
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      notifications: formData,
      lastUpdated: new Date().toISOString(),
    });
    toast.success('Notification settings updated successfully');
  };

  const playNotificationSound = () => {
    // Play a sample notification sound
    toast.info('Playing notification sound preview');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* General Notifications */}
      <div className="space-y-4">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">General Notifications</h3>
          <p className="text-sm text-muted-foreground">Configure notification channels</p>
        </div>

        {/* Enable System Notifications */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enableSystemNotifications" className="cursor-pointer">
              Enable System Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Show in-app notifications for all events
            </p>
          </div>
          <Switch
            id="enableSystemNotifications"
            checked={formData.enableSystemNotifications}
            onCheckedChange={(checked) => handleChange('enableSystemNotifications', checked)}
          />
        </div>

        {/* Enable Email Alerts */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enableEmailAlerts" className="cursor-pointer">
              Enable Email Alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Send notifications via email
            </p>
          </div>
          <Switch
            id="enableEmailAlerts"
            checked={formData.enableEmailAlerts}
            onCheckedChange={(checked) => handleChange('enableEmailAlerts', checked)}
          />
        </div>

        {/* Enable SMS Alerts */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enableSMSAlerts" className="cursor-pointer">
              Enable SMS Alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Send notifications via SMS
            </p>
          </div>
          <Switch
            id="enableSMSAlerts"
            checked={formData.enableSMSAlerts}
            onCheckedChange={(checked) => handleChange('enableSMSAlerts', checked)}
          />
        </div>
      </div>

      {/* Event-Specific Notifications */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Event-Specific Notifications</h3>
          <p className="text-sm text-muted-foreground">Choose which events trigger notifications</p>
        </div>

        {/* Appointment Reminder */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="appointmentReminder" className="cursor-pointer">
              Appointment Reminder
            </Label>
            <p className="text-sm text-muted-foreground">
              Notify patients about upcoming appointments
            </p>
          </div>
          <Switch
            id="appointmentReminder"
            checked={formData.appointmentReminder}
            onCheckedChange={(checked) => handleChange('appointmentReminder', checked)}
          />
        </div>

        {/* Payment Confirmation */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="paymentConfirmation" className="cursor-pointer">
              Payment Confirmation
            </Label>
            <p className="text-sm text-muted-foreground">
              Send receipts and payment confirmations
            </p>
          </div>
          <Switch
            id="paymentConfirmation"
            checked={formData.paymentConfirmation}
            onCheckedChange={(checked) => handleChange('paymentConfirmation', checked)}
          />
        </div>

        {/* Lab Result Ready */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="labResultReady" className="cursor-pointer">
              Lab Result Ready
            </Label>
            <p className="text-sm text-muted-foreground">
              Alert when laboratory results are available
            </p>
          </div>
          <Switch
            id="labResultReady"
            checked={formData.labResultReady}
            onCheckedChange={(checked) => handleChange('labResultReady', checked)}
          />
        </div>
      </div>

      {/* Notification Sound */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Sound Settings</h3>
          <p className="text-sm text-muted-foreground">Configure notification sounds</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="notificationSound">Notification Sound</Label>
            <Select 
              value={formData.notificationSound} 
              onValueChange={(value) => handleChange('notificationSound', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="chime">Chime</SelectItem>
                <SelectItem value="bell">Bell</SelectItem>
                <SelectItem value="ding">Ding</SelectItem>
                <SelectItem value="none">None (Silent)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline" 
            onClick={playNotificationSound}
            className="gap-2 mt-7"
          >
            <Volume2 className="w-4 h-4" />
            Preview
          </Button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Notification Settings
        </Button>
      </div>
    </motion.div>
  );
}
