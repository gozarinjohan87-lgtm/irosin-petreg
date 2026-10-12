import { Badge } from '@/components/ui/badge';
import type { IncidentStatus } from '@/types/types';

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const map: Record<IncidentStatus, { label: string; variant: 'warning' | 'info' | 'success' }> = {
    'pending': { label: 'Pending', variant: 'warning' },
    'under-investigation': { label: 'Investigating', variant: 'info' },
    'resolved': { label: 'Resolved', variant: 'success' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
