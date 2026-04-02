import { NotepadText } from 'lucide-react';
import { ComingSoonPage } from './coming-soon';

export function NurseDeskPage() {
  return (
    <ComingSoonPage
      title="Nurse Desk"
      description="Nursing station for patient vitals, medications, and care"
      icon={NotepadText}
      actionButtons={[
        { label: 'Record Vitals', disabled: true },
        { label: 'View Tasks', disabled: true },
      ]}
    />
  );
}
