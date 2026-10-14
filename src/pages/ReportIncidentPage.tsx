import { useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateId } from '@/lib/utils';
import { BARANGAYS, INCIDENT_LABELS } from '@/types/types';
import type { IncidentType } from '@/types/types';

export function ReportIncidentPage() {
  const { addIncident } = useApp();
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: '', dateTime: '', barangay: '', address: '',
    description: '', animalDescription: '', reporterName: '', reporterContact: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.type) e.type = 'Incident type is required';
    if (!form.dateTime) e.dateTime = 'Date and time are required';
    if (!form.barangay) e.barangay = 'Barangay is required';
    if (!form.address.trim()) e.address = 'Specific address is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const id = 'INC' + generateId();
    addIncident({
      id,
      type: form.type as IncidentType,
      dateTime: form.dateTime,
      barangay: form.barangay,
      address: form.address.trim(),
      description: form.description.trim(),
      animalDescription: form.animalDescription.trim() || undefined,
      reporterName: form.reporterName.trim() || 'Anonymous',
      reporterContact: form.reporterContact.trim() || undefined,
      status: 'pending',
      reportedAt: new Date().toISOString().split('T')[0],
    });
    setSubmitted(id);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
        <p className="text-muted-foreground mb-2">
          Your incident report has been received by the LGU Irosin Animal Management Office.
        </p>
        <p className="text-sm font-medium text-muted-foreground mb-1">Reference Number:</p>
        <p className="text-lg font-bold text-primary mb-6">{submitted}</p>
        <p className="text-sm text-muted-foreground mb-8">
          A Barangay Operator will review and respond to your report. For urgent matters, contact your Barangay Hall directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => { setSubmitted(null); setForm({ type: '', dateTime: '', barangay: '', address: '', description: '', animalDescription: '', reporterName: '', reporterContact: '' }); }}>
            Report Another Incident
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Back to Home</Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Report an Incident</h1>
            <p className="text-sm text-muted-foreground">No login required — available to all community members</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Incident Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Incident type */}
            <div className="space-y-1">
              <Label>Incident Type *</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue placeholder="Select incident type" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(INCIDENT_LABELS) as IncidentType[]).map(t => (
                    <SelectItem key={t} value={t}>{INCIDENT_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
            </div>

            {/* Date & time */}
            <div className="space-y-1">
              <Label>Date & Time of Incident *</Label>
              <Input type="datetime-local" value={form.dateTime} onChange={e => set('dateTime', e.target.value)} />
              {errors.dateTime && <p className="text-xs text-destructive">{errors.dateTime}</p>}
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Barangay *</Label>
                <Select value={form.barangay} onValueChange={v => set('barangay', v)}>
                  <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                  <SelectContent>
                    {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.barangay && <p className="text-xs text-destructive">{errors.barangay}</p>}
              </div>
              <div className="space-y-1">
                <Label>Specific Address *</Label>
                <Input placeholder="Street, landmark, etc." value={form.address} onChange={e => set('address', e.target.value)} />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Description of Incident *</Label>
              <Textarea rows={4} placeholder="Describe what happened in detail..." value={form.description} onChange={e => set('description', e.target.value)} />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            {/* Animal description */}
            <div className="space-y-1">
              <Label>Animal Description (optional)</Label>
              <Input placeholder="e.g., Brown Aspin, medium size, no collar" value={form.animalDescription} onChange={e => set('animalDescription', e.target.value)} />
            </div>

            {/* Reporter info */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Your Information (optional)</p>
                <p className="text-xs text-muted-foreground">Your name and contact are optional. Providing them helps our officers follow up.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Your Name</Label>
                    <Input placeholder="Leave blank to be anonymous" value={form.reporterName} onChange={e => set('reporterName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Contact Number</Label>
                    <Input placeholder="09XXXXXXXXX" value={form.reporterContact} onChange={e => set('reporterContact', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg">
              <AlertTriangle className="h-4 w-4" />
              Submit Incident Report
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-4">
        For life-threatening emergencies, call <strong>911</strong> or your local Barangay Hall immediately.
      </p>
    </div>
  );
}
