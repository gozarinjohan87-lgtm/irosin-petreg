import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PetAvatar } from '@/components/shared/PetAvatar';
import { VaccinationStatusBadge } from '@/components/shared/VaccinationStatusBadge';
import { Shield, Search, Dog, Cat, CheckCircle2, XCircle, AlertTriangle, Calendar, User, MapPin, Syringe } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { isOverdue, isDueSoon } from '@/lib/utils';

export function PublicVerifyPage() {
  const { pets, vaccinations } = useApp();
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<typeof pets[0] | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    // Search by pet ID, QR code, or collar tag pattern
    const found = pets.find(p =>
      p.id.toUpperCase() === q ||
      p.qrCode?.toUpperCase().includes(q) ||
      p.id.toUpperCase().includes(q)
    );
    setResult(found || null);
    setSearched(true);
  };

  const petVaccinations = result ? vaccinations.filter(v => v.petId === result.id) : [];
  const latestVacc = petVaccinations.sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered))[0];

  const getHealthStatus = () => {
    if (!latestVacc) return { label: 'No Vaccination Record', color: 'bg-red-100 text-red-800', icon: XCircle };
    if (isOverdue(latestVacc.nextBoosterDue)) return { label: 'Vaccine Overdue', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (isDueSoon(latestVacc.nextBoosterDue, 30)) return { label: 'Due for Booster Soon', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { label: 'Vaccination Up to Date', color: 'bg-green-100 text-green-800', icon: CheckCircle2 };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-4">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Pet Verification Portal</h1>
          <p className="text-muted-foreground mt-1">Irosin Pet Registry & Monitoring System</p>
          <p className="text-sm text-muted-foreground mt-2">
            Enter a Pet ID or collar tag number to verify vaccination status and registration
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query">Pet ID / Collar Tag Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="query"
                    placeholder="e.g. PET001 or scan collar tag..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">
                    <Search className="h-4 w-4" />Verify
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !result && (
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
              <p className="font-semibold text-red-700">Pet Not Found</p>
              <p className="text-sm text-muted-foreground mt-1">
                No registered pet found with ID "<span className="font-mono">{query}</span>".
                The pet may not be registered in the Irosin Pet Registry.
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                If this pet is yours, please visit the Municipal Hall or your Barangay Hall to register.
              </p>
            </CardContent>
          </Card>
        )}

        {searched && result && (() => {
          const health = getHealthStatus();
          const HealthIcon = health.icon;
          return (
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-700">Pet Found — Official Record</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Pet identity */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <PetAvatar photo={result.photo} name={result.name} species={result.species} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">{result.name}</h2>
                    <p className="text-muted-foreground text-sm">{result.breed}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {result.species === 'dog' ? <Dog className="h-3 w-3 mr-1" /> : <Cat className="h-3 w-3 mr-1" />}
                        {result.species}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">{result.sex}</Badge>
                      {result.isSpayedNeutered && <Badge className="bg-blue-100 text-blue-800 text-xs">Spayed/Neutered</Badge>}
                      <Badge className={`text-xs ${result.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {result.verificationStatus === 'verified' ? '✓ Verified' : 'Pending Verification'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Health status */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${health.color}`}>
                  <HealthIcon className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-semibold">{health.label}</p>
                    {latestVacc && (
                      <p className="text-xs">
                        Last vaccine: {latestVacc.vaccineType} — {formatDate(latestVacc.dateAdministered)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="font-medium">{result.ownerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Barangay</p>
                      <p className="font-medium">{result.barangay}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="font-medium">{result.age} yr{result.age !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Syringe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Next Booster</p>
                      <p className="font-medium">
                        {latestVacc?.nextBoosterDue ? formatDate(latestVacc.nextBoosterDue) : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vaccination history */}
                {petVaccinations.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Vaccination History</p>
                    <div className="space-y-2">
                      {petVaccinations.slice(0, 3).map(v => (
                        <div key={v.id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-2">
                          <span className="font-medium">{v.vaccineType}</span>
                          <span className="text-muted-foreground">{formatDate(v.dateAdministered)}</span>
                          <VaccinationStatusBadge nextDue={v.nextBoosterDue} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impounded warning */}
                {result.impounded && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>This pet is currently <strong>impounded</strong> at the municipal pound. Contact your barangay hall.</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Pet ID: <span className="font-mono">{result.id}</span> · Registered: {formatDate(result.registeredAt)}
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 pb-8">
          Irosin, Sorsogon Pet Registry · RA 9482 Compliant · Municipal Agriculture Office
        </p>
      </div>
    </div>
  );
}
