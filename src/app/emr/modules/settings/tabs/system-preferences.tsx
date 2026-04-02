import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save } from 'lucide-react';
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

interface SystemPreferencesProps {
  onUpdate: () => void;
}

export function SystemPreferences({ onUpdate }: SystemPreferencesProps) {
  const { settings, updateSettings } = useEMRStore();
  
  const [formData, setFormData] = useState({
    defaultLandingPage: settings?.preferences?.defaultLandingPage || '/emr/dashboard',
    tableRowsDefault: settings?.preferences?.tableRowsDefault || 10,
    enableDarkMode: settings?.preferences?.enableDarkMode || false,
    enableAnimations: settings?.preferences?.enableAnimations ?? true,
    printLayoutStyle: settings?.preferences?.printLayoutStyle || 'standard',
  });

  useEffect(() => {
    if (settings?.preferences) {
      setFormData({
        defaultLandingPage: settings.preferences.defaultLandingPage || '/emr/dashboard',
        tableRowsDefault: settings.preferences.tableRowsDefault || 10,
        enableDarkMode: settings.preferences.enableDarkMode || false,
        enableAnimations: settings.preferences.enableAnimations ?? true,
        printLayoutStyle: settings.preferences.printLayoutStyle || 'standard',
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate();
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      preferences: formData,
      lastUpdated: new Date().toISOString(),
    });
    toast.success('System preferences updated successfully');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Navigation Preferences */}
      <div className="space-y-4">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Navigation Preferences</h3>
          <p className="text-sm text-muted-foreground">Configure default navigation behavior</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultLandingPage">Default Landing Page</Label>
          <Select 
            value={formData.defaultLandingPage} 
            onValueChange={(value) => handleChange('defaultLandingPage', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="/emr/dashboard">Dashboard</SelectItem>
              <SelectItem value="/emr/dashboard/patients">Patients</SelectItem>
              <SelectItem value="/emr/dashboard/appointments">Appointments</SelectItem>
              <SelectItem value="/emr/dashboard/finance">Finance</SelectItem>
              <SelectItem value="/emr/dashboard/pharmacy">Pharmacy</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Page to show after login
          </p>
        </div>
      </div>

      {/* Table Preferences */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Table Preferences</h3>
          <p className="text-sm text-muted-foreground">Configure table display settings</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tableRowsDefault">Default Rows Per Page</Label>
          <Select 
            value={formData.tableRowsDefault.toString()} 
            onValueChange={(value) => handleChange('tableRowsDefault', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 rows</SelectItem>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="20">20 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Number of items shown in tables by default
          </p>
        </div>
      </div>

      {/* Appearance Preferences */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Appearance Preferences</h3>
          <p className="text-sm text-muted-foreground">Customize the look and feel</p>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enableDarkMode" className="cursor-pointer">
              Enable Dark Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Switch to dark color scheme (Coming Soon)
            </p>
          </div>
          <Switch
            id="enableDarkMode"
            checked={formData.enableDarkMode}
            onCheckedChange={(checked) => {
              handleChange('enableDarkMode', checked);
              toast.info('Dark mode feature coming soon');
            }}
            disabled
          />
        </div>

        {/* Animations */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enableAnimations" className="cursor-pointer">
              Enable Animations
            </Label>
            <p className="text-sm text-muted-foreground">
              Show smooth transitions and animations
            </p>
          </div>
          <Switch
            id="enableAnimations"
            checked={formData.enableAnimations}
            onCheckedChange={(checked) => handleChange('enableAnimations', checked)}
          />
        </div>
      </div>

      {/* Print Preferences */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Print Preferences</h3>
          <p className="text-sm text-muted-foreground">Configure print layout settings</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="printLayoutStyle">Print Layout Style</Label>
          <Select 
            value={formData.printLayoutStyle} 
            onValueChange={(value) => handleChange('printLayoutStyle', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="letterhead">With Letterhead</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Default print template for receipts and reports
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save System Preferences
        </Button>
      </div>
    </motion.div>
  );
}
