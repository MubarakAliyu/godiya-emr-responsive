import { Wind } from 'lucide-react';
import { ComingSoonPage } from '../coming-soon';

export function COPDPatientsPage() {
  return (
    <ComingSoonPage
      title="COPD Patients"
      description="Chronic Obstructive Pulmonary Disease patient management"
      icon={Wind}
      actionButtons={[
        { label: 'Add COPD Patient', disabled: true },
        { label: 'View Treatment Plans', disabled: true },
      ]}
    />
  );
}
