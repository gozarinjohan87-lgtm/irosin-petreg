import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PawPrint, AlertTriangle, Syringe, Users,
  Plus, Eye, Bell, TrendingUp, CheckCircle,
  ShieldAlert, Stethoscope, HeartHandshake, ClipboardList, XCircle,
  UserPlus, Clock, Lock,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PetAvatar } from '@/components/shared/PetAvatar';
import { VaccinationStatusBadge } from '@/components/shared/VaccinationStatusBadge';
import { IncidentStatusBadge } from '@/components/shared/IncidentStatusBadge';
import { formatDateShort, isOverdue, isDueSoon, cn } from '@/lib/utils';
import { INCIDENT_LABELS } from '@/types/types';
import { PendingOwnersTable } from '@/components/dashboard/PendingOwnersTable';
import { OperatorRegisterOwnerModal } from '@/components/dashboard/OperatorRegisterOwnerModal';
import { AuditLogViewer } from '@/components/dashboard/AuditLogViewer';

export function DashboardPage() {
  const { currentUser, pets, incidents, vaccinations, notifications, users, biteCases, adoptionListings, updatePet, unreadCount } = useApp();
  const [operatorRegisterOpen, setOperatorRegisterOpen] = useState(false);
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isOperator = currentUser.role === 'operator';
  const isOwner = currentUser.role === 'owner';
  const isBiteCenter = currentUser.role === 'bite_center';
  const isVetClinic = currentUser.role === 'vet_clinic';

  const myPets = isOwner
    ? pets.filter(p => {
        if (p.ownerId) {
          return p.ownerId === currentUser.id;
        }
        return Boolean(p.ownerName) && (
          p.ownerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
          (currentUser.username && p.ownerName.trim().toLowerCase() === currentUser.username.trim().toLowerCase())
        );
      })
    : isOperator ? pets.filter(p => p.barangay === currentUser.barangay)
    : pets;

  const overdueVacc = vaccinations.filter(v => isOverdue(v.nextBoosterDue));
  const dueSoonVacc = vaccinations.filter(v => isDueSoon(v.nextBoosterDue, 30) && !isOverdue(v.nextBoosterDue));
  const pendingIncidents = incidents.filter(i => i.status === 'pending');
  const recentPets = [...pets].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt)).slice(0, 5);
  const recentIncidents = [...incidents].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)).slice(0, 5);
  const pendingBiteCases = biteCases.filter(b => b.quarantineStatus === 'pending' || b.quarantineStatus === 'under-quarantine');
  const activeAdoptions = adoptionListings.filter(l => l.status === 'active');

  // ── Bite Center Dashboard ─────────────────────────────────────────
  if (isBiteCenter) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
            Welcome, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm">{currentUser.facilityName ?? 'Irosin Animal Bite Treatment Center'}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Cases" value={biteCases.length} icon={ShieldAlert} color="blue" />
          <StatCard title="Pending Action" value={biteCases.filter(b => b.quarantineStatus === 'pending').length} icon={AlertTriangle} color="yellow" subtitle="Needs attention" />
          <StatCard title="Under Quarantine" value={biteCases.filter(b => b.quarantineStatus === 'under-quarantine').length} icon={AlertTriangle} color="red" />
          <StatCard title="Resolved" value={biteCases.filter(b => b.quarantineStatus === 'completed' || b.quarantineStatus === 'released').length} icon={CheckCircle} color="green" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Log New Bite Exposure</p>
                <p className="text-xs text-muted-foreground">Human bite case entry</p>
              </div>
              <Button size="sm" asChild><Link to="/bite-cases">Open Ledger</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <HeartHandshake className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Adoption Board</p>
                <p className="text-xs text-muted-foreground">{activeAdoptions.length} pets available</p>
              </div>
              <Button size="sm" variant="outline" asChild><Link to="/adoption">View</Link></Button>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Active &amp; Pending Cases</CardTitle>
              <Button size="sm" variant="ghost" asChild><Link to="/bite-cases">View All</Link></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingBiteCases.slice(0, 5).map(bc => (
                <div key={bc.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bc.patientName}</p>
                    <p className="text-xs text-muted-foreground">{bc.biteLocation} · Brgy. {bc.barangay} · {formatDateShort(bc.incidentDate)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bc.quarantineStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                    {bc.quarantineStatus === 'pending' ? 'Pending' : 'Quarantine'}
                  </span>
                </div>
              ))}
              {pendingBiteCases.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No active cases. All clear!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Vet Clinic Dashboard ──────────────────────────────────────────
  if (isVetClinic) {
    const myVaccs = vaccinations.filter(v => v.veterinarian === currentUser.name || v.clinicName === currentUser.facilityName);
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-purple-500" />
            Welcome, Dr. {currentUser.name.split(' ').pop()}
          </h1>
          <p className="text-muted-foreground text-sm">{currentUser.facilityName ?? 'Veterinary Clinic'}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Pets" value={pets.filter(p => p.verificationStatus === 'verified').length} icon={PawPrint} color="yellow" />
          <StatCard title="Records by Clinic" value={myVaccs.length} icon={Syringe} color="blue" subtitle="This clinic" />
          <StatCard title="Overdue Boosters" value={overdueVacc.length} icon={AlertTriangle} color="red" />
          <StatCard title="Due Within 30 Days" value={dueSoonVacc.length} icon={Syringe} color="yellow" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center shrink-0">
                <Syringe className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Vaccination &amp; Surgery</p>
                <p className="text-xs text-muted-foreground">Record inoculations via QR</p>
              </div>
              <Button size="sm" asChild><Link to="/vet-clinic">Open Panel</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <PawPrint className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Pet Registry</p>
                <p className="text-xs text-muted-foreground">Browse all registered pets</p>
              </div>
              <Button size="sm" variant="outline" asChild><Link to="/pets">View</Link></Button>
            </CardContent>
          </Card>
        </div>
        {overdueVacc.length > 0 && (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-red-800">Overdue Boosters</CardTitle>
                <Button size="sm" variant="ghost" asChild><Link to="/vaccinations">View All</Link></Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {overdueVacc.slice(0, 5).map(v => {
                  const pet = pets.find(p => p.id === v.petId);
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-6 py-3">
                      {pet && <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="sm" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pet?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{v.vaccineType} · Due: {formatDateShort(v.nextBoosterDue)}</p>
                      </div>
                      <VaccinationStatusBadge nextDue={v.nextBoosterDue} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Owner Dashboard ───────────────────────────────────────────────
  if (isOwner) {
    const isVerified = currentUser.verificationStatus === 'verified';

    return (
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Welcome back, {currentUser.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground text-sm">
              Pet Owner · Brgy. {currentUser.barangay || 'Irosin'}{currentUser.purok ? ` (${currentUser.purok})` : ''}
            </p>
          </div>
          <div>
            {isVerified ? (
              <Badge variant="success" className="gap-1 py-1 px-2.5">
                <CheckCircle className="h-3.5 w-3.5" /> Verified Resident Owner
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1 py-1 px-2.5 animate-pulse">
                <Clock className="h-3.5 w-3.5" /> Verification Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Verification Alert Banner for Pending Owners */}
        {!isVerified && (
          <Card className="mb-6 border-amber-300 bg-amber-50/70">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950 text-sm">Owner Residency Verification Pending</p>
                  <p className="text-xs text-amber-900/80 mt-0.5">
                    Your account registration for <strong>Brgy. {currentUser.barangay || 'your barangay'}</strong> is awaiting approval from your Barangay Operator. Pet registration features remain locked until your verification is approved.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" asChild className="shrink-0 border-amber-300 bg-white hover:bg-amber-100">
                <Link to="/complete-profile">Review Profile</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="My Pets" value={myPets.length} icon={PawPrint} color="yellow" />
          <StatCard title="Overdue Vaccines" value={overdueVacc.filter(v => myPets.some(p => p.id === v.petId)).length} icon={Syringe} color="red" />
          <StatCard title="Notifications" value={notifications.filter(n => {
            // Newly created accounts waiting for operator approval have 0 notifications until approval decision
            if (currentUser.verificationStatus !== 'verified') {
              return n.userId === currentUser.id && (n.type === 'owner-verified' || n.title?.toLowerCase().includes('verification'));
            }
            if (n.type === 'pet-pending' || n.type === 'owner-pending') return false;
            if (n.userId) return n.userId === currentUser.id;
            if (n.petId) {
              return myPets.some(p => p.id === n.petId);
            }
            return false;
          }).length} icon={Bell} color="blue" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={cn(
            isVerified ? "border-primary/30 bg-primary/5" : "border-muted bg-muted/40"
          )}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                isVerified ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {isVerified ? <Plus className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  Register New Pet {!isVerified && <span className="text-xs text-amber-700 font-normal">(Locked)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isVerified ? "Submit a pet registration request" : "Requires verified account"}
                </p>
              </div>
              {isVerified ? (
                <Button size="sm" asChild><Link to="/pets/register">Register</Link></Button>
              ) : (
                <Button size="sm" variant="outline" disabled onClick={() => {}} className="cursor-not-allowed opacity-60 text-xs">
                  Locked
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">View Pet Registry</p>
                <p className="text-xs text-muted-foreground">Browse all registered pets</p>
              </div>
              <Button size="sm" variant="outline" asChild><Link to="/pets">View</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Report Incident</p>
                <p className="text-xs text-muted-foreground">Submit community report</p>
              </div>
              <Button size="sm" variant="outline" asChild><Link to="/report-incident">Report</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-pink-50 rounded-lg flex items-center justify-center shrink-0">
                <HeartHandshake className="h-5 w-5 text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Adoption Board</p>
                <p className="text-xs text-muted-foreground">{activeAdoptions.length} pets available</p>
              </div>
              <Button size="sm" variant="outline" asChild><Link to="/adoption">View</Link></Button>
            </CardContent>
          </Card>
        </div>
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Pets</CardTitle>
              <Button size="sm" variant="ghost" asChild><Link to="/pets">View All</Link></Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {myPets.length === 0 ? (
              <div className="text-center py-8">
                <PawPrint className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pets registered yet.</p>
                <p className="text-xs text-muted-foreground">Contact your Barangay Operator to register your pet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPets.map(pet => {
                  const latestVacc = vaccinations.filter(v => v.petId === pet.id).sort((a, b) => b.nextBoosterDue.localeCompare(a.nextBoosterDue))[0];
                  return (
                    <Link key={pet.id} to={`/pets/${pet.id}`} className="flex items-center gap-3 rounded-lg p-3 border hover:bg-muted/50 transition-colors">
                      <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{pet.name}</p>
                        <p className="text-xs text-muted-foreground">{pet.species === 'dog' ? 'Dog' : 'Cat'} · {pet.breed}</p>
                        {pet.verificationStatus && (
                          <span className={`text-xs font-medium ${pet.verificationStatus === 'verified' ? 'text-green-600' : pet.verificationStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {pet.verificationStatus === 'verified' ? '✓ Verified' : pet.verificationStatus === 'pending' ? '⏳ Pending Verification' : '✗ Rejected'}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <VaccinationStatusBadge nextDue={latestVacc?.nextBoosterDue} />
                        {latestVacc && <p className="text-xs text-muted-foreground mt-1">Due: {formatDateShort(latestVacc.nextBoosterDue)}</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Admin / Operator Dashboard ────────────────────────────────────
  const pendingVerification = isOperator
    ? pets.filter(p => p.barangay?.toLowerCase() === currentUser.barangay?.toLowerCase() && p.verificationStatus === 'pending')
    : pets.filter(p => p.verificationStatus === 'pending');
  const pendingPets = pendingVerification;

  const pendingOwners = isOperator
    ? users.filter(u => u.role === 'owner' && u.barangay?.toLowerCase() === currentUser.barangay?.toLowerCase() && u.verificationStatus === 'pending')
    : users.filter(u => u.role === 'owner' && u.verificationStatus === 'pending');

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Welcome back, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? 'LGU Admin — Municipal Pet Registry Management'
              : `Barangay Operator — Brgy. ${currentUser.barangay} ${currentUser.operatorPosition ? `(${currentUser.operatorPosition})` : ''}`}
          </p>
        </div>
      </div>

      {/* Operator Register Modal */}
      {isOperator && currentUser.barangay && (
        <OperatorRegisterOwnerModal
          open={operatorRegisterOpen}
          onOpenChange={setOperatorRegisterOpen}
          operatorBarangay={currentUser.barangay}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title={isOperator ? "Brgy. Pets" : "Total Pets"} value={myPets.length} icon={PawPrint} color="yellow" />
        <StatCard
          title="Pending Owners"
          value={pendingOwners.length}
          icon={Users}
          color={pendingOwners.length > 0 ? "red" : "green"}
          subtitle={pendingOwners.length > 0 ? "Awaiting review" : "All verified"}
        />
        <StatCard title="Pending Incidents" value={pendingIncidents.length} icon={AlertTriangle} color="red" subtitle={isOperator ? `Brgy. ${currentUser.barangay}` : "Needs attention"} />
        <StatCard
          title="Unread Alerts"
          value={unreadCount}
          icon={Bell}
          color={unreadCount > 0 ? "blue" : undefined}
          subtitle="Notification center"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {isOperator ? (
          <Card className="border-primary/40 bg-primary/5 hover:border-primary transition-colors cursor-pointer" onClick={() => setOperatorRegisterOpen(true)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Register Owner</p>
                <p className="text-xs text-muted-foreground">Add resident in Brgy. {currentUser.barangay}</p>
              </div>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); setOperatorRegisterOpen(true); }}>Add</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Register New Pet</p>
                <p className="text-xs text-muted-foreground">Add cat or dog to registry</p>
              </div>
              <Button size="sm" asChild><Link to="/pets/register">Register</Link></Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Pet Registry</p>
              <p className="text-xs text-muted-foreground">Browse all pets</p>
            </div>
            <Button size="sm" variant="outline" asChild><Link to="/pets">View</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Bite Cases</p>
              <p className="text-xs text-muted-foreground">{pendingBiteCases.length} active</p>
            </div>
            <Button size="sm" variant="outline" asChild><Link to="/bite-cases">View</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 bg-pink-50 rounded-lg flex items-center justify-center shrink-0">
              <HeartHandshake className="h-5 w-5 text-pink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Adoption Board</p>
              <p className="text-xs text-muted-foreground">{activeAdoptions.length} listed</p>
            </div>
            <Button size="sm" variant="outline" asChild><Link to="/adoption">View</Link></Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts banner */}
      {(overdueVacc.length > 0 || pendingIncidents.length > 0 || pendingPets.length > 0 || pendingOwners.length > 0) && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-yellow-800 text-sm">Action Required</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {pendingOwners.length > 0 && (
                    <Badge variant="destructive" className="bg-red-600">
                      {pendingOwners.length} owner registration{pendingOwners.length !== 1 ? 's' : ''} awaiting approval
                    </Badge>
                  )}
                  {pendingPets.length > 0 && (
                    <Badge variant="warning">{pendingPets.length} pet registration{pendingPets.length !== 1 ? 's' : ''} pending</Badge>
                  )}
                  {overdueVacc.length > 0 && <Badge variant="danger">{overdueVacc.length} overdue vaccinations</Badge>}
                  {pendingIncidents.length > 0 && <Badge variant="warning">{pendingIncidents.length} pending incidents</Badge>}
                </div>
              </div>
              <Button size="sm" variant="outline" asChild className="shrink-0">
                <Link to="/notifications">View Notifications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dedicated Pending Owners Table (Requirement 2, 3, 5) */}
      <div className="mb-6">
        <PendingOwnersTable barangayFilter={isOperator ? currentUser.barangay : undefined} />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent pets */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Registrations</CardTitle>
              <Button size="sm" variant="ghost" asChild><Link to="/pets">View all</Link></Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
            <div className="divide-y">
              {recentPets.map(pet => {
                const latestVacc = vaccinations.filter(v => v.petId === pet.id).sort((a, b) => b.nextBoosterDue.localeCompare(a.nextBoosterDue))[0];
                return (
                  <Link key={pet.id} to={`/pets/${pet.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                    <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pet.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{pet.breed} · {pet.barangay}</p>
                    </div>
                    <VaccinationStatusBadge nextDue={latestVacc?.nextBoosterDue} />
                  </Link>
                );
              })}
              {recentPets.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted-foreground">No pets registered yet.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Recent incidents */}
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Incidents</CardTitle>
              <Button size="sm" variant="ghost" asChild><Link to="/incidents">View all</Link></Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
            <div className="divide-y">
              {recentIncidents.map(inc => (
                <Link key={inc.id} to={`/incidents/${inc.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{INCIDENT_LABELS[inc.type]}</p>
                    <p className="text-xs text-muted-foreground truncate">{inc.barangay} · {formatDateShort(inc.reportedAt)}</p>
                  </div>
                  <IncidentStatusBadge status={inc.status} />
                </Link>
              ))}
              {recentIncidents.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted-foreground">No incidents reported.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending verifications */}
      {pendingVerification.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-yellow-600" />
                Pending Pet Verifications ({pendingVerification.length})
              </CardTitle>
              <Button size="sm" variant="ghost" asChild><Link to="/pets">View All</Link></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingVerification.slice(0, 4).map(pet => (
                <Link key={pet.id} to={`/pets/${pet.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors">
                  <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{pet.name}</p>
                    <p className="text-xs text-muted-foreground">{pet.breed} · {pet.ownerName} · Brgy. {pet.barangay}</p>
                  </div>
                  <Badge variant="warning" className="text-xs shrink-0">Pending Verification</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin quick analytics */}
      {isAdmin && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">System Overview</CardTitle>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/analytics"><TrendingUp className="h-4 w-4 mr-1" />Full Analytics</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{pets.filter(p => p.species === 'dog').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Dogs Registered</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{pets.filter(p => p.species === 'cat').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Cats Registered</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">{biteCases.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Bite Cases Total</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{incidents.filter(i => i.status === 'resolved').length}</p>
                <p className="text-xs text-muted-foreground mt-1">Resolved Incidents</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                Vaccination compliance rate:{' '}
                <strong>
                  {vaccinations.length > 0
                    ? Math.round((vaccinations.filter(v => !isOverdue(v.nextBoosterDue)).length / vaccinations.length) * 100)
                    : 0}%
                </strong>
                {' '}of records up-to-date
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Verifications */}
      {(currentUser.role === 'admin' || currentUser.role === 'operator') && pendingVerification.length > 0 && (
        <Card className="mt-6 border-yellow-200">
          <CardHeader className="pb-3 bg-yellow-50/50">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-800">
              <ClipboardList className="h-5 w-5" />
              Pending Registration Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingVerification.map(pet => (
                <div key={pet.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                  <div className="flex items-center gap-3">
                    <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="md" />
                    <div>
                      <p className="font-semibold text-base">{pet.name} <span className="text-muted-foreground font-normal text-sm">({pet.species} - {pet.breed})</span></p>
                      <p className="text-sm text-muted-foreground">Owner: {pet.ownerName} · Contact: {pet.ownerContact}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Address: {pet.ownerAddress}, Brgy. {pet.barangay}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => {
                      updatePet({ ...pet, verificationStatus: 'verified' });
                      alert(`Request for ${pet.name} approved.`);
                    }} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      const reason = window.prompt("Reason for rejection:");
                      if (reason !== null) {
                         updatePet({ ...pet, verificationStatus: 'rejected' });
                         alert(`Request for ${pet.name} rejected.`);
                      }
                    }}>
                      <XCircle className="h-4 w-4 mr-1" /> Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Trail & Lifecycle History */}
      {(currentUser.role === 'admin' || currentUser.role === 'operator') && (
        <AuditLogViewer />
      )}
    </div>
  );
}
