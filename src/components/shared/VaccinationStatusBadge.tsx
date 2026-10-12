import { Badge } from '@/components/ui/badge';
import { getVaccStatus } from '@/lib/utils';

export function VaccinationStatusBadge({ nextDue }: { nextDue?: string }) {
  const status = nextDue ? getVaccStatus(nextDue) : 'none';
  const map = {
    'up-to-date': { label: 'Up-to-Date', variant: 'success' as const },
    'due-soon': { label: 'Due Soon', variant: 'warning' as const },
    'overdue': { label: 'Overdue', variant: 'danger' as const },
    'none': { label: 'No Record', variant: 'outline' as const },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
