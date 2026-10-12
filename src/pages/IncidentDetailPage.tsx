import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Calendar, Edit2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { IncidentStatusBadge } from '@/components/shared/IncidentStatusBadge';
import { formatDate } from '@/lib/utils';
import { INCIDENT_LABELS, STATUS_LABELS } from '@/types/types';
import type { IncidentStatus } from '@/types/types';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { incidents, updateIncident, pets, currentUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<IncidentStatus | ''>('');
  const [notes, setNotes] = useState('');

  const inc = incidents.find(i => i.id === id);
  if (!inc) return (
    <div className="text-center py-20">
      <p className="text-lg font-semibold">Incident not found</p>
      <Button asChild className="mt-4"><Link to="/incidents">Back to Incidents</Link></Button>
    </div>
  );

  const linkedPet = inc.linkedPetId ? pets.find(p => p.id === inc.linkedPetId) : null;
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator';

  function handleUpdate() {
    if (!newStatus || !inc) return;
    updateIncident({
      ...inc,
      status: newStatus as IncidentStatus,
      resolutionNotes: notes || inc.resolutionNotes,
    });
    setEditing(false);
    setNewStatus('');
    setNotes('');
  }

  const statusSteps: IncidentStatus[] = ['pending', 'under-investigation', 'resolved'];
  const currentStep = inc ? statusSteps.indexOf(inc.status) : 0;

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/incidents"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">{INCIDENT_LABELS[inc.type]}</h1>
          <p className="text-sm text-muted-foreground">Report ID: {inc.id}</p>
        </div>
        <IncidentStatusBadge status={inc.status} />
      </div>

      {/* Status progress */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-1 ${i < statusSteps.length - 1 ? 'relative' : ''}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${i <= currentStep ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'}`}>
                    {i < currentStep ? <CheckCircle className="h-4 w-4" /> : i === currentStep ? <Clock className="h-4 w-4" /> : <span>{i + 1}</span>}
                  </div>
                  <span className="text-xs mt-1 text-center text-muted-foreground font-medium">{STATUS_LABELS[step]}</span>
                  {i < statusSteps.length - 1 && (
                    <div className={`absolute top-4 left-1/2 w-full h-0.5 ${i < currentStep ? 'bg-primary' : 'bg-border'}`} style={{ left: '50%', width: '100%' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Incident Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{INCIDENT_LABELS[inc.type]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{formatDate(inc.dateTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Barangay</p>
                  <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{inc.barangay}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{inc.address}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm p-3 bg-muted/50 rounded-lg">{inc.description}</p>
              </div>
              {inc.animalDescription && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Animal Description</p>
                  <p className="text-sm p-3 bg-muted/50 rounded-lg">{inc.animalDescription}</p>
                </div>
              )}
              {inc.resolutionNotes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Resolution Notes</p>
                  <p className="text-sm p-3 bg-green-50 rounded-lg border border-green-200 text-green-800">{inc.resolutionNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update status */}
          {canEdit && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Update Incident</CardTitle>
                  {!editing && (
                    <Button size="sm" onClick={() => setEditing(true)}>
                      <Edit2 className="h-4 w-4" />Update Status
                    </Button>
                  )}
                </div>
              </CardHeader>
              {editing && (
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>New Status</Label>
                    <Select value={newStatus} onValueChange={v => setNewStatus(v as IncidentStatus)}>
                      <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under-investigation">Under Investigation</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Notes / Resolution Details</Label>
                    <Textarea rows={3} placeholder="Describe actions taken or resolution..." value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdate} disabled={!newStatus}>Save Update</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Reporter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reporter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{inc.reporterName || 'Anonymous'}</span>
              </div>
              {inc.reporterContact ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{inc.reporterContact}</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No contact provided</p>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Reported: {formatDate(inc.reportedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Linked pet */}
          {linkedPet ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Linked Pet</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/pets/${linkedPet.id}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-lg">{linkedPet.species === 'dog' ? '🐕' : '🐈'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{linkedPet.name}</p>
                    <p className="text-xs text-muted-foreground">{linkedPet.breed} · {linkedPet.barangay}</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Linked Pet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No pet linked to this incident.</p>
                {canEdit && (
                  <p className="text-xs text-muted-foreground mt-1">You can link a pet from the Pet Registry if the animal is identified.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {canEdit && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/pets">
                    <AlertTriangle className="h-4 w-4" />
                    Browse Pet Registry
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to="/incidents">
                    <ArrowLeft className="h-4 w-4" />
                    All Incidents
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
