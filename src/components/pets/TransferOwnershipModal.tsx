import { useState } from 'react';
import { UserCheck, ArrowRightLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { BARANGAYS } from '@/types/types';
import type { Pet } from '@/types/types';

interface TransferOwnershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: Pet;
  onSuccess?: () => void;
}

export function TransferOwnershipModal({
  open,
  onOpenChange,
  pet,
  onSuccess,
}: TransferOwnershipModalProps) {
  const { users, transferPetOwnership } = useApp();
  const registeredOwners = users.filter(u => u.role === 'owner');

  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('custom');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerContact, setNewOwnerContact] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');
  const [newBarangay, setNewBarangay] = useState(pet.barangay || BARANGAYS[0]);
  const [transferNotes, setTransferNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  const handleSelectOwner = (val: string) => {
    setSelectedOwnerId(val);
    if (val === 'custom') {
      setNewOwnerName('');
      setNewOwnerContact('');
      setNewOwnerAddress('');
    } else {
      const found = registeredOwners.find(o => o.id === val);
      if (found) {
        setNewOwnerName(found.name);
        setNewOwnerContact(found.contactNumber || '');
        setNewOwnerAddress(found.purok ? `Purok ${found.purok}, Brgy. ${found.barangay}` : `Brgy. ${found.barangay}`);
        if (found.barangay) setNewBarangay(found.barangay);
      }
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newOwnerName.trim()) {
      setError('New owner name is required.');
      return;
    }
    if (!newOwnerContact.trim()) {
      setError('Contact number is required for notification and rabies tracking.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const res = transferPetOwnership(
        pet.id,
        selectedOwnerId === 'custom' ? 'USR_' + Math.random().toString(36).substring(2, 7) : selectedOwnerId,
        newOwnerName.trim(),
        newOwnerContact.trim(),
        newOwnerAddress.trim() || `Brgy. ${newBarangay}`,
        newBarangay
      );

      if (res) {
        setCompleted(true);
        if (onSuccess) onSuccess();
      } else {
        setError('Failed to transfer ownership. Please try again.');
      }
    }, 400);
  };

  const resetModal = () => {
    setCompleted(false);
    setError('');
    setSelectedOwnerId('custom');
    setNewOwnerName('');
    setNewOwnerContact('');
    setNewOwnerAddress('');
    setTransferNotes('');
  };

  const handleOpen = (newVal: boolean) => {
    if (!newVal) resetModal();
    onOpenChange(newVal);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            {completed ? 'Ownership Transferred' : `Transfer Ownership: ${pet.name}`}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {completed
              ? `Ownership of ${pet.name} (${pet.id}) has been successfully updated.`
              : `Officially update the legal custodian of ${pet.name} under Irosin Municipal Ordinance.`}
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="space-y-4 py-2 text-center">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 text-green-800 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Transfer Recorded in Municipal Audit Trail
              </div>
              <p className="text-green-700">
                <strong>New Owner:</strong> {newOwnerName} ({newBarangay})
              </p>
              <p className="text-green-700">
                <strong>Previous Owner:</strong> {pet.ownerName}
              </p>
              <p className="text-muted-foreground text-[11px]">
                The historical registration history and vaccination records remain linked to Pet ID <strong>{pet.id}</strong>.
              </p>
            </div>
            <Button className="w-full" onClick={() => handleOpen(false)}>
              Close &amp; View Profile
            </Button>
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4 pt-1">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-xs rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Current Custodian Summary */}
            <div className="p-3 bg-muted rounded-lg text-xs flex justify-between items-center">
              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Current Registered Owner</p>
                <p className="font-bold text-foreground text-sm">{pet.ownerName}</p>
                <p className="text-muted-foreground">{pet.ownerContact} · Brgy. {pet.barangay}</p>
              </div>
              <span className="text-[11px] font-mono bg-background border px-2 py-1 rounded">
                {pet.id}
              </span>
            </div>

            {/* Quick Picker for Registered Owners */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Transfer To Registered Resident</Label>
              <Select value={selectedOwnerId} onValueChange={handleSelectOwner}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select an existing owner or enter new..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="custom" className="text-xs font-medium">
                    + Enter New Owner Manually
                  </SelectItem>
                  {registeredOwners.map(owner => (
                    <SelectItem key={owner.id} value={owner.id} className="text-xs">
                      {owner.name} ({owner.barangay ? `Brgy. ${owner.barangay}` : owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">New Owner Name *</Label>
                <Input
                  required
                  placeholder="e.g. Maria Santos"
                  className="text-xs"
                  value={newOwnerName}
                  onChange={e => setNewOwnerName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contact Number *</Label>
                <Input
                  required
                  placeholder="0917-XXX-XXXX"
                  className="text-xs"
                  value={newOwnerContact}
                  onChange={e => setNewOwnerContact(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Barangay *</Label>
                <Select value={newBarangay} onValueChange={setNewBarangay}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {BARANGAYS.map(b => (
                      <SelectItem key={b} value={b} className="text-xs">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Street / Purok Address</Label>
                <Input
                  placeholder="Purok 2, Main Road"
                  className="text-xs"
                  value={newOwnerAddress}
                  onChange={e => setNewOwnerAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Transfer Reason / Notes</Label>
              <Input
                placeholder="e.g. Rehoming, family relocation, purchase"
                className="text-xs"
                value={transferNotes}
                onChange={e => setTransferNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Confirm Transfer
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
