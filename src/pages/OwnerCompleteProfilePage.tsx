import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Upload, FileText, CheckCircle2, ShieldCheck, MapPin, Phone, User, Camera, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { BARANGAYS } from '@/types/types';
import { generateId } from '@/lib/utils';

export function OwnerCompleteProfilePage() {
  const { currentUser, updateUser, users, addNotification } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: currentUser?.name ?? '',
    contactNumber: currentUser?.contactNumber ?? '',
    barangay: currentUser?.barangay ?? BARANGAYS[0],
    purok: currentUser?.purok ?? '',
    avatarUrl: currentUser?.avatarUrl ?? '',
    idDocumentUrl: currentUser?.idDocumentUrl ?? '',
    proofDocument: currentUser?.proofDocument ?? '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser?.avatarUrl ?? '');
  const [idPreview, setIdPreview] = useState<string>(currentUser?.idDocumentUrl ?? '');
  const [uploadedFileName, setUploadedFileName] = useState<string>(currentUser?.proofDocument ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setForm(prev => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  function handleIdDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setForm(prev => ({ ...prev, proofDocument: file.name }));

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setIdPreview(result);
          setForm(prev => ({ ...prev, idDocumentUrl: result }));
        };
        reader.readAsDataURL(file);
      } else {
        // PDF or doc representation
        setIdPreview('');
      }
    }
  }

  function handleSelectSampleAvatar(url: string) {
    setAvatarPreview(url);
    setForm(prev => ({ ...prev, avatarUrl: url }));
  }

  function handleSelectSampleId(url: string, name: string) {
    setIdPreview(url);
    setUploadedFileName(name);
    setForm(prev => ({ ...prev, idDocumentUrl: url, proofDocument: name }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);

    const updatedUser = {
      ...currentUser,
      name: form.name.trim(),
      contactNumber: form.contactNumber.trim(),
      barangay: form.barangay,
      purok: form.purok.trim(),
      avatarUrl: form.avatarUrl || avatarPreview,
      idDocumentUrl: form.idDocumentUrl || idPreview,
      proofDocument: form.proofDocument || (uploadedFileName || 'Barangay_Proof_Document.pdf'),
      verificationStatus: 'pending' as const,
    };

    updateUser(updatedUser);

    // Notify the assigned Barangay Operator for the selected barangay
    const assignedOperator = users.find(
      u => u.role === 'operator' && u.barangay?.toLowerCase() === form.barangay.toLowerCase()
    );

    addNotification({
      id: 'NOT' + generateId(),
      type: 'owner-pending',
      title: 'New Owner Registration Verification',
      message: `${form.name} registered claiming residency in ${form.barangay} (${form.purok}). Photo & ID proof submitted: ${form.proofDocument || 'ID documentation attached'}. Awaiting your verification.`,
      userId: assignedOperator ? assignedOperator.id : undefined,
      createdAt: new Date().toISOString(),
      isRead: false,
    });

    // Also notify municipal admin
    addNotification({
      id: 'NOT' + generateId(),
      type: 'owner-pending',
      title: 'New Owner Pending Verification',
      message: `${form.name} submitted owner profile with photo ID in ${form.barangay} (${form.purok}).`,
      createdAt: new Date().toISOString(),
      isRead: false,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 400);
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4 flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-lg border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-3">
            <UserCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Owner Information</CardTitle>
          <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
            Please provide your residential details in Irosin, Sorsogon. Your assigned Barangay Operator will review and verify your residency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full-name" className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="full-name"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Juan M. Dela Cruz"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact-num" className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Contact Number
              </Label>
              <Input
                id="contact-num"
                type="tel"
                required
                value={form.contactNumber}
                onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))}
                placeholder="e.g. 0917-123-4567"
              />
              <p className="text-[11px] text-muted-foreground">Used for emergency alerts and bite notifications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="barangay-select" className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Barangay
                </Label>
                <Select
                  value={form.barangay}
                  onValueChange={v => setForm(p => ({ ...p, barangay: v }))}
                >
                  <SelectTrigger id="barangay-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {BARANGAYS.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purok-input">Purok / Street / Zone</Label>
                <Input
                  id="purok-input"
                  required
                  value={form.purok}
                  onChange={e => setForm(p => ({ ...p, purok: e.target.value }))}
                  placeholder="e.g. Purok 3, Rizal Street"
                />
              </div>
            </div>

            {/* Owner Photo Identification */}
            <div className="pt-1">
              <Label className="flex items-center gap-1.5 mb-1.5 font-medium">
                <Camera className="h-4 w-4 text-primary" />
                Owner Profile Photo / Face Identification
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 border rounded-xl bg-card">
                <div className="relative shrink-0">
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Owner Preview"
                        className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview('');
                          setForm(p => ({ ...p, avatarUrl: '' }));
                        }}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow hover:opacity-90"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                      <User className="h-8 w-8 opacity-40" />
                      <span className="text-[10px] mt-0.5">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      type="file"
                      id="owner-avatar-file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5"
                      onClick={() => document.getElementById('owner-avatar-file')?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload Photo
                    </Button>
                    <span className="text-xs text-muted-foreground">or pick a sample:</span>
                  </div>

                  {/* Sample avatar presets */}
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                    {[
                      { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
                      { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
                      { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
                      { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSampleAvatar(sample.url)}
                        className={`h-8 w-8 rounded-full overflow-hidden border transition-all ${
                          avatarPreview === sample.url ? 'ring-2 ring-primary scale-105 border-primary' : 'border-border/60 opacity-80 hover:opacity-100'
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

            {/* Proof of Residency / Valid ID Upload */}
            <div className="pt-2">
              <Label className="flex items-center gap-1.5 mb-1.5 font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Proof of Residency &amp; Valid ID (Barangay Cert / Gov ID / Utility Bill)
              </Label>

              {idPreview ? (
                <div className="border rounded-xl p-3 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Attached ID / Document Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIdPreview('');
                        setUploadedFileName('');
                        setForm(p => ({ ...p, idDocumentUrl: '', proofDocument: '' }));
                      }}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                  <div className="h-32 w-full rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                    <img src={idPreview} alt="Valid ID" className="h-full w-full object-contain" />
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{uploadedFileName || 'Valid_ID_Photo.jpg'}</p>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/40 transition-colors">
                  <input
                    type="file"
                    id="proof-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleIdDocChange}
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium text-foreground">
                      {uploadedFileName ? uploadedFileName : 'Click to upload proof document or photo'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Government ID, Barangay Certificate of Residency, or Utility Bill
                    </span>
                  </label>
                </div>
              )}

              {/* Sample ID choices */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground text-[11px]">Or attach sample ID:</span>
                <button
                  type="button"
                  onClick={() => handleSelectSampleId('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80', 'Barangay_Residency_Certificate_Irosin.jpg')}
                  className="px-2 py-1 rounded border bg-muted/50 hover:bg-muted text-[11px] text-foreground"
                >
                  Barangay Certificate
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSampleId('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', 'Philippine_National_ID.jpg')}
                  className="px-2 py-1 rounded border bg-muted/50 hover:bg-muted text-[11px] text-foreground"
                >
                  Philippine National ID
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSampleId('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80', 'Sorsogon_Electric_Bill_Proof.jpg')}
                  className="px-2 py-1 rounded border bg-muted/50 hover:bg-muted text-[11px] text-foreground"
                >
                  Electric / Water Bill
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <strong>Verification Notice:</strong> After submission, your Barangay Operator will review your proof of residency. If they already personally know you, they may also verify you directly.
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full font-semibold" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Information...' : 'Complete Profile & Go to Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
