import { useState } from 'react';
import { ShieldAlert, Plus, RefreshCw, Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, PawPrint } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/StatCard';
import type { BiteCase, QuarantineStatus } from '@/types/types';
import { BARANGAYS } from '@/types/types';
import { generateId, formatDateShort } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLOR: Record<QuarantineStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'under-quarantine': 'bg-orange-100 text-orange-800 border-orange-200',
  released: 'bg-green-100 text-green-800 border-green-200',
  euthanized: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
};

const STATUS_LABEL: Record<QuarantineStatus, string> = {
  pending: 'Pending Action',
  'under-quarantine': 'Under Quarantine',
  released: 'Released',
  euthanized: 'Euthanized',
  completed: 'Completed',
};

const BITE_LOCATIONS = [
  'Head / Face', 'Neck', 'Left arm', 'Right arm',
  'Left hand', 'Right hand', 'Left leg', 'Right leg',
  'Left foot', 'Right foot', 'Torso / Back', 'Other',
];

function QuarantineStatusBadge({ status }: { status: QuarantineStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function CaseCard({ bc, pets, onUpdate }: { bc: BiteCase; pets: ReturnType<typeof useApp>['pets']; onUpdate: (bc: BiteCase) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState<QuarantineStatus>(bc.quarantineStatus);
  const [note, setNote] = useState('');
  const linkedPet = pets.find(p => p.id === bc.petId);

  function handleStatusUpdate() {
    if (newStatus === bc.quarantineStatus) return;
    const updated: BiteCase = {
      ...bc,
      quarantineStatus: newStatus,
      statusHistory: [
        ...(bc.statusHistory ?? []),
        { status: newStatus, date: new Date().toISOString().split('T')[0], note: note || undefined },
      ],
    };
    onUpdate(updated);
    setNote('');
    toast.success('Quarantine status updated.');
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{bc.patientName}</p>
              <span className="text-xs text-muted-foreground">Age {bc.patientAge}</span>
              <QuarantineStatusBadge status={bc.quarantineStatus} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bite: <span className="font-medium text-foreground">{bc.biteLocation}</span>
              {' · '}Animal: <span className="font-medium text-foreground capitalize">{bc.animalType}</span>
              {' · '}Brgy. {bc.barangay}
            </p>
            <p className="text-xs text-muted-foreground">Logged: {formatDateShort(bc.reportedAt)} · Incident: {formatDateShort(bc.incidentDate)}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)} className="shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {/* Linked pet */}
            {linkedPet && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <PawPrint className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">Biting Animal Tracked</p>
                  <p className="text-xs text-muted-foreground">{linkedPet.name} · {linkedPet.breed} · {linkedPet.ownerName} · {linkedPet.ownerContact}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {bc.treatmentNotes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Treatment Notes</p>
                <p className="text-xs">{bc.treatmentNotes}</p>
              </div>
            )}
            {bc.quarantineNotes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Quarantine Notes</p>
                <p className="text-xs">{bc.quarantineNotes}</p>
              </div>
            )}

            {/* Status history */}
            {bc.statusHistory && bc.statusHistory.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Status Timeline</p>
                <div className="space-y-2">
                  {bc.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <QuarantineStatusBadge status={h.status} />
                        <span className="text-xs text-muted-foreground ml-2">{formatDateShort(h.date)}</span>
                        {h.note && <p className="text-xs text-muted-foreground mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Update status */}
            {bc.quarantineStatus !== 'completed' && bc.quarantineStatus !== 'released' && bc.quarantineStatus !== 'euthanized' && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium">Update Quarantine Status</p>
                <div className="flex gap-2 flex-wrap">
                  <Select value={newStatus} onValueChange={v => setNewStatus(v as QuarantineStatus)}>
                    <SelectTrigger className="h-8 text-xs flex-1 min-w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Action</SelectItem>
                      <SelectItem value="under-quarantine">Under Quarantine</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                      <SelectItem value="euthanized">Euthanized</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleStatusUpdate} className="h-8 text-xs">Update</Button>
                </div>
                <Input
                  placeholder="Optional note..."
                  className="text-xs h-8"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BiteCenterPage() {
  const { currentUser, biteCases, addBiteCase, updateBiteCase, pets, addNotification } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<QuarantineStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    patientName: '', patientAge: '', incidentDate: '', biteLocation: '',
    barangay: '', animalType: 'dog' as 'dog' | 'cat' | 'unknown',
    petId: '', quarantineNotes: '', treatmentNotes: '',
  });

  const filtered = biteCases.filter(bc => {
    const matchStatus = filter === 'all' || bc.quarantineStatus === filter;
    const matchSearch = search === '' ||
      bc.patientName.toLowerCase().includes(search.toLowerCase()) ||
      bc.barangay.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: biteCases.length,
    pending: biteCases.filter(b => b.quarantineStatus === 'pending').length,
    underQuarantine: biteCases.filter(b => b.quarantineStatus === 'under-quarantine').length,
    completed: biteCases.filter(b => b.quarantineStatus === 'completed' || b.quarantineStatus === 'released').length,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patientName || !form.incidentDate || !form.biteLocation || !form.barangay) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const now = new Date().toISOString().split('T')[0];
    const newCase: BiteCase = {
      id: 'BITE' + generateId(),
      patientName: form.patientName,
      patientAge: parseInt(form.patientAge) || 0,
      incidentDate: form.incidentDate,
      biteLocation: form.biteLocation,
      barangay: form.barangay,
      animalType: form.animalType,
      petId: form.petId || undefined,
      quarantineStatus: 'pending',
      quarantineNotes: form.quarantineNotes || undefined,
      treatmentNotes: form.treatmentNotes || undefined,
      reportedAt: now,
      reportedBy: currentUser?.id ?? '',
      statusHistory: [{ status: 'pending', date: now, note: 'Case logged' }],
    };
    addBiteCase(newCase);
    addNotification({
      id: 'NOT' + generateId(),
      type: 'new-bite-case',
      title: 'New Bite Case Logged',
      message: `New animal bite case: ${form.patientName}, Brgy. ${form.barangay}. Pending action.`,
      relatedId: newCase.id,
      isRead: false,
      createdAt: now,
    });
    setForm({ patientName: '', patientAge: '', incidentDate: '', biteLocation: '', barangay: '', animalType: 'dog', petId: '', quarantineNotes: '', treatmentNotes: '' });
    setOpen(false);
    toast.success('Bite case logged successfully.');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
            Irosin Animal Bite Treatment Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sterile Data Entry Portal &amp; Quarantine Surveillance Ledger
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Log New Bite Exposure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Human Bite Case Logging</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Patient Name <span className="text-destructive">*</span></Label>
                  <Input value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} placeholder="Full name" required />
                </div>
                <div className="space-y-1">
                  <Label>Age</Label>
                  <Input type="number" min="0" max="120" value={form.patientAge} onChange={e => setForm(p => ({ ...p, patientAge: e.target.value }))} placeholder="Years" />
                </div>
                <div className="space-y-1">
                  <Label>Incident Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.incidentDate} onChange={e => setForm(p => ({ ...p, incidentDate: e.target.value }))} required />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Bite Location <span className="text-destructive">*</span></Label>
                  <Select value={form.biteLocation} onValueChange={v => setForm(p => ({ ...p, biteLocation: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select body part" /></SelectTrigger>
                    <SelectContent>
                      {BITE_LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Barangay <span className="text-destructive">*</span></Label>
                  <Select value={form.barangay} onValueChange={v => setForm(p => ({ ...p, barangay: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                    <SelectContent>
                      {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Animal Type</Label>
                  <Select value={form.animalType} onValueChange={v => setForm(p => ({ ...p, animalType: v as typeof form.animalType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Linked Pet ID (if known)</Label>
                  <Select value={form.petId || 'none'} onValueChange={v => setForm(p => ({ ...p, petId: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select pet (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No linked pet —</SelectItem>
                      {pets.filter(p => p.verificationStatus === 'verified').map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.breed}, {p.barangay})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Treatment Notes</Label>
                  <Textarea rows={2} value={form.treatmentNotes} onChange={e => setForm(p => ({ ...p, treatmentNotes: e.target.value }))} placeholder="ARV dose, wound care, etc." />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Quarantine Notes</Label>
                  <Textarea rows={2} value={form.quarantineNotes} onChange={e => setForm(p => ({ ...p, quarantineNotes: e.target.value }))} placeholder="Animal status, owner info, etc." />
                </div>
              </div>
              <Button type="submit" className="w-full">Log Bite Case</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Cases" value={stats.total} icon={ShieldAlert} color="blue" />
        <StatCard title="Pending Action" value={stats.pending} icon={Clock} color="yellow" subtitle="Needs attention" />
        <StatCard title="Under Quarantine" value={stats.underQuarantine} icon={AlertTriangle} color="red" />
        <StatCard title="Resolved" value={stats.completed} icon={CheckCircle} color="green" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search patient or barangay..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'under-quarantine', 'released', 'completed'] as const).map(s => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? 'default' : 'outline'}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s as QuarantineStatus]}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="ml-auto shrink-0" onClick={() => { setSearch(''); setFilter('all'); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>

      {/* Municipal Bite Ledger */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Municipal Bite Ledger ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No bite cases found.</p>
          ) : (
            filtered.map(bc => (
              <CaseCard key={bc.id} bc={bc} pets={pets} onUpdate={updateBiteCase} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
