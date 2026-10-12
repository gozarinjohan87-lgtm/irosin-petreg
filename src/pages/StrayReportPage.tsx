import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { BARANGAYS } from '@/types/types';
import type { StraySighting, Species } from '@/types/types';
import { MapPin, AlertTriangle, Eye, CheckCircle2, Dog, Cat, Plus, Search, Bell } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLORS: Record<StraySighting['status'], string> = {
  open: 'bg-red-100 text-red-800',
  reviewed: 'bg-blue-100 text-blue-800',
  captured: 'bg-orange-100 text-orange-800',
  returned: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<StraySighting['status'], string> = {
  open: 'Open',
  reviewed: 'Reviewed',
  captured: 'Captured',
  returned: 'Returned to Owner',
};

export function StrayReportPage() {
  const { currentUser, straySightings, addStraySighting, updateStraySighting } = useApp();
  const isStaff = currentUser && ['admin', 'operator'].includes(currentUser.role);

  const [view, setView] = useState<'report' | 'list'>('list');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBarangay, setFilterBarangay] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    species: 'dog' as Species,
    barangay: '',
    address: '',
    description: '',
    reporterName: '',
    reporterContact: '',
    collarTag: '',
    photo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.barangay || !form.description) {
      toast.error('Please fill in required fields.');
      return;
    }
    const newSighting: StraySighting = {
      id: `SS${Date.now()}`,
      species: form.species,
      barangay: form.barangay,
      address: form.address || undefined,
      description: form.description,
      reporterName: form.reporterName || 'Anonymous',
      reporterContact: form.reporterContact || undefined,
      collarTag: form.collarTag || undefined,
      photo: form.photo || undefined,
      status: 'open',
      reportedAt: new Date().toISOString(),
      crossBarangayAlert: false,
    };
    addStraySighting(newSighting);
    toast.success('Stray sighting reported successfully! Barangay operators have been notified.');
    setForm({ species: 'dog', barangay: '', address: '', description: '', reporterName: '', reporterContact: '', collarTag: '', photo: '' });
    setView('list');
  };

  const handleStatusUpdate = (id: string, status: StraySighting['status']) => {
    updateStraySighting(id, { status, reviewedBy: currentUser?.id });
    toast.success(`Sighting status updated to: ${STATUS_LABELS[status]}`);
  };

  const handleCrossAlert = (sighting: StraySighting) => {
    updateStraySighting(sighting.id, { crossBarangayAlert: true, reviewedBy: currentUser?.id });
    toast.success(`Cross-barangay stray alert issued for ${sighting.barangay}!`);
  };

  const filtered = straySightings.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterBarangay !== 'all' && s.barangay !== filterBarangay) return false;
    if (search && !s.description.toLowerCase().includes(search.toLowerCase()) &&
        !s.barangay.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: straySightings.length,
    open: straySightings.filter(s => s.status === 'open').length,
    reviewed: straySightings.filter(s => s.status === 'reviewed').length,
    alerts: straySightings.filter(s => s.crossBarangayAlert).length,
  };

  return (
    <div>
      <PageHeader
        title="Stray Sighting Reports"
        subtitle="Report loose or stray animals — anonymous reports accepted"
        action={
          <Button onClick={() => setView(view === 'report' ? 'list' : 'report')}>
            {view === 'report' ? <><Eye className="h-4 w-4" />View Reports</> : <><Plus className="h-4 w-4" />Report Sighting</>}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: stats.total, icon: MapPin, color: 'text-primary' },
          { label: 'Open / Unresolved', value: stats.open, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Under Review', value: stats.reviewed, icon: Eye, color: 'text-blue-500' },
          { label: 'Cross-Brgy Alerts', value: stats.alerts, icon: Bell, color: 'text-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {view === 'report' ? (
        /* ── Report Form ── */
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Report a Loose / Stray Animal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Animal Type *</Label>
                  <Select value={form.species} onValueChange={v => setForm(p => ({ ...p, species: v as Species }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">🐕 Dog</SelectItem>
                      <SelectItem value="cat">🐈 Cat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Barangay Where Spotted *</Label>
                  <Select value={form.barangay} onValueChange={v => setForm(p => ({ ...p, barangay: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                    <SelectContent>
                      {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specific Location / Landmark</Label>
                <Input placeholder="e.g. Near the school, along the highway..." value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the animal: color, size, markings, behavior, any injuries..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Collar Tag ID (if any)</Label>
                <Input placeholder="e.g. PET-SAL-001" value={form.collarTag} onChange={e => setForm(p => ({ ...p, collarTag: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name (optional)</Label>
                  <Input placeholder="Leave blank to report anonymously" value={form.reporterName} onChange={e => setForm(p => ({ ...p, reporterName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number (optional)</Label>
                  <Input placeholder="09XX-XXX-XXXX" value={form.reporterContact} onChange={e => setForm(p => ({ ...p, reporterContact: e.target.value }))} />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">📋 What happens next?</p>
                <p>Your report will be sent to the Barangay Operator in the reported area. They will dispatch a patrol to assess and respond. Cross-barangay alerts may be issued if needed.</p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Submit Sighting Report</Button>
                <Button type="button" variant="outline" onClick={() => setView('list')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* ── Reports List ── */
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search by description or barangay..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBarangay} onValueChange={setFilterBarangay}>
                <SelectTrigger className="w-44 shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Barangays</SelectItem>
                  {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No stray sighting reports found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(s => (
                <Card key={s.id} className={s.crossBarangayAlert ? 'border-orange-300' : ''}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {s.species === 'dog' ? <Dog className="h-5 w-5 text-primary" /> : <Cat className="h-5 w-5 text-primary" />}
                        <div>
                          <p className="font-semibold capitalize">{s.species}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(s.reportedAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={STATUS_COLORS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                        {s.crossBarangayAlert && <Badge className="bg-orange-100 text-orange-800 text-xs">⚠️ Cross-Brgy Alert</Badge>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{s.barangay}{s.address ? ` — ${s.address}` : ''}</span>
                    </div>

                    <p className="text-sm">{s.description}</p>

                    {s.collarTag && (
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded">Tag: {s.collarTag}</p>
                    )}

                    {s.reviewNotes && (
                      <p className="text-xs text-muted-foreground italic">Note: {s.reviewNotes}</p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Reported by: {s.reporterName || 'Anonymous'}
                      {s.reporterContact ? ` · ${s.reporterContact}` : ''}
                    </div>

                    {isStaff && s.status === 'open' && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(s.id, 'reviewed')}>
                          <Eye className="h-3 w-3" />Mark Reviewed
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(s.id, 'captured')}>
                          <CheckCircle2 className="h-3 w-3" />Captured
                        </Button>
                        {!s.crossBarangayAlert && (
                          <Button size="sm" variant="outline" className="border-orange-300 text-orange-700" onClick={() => handleCrossAlert(s)}>
                            <Bell className="h-3 w-3" />Issue Alert
                          </Button>
                        )}
                      </div>
                    )}
                    {isStaff && s.status === 'reviewed' && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(s.id, 'captured')}>
                          <CheckCircle2 className="h-3 w-3" />Mark Captured
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(s.id, 'returned')}>
                          Returned to Owner
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
