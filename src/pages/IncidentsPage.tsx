import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Search, Filter } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IncidentStatusBadge } from '@/components/shared/IncidentStatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { formatDateShort } from '@/lib/utils';
import { BARANGAYS, INCIDENT_LABELS } from '@/types/types';
import type { IncidentType } from '@/types/types';
import { CheckCircle, Clock } from 'lucide-react';

export function IncidentsPage() {
  const { incidents } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBarangay, setFilterBarangay] = useState('all');

  const filtered = incidents.filter(inc => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      inc.description.toLowerCase().includes(q) ||
      inc.barangay.toLowerCase().includes(q) ||
      (inc.reporterName?.toLowerCase().includes(q) ?? false);
    const matchType = filterType === 'all' || inc.type === filterType;
    const matchStatus = filterStatus === 'all' || inc.status === filterStatus;
    const matchBarangay = filterBarangay === 'all' || inc.barangay === filterBarangay;
    return matchSearch && matchType && matchStatus && matchBarangay;
  }).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  const pending = incidents.filter(i => i.status === 'pending').length;
  const investigating = incidents.filter(i => i.status === 'under-investigation').length;
  const resolved = incidents.filter(i => i.status === 'resolved').length;

  const typeIcons: Record<IncidentType, string> = {
    'animal-bite': '🦷',
    'road-accident': '🚗',
    'stray-sighting': '🐕',
    'sanitation-violation': '🗑️',
  };

  return (
    <div>
      <PageHeader
        title="Incidents Management"
        subtitle={`${incidents.length} total reports — ${pending} pending review`}
        action={
          <Button asChild variant="outline" size="sm">
            <Link to="/report-incident">Public Report Form</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Reports" value={incidents.length} icon={AlertTriangle} color="yellow" />
        <StatCard title="Pending" value={pending} icon={AlertTriangle} color="red" />
        <StatCard title="Investigating" value={investigating} icon={Clock} color="blue" />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle} color="green" />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by description, barangay, or reporter..." className="pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(Object.keys(INCIDENT_LABELS) as IncidentType[]).map(t => (
                  <SelectItem key={t} value={t}>{INCIDENT_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under-investigation">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBarangay} onValueChange={setFilterBarangay}>
              <SelectTrigger><SelectValue placeholder="Barangay" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barangays</SelectItem>
                {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {(filterType !== 'all' || filterStatus !== 'all' || filterBarangay !== 'all') && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setFilterType('all'); setFilterStatus('all'); setFilterBarangay('all'); }}>
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incidents list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No incidents found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Incidents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map(inc => (
                <Link
                  key={inc.id}
                  to={`/incidents/${inc.id}`}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="shrink-0 h-10 w-10 rounded-full bg-red-50 flex items-center justify-center text-base">
                    {typeIcons[inc.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm">{INCIDENT_LABELS[inc.type]}</p>
                      <IncidentStatusBadge status={inc.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{inc.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <span className="text-xs text-muted-foreground">📍 Brgy. {inc.barangay}</span>
                      <span className="text-xs text-muted-foreground">📅 {formatDateShort(inc.reportedAt)}</span>
                      {inc.reporterName && inc.reporterName !== 'Anonymous' && (
                        <span className="text-xs text-muted-foreground">👤 {inc.reporterName}</span>
                      )}
                      {inc.linkedPetId && (
                        <span className="text-xs text-primary font-medium">🔗 Pet linked</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
