import { Heart, HeartPulse } from 'lucide-react';
import { ComingSoonPage } from '../coming-soon';

export function ICUPatientsPage() {
  return (
    <ComingSoonPage
      title="ICU Patients"
      description="Intensive care unit patient monitoring and management"
      icon={HeartPulse}
      actionButtons={[
        { label: 'Add ICU Patient', disabled: true },
        { label: 'View Monitors', disabled: true },
      ]}
    />
  );
}
