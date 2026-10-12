import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, Dog, Cat } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VaccinationStatusBadge } from '@/components/shared/VaccinationStatusBadge';
import { PetAvatar } from '@/components/shared/PetAvatar';
import { PageHeader } from '@/components/shared/PageHeader';
import { formatDateShort, getVaccStatus } from '@/lib/utils';
import { BARANGAYS } from '@/types/types';

export function PetRegistryPage() {
  const { pets, vaccinations, currentUser, users } = useApp();
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [filterBarangay, setFilterBarangay] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVacc, setFilterVacc] = useState('all');

  const canRegister = currentUser?.role === 'admin' || currentUser?.role === 'operator' || currentUser?.role === 'owner';

  const getLatestVacc = (petId: string) =>
    vaccinations.filter(v => v.petId === petId).sort((a, b) => b.nextBoosterDue.localeCompare(a.nextBoosterDue))[0];

  const filtered = pets.filter(pet => {
    const q = search.toLowerCase();
    const petOwner = users.find(u => u.id === pet.ownerId || (u.name && pet.ownerName && u.name.trim().toLowerCase() === pet.ownerName.trim().toLowerCase()));
    const matchSearch = !q ||
      pet.name.toLowerCase().includes(q) ||
      pet.ownerName.toLowerCase().includes(q) ||
      (petOwner?.username && petOwner.username.toLowerCase().includes(q)) ||
      pet.breed.toLowerCase().includes(q);
    const matchSpecies = filterSpecies === 'all' || pet.species === filterSpecies;
    const matchBarangay = filterBarangay === 'all' || pet.barangay === filterBarangay;
    const matchStatus = filterStatus === 'all' || pet.status === filterStatus;
    const latestVacc = getLatestVacc(pet.id);
    const vaccStatus = latestVacc ? getVaccStatus(latestVacc.nextBoosterDue) : 'none';
    const matchVacc = filterVacc === 'all' || vaccStatus === filterVacc;
    return matchSearch && matchSpecies && matchBarangay && matchStatus && matchVacc;
  });

  const dogs = pets.filter(p => p.species === 'dog').length;
  const cats = pets.filter(p => p.species === 'cat').length;
  const strays = pets.filter(p => p.status === 'stray').length;

  return (
    <div>
      <PageHeader
        title="Pet Registry"
        subtitle={`${pets.length} animals registered · ${dogs} dogs · ${cats} cats · ${strays} strays`}
        action={canRegister ? (
          <Button asChild>
            <Link to="/pets/register">
              <Plus className="h-4 w-4" />
              Register Pet
            </Link>
          </Button>
        ) : undefined}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, owner, or breed..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                <SelectTrigger><SelectValue placeholder="Species" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="dog">Dogs</SelectItem>
                  <SelectItem value="cat">Cats</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="stray">Stray</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVacc} onValueChange={setFilterVacc}>
                <SelectTrigger><SelectValue placeholder="Vaccination" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vaccines</SelectItem>
                  <SelectItem value="up-to-date">Up-to-Date</SelectItem>
                  <SelectItem value="due-soon">Due Soon</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="none">No Record</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBarangay} onValueChange={setFilterBarangay}>
                <SelectTrigger><SelectValue placeholder="Barangay" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Barangays</SelectItem>
                  {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(filterSpecies !== 'all' || filterBarangay !== 'all' || filterStatus !== 'all' || filterVacc !== 'all') && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                <Button variant="ghost" size="sm" onClick={() => { setFilterSpecies('all'); setFilterBarangay('all'); setFilterStatus('all'); setFilterVacc('all'); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Dog className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pets found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(pet => {
            const lv = getLatestVacc(pet.id);
            return (
              <Link key={pet.id} to={`/pets/${pet.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border hover:border-primary/40">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <PetAvatar photo={pet.photo} name={pet.name} species={pet.species} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base truncate">{pet.name}</h3>
                          <div className="flex items-center gap-1 shrink-0">
                            {pet.lifecycleStatus === 'deceased' ? (
                              <Badge variant="outline" className="text-[10px] bg-zinc-200 text-zinc-800 border-zinc-400">
                                Deceased
                              </Badge>
                            ) : pet.lifecycleStatus === 'transferred' ? (
                              <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-300">
                                Transferred
                              </Badge>
                            ) : (
                              <Badge variant={pet.status === 'stray' ? 'warning' : 'secondary'} className="text-xs">
                                {pet.status === 'stray' ? 'Stray' : 'Owned'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{pet.breed}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {pet.species === 'dog' ? <Dog className="h-3 w-3 text-muted-foreground" /> : <Cat className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground capitalize">{pet.species} · {pet.sex} · {pet.age}yr{pet.age !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t space-y-1.5">
                      {(() => {
                        const petOwner = users.find(u => u.id === pet.ownerId || (u.name && pet.ownerName && u.name.trim().toLowerCase() === pet.ownerName.trim().toLowerCase()));
                        const displayOwner = petOwner?.username ? `@${petOwner.username}` : (petOwner?.name || pet.ownerName);

                        return (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground truncate">
                              Owner: <strong className="font-semibold text-foreground">{displayOwner}</strong>
                            </span>
                            <VaccinationStatusBadge nextDue={lv?.nextBoosterDue} />
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">Brgy. {pet.barangay}</span>
                        <span className="text-xs text-muted-foreground">{formatDateShort(pet.registeredAt)}</span>
                      </div>
                      {pet.isSpayedNeutered && (
                        <Badge variant="info" className="text-xs">Spayed/Neutered</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
