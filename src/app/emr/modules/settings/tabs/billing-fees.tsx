import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';

interface BillingFeesProps {
  onUpdate: () => void;
}

export function BillingFees({ onUpdate }: BillingFeesProps) {
  const { settings, updateSettings } = useEMRStore();

  const [formData, setFormData] = useState({
    individualFileFee: settings?.billing?.individualFileFee || 1500,
    consultationFee: settings?.billing?.consultationFee || 11000,
    baseFee: settings?.billing?.baseFee ?? 1000,
    doctorConsultationFee: settings?.billing?.doctorConsultationFee ?? 10000,
    admissionDeposit: settings?.billing?.admissionDeposit || 50000,
    enableNHIS: settings?.billing?.enableNHIS || false,
    familyFileFee: settings?.billing?.familyFileFee || 5000,
    pharmacyFlexible: settings?.billing?.pharmacyFlexible || true,
    allowManualFeeOverride: settings?.billing?.allowManualFeeOverride || true,
    allowInvoiceRegeneration: settings?.billing?.allowInvoiceRegeneration || false,
  });

  useEffect(() => {
    if (settings?.billing) {
      setFormData({
        individualFileFee: settings.billing.individualFileFee || 1500,
        consultationFee: settings.billing.consultationFee || 11000,
        baseFee: settings.billing.baseFee ?? 1000,
        doctorConsultationFee: settings.billing.doctorConsultationFee ?? 10000,
        admissionDeposit: settings.billing.admissionDeposit || 50000,
        enableNHIS: settings.billing.enableNHIS || false,
        familyFileFee: settings.billing.familyFileFee || 5000,
        pharmacyFlexible: settings.billing.pharmacyFlexible || true,
        allowManualFeeOverride: settings.billing.allowManualFeeOverride || true,
        allowInvoiceRegeneration: settings.billing.allowInvoiceRegeneration || false,
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
      billing: formData,
      lastUpdated: new Date().toISOString(),
    });
    toast.success('Billing & fees settings updated successfully');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Default Fees */}
      <div className="space-y-4">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Default Fees</h3>
          <p className="text-sm text-muted-foreground">Set standard billing amounts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Individual File Fee */}
          <div className="space-y-2">
            <Label htmlFor="individualFileFee">Individual File (₦)</Label>
            <Input
              id="individualFileFee"
              type="number"
              value={formData.individualFileFee}
              onChange={(e) => handleChange('individualFileFee', parseFloat(e.target.value))}
              placeholder="Enter individual file fee"
            />
          </div>

          {/* Base Consultation Fee (fixed) */}
          <div className="space-y-2">
            <Label htmlFor="baseFee">Base Consultation Fee (₦) — Fixed</Label>
            <Input
              id="baseFee"
              type="number"
              value={formData.baseFee}
              onChange={(e) => handleChange('baseFee', parseFloat(e.target.value))}
              placeholder="1000"
            />
            <p className="text-xs text-muted-foreground">Fixed registration/triage component, e.g. ₦1,000</p>
          </div>

          {/* Doctor Consultation Fee (dynamic) */}
          <div className="space-y-2">
            <Label htmlFor="doctorConsultationFee">Doctor Consultation Fee (₦) — Dynamic (₦10,000–₦15,000)</Label>
            <Input
              id="doctorConsultationFee"
              type="number"
              min={10000}
              max={15000}
              value={formData.doctorConsultationFee}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                handleChange('doctorConsultationFee', val);
                // Keep total consultationFee in sync
                handleChange('consultationFee', formData.baseFee + val);
              }}
              placeholder="10000"
            />
            <p className="text-xs text-muted-foreground">
              Configurable between ₦10,000 and ₦15,000. Total: <strong>₦{(formData.baseFee + formData.doctorConsultationFee).toLocaleString()}</strong>
            </p>
          </div>

          {/* Admission Deposit */}
          <div className="space-y-2">
            <Label htmlFor="admissionDeposit">Admission Deposit (₦)</Label>
            <Input
              id="admissionDeposit"
              type="number"
              value={formData.admissionDeposit}
              onChange={(e) => handleChange('admissionDeposit', parseFloat(e.target.value))}
              placeholder="Enter admission deposit"
            />
          </div>

          {/* Family File Fee */}
          <div className="space-y-2">
            <Label htmlFor="familyFileFee">Family File (₦)</Label>
            <Input
              id="familyFileFee"
              type="number"
              value={formData.familyFileFee}
              onChange={(e) => handleChange('familyFileFee', parseFloat(e.target.value))}
              placeholder="Enter family file fee"
            />
          </div>
        </div>
      </div>

      {/* Settings Toggles */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="pb-2">
          <h3 className="text-lg font-semibold">Billing Settings</h3>
          <p className="text-sm text-muted-foreground">Configure billing behavior</p>
        </div>

        {/* Enable NHIS */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="enableNHIS" className="cursor-pointer">Enable NHIS</Label>
            <p className="text-sm text-muted-foreground">
              Support National Health Insurance Scheme
            </p>
          </div>
          <Switch
            id="enableNHIS"
            checked={formData.enableNHIS}
            onCheckedChange={(checked) => handleChange('enableNHIS', checked)}
          />
        </div>

        {/* Pharmacy Flexible */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="pharmacyFlexible" className="cursor-pointer">Pharmacy Flexible Pricing</Label>
            <p className="text-sm text-muted-foreground">
              Allow flexible pricing in pharmacy module
            </p>
          </div>
          <Switch
            id="pharmacyFlexible"
            checked={formData.pharmacyFlexible}
            onCheckedChange={(checked) => handleChange('pharmacyFlexible', checked)}
          />
        </div>

        {/* Allow Manual Fee Override */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="allowManualFeeOverride" className="cursor-pointer">Allow Manual Fee Override</Label>
            <p className="text-sm text-muted-foreground">
              Permit staff to modify standard fees
            </p>
          </div>
          <Switch
            id="allowManualFeeOverride"
            checked={formData.allowManualFeeOverride}
            onCheckedChange={(checked) => handleChange('allowManualFeeOverride', checked)}
          />
        </div>

        {/* Allow Invoice Regeneration */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="allowInvoiceRegeneration" className="cursor-pointer">Allow Invoice Re-Generation After Payment</Label>
            <p className="text-sm text-muted-foreground">
              Enable regenerating invoices after payment
            </p>
          </div>
          <Switch
            id="allowInvoiceRegeneration"
            checked={formData.allowInvoiceRegeneration}
            onCheckedChange={(checked) => handleChange('allowInvoiceRegeneration', checked)}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          Save Billing Settings
        </Button>
      </div>
    </motion.div>
  );
}
