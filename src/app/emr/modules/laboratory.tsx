import { FlaskConical } from 'lucide-react';
import { ComingSoonPage } from './coming-soon';

export function LaboratoryPage() {
  return (
    <ComingSoonPage
      title="Laboratory"
      description="Manage lab tests, results, and sample tracking"
      icon={FlaskConical}
      actionButtons={[
        { label: 'New Test Request', disabled: true },
        { label: 'View Results', disabled: true },
      ]}
    />
  );
}
