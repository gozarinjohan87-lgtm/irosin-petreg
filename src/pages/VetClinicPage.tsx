import { useState } from 'react';
import { Stethoscope, Syringe, Scissors, QrCode, Search, CheckCircle, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/StatCard';
import { PetAvatar } from '@/components/shared/PetAvatar';
import { VaccinationStatusBadge } from '@/components/shared/VaccinationStatusBadge';
import type { Pet, Vaccination } from '@/types/types';
import { VACCINE_TYPES } from '@/types/types';
import { generateId, formatDateShort, isOverdue, isDueSoon } from '@/lib/utils';
import { toast } from 'sonner';

function PetCard({
  pet, vaccinations, onRecordVacc, onRecordSurgery,
}: {
  pet: Pet;
  vaccinations: Vaccination[];
  onRecordVacc: (pet: Pet) => void;
  onRecordSurgery: (pet: Pet) => void;
}) {
  const petVaccs = vaccinations.filter(v => v.petId === pet.id);
  const latestRabies = petVaccs.filter(v => v.vaccineType.toLowerCase().includes('rabies')).sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered))[0];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{pet.name}</p>
              <Badge variant="outline" className="text-xs capitalize">{pet.species}</Badge>
              <VaccinationStatusBadge nextDue={latestRabies?.nextBoosterDue} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{pet.breed} · {pet.sex} · Brgy. {pet.barangay}</p>
            <p className="text-xs text-muted-foreground">{pet.ownerName} · {pet.ownerContact}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-medium ${pet.isSpayedNeutered ? 'text-green-600' : 'text-muted-foreground'}`}>
                {pet.isSpayedNeutered ? '✓ Spayed/Neutered' : '○ Not Spayed/Neutered'}
              </span>
              {latestRabies && (
                <span className="text-xs text-muted-foreground">
                  Rabies: {formatDateShort(latestRabies.dateAdministered)}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" className="text-xs h-8" onClick={() => onRecordVacc(pet)}>
              <Syringe className="h-3 w-3 mr-1" /> Inoculate
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => onRecordSurgery(pet)}>
              <Scissors className="h-3 w-3 mr-1" /> Surgery
            </Button>
          </div>
        </div>

        {/* Vaccination history */}
        {petVaccs.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Vaccination Records</p>
            <div className="space-y-1">
              {petVaccs.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center justify-between text-xs gap-2">
                  <span className="truncate text-foreground">{v.vaccineType}</span>
                  <span className="text-muted-foreground shrink-0">{formatDateShort(v.dateAdministered)}</span>
                  <VaccinationStatusBadge nextDue={v.nextBoosterDue} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function VetClinicPage() {
  const { currentUser, pets, vaccinations, addVaccination, updatePet } = useApp();
  const [search, setSearch] = useState('');
  const [vaccPet, setVaccPet] = useState<Pet | null>(null);
  const [surgPet, setSurgPet] = useState<Pet | null>(null);
  const [qrMode, setQrMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState<Pet | null>(null);

  const [vaccForm, setVaccForm] = useState({
    vaccineType: 'Anti-Rabies Vaccine', dateAdministered: new Date().toISOString().split('T')[0],
    nextBoosterDue: '', notes: '',
  });
  const [surgForm, setSurgForm] = useState({ procedure: 'spay', notes: '' });

  const verifiedPets = pets.filter(p => p.verificationStatus === 'verified');
  const displayPets = verifiedPets.filter(p =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    p.barangay.toLowerCase().includes(search.toLowerCase())
  );

  const overdueCount = vaccinations.filter(v => isOverdue(v.nextBoosterDue)).length;
  const dueSoonCount = vaccinations.filter(v => isDueSoon(v.nextBoosterDue, 30) && !isOverdue(v.nextBoosterDue)).length;
  const totalVaccs = vaccinations.length;

  function handleVaccSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vaccPet || !vaccForm.dateAdministered || !vaccForm.nextBoosterDue) {
      toast.error('Fill all required fields.');
      return;
    }
    const now = new Date().toISOString().split('T')[0];
    addVaccination({
      id: 'VAC' + generateId(),
      petId: vaccPet.id,
      vaccineType: vaccForm.vaccineType,
      dateAdministered: vaccForm.dateAdministered,
      nextBoosterDue: vaccForm.nextBoosterDue,
      veterinarian: currentUser?.name ?? 'Vet Clinic',
      clinicName: currentUser?.facilityName,
      notes: vaccForm.notes || undefined,
      createdAt: now,
    });
    toast.success(`Vaccination recorded for ${vaccPet.name}.`);
    setVaccPet(null);
    setVaccForm({ vaccineType: 'Anti-Rabies Vaccine', dateAdministered: now, nextBoosterDue: '', notes: '' });
  }

  function handleSurgSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!surgPet) return;
    updatePet({ ...surgPet, isSpayedNeutered: true });
    toast.success(`Surgical record updated for ${surgPet.name}.`);
    setSurgPet(null);
    setSurgForm({ procedure: 'spay', notes: '' });
  }

  function handleQrScan() {
    const found = pets.find(p => p.id === qrInput.trim() || p.qrCode === qrInput.trim());
    if (found) {
      setQrResult(found);
    } else {
      toast.error('No pet found with that QR / ID.');
      setQrResult(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-purple-500" />
            Licensed Veterinary Clinic
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser?.facilityName ?? 'Vet Clinic'} — Vaccination &amp; Surgery Logs
          </p>
        </div>
        <Button variant="outline" onClick={() => setQrMode(m => !m)} className="shrink-0">
          <QrCode className="h-4 w-4 mr-2" />
          {qrMode ? 'Close Scanner' : 'Open QR Scanner'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Vaccinations" value={totalVaccs} icon={Syringe} color="blue" />
        <StatCard title="Overdue Boosters" value={overdueCount} icon={CheckCircle} color="red" subtitle="Needs attention" />
        <StatCard title="Due Within 30 Days" value={dueSoonCount} icon={CheckCircle} color="yellow" />
      </div>

      {/* QR Scanner */}
      {qrMode && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <QrCode className="h-4 w-4 text-purple-500" />
              QR / Pet ID Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter QR code or Pet ID (e.g. PET001)"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQrScan()}
                className="flex-1"
              />
              <Button onClick={handleQrScan}><Search className="h-4 w-4" /></Button>
            </div>
            {qrResult && (
              <div className="mt-3 p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <PetAvatar photo={qrResult.photo} name={qrResult.name} species={qrResult.species} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{qrResult.name}</p>
                    <p className="text-xs text-muted-foreground">{qrResult.breed} · {qrResult.ownerName}</p>
                    <p className="text-xs text-muted-foreground">{qrResult.ownerContact} · Brgy. {qrResult.barangay}</p>
                    <p className="text-xs mt-1">{qrResult.isSpayedNeutered ? '✓ Spayed/Neutered' : '○ Not Spayed/Neutered'}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="sm" className="text-xs h-7" onClick={() => { setVaccPet(qrResult); setQrMode(false); }}>
                      <Syringe className="h-3 w-3 mr-1" /> Vaccinate
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setSurgPet(qrResult); setQrMode(false); }}>
                      <Scissors className="h-3 w-3 mr-1" /> Surgery
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder="Search pet name, owner, or barangay..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </div>

      {/* Pet list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pet Registry ({displayPets.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayPets.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No pets found.</p>
          ) : (
            displayPets.map(pet => (
              <PetCard
                key={pet.id}
                pet={pet}
                vaccinations={vaccinations.filter(v => v.petId === pet.id)}
                onRecordVacc={setVaccPet}
                onRecordSurgery={setSurgPet}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Vaccination Dialog */}
      <Dialog open={!!vaccPet} onOpenChange={o => { if (!o) setVaccPet(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" />
              Record Inoculation / Booster
              {vaccPet && <span className="text-muted-foreground font-normal">— {vaccPet.name}</span>}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVaccSubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Vaccine Type <span className="text-destructive">*</span></Label>
              <Select value={vaccForm.vaccineType} onValueChange={v => setVaccForm(p => ({ ...p, vaccineType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VACCINE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date Administered <span className="text-destructive">*</span></Label>
                <Input type="date" value={vaccForm.dateAdministered} onChange={e => setVaccForm(p => ({ ...p, dateAdministered: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Next Booster Due <span className="text-destructive">*</span></Label>
                <Input type="date" value={vaccForm.nextBoosterDue} onChange={e => setVaccForm(p => ({ ...p, nextBoosterDue: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea rows={2} value={vaccForm.notes} onChange={e => setVaccForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Save Vaccination Record
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Surgery Dialog */}
      <Dialog open={!!surgPet} onOpenChange={o => { if (!o) setSurgPet(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-purple-500" />
              Record Surgical Operation
              {surgPet && <span className="text-muted-foreground font-normal">— {surgPet.name}</span>}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSurgSubmit} className="space-y-4 pt-2">
            {surgPet?.isSpayedNeutered && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800">
                This pet is already marked as Spayed/Neutered in the registry.
              </div>
            )}
            <div className="space-y-1">
              <Label>Procedure</Label>
              <Select value={surgForm.procedure} onValueChange={v => setSurgForm(p => ({ ...p, procedure: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spay">Spay (Female)</SelectItem>
                  <SelectItem value="neuter">Neuter (Male)</SelectItem>
                  <SelectItem value="other">Other Procedure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Surgical Notes</Label>
              <Textarea rows={2} value={surgForm.notes} onChange={e => setSurgForm(p => ({ ...p, notes: e.target.value }))} placeholder="Procedure details, anesthesia, post-op care..." />
            </div>
            <Button type="submit" className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" /> Save Surgical Record &amp; Mark Spayed/Neutered
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
