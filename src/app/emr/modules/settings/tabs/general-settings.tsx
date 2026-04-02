import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';

interface GeneralSettingsProps {
  onUpdate: () => void;
}

export function GeneralSettings({ onUpdate }: GeneralSettingsProps) {
  const { settings, updateSettings } = useEMRStore();
  
  const [formData, setFormData] = useState({
    hospitalName: settings?.general?.hospitalName || 'Godiya Hospital',
    hospitalShortName: settings?.general?.hospitalShortName || 'GH',
    timeZone: settings?.general?.timeZone || 'Africa/Lagos',
    dateFormat: settings?.general?.dateFormat || 'DD/MM/YYYY',
    currencySymbol: settings?.general?.currencySymbol || '₦',
    language: settings?.general?.language || 'English',
    workingHoursStart: settings?.general?.workingHoursStart || '08:00',
    workingHoursEnd: settings?.general?.workingHoursEnd || '17:00',
  });

  useEffect(() => {
    if (settings?.general) {
      setFormData({
        hospitalName: settings.general.hospitalName || 'Godiya Hospital',
        hospitalShortName: settings.general.hospitalShortName || 'GH',
        timeZone: settings.general.timeZone || 'Africa/Lagos',
        dateFormat: settings.general.dateFormat || 'DD/MM/YYYY',
        currencySymbol: settings.general.currencySymbol || '₦',
        language: settings.general.language || 'English',
        workingHoursStart: settings.general.workingHoursStart || '08:00',
        workingHoursEnd: settings.general.workingHoursEnd || '17:00',
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate();
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      general: formData,
      lastUpdated: new Date().toISOString(),
    });
    toast.success('General settings updated successfully');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hospital Name */}
        <div className="space-y-2">
          <Label htmlFor="hospitalName">Hospital Name</Label>
          <Input
            id="hospitalName"
            value={formData.hospitalName}
            onChange={(e) => handleChange('hospitalName', e.target.value)}
            placeholder="Enter hospital name"
          />
        </div>

        {/* Hospital Short Name */}
        <div className="space-y-2">
          <Label htmlFor="hospitalShortName">Hospital Short Name</Label>
          <Input
            id="hospitalShortName"
            value={formData.hospitalShortName}
            onChange={(e) => handleChange('hospitalShortName', e.target.value)}
            placeholder="Enter short name"
          />
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <Label htmlFor="timeZone">Time Zone</Label>
          <Select 
            value={formData.timeZone} 
            onValueChange={(value) => handleChange('timeZone', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="Africa/Accra">Africa/Accra (GMT)</SelectItem>
              <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Format */}
        <div className="space-y-2">
          <Label htmlFor="dateFormat">Date Format</Label>
          <Select 
            value={formData.dateFormat} 
            onValueChange={(value) => handleChange('dateFormat', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency Symbol */}
        <div className="space-y-2">
          <Label htmlFor="currencySymbol">Currency Symbol</Label>
          <Select 
            value={formData.currencySymbol} 
            onValueChange={(value) => handleChange('currencySymbol', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="₦">₦ (Naira)</SelectItem>
              <SelectItem value="$">$ (Dollar)</SelectItem>
              <SelectItem value="£">£ (Pound)</SelectItem>
              <SelectItem value="€">€ (Euro)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select 
            value={formData.language} 
            onValueChange={(value) => handleChange('language', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hausa">Hausa</SelectItem>
              <SelectItem value="Yoruba">Yoruba</SelectItem>
              <SelectItem value="Igbo">Igbo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Working Hours Start */}
        <div className="space-y-2">
          <Label htmlFor="workingHoursStart">Working Hours Start</Label>
          <Input
            id="workingHoursStart"
            type="time"
            value={formData.workingHoursStart}
            onChange={(e) => handleChange('workingHoursStart', e.target.value)}
          />
        </div>

        {/* Working Hours End */}
        <div className="space-y-2">
          <Label htmlFor="workingHoursEnd">Working Hours End</Label>
          <Input
            id="workingHoursEnd"
            type="time"
            value={formData.workingHoursEnd}
            onChange={(e) => handleChange('workingHoursEnd', e.target.value)}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save General Settings
        </Button>
      </div>
    </motion.div>
  );
}
