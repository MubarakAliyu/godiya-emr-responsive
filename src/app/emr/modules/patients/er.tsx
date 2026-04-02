import { Ambulance } from 'lucide-react';
import { ComingSoonPage } from '../coming-soon';

export function ERPatientsPage() {
  return (
    <ComingSoonPage
      title="Emergency Room Patients"
      description="Manage emergency room admissions and critical care"
      icon={Ambulance}
      actionButtons={[
        { label: 'Add ER Patient', disabled: true },
        { label: 'View Queue', disabled: true },
      ]}
    />
  );
}
