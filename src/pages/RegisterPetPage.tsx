import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PawPrint, ArrowLeft, Lock, ShieldAlert, Camera, Upload, X, User, CheckCircle2, UserCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { generateId } from '@/lib/utils';
import { BARANGAYS } from '@/types/types';
import type { Pet } from '@/types/types';

export function RegisterPetPage() {
  const { addPet, addNotification, currentUser, users } = useApp();
  const navigate = useNavigate();

  const isOwner = currentUser?.role === 'owner';
  const isOperator = currentUser?.role === 'operator';
  const isAdmin = currentUser?.role === 'admin';

  // Guard: Unverified owner cannot register pet
  if (isOwner && currentUser?.verificationStatus !== 'verified') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <Card className="p-8 border-amber-300 bg-amber-50/70 shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-amber-950 mb-2">Pet Registration Restricted</h2>
          <p className="text-sm text-amber-900/80 mb-6 leading-relaxed max-w-md mx-auto">
            Your owner account for <strong>Brgy. {currentUser?.barangay || 'your barangay'}</strong> is currently <strong>Pending Verification</strong>.
            Under municipal guidelines and RA 9482, your Barangay Operator must verify your residency before you can register animals.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link to="/complete-profile">View Profile Status</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const [form, setForm] = useState({
    name: '',
    species: 'dog',
    breed: '',
    color: '',
    age: '',
    sex: 'male',
    photo: '',
    ownerName: isOwner ? (currentUser?.name ?? '') : '',
    ownerContact: isOwner ? (currentUser?.contactNumber ?? '') : '',
    ownerAddress: isOwner ? (currentUser?.purok ? `${currentUser.purok}, ${currentUser.barangay ?? ''}` : currentUser?.barangay ?? '') : '',
    barangay: (isOwner || isOperator) ? (currentUser?.barangay ?? BARANGAYS[0]) : '',
    status: isOwner ? 'owned' : '',
    isSpayedNeutered: false,
    sightingLocation: '',
    behavior: '',
    notes: '',
  });

  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('custom');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // List of registered owners for operator or admin
  const registeredOwnersList = users.filter(u => {
    if (u.role !== 'owner') return false;
    if (isOperator) {
      return u.barangay?.toLowerCase() === currentUser?.barangay?.toLowerCase();
    }
    if (form.barangay) {
      return u.barangay?.toLowerCase() === form.barangay.toLowerCase();
    }
    return true;
  });

  const set = (key: string, val: string | boolean) =>
    setForm(p => ({ ...p, [key]: val }));

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoPreview(result);
        setForm(p => ({ ...p, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSelectSamplePhoto(url: string) {
    setPhotoPreview(url);
    setForm(p => ({ ...p, photo: url }));
  }

  function handleOwnerSelect(ownerId: string) {
    setSelectedOwnerId(ownerId);
    if (ownerId === 'custom') {
      setForm(p => ({
        ...p,
        ownerName: '',
        ownerContact: '',
        ownerAddress: '',
      }));
    } else {
      const owner = users.find(u => u.id === ownerId);
      if (owner) {
        setForm(p => ({
          ...p,
          ownerName: owner.name,
          ownerContact: owner.contactNumber || '',
          ownerAddress: owner.purok ? `${owner.purok}, ${owner.barangay ?? ''}` : (owner.barangay ?? ''),
          barangay: owner.barangay || p.barangay,
        }));
      }
    }
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Pet name is required';
    if (!form.species) e.species = 'Species is required';
    if (!form.breed.trim()) e.breed = 'Breed is required';
    if (!form.color.trim()) e.color = 'Color is required';
    if (!form.age || isNaN(Number(form.age))) e.age = 'Valid age is required';
    if (!form.sex) e.sex = 'Sex is required';
    if (!form.barangay) e.barangay = 'Barangay is required';
    if (!form.status) e.status = 'Status is required';

    if (form.status === 'stray') {
      if (!form.sightingLocation.trim()) e.sightingLocation = 'Sighting location / usual roaming area is required';
      if (!form.behavior.trim()) e.behavior = 'Behavior description is required';
    } else {
      if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
      if (!form.ownerContact.trim()) e.ownerContact = 'Contact number is required';
      if (!form.ownerAddress.trim()) e.ownerAddress = 'Address is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const id = 'PET' + generateId();
    // Anchor pet strictly to ownerId
    let resolvedOwnerId = isOwner ? currentUser?.id : (selectedOwnerId !== 'custom' ? selectedOwnerId : undefined);
    if (!resolvedOwnerId && form.status === 'owned') {
      const matched = users.find(u =>
        (u.name && u.name.trim().toLowerCase() === form.ownerName.trim().toLowerCase()) ||
        (u.username && u.username.trim().toLowerCase() === form.ownerName.trim().toLowerCase())
      );
      if (matched) resolvedOwnerId = matched.id;
    }

    const pet: Pet = {
      id,
      name: form.name.trim(),
      species: form.species as 'dog' | 'cat',
      breed: form.breed.trim(),
      color: form.color.trim(),
      age: Number(form.age),
      sex: form.sex as 'male' | 'female',
      photo: form.photo || undefined,
      ownerName: form.status === 'stray' ? 'LGU Irosin' : form.ownerName.trim(),
      ownerContact: form.status === 'stray' ? '056-555-0001' : form.ownerContact.trim(),
      ownerAddress: form.status === 'stray' ? `Barangay Hall, ${form.barangay}` : form.ownerAddress.trim(),
      barangay: form.barangay,
      status: form.status as 'owned' | 'stray',
      isSpayedNeutered: form.isSpayedNeutered,
      registeredById: currentUser?.id ?? 'USR001',
      registeredAt: new Date().toISOString().split('T')[0],
      qrCode: id,
      ownerId: resolvedOwnerId,
      verificationStatus: isOwner ? 'pending' : 'verified',
      sightingLocation: form.status === 'stray' ? form.sightingLocation.trim() : undefined,
      behavior: form.status === 'stray' ? form.behavior.trim() : undefined,
    };
    addPet(pet);
    
    if (isOwner) {
      // Find operator for this owner's barangay
      const op = users.find(u => u.role === 'operator' && u.barangay?.toLowerCase() === pet.barangay.toLowerCase());
      addNotification({
        id: 'NOT' + generateId(),
        type: 'pet-pending',
        title: 'New Pet Registration Request',
        message: `${currentUser.name} submitted a registration request for ${pet.name} (${pet.breed}) in Brgy. ${pet.barangay}.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        petId: pet.id,
        userId: op ? op.id : undefined,
      });
      alert("Registration request submitted successfully. Waiting for operator approval.");
      navigate(`/dashboard`);
    } else {
      navigate(`/pets/${id}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Register New Pet"
        subtitle="Add a new cat or dog to the Irosin pet registry"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/pets"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pet Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-primary" />
                Pet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Pet Name *</Label>
                <Input id="name" placeholder="e.g., Bantay" value={form.name} onChange={e => set('name', e.target.value)} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Species *</Label>
                  <Select value={form.species} onValueChange={v => set('species', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.species && <p className="text-xs text-destructive">{errors.species}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Sex *</Label>
                  <Select value={form.sex} onValueChange={v => set('sex', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.sex && <p className="text-xs text-destructive">{errors.sex}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="breed">Breed *</Label>
                  <Input id="breed" placeholder="e.g., Aspin" value={form.breed} onChange={e => set('breed', e.target.value)} />
                  {errors.breed && <p className="text-xs text-destructive">{errors.breed}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="age">Age (years) *</Label>
                  <Input id="age" type="number" min="0" max="30" placeholder="2" value={form.age} onChange={e => set('age', e.target.value)} />
                  {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="color">Color / Markings *</Label>
                <Input id="color" placeholder="e.g., Brown & White" value={form.color} onChange={e => set('color', e.target.value)} />
                {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
              </div>

              {/* Pet Photo Identification Picker */}
              <div className="space-y-2 pt-1 border-t">
                <Label className="flex items-center gap-1.5 font-medium text-xs">
                  <Camera className="h-4 w-4 text-primary" />
                  Pet Photo / Identification Picture
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 border rounded-xl bg-muted/20">
                  <div className="relative shrink-0">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Pet preview"
                          className="h-16 w-16 rounded-xl object-cover border-2 border-primary shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview('');
                            setForm(p => ({ ...p, photo: '' }));
                          }}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow hover:opacity-90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                        <PawPrint className="h-6 w-6 opacity-30" />
                        <span className="text-[9px] mt-0.5">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input
                        type="file"
                        id="pet-photo-file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => document.getElementById('pet-photo-file')?.click()}
                      >
                        <Upload className="h-3 w-3" /> Upload Picture
                      </Button>
                      <span className="text-[11px] text-muted-foreground">or pick a sample:</span>
                    </div>

                    {/* Quick sample pet photos based on species */}
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                      {(form.species === 'cat' ? [
                        { label: 'Puspin', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80' },
                        { label: 'Siamese', url: 'https://images.unsplash.com/photo-1513360309081-38f0762daed1?w=200&auto=format&fit=crop&q=80' },
                        { label: 'Tabby', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&auto=format&fit=crop&q=80' },
                        { label: 'Persian', url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200&auto=format&fit=crop&q=80' },
                      ] : [
                        { label: 'Aspin', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&auto=format&fit=crop&q=80' },
                        { label: 'Retriever', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&auto=format&fit=crop&q=80' },
                        { label: 'Shepherd', url: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=200&auto=format&fit=crop&q=80' },
                        { label: 'Shih Tzu', url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&auto=format&fit=crop&q=80' },
                      ]).map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSamplePhoto(sample.url)}
                          className={`h-7 w-7 rounded-lg overflow-hidden border transition-all ${
                            photoPreview === sample.url ? 'ring-2 ring-primary scale-105 border-primary' : 'border-border/60 opacity-80 hover:opacity-100'
                          }`}
                          title={sample.label}
                        >
                          <img src={sample.url} alt={sample.label} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Checkbox
                  id="spayed"
                  checked={form.isSpayedNeutered}
                  onCheckedChange={v => set('isSpayedNeutered', Boolean(v))}
                />
                <Label htmlFor="spayed" className="cursor-pointer">Spayed / Neutered</Label>
              </div>
            </CardContent>
          </Card>

          {/* Owner & Location */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Barangay *</Label>
                    {isOperator ? (
                      <div>
                        <Input disabled value={form.barangay} className="bg-muted font-medium" />
                        <p className="text-[11px] text-muted-foreground mt-1">Locked to your assigned barangay</p>
                      </div>
                    ) : isOwner ? (
                      <div>
                        <Input disabled value={form.barangay || 'Pending profile'} className="bg-muted font-medium" />
                        <p className="text-[11px] text-muted-foreground mt-1">From your registered profile</p>
                      </div>
                    ) : (
                      <Select value={form.barangay} onValueChange={v => set('barangay', v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="max-h-56">
                          {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    {errors.barangay && <p className="text-xs text-destructive">{errors.barangay}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Ownership Status *</Label>
                    {isOwner ? (
                      <div>
                        <Input disabled value="Owned" className="bg-muted font-medium" />
                        <p className="text-[11px] text-muted-foreground mt-1">Registered to your account</p>
                      </div>
                    ) : (
                      <Select value={form.status} onValueChange={v => set('status', v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owned">Owned</SelectItem>
                          <SelectItem value="stray">Stray</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stray animal specific fields (Requirement 1) */}
            {form.status === 'stray' && (
              <Card className="border-amber-300 bg-amber-50/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-amber-600" />
                    Stray Animal Details &amp; Sighting Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="sightingLocation" className="text-amber-950 font-medium">
                      Where is the animal usually seen? (Habitual Roaming Location) *
                    </Label>
                    <Input
                      id="sightingLocation"
                      placeholder="e.g. Around the public market dry goods stalls, San Juan St."
                      value={form.sightingLocation}
                      onChange={e => set('sightingLocation', e.target.value)}
                      className="bg-white"
                    />
                    {errors.sightingLocation && <p className="text-xs text-destructive">{errors.sightingLocation}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="behavior" className="text-amber-950 font-medium">
                      Animal Behavior &amp; Temperament *
                    </Label>
                    <Textarea
                      id="behavior"
                      placeholder="e.g. Docile and friendly towards pedestrians; timid when vehicles pass; no signs of aggression."
                      rows={2}
                      value={form.behavior}
                      onChange={e => set('behavior', e.target.value)}
                      className="bg-white"
                    />
                    {errors.behavior && <p className="text-xs text-destructive">{errors.behavior}</p>}
                  </div>

                  <p className="text-xs text-amber-800 bg-amber-100/60 p-2.5 rounded-md border border-amber-200">
                    <strong>Responsible Entity:</strong> LGU Irosin Municipal Agriculture &amp; Veterinary Office will be listed as the custodian for this stray record.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Owner info: auto-filled for owner or editable for admin/operator */}
            {form.status !== 'stray' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Owner Information</span>
                    {isOwner && (
                      <span className="text-xs font-normal text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        Auto-filled from your profile
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isOwner ? (
                    <div className="rounded-lg bg-muted/50 p-3.5 space-y-2 border text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-xs">Registered Owner:</span>
                        <span className="font-semibold">{currentUser?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-xs">Contact Number:</span>
                        <span className="font-medium">{currentUser?.contactNumber || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-xs">Residence:</span>
                        <span className="font-medium">
                          {currentUser?.purok ? `${currentUser.purok}, ` : ''}{currentUser?.barangay}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-1 border-t">
                        Owner details are securely pulled from your account and will be attached to this pet.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Operator & Admin: Searchable Registered Owners Dropdown Selection */}
                      <div className="space-y-2 p-3 rounded-lg border bg-primary/5">
                        <Label className="text-xs font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-foreground">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            Select Registered Owner
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {isOperator ? `Brgy. ${currentUser?.barangay}` : 'All Municipal Owners'} ({registeredOwnersList.length} registered)
                          </span>
                        </Label>
                        
                        <Select value={selectedOwnerId} onValueChange={handleOwnerSelect}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Choose an existing registered owner or enter manually" />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            <SelectItem value="custom">+ Enter New Owner Details Manually</SelectItem>
                            {registeredOwnersList.map(owner => (
                              <SelectItem key={owner.id} value={owner.id}>
                                {owner.name} ({owner.purok ? `${owner.purok}, ` : ''}{owner.barangay}) {owner.contactNumber ? `— ${owner.contactNumber}` : ''} {owner.verificationStatus === 'verified' ? '✓' : '(Pending)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedOwnerId !== 'custom' ? (
                          <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span>Auto-linked to registered resident: <strong>{form.ownerName}</strong> ({form.ownerAddress})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-[11px] h-6 px-1.5 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOwnerSelect('custom')}
                            >
                              Edit Manually
                            </Button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            Select an existing registered resident above to automatically fill their profile and link this pet to their account, or type details below.
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="ownerName">Owner's Full Name *</Label>
                        <Input id="ownerName" placeholder="Juan dela Cruz" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} />
                        {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ownerContact">Contact Number *</Label>
                        <Input id="ownerContact" placeholder="09171234567" value={form.ownerContact} onChange={e => set('ownerContact', e.target.value)} />
                        {errors.ownerContact && <p className="text-xs text-destructive">{errors.ownerContact}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ownerAddress">Home Address / Purok *</Label>
                        <Textarea id="ownerAddress" placeholder="Purok 2, House No., Street" rows={2} value={form.ownerAddress} onChange={e => set('ownerAddress', e.target.value)} />
                        {errors.ownerAddress && <p className="text-xs text-destructive">{errors.ownerAddress}</p>}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/pets">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting} size="lg">
            <PawPrint className="h-4 w-4" />
            Register Pet &amp; Generate QR
          </Button>
        </div>
      </form>
    </div>
  );
}
