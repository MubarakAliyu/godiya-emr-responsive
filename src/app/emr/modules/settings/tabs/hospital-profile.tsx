import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';

interface HospitalProfileProps {
  onUpdate: () => void;
}

export function HospitalProfile({ onUpdate }: HospitalProfileProps) {
  const { settings, updateSettings } = useEMRStore();
  
  const [formData, setFormData] = useState({
    logo: settings?.profile?.logo || '',
    address: settings?.profile?.address || 'Birnin Kebbi, Kebbi State, Nigeria',
    phoneNumber: settings?.profile?.phoneNumber || '+234-XXX-XXX-XXXX',
    email: settings?.profile?.email || 'info@godiyahospital.com',
    website: settings?.profile?.website || 'www.godiyahospital.com',
    cmdName: settings?.profile?.cmdName || 'Dr. [Name]',
    registrationNumber: settings?.profile?.registrationNumber || 'GH-REG-2025',
    hospitalType: settings?.profile?.hospitalType || 'Private',
  });

  const [logoPreview, setLogoPreview] = useState(formData.logo);

  useEffect(() => {
    if (settings?.profile) {
      setFormData({
        logo: settings.profile.logo || '',
        address: settings.profile.address || 'Birnin Kebbi, Kebbi State, Nigeria',
        phoneNumber: settings.profile.phoneNumber || '+234-XXX-XXX-XXXX',
        email: settings.profile.email || 'info@godiyahospital.com',
        website: settings.profile.website || 'www.godiyahospital.com',
        cmdName: settings.profile.cmdName || 'Dr. [Name]',
        registrationNumber: settings.profile.registrationNumber || 'GH-REG-2025',
        hospitalType: settings.profile.hospitalType || 'Private',
      });
      setLogoPreview(settings.profile.logo || '');
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        handleChange('logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      profile: formData,
      lastUpdated: new Date().toISOString(),
    });
    toast.success('Hospital profile updated successfully');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Logo Upload Section */}
      <div className="space-y-4">
        <Label>Hospital Logo</Label>
        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Hospital Logo" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No logo</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div>
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <label htmlFor="logo-upload">
              <Button type="button" variant="outline" className="gap-2 cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Recommended: 200x200px, PNG or JPG
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Hospital Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter hospital address"
            rows={3}
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter email address"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="Enter website URL"
          />
        </div>

        {/* CMD Name */}
        <div className="space-y-2">
          <Label htmlFor="cmdName">CMD Name</Label>
          <Input
            id="cmdName"
            value={formData.cmdName}
            onChange={(e) => handleChange('cmdName', e.target.value)}
            placeholder="Enter CMD name"
          />
        </div>

        {/* Registration Number */}
        <div className="space-y-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => handleChange('registrationNumber', e.target.value)}
            placeholder="Enter registration number"
          />
        </div>

        {/* Hospital Type */}
        <div className="space-y-2">
          <Label htmlFor="hospitalType">Hospital Type</Label>
          <Select 
            value={formData.hospitalType} 
            onValueChange={(value) => handleChange('hospitalType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Private">Private Hospital</SelectItem>
              <SelectItem value="Public">Public Hospital</SelectItem>
              <SelectItem value="Teaching">Teaching Hospital</SelectItem>
              <SelectItem value="Specialist">Specialist Hospital</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Hospital Profile
        </Button>
      </div>
    </motion.div>
  );
}
