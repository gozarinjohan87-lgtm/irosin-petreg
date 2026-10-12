import { useState } from 'react';
import { UserPlus, ShieldCheck, Camera, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import type { User } from '@/types/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatorBarangay: string;
}

export function OperatorRegisterOwnerModal({ open, onOpenChange, operatorBarangay }: Props) {
  const { addUser, users, currentUser } = useApp();

  const [form, setForm] = useState({
    name: '',
    email: '',
    contactNumber: '',
    purok: '',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
    idDocumentUrl: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setForm(p => ({ ...p, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError('An account with this email already exists.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    if (!form.purok.trim()) {
      setError('Please provide the resident\'s Purok / Zone.');
      return;
    }

    const newOwner: User = {
      id: 'USR' + generateId(),
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: 'owner',
      barangay: operatorBarangay,
      purok: form.purok.trim(),
      contactNumber: form.contactNumber.trim(),
      avatarUrl: form.avatarUrl || avatarPreview || undefined,
      idDocumentUrl: form.idDocumentUrl || undefined,
      status: 'active',
      verificationStatus: 'verified', // Directly verified by the barangay operator
      proofDocument: `Verified in person by Barangay Operator ${currentUser?.name ?? ''} (${currentUser?.operatorPosition ?? 'Operator'})`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addUser(newOwner);
    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
      setForm({
        name: '',
        email: '',
        contactNumber: '',
        purok: '',
        password: '',
        confirmPassword: '',
        avatarUrl: '',
        idDocumentUrl: '',
      });
      setAvatarPreview('');
      onOpenChange(false);
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Register Resident Pet Owner
          </DialogTitle>
          <DialogDescription>
            Register a pet owner resident in <strong>Brgy. {operatorBarangay}</strong>. Because you are registering them in person as Barangay Operator, their account will be immediately verified.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground">Resident Owner Registered Successfully!</p>
            <p className="text-xs text-muted-foreground">
              Account created with verified status in Brgy. {operatorBarangay}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="resName">Full Name *</Label>
                <Input
                  id="resName"
                  required
                  placeholder="e.g. Maria Santos"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resContact">Contact Number *</Label>
                <Input
                  id="resContact"
                  required
                  placeholder="e.g. 09171234567"
                  value={form.contactNumber}
                  onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))}
                />
              </div>
            </div>

            {/* Optional Owner Photo */}
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-primary" />
                Owner Identification Photo (Optional)
              </Label>
              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <div className="relative">
                    <img src={avatarPreview} alt="Preview" className="h-12 w-12 rounded-full object-cover border" />
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview('');
                        setForm(p => ({ ...p, avatarUrl: '' }));
                      }}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted border border-dashed flex items-center justify-center text-muted-foreground text-[10px]">
                    No Photo
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="op-owner-photo"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => document.getElementById('op-owner-photo')?.click()}
                  >
                    <Upload className="h-3 w-3" /> Choose Photo
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="resEmail">Email Address (Login Username) *</Label>
                <Input
                  id="resEmail"
                  type="email"
                  required
                  placeholder="e.g. maria.santos@gmail.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resPurok">Purok / Zone *</Label>
                <Input
                  id="resPurok"
                  required
                  placeholder="e.g. Purok 3 (Maharlika)"
                  value={form.purok}
                  onChange={e => setForm(p => ({ ...p, purok: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Barangay Jurisdiction (Fixed)</Label>
              <Input
                disabled
                value={`Brgy. ${operatorBarangay}`}
                className="bg-muted font-medium text-foreground cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">
                Strictly scoped to your assigned barangay per RA 9482 protocol.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="resPass">Initial Password *</Label>
                <Input
                  id="resPass"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resConfirm">Confirm Password *</Label>
                <Input
                  id="resConfirm"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Register &amp; Verify Resident
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}