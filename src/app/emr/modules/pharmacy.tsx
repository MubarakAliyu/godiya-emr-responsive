import { Pill } from 'lucide-react';
import { ComingSoonPage } from './coming-soon';

export function PharmacyPage() {
  return (
    <ComingSoonPage
      title="Pharmacy"
      description="Manage prescriptions, drug inventory, and dispensing"
      icon={Pill}
      actionButtons={[
        { label: 'Dispense Medication', disabled: true },
        { label: 'View Inventory', disabled: true },
      ]}
    />
  );
}
