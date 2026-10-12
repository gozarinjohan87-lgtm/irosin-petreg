import { useState } from 'react';
import { ShieldCheck, ArrowRightLeft, Skull, KeyRound, CheckCircle, Search, Filter, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types/types';

export function AuditLogViewer() {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filtered = (auditLogs ?? []).filter(log => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch =
      searchTerm === '' ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.performedByName && log.performedByName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.targetId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'TRANSFER_OWNERSHIP':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 gap-1 text-[11px]">
            <ArrowRightLeft className="h-3 w-3" /> Transfer Ownership
          </Badge>
        );
      case 'MARK_DECEASED':
        return (
          <Badge className="bg-zinc-200 text-zinc-800 border-zinc-400 gap-1 text-[11px]">
            <Skull className="h-3 w-3" /> Deceased Archival
          </Badge>
        );
      case 'PASSWORD_RESET':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 text-[11px]">
            <KeyRound className="h-3 w-3" /> Password Reset
          </Badge>
        );
      case 'VERIFY_OWNER':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 gap-1 text-[11px]">
            <CheckCircle className="h-3 w-3" /> Owner Verified
          </Badge>
        );
      case 'VERIFY_PET':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 text-[11px]">
            <ShieldCheck className="h-3 w-3" /> Pet Verified
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[11px]">{action}</Badge>;
    }
  };

  return (
    <Card className="mt-6 border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Municipal Lifecycle &amp; Security Audit Trail
            </CardTitle>
            <CardDescription className="text-xs">
              Immutable logs of ownership transfers, deceased archivals, resident verifications, and account security events.
            </CardDescription>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-xs font-mono">
            {filtered.length} Recorded Event{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by pet name, resident, or details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Actions</SelectItem>
              <SelectItem value="TRANSFER_OWNERSHIP" className="text-xs">Transfer Ownership</SelectItem>
              <SelectItem value="MARK_DECEASED" className="text-xs">Deceased Archival</SelectItem>
              <SelectItem value="PASSWORD_RESET" className="text-xs">Password Reset</SelectItem>
              <SelectItem value="VERIFY_OWNER" className="text-xs">Owner Verification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No audit events found matching the criteria. Any transfer, archival, or password reset will be recorded here.
          </div>
        ) : (
          <div className="divide-y max-h-80 overflow-y-auto">
            {filtered.map(log => (
              <div key={log.id} className="p-3.5 hover:bg-muted/40 transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.action)}
                    <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                      {log.targetId}
                    </span>
                    {log.targetName && (
                      <span className="font-medium text-foreground">
                        ({log.targetName})
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    {log.details}
                  </p>
                </div>
                <div className="text-right shrink-0 text-[11px] text-muted-foreground self-start sm:self-auto">
                  <p className="font-medium text-foreground">{log.performedByName || 'System'}</p>
                  <p>{formatDate(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
