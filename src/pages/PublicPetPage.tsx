import { useParams, Link } from 'react-router-dom';
import { PawPrint, Phone, Syringe, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VaccinationStatusBadge } from '@/components/shared/VaccinationStatusBadge';
import { PetAvatar } from '@/components/shared/PetAvatar';
import { formatDateShort } from '@/lib/utils';

export function PublicPetPage() {
  const { id } = useParams<{ id: string }>();
  const { pets, users, getPetVaccinations } = useApp();

  const pet = pets.find(p => p.id === id);
  if (!pet) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8 text-center">
          <PawPrint className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-lg">Pet Not Found</p>
          <p className="text-muted-foreground text-sm mt-1">This QR code does not match any registered pet.</p>
          <Button className="mt-4 w-full" asChild>
            <Link to="/report-incident">Report an Incident</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const vaccinations = getPetVaccinations(pet.id);
  const latestVacc = vaccinations.sort((a, b) => b.nextBoosterDue.localeCompare(a.nextBoosterDue))[0];

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-sm mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-2">
            <PawPrint className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Irosin Pet Registry</p>
          <p className="text-xs text-muted-foreground">RA 9482 — Anti-Rabies Act Compliance</p>
        </div>

        {/* Pet card */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="xl" />
            </div>
            <h1 className="text-2xl font-bold">{pet.name}</h1>
            <p className="text-muted-foreground">{pet.breed}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              <Badge variant={pet.status === 'stray' ? 'warning' : 'secondary'}>
                {pet.status === 'stray' ? 'Stray' : 'Owned'}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {pet.species === 'dog' ? '🐕 Dog' : '🐈 Cat'}
              </Badge>
              <Badge variant="outline">{pet.sex === 'male' ? 'Male' : 'Female'}</Badge>
              {pet.isSpayedNeutered && <Badge variant="info">Spayed/Neutered</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Vaccination status — most important for QR scan */}
        <Card className={latestVacc ? 'border-green-300' : 'border-red-300'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Syringe className="h-4 w-4 text-primary" />
              Vaccination Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestVacc ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Latest Vaccine</span>
                  <span className="text-sm font-medium">{latestVacc.vaccineType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Date Given</span>
                  <span className="text-sm">{formatDateShort(latestVacc.dateAdministered)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next Booster Due</span>
                  <span className="text-sm font-medium">{formatDateShort(latestVacc.nextBoosterDue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <VaccinationStatusBadge nextDue={latestVacc.nextBoosterDue} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Veterinarian</span>
                  <span className="text-sm">{latestVacc.veterinarian}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm">No vaccination records on file for this pet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: 'Breed', value: pet.breed },
              { label: 'Color', value: pet.color },
              { label: 'Age', value: `${pet.age} year${pet.age !== 1 ? 's' : ''}` },
              { label: 'Barangay', value: `Brgy. ${pet.barangay}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
            {pet.status === 'owned' && (() => {
              const petOwner = users.find(u => u.id === pet.ownerId || (u.name && u.name.toLowerCase() === pet.ownerName.toLowerCase()));
              return (
                <>
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <div className="flex items-center gap-1.5">
                      {petOwner?.avatarUrl && (
                        <img src={petOwner.avatarUrl} alt={pet.ownerName} className="h-5 w-5 rounded-full object-cover border" />
                      )}
                      <span className="font-medium">
                        {petOwner?.username ? `@${petOwner.username}` : pet.ownerName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Contact</span>
                    <a href={`tel:${pet.ownerContact}`} className="text-primary font-medium">{pet.ownerContact}</a>
                  </div>
                </>
              );
            })()}

            {pet.status === 'stray' && (
              <div className="pt-2 border-t space-y-1.5 text-xs text-amber-900 bg-amber-50/50 p-2.5 rounded">
                <p className="font-semibold">Stray Animal Information:</p>
                {pet.sightingLocation && <p><strong>Roaming Spot:</strong> {pet.sightingLocation}</p>}
                {pet.behavior && <p><strong>Behavior:</strong> {pet.behavior}</p>}
                <p className="text-[11px] text-muted-foreground">Responsible Agency: LGU Irosin Agriculture Office</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-3 pb-4">
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            <span>Pet ID: {pet.id}</span>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/report-incident">Report an Incident Involving This Pet</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Irosin LGU Pet Registry · RA 9482 Anti-Rabies Act · Sorsogon, Philippines
          </p>
        </div>
      </div>
    </div>
  );
}
