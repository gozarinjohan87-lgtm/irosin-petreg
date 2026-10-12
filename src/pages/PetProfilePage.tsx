import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, Edit, Trash2, Plus, Printer, Dog, Cat,
  Phone, MapPin, Calendar, Syringe, AlertTriangle, QrCode,
  Download, Shield, FileText, ArrowRightLeft, Skull, HeartHandshake, Eye
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VaccinationStatusBadge } from '@/components/shared/VaccinationStatusBadge';
import { IncidentStatusBadge } from '@/components/shared/IncidentStatusBadge';
import { PetAvatar } from '@/components/shared/PetAvatar';
import { formatDate, formatDateShort } from '@/lib/utils';
import { INCIDENT_LABELS } from '@/types/types';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateId } from '@/lib/utils';
import { VACCINE_TYPES } from '@/types/types';
import { TransferOwnershipModal } from '@/components/pets/TransferOwnershipModal';
import { DeceasedArchivalModal } from '@/components/pets/DeceasedArchivalModal';

export function PetProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { pets, users, getPetVaccinations, getPetIncidents, deletePet, addVaccination, updatePet, currentUser } = useApp();
  const navigate = useNavigate();
  const [vaccDialog, setVaccDialog] = useState(false);
  const [vaccForm, setVaccForm] = useState({
    vaccineType: '', dateAdministered: '', nextBoosterDue: '', veterinarian: '', notes: '',
  });
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', breed: '', color: '', age: '', ownerName: '', ownerContact: '', ownerAddress: '',
  });
  const [transferOpen, setTransferOpen] = useState(false);
  const [deceasedOpen, setDeceasedOpen] = useState(false);
  const [monochromeTag, setMonochromeTag] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const petFound = pets.find(p => p.id === id);
  if (!petFound) return (
    <div className="text-center py-20">
      <p className="text-lg font-semibold">Pet not found</p>
      <Button asChild className="mt-4"><Link to="/pets">Back to Registry</Link></Button>
    </div>
  );
  const pet = petFound;

  const vaccinations = getPetVaccinations(pet.id);
  const incidents = getPetIncidents(pet.id);
  const latestVacc = vaccinations.sort((a, b) => b.nextBoosterDue.localeCompare(a.nextBoosterDue))[0];

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator';
  const canDelete = currentUser?.role === 'admin';
  const isPublic = !currentUser;

  const qrUrl = `${window.location.origin}/pet/${pet.id}`;
  const verifyUrl = `${window.location.origin}/verify`;

  function handleDelete() {
    deletePet(pet.id);
    navigate('/pets');
  }

  function downloadQRTag() {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const size = 320;
    canvas.width = size;
    canvas.height = size + 80;
    const ctx = canvas.getContext('2d')!;

    // Clean white background with high-contrast border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (monochromeTag) {
      // Solid municipal outer border for high-contrast engraving
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // Header Banner
      ctx.fillStyle = '#000000';
      ctx.fillRect(4, 4, canvas.width - 8, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MUNICIPALITY OF IROSIN · ANIMAL TAG', size / 2, 22);
    }

    // Draw QR via SVG → canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const qrOffsetTop = monochromeTag ? 36 : 16;
      ctx.drawImage(img, 24, qrOffsetTop, size - 48, size - 48);

      // Pet name label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pet.name, size / 2, qrOffsetTop + (size - 48) + 24);

      // Pet ID and Barangay
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#111111';
      ctx.fillText(`ID: ${pet.id} · BRGY. ${pet.barangay.toUpperCase()}`, size / 2, qrOffsetTop + (size - 48) + 44);

      // Download
      const a = document.createElement('a');
      a.download = `${pet.id}-${monochromeTag ? 'monochrome-' : ''}collar-tag.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  }

  function printPassport() {
    const vaccs = vaccinations.slice(0, 5).map(v =>
      `<tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${v.vaccineType}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${formatDate(v.dateAdministered)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${formatDate(v.nextBoosterDue)}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee">${v.veterinarian}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pet Passport — ${pet.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #111; }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
    .header h1 { font-size: 24px; color: #2563eb; margin: 0 0 4px; }
    .header p { margin: 2px 0; font-size: 12px; color: #555; }
    .badge { display:inline-block; background:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:bold; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 20px; }
    .field label { font-size: 10px; color:#555; text-transform:uppercase; display:block; }
    .field p { font-size:14px; font-weight:600; margin:2px 0 0; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { background:#eff6ff; text-align:left; padding:6px 8px; font-size:11px; text-transform:uppercase; color:#1d4ed8; }
    .footer { margin-top:30px; border-top:1px solid #eee; padding-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .sig-line { border-top:1px solid #111; margin-top:24px; padding-top:4px; font-size:11px; color:#555; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐾 IROSIN PET PASSPORT</h1>
    <p>Official Pet Health & Registration Certificate</p>
    <p>Municipal Agriculture Office · Irosin, Sorsogon · RA 9482 Compliant</p>
  </div>

  <div class="grid">
    <div class="field"><label>Pet Name</label><p>${pet.name}</p></div>
    <div class="field"><label>Pet ID</label><p style="font-family:monospace">${pet.id}</p></div>
    <div class="field"><label>Species</label><p style="text-transform:capitalize">${pet.species}</p></div>
    <div class="field"><label>Breed</label><p>${pet.breed}</p></div>
    <div class="field"><label>Color</label><p>${pet.color}</p></div>
    <div class="field"><label>Sex</label><p style="text-transform:capitalize">${pet.sex}${pet.isSpayedNeutered ? ' (Spayed/Neutered)' : ''}</p></div>
    <div class="field"><label>Age</label><p>${pet.age} year${pet.age !== 1 ? 's' : ''}</p></div>
    <div class="field"><label>Barangay</label><p>${pet.barangay}</p></div>
    <div class="field"><label>Owner</label><p>${pet.ownerName}</p></div>
    <div class="field"><label>Contact</label><p>${pet.ownerContact}</p></div>
    <div class="field"><label>Address</label><p>${pet.ownerAddress}</p></div>
    <div class="field"><label>Registered</label><p>${formatDate(pet.registeredAt)}</p></div>
  </div>

  <h3 style="font-size:13px;text-transform:uppercase;color:#1d4ed8;margin-bottom:8px">Vaccination History</h3>
  <table>
    <thead><tr>
      <th>Vaccine</th><th>Date Administered</th><th>Next Booster Due</th><th>Veterinarian</th>
    </tr></thead>
    <tbody>${vaccs || '<tr><td colspan="4" style="padding:8px;color:#999">No vaccination records on file</td></tr>'}</tbody>
  </table>

  <div class="footer">
    <div>
      <div class="sig-line">Veterinarian / Vet Tech Signature</div>
      <div class="sig-line" style="margin-top:20px">Date</div>
    </div>
    <div>
      <div class="sig-line">Municipal Agriculturist Signature</div>
      <div class="sig-line" style="margin-top:20px">Official Stamp</div>
    </div>
  </div>

  <p style="font-size:10px;color:#aaa;text-align:center;margin-top:20px">
    Scan QR at ${verifyUrl} to verify · Pet ID: ${pet.id} · Printed: ${new Date().toLocaleDateString()}
  </p>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  }

  function handleEditOpen() {
    setEditForm({
      name: pet.name, breed: pet.breed, color: pet.color, age: String(pet.age),
      ownerName: pet.ownerName, ownerContact: pet.ownerContact, ownerAddress: pet.ownerAddress,
    });
    setEditDialog(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    updatePet({ ...pet, name: editForm.name, breed: editForm.breed, color: editForm.color,
      age: Number(editForm.age), ownerName: editForm.ownerName,
      ownerContact: editForm.ownerContact, ownerAddress: editForm.ownerAddress,
    });
    setEditDialog(false);
  }

  function handleAddVacc(e: React.FormEvent) {
    e.preventDefault();
    addVaccination({
      id: 'VAC' + generateId(),
      petId: pet.id,
      vaccineType: vaccForm.vaccineType,
      dateAdministered: vaccForm.dateAdministered,
      nextBoosterDue: vaccForm.nextBoosterDue,
      veterinarian: vaccForm.veterinarian,
      notes: vaccForm.notes,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setVaccDialog(false);
    setVaccForm({ vaccineType: '', dateAdministered: '', nextBoosterDue: '', veterinarian: '', notes: '' });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pets"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">{pet.name}'s Profile</h1>
          {pet.lifecycleStatus === 'deceased' && (
            <Badge variant="outline" className="border-zinc-400 bg-zinc-200 text-zinc-800 font-semibold text-xs">
              Deceased
            </Badge>
          )}
          {pet.lifecycleStatus === 'transferred' && (
            <Badge variant="outline" className="border-blue-400 bg-blue-100 text-blue-800 font-semibold text-xs">
              Transferred Custody
            </Badge>
          )}
        </div>

        {/* Lifecycle Actions */}
        {!isPublic && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferOpen(true)}
              className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
              Transfer Ownership
            </Button>
            {pet.lifecycleStatus !== 'deceased' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeceasedOpen(true)}
                className="text-xs h-8 text-muted-foreground hover:text-destructive hover:border-destructive/40"
              >
                <Skull className="h-3.5 w-3.5 mr-1" />
                Record Deceased
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Deceased Memorial Banner */}
      {pet.lifecycleStatus === 'deceased' && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-900 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center font-serif font-bold text-lg text-zinc-700 shrink-0">
              ✝
            </div>
            <div>
              <p className="font-bold text-sm">Archived Pet Record (Deceased)</p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Recorded Date of Passing: <strong>{pet.deceasedAt ? formatDate(pet.deceasedAt) : 'Archived'}</strong>
              </p>
              <p className="text-xs text-zinc-600">
                Cause: <em>{pet.deceasedReason || 'Natural causes'}</em>
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Vaccination reminders and booster dispatches have been deactivated. Official identification and rabies inoculation archives remain active in the municipal database per RA 9482.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: pet info + QR */}
        <div className="space-y-6">
          {/* Pet Summary */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="xl" />
              </div>
              <h2 className="text-2xl font-bold">{pet.name}</h2>
              <p className="text-muted-foreground">{pet.breed}</p>
              <div className="flex justify-center gap-2 mt-2 flex-wrap">
                <Badge variant={pet.status === 'stray' ? 'warning' : 'secondary'}>
                  {pet.status === 'stray' ? 'Stray' : 'Owned'}
                </Badge>
                <Badge variant="outline">
                  {pet.species === 'dog' ? <Dog className="h-3 w-3 mr-1" /> : <Cat className="h-3 w-3 mr-1" />}
                  {pet.sex === 'male' ? 'Male' : 'Female'}
                </Badge>
                {pet.isSpayedNeutered && <Badge variant="info">Spayed/Neutered</Badge>}
                {pet.verificationStatus === 'verified' && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
                {pet.verificationStatus === 'pending' && <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>}
                {pet.verificationStatus === 'rejected' && <Badge variant="danger">Verification Rejected</Badge>}
                {pet.impounded && <Badge className="bg-orange-100 text-orange-800">Impounded</Badge>}
                {pet.isForAdoptionOrSale && <Badge className="bg-pink-100 text-pink-800">For Adoption</Badge>}
                <VaccinationStatusBadge nextDue={latestVacc?.nextBoosterDue} />
              </div>
              <div className="mt-4 grid grid-cols-3 text-center gap-3">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{pet.age}</p>
                  <p className="text-xs text-muted-foreground">Years Old</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{vaccinations.length}</p>
                  <p className="text-xs text-muted-foreground">Vaccines</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{incidents.length}</p>
                  <p className="text-xs text-muted-foreground">Incidents</p>
                </div>
              </div>
            </CardContent>
            {canEdit && (
              <div className="px-6 pb-4 flex gap-2">
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex-1">
                        <Trash2 className="h-4 w-4" />Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Pet Record?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {pet.name} and all associated records. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Dialog open={editDialog} onOpenChange={setEditDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1" onClick={handleEditOpen}>
                      <Edit className="h-4 w-4" />Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                    <DialogHeader><DialogTitle>Edit Pet Information</DialogTitle></DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2">
                          <Label>Pet Name *</Label>
                          <Input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Breed *</Label>
                          <Input required value={editForm.breed} onChange={e => setEditForm(p => ({ ...p, breed: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Color *</Label>
                          <Input required value={editForm.color} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Age (years) *</Label>
                          <Input type="number" min="0" required value={editForm.age} onChange={e => setEditForm(p => ({ ...p, age: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Owner Name *</Label>
                          <Input required value={editForm.ownerName} onChange={e => setEditForm(p => ({ ...p, ownerName: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label>Contact *</Label>
                          <Input required value={editForm.ownerContact} onChange={e => setEditForm(p => ({ ...p, ownerContact: e.target.value }))} />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label>Address</Label>
                          <Input value={editForm.ownerAddress} onChange={e => setEditForm(p => ({ ...p, ownerAddress: e.target.value }))} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </Card>

          {/* QR Code + Collar Tag */}
          <Card className={monochromeTag ? 'border-2 border-zinc-900 bg-white' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  QR Collar Tag
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonochromeTag(p => !p)}
                  className={`text-[11px] h-7 px-2 border ${monochromeTag ? 'bg-zinc-900 text-white font-bold' : 'text-muted-foreground'}`}
                >
                  {monochromeTag ? 'Monochrome Active' : 'Monochrome Mode'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div
                ref={qrRef}
                className={`qr-container mx-auto mb-3 p-3 rounded-lg inline-block ${
                  monochromeTag
                    ? 'border-4 border-black bg-white text-black shadow-none'
                    : 'bg-white'
                }`}
              >
                <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-black">
                  {monochromeTag ? 'MUNICIPALITY OF IROSIN' : 'IROSIN ANIMAL HEALTH'}
                </div>
                <QRCodeSVG
                  value={qrUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
                <div className="mt-1 text-[10px] font-mono font-bold tracking-wider text-black">
                  ID: {pet.id}
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                {monochromeTag ? 'HIGH-CONTRAST MONOCHROME TAG' : 'SCAN FOR PET INFO'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{pet.id}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={downloadQRTag}>
                  <Download className="h-4 w-4" />Download Tag
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />Print Tag
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {monochromeTag
                  ? 'Optimized for thermal, laser, and high-contrast metal collar tag engraving.'
                  : 'Attach to pet\'s collar for instant ID scanning'}
              </p>
            </CardContent>
          </Card>

          {/* Medical Passport */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Medical Passport
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Official printable health certificate with vaccination history and vet signature block.</span>
              </div>
              <Button className="w-full" onClick={printPassport}>
                <Printer className="h-4 w-4" />Generate Official Passport (PDF)
              </Button>
              <p className="text-xs text-muted-foreground text-center">IROSIN PET PASSPORT · RA 9482 Compliant</p>
            </CardContent>
          </Card>

          {/* Owner Info */}
          {!isPublic && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Owner Information</span>
                  {pet.status === 'owned' && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ID: {pet.ownerId || 'Registered'}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(() => {
                  const petOwner = users.find(u => u.id === pet.ownerId || (u.name && u.name.toLowerCase() === pet.ownerName.toLowerCase()));
                  return (
                    <>
                      <div className="flex items-center gap-3 pb-2 border-b">
                        {petOwner?.avatarUrl ? (
                          <img
                            src={petOwner.avatarUrl}
                            alt={pet.ownerName}
                            className="h-10 w-10 rounded-full object-cover border-2 border-primary/40 shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                            {pet.ownerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                            {petOwner?.username ? `@${petOwner.username}` : pet.ownerName}
                            {petOwner?.username && <span className="text-xs text-muted-foreground font-normal">({pet.ownerName})</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {petOwner?.verificationStatus === 'verified' ? '✓ Verified Resident' : 'Registered Pet Owner'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{pet.ownerContact}</span>
                      </div>
                      <div className="flex gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="break-words">{pet.ownerAddress}</span>
                      </div>
                      <div className="flex gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>Registered: {formatDate(pet.registeredAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>Barangay {pet.barangay}</span>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pet Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Physical Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {[
                  { label: 'Species', value: pet.species === 'dog' ? 'Dog' : 'Cat' },
                  { label: 'Breed', value: pet.breed },
                  { label: 'Color', value: pet.color },
                  { label: 'Age', value: `${pet.age} year${pet.age !== 1 ? 's' : ''}` },
                  { label: 'Sex', value: pet.sex === 'male' ? 'Male' : 'Female' },
                  { label: 'Status', value: pet.status === 'stray' ? 'Stray' : 'Owned' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Stray specific behavioral & sighting info */}
              {(pet.status === 'stray' || pet.sightingLocation || pet.behavior) && (
                <div className="mt-4 p-4 rounded-lg bg-amber-50/60 border border-amber-200/80 space-y-2.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                    Stray Animal Sighting &amp; Behavioral Details
                  </h4>
                  {pet.sightingLocation && (
                    <div className="text-sm">
                      <span className="text-xs text-muted-foreground block">Habitual Sighting / Roaming Area:</span>
                      <span className="font-medium text-foreground">{pet.sightingLocation}</span>
                    </div>
                  )}
                  {pet.behavior && (
                    <div className="text-sm">
                      <span className="text-xs text-muted-foreground block">Observed Behavior &amp; Temperament:</span>
                      <span className="font-medium text-foreground">{pet.behavior}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vaccination Records */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Syringe className="h-4 w-4 text-primary" />
                  Vaccination History
                </CardTitle>
                {canEdit && (
                  <Dialog open={vaccDialog} onOpenChange={setVaccDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4" />Add Record
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Vaccination Record</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddVacc} className="space-y-4">
                        <div className="space-y-1">
                          <Label>Vaccine Type *</Label>
                          <Select value={vaccForm.vaccineType} onValueChange={v => setVaccForm(p => ({ ...p, vaccineType: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select vaccine" /></SelectTrigger>
                            <SelectContent>
                              {VACCINE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>Date Administered *</Label>
                            <Input type="date" required value={vaccForm.dateAdministered} onChange={e => setVaccForm(p => ({ ...p, dateAdministered: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <Label>Next Booster Due *</Label>
                            <Input type="date" required value={vaccForm.nextBoosterDue} onChange={e => setVaccForm(p => ({ ...p, nextBoosterDue: e.target.value }))} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Veterinarian *</Label>
                          <Input required placeholder="Dr. Name" value={vaccForm.veterinarian} onChange={e => setVaccForm(p => ({ ...p, veterinarian: e.target.value }))} />
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save Record</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {vaccinations.length === 0 ? (
                <div className="text-center py-8">
                  <Syringe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No vaccination records yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Vaccine</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Date Given</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Next Booster</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">Veterinarian</th>
                        <th className="text-left py-2 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {vaccinations.map(v => (
                        <tr key={v.id} className="hover:bg-muted/30">
                          <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{v.vaccineType}</td>
                          <td className="py-2.5 pr-4 whitespace-nowrap">{formatDateShort(v.dateAdministered)}</td>
                          <td className="py-2.5 pr-4 whitespace-nowrap">{formatDateShort(v.nextBoosterDue)}</td>
                          <td className="py-2.5 pr-4 whitespace-nowrap">{v.veterinarian}</td>
                          <td className="py-2.5 whitespace-nowrap"><VaccinationStatusBadge nextDue={v.nextBoosterDue} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Behavioral Incidents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Behavioral Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No incidents linked to this pet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map(inc => (
                    <Link key={inc.id} to={`/incidents/${inc.id}`} className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{INCIDENT_LABELS[inc.type]}</p>
                        <IncidentStatusBadge status={inc.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{inc.barangay} · {formatDateShort(inc.dateTime)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{inc.description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ownership History Timeline */}
          {pet.previousOwners && pet.previousOwners.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                  Official Ownership &amp; Transfer History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {/* Current owner */}
                  <div className="relative text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground text-sm">{pet.ownerName}</p>
                      <Badge className="bg-primary/10 text-primary text-[10px] h-5">Current Custodian</Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{pet.ownerContact} · Brgy. {pet.barangay}</p>
                  </div>

                  {/* Previous owners */}
                  {pet.previousOwners.map((item, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-muted-foreground" />
                      <p className="font-semibold text-foreground">{item.ownerName}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {item.ownerContact} · Transferred on <strong>{formatDate(item.transferDate)}</strong>
                      </p>
                      {item.authorizedBy && (
                        <p className="text-[11px] text-muted-foreground italic">
                          Authorized by: {item.authorizedBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TransferOwnershipModal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        pet={pet}
      />

      <DeceasedArchivalModal
        open={deceasedOpen}
        onOpenChange={setDeceasedOpen}
        pet={pet}
      />
    </div>
  );
}
