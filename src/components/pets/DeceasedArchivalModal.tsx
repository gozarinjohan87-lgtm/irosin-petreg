import { useState } from 'react';
import { Skull, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import type { Pet } from '@/types/types';

interface DeceasedArchivalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: Pet;
  onSuccess?: () => void;
}

export function DeceasedArchivalModal({
  open,
  onOpenChange,
  pet,
  onSuccess,
}: DeceasedArchivalModalProps) {
  const { markPetDeceased } = useApp();

  const [dateOfPassing, setDateOfPassing] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('Old age / Natural causes');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const fullReason = notes.trim() ? `${reason} - ${notes.trim()}` : reason;
      const res = markPetDeceased(pet.id, dateOfPassing, fullReason);
      if (res) {
        setCompleted(true);
        if (onSuccess) onSuccess();
      }
    }, 400);
  };

  const resetModal = () => {
    setCompleted(false);
    setDateOfPassing(new Date().toISOString().split('T')[0]);
    setReason('Old age / Natural causes');
    setNotes('');
  };

  const handleOpen = (newVal: boolean) => {
    if (!newVal) resetModal();
    onOpenChange(newVal);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-1">
            <Skull className="h-6 w-6 text-zinc-600" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            {completed ? 'Pet Record Archived' : `Record Deceased Pet: ${pet.name}`}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {completed
              ? `${pet.name}'s status has been updated to Deceased.`
              : `Archive ${pet.name} (${pet.id}) while retaining public health and medical records.`}
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="space-y-4 py-2 text-center">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2 text-left">
              <div className="flex items-center gap-2 text-zinc-800 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-zinc-600" />
                Archival Audit Trail Complete
              </div>
              <p className="text-zinc-700">
                <strong>Status:</strong> Archived as Deceased
              </p>
              <p className="text-zinc-700">
                <strong>Date of Passing:</strong> {dateOfPassing}
              </p>
              <p className="text-zinc-700">
                <strong>Reason:</strong> {reason}
              </p>
              <p className="text-muted-foreground text-[11px]">
                Future vaccination reminder alerts have been paused for this pet. Historical rabies immunization records remain in the municipal public health database.
              </p>
            </div>
            <Button className="w-full" onClick={() => handleOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Public Health Archival</p>
                <p className="text-[11px] leading-relaxed mt-0.5">
                  This action marks {pet.name} as deceased. The collar tag QR code will show an archived memorial status and SMS booster reminders will cease.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Date of Passing *</Label>
              <Input
                type="date"
                required
                className="text-xs"
                value={dateOfPassing}
                onChange={e => setDateOfPassing(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cause / Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Old age / Natural causes" className="text-xs">Old age / Natural causes</SelectItem>
                  <SelectItem value="Illness / Non-infectious disease" className="text-xs">Illness / Non-infectious disease</SelectItem>
                  <SelectItem value="Suspected / Confirmed Rabies" className="text-xs text-destructive font-semibold">Suspected / Confirmed Rabies</SelectItem>
                  <SelectItem value="Traffic / Road accident" className="text-xs">Traffic / Road accident</SelectItem>
                  <SelectItem value="Euthanasia (Veterinary advice)" className="text-xs">Euthanasia (Veterinary advice)</SelectItem>
                  <SelectItem value="Other causes" className="text-xs">Other causes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Veterinary / Municipal Notes</Label>
              <Textarea
                placeholder="Additional details, attending veterinarian, or burial disposal notes..."
                className="text-xs resize-none h-20"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Archive Record
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
