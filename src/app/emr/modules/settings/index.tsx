import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings as SettingsIcon,
  CheckCircle,
  Bell,
  Clock,
  Save,
  RotateCcw,
  Download,
  Building2,
  CreditCard,
  Shield,
  Monitor,
  Database,
  User,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useEMRStore } from '@/app/emr/store/emr-store';
import { toast } from 'sonner';
import { GeneralSettings } from './tabs/general-settings';
import { HospitalProfile } from './tabs/hospital-profile';
import { BillingFees } from './tabs/billing-fees';
import { NotificationSettings } from './tabs/notification-settings';
import { SecuritySettings } from './tabs/security-settings';
import { SystemPreferences } from './tabs/system-preferences';
import { BackupRestore } from './tabs/backup-restore';
import { UserAccount } from './tabs/user-account';

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

export function SettingsPage() {
  const { settings, updateSettings } = useEMRStore();
  const [activeTab, setActiveTab] = useState('account');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const tabs = [
    { id: 'account', label: 'My Account', icon: User },
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'profile', label: 'Hospital Profile', icon: Building2 },
    { id: 'billing', label: 'Billing & Fees', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'System Preferences', icon: Monitor },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
  ];

  const handleSaveChanges = () => {
    toast.success('Settings saved successfully');
    setHasUnsavedChanges(false);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      toast.success('Settings reset to defaults');
      setHasUnsavedChanges(false);
    }
  };

  const handleExportConfig = () => {
    const configData = JSON.stringify(settings, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `godiya-hospital-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Configuration exported successfully');
  };

  // Calculate KPI values
  const activeConfigurations = Object.keys(settings || {}).length || 14;
  const billingRulesSet = settings?.billing?.registrationFee ? 5 : 0;
  const notificationRulesActive = settings?.notifications?.enableSystemNotifications ? 6 : 0;
  const lastUpdated = settings?.lastUpdated || new Date().toLocaleString();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage hospital system configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </Button>
          <Button
            variant="outline"
            onClick={handleExportConfig}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Config
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="gap-2"
            disabled={!hasUnsavedChanges}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={CheckCircle}
          label="Active Configurations"
          value={activeConfigurations}
          color="bg-blue-100 text-blue-600"
          delay={0}
        />
        <KPICard
          icon={CreditCard}
          label="Billing Rules Set"
          value={billingRulesSet}
          color="bg-green-100 text-green-600"
          delay={0.1}
        />
        <KPICard
          icon={Bell}
          label="Notification Rules Active"
          value={notificationRulesActive}
          color="bg-purple-100 text-purple-600"
          delay={0.2}
        />
        <KPICard
          icon={Clock}
          label="Last Updated"
          value={new Date(lastUpdated).toLocaleDateString()}
          color="bg-orange-100 text-orange-600"
          delay={0.3}
        />
      </div>

      {/* Settings Tabs Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
      >
        {/* Tabs Header */}
        <div className="border-b border-border bg-muted/30">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id
                    ? 'border-primary text-primary bg-white'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'account' && <UserAccount onUpdate={() => setHasUnsavedChanges(false)} />}
          {activeTab === 'general' && <GeneralSettings onUpdate={() => setHasUnsavedChanges(true)} />}
          {activeTab === 'profile' && <HospitalProfile onUpdate={() => setHasUnsavedChanges(true)} />}
          {activeTab === 'billing' && <BillingFees onUpdate={() => setHasUnsavedChanges(true)} />}
          {activeTab === 'notifications' && <NotificationSettings onUpdate={() => setHasUnsavedChanges(true)} />}
          {activeTab === 'security' && <SecuritySettings onUpdate={() => setHasUnsavedChanges(true)} />}
          {activeTab === 'preferences' && <SystemPreferences onUpdate={() => setHasUnsavedChanges(true)} />}
          {activeTab === 'backup' && <BackupRestore />}
        </div>
      </motion.div>
    </div>
  );
}
