import { Stethoscope } from 'lucide-react';
import { ComingSoonPage } from './coming-soon';

export function DoctorsPage() {
  return (
    <ComingSoonPage
      title="Doctors Management"
      description="Manage doctor profiles, schedules, and assignments"
      icon={Stethoscope}
      actionButtons={[
        { label: 'Add Doctor', disabled: true },
        { label: 'View Schedules', disabled: true },
      ]}
    />
  );
}
