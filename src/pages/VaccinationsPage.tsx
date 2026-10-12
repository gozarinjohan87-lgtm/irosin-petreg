import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Syringe, AlertTriangle, Clock, CheckCircle, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VaccinationStatusBadge } from '@/components/shared/VaccinationStatusBadge';
import { PetAvatar } from '@/components/shared/PetAvatar';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { formatDateShort, isOverdue, isDueSoon } from '@/lib/utils';
import { BARANGAYS } from '@/types/types';
import { SmsBoosterEngine } from '@/components/vaccinations/SmsBoosterEngine';

export function VaccinationsPage() {
  const { vaccinations, pets } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBarangay, setFilterBarangay] = useState('all');

  const getPet = (petId: string) => pets.find(p => p.id === petId);

  const enriched = vaccinations.map(v => ({ ...v, pet: getPet(v.petId) }))
    .filter(v => v.pet);

  const filtered = enriched.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      v.pet!.name.toLowerCase().includes(q) ||
      v.pet!.ownerName.toLowerCase().includes(q) ||
      v.vaccineType.toLowerCase().includes(q);
    const matchBarangay = filterBarangay === 'all' || v.pet!.barangay === filterBarangay;
    let matchStatus = true;
    if (filterStatus === 'overdue') matchStatus = isOverdue(v.nextBoosterDue);
    else if (filterStatus === 'due-soon') matchStatus = isDueSoon(v.nextBoosterDue, 30) && !isOverdue(v.nextBoosterDue);
    else if (filterStatus === 'up-to-date') matchStatus = !isOverdue(v.nextBoosterDue) && !isDueSoon(v.nextBoosterDue, 30);
    return matchSearch && matchBarangay && matchStatus;
  }).sort((a, b) => a.nextBoosterDue.localeCompare(b.nextBoosterDue));

  const overdueCount = vaccinations.filter(v => isOverdue(v.nextBoosterDue)).length;
  const dueSoonCount = vaccinations.filter(v => isDueSoon(v.nextBoosterDue, 30) && !isOverdue(v.nextBoosterDue)).length;
  const upToDateCount = vaccinations.filter(v => !isOverdue(v.nextBoosterDue) && !isDueSoon(v.nextBoosterDue, 30)).length;

  return (
    <div>
      <PageHeader
        title="Health & Vaccination Records"
        subtitle="Track anti-rabies and other vaccine schedules for all registered pets"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Records" value={vaccinations.length} icon={Syringe} color="yellow" />
        <StatCard title="Overdue" value={overdueCount} icon={AlertTriangle} color="red" subtitle="Needs attention" />
        <StatCard title="Due Soon" value={dueSoonCount} icon={Clock} color="yellow" subtitle="Within 30 days" />
        <StatCard title="Up-to-Date" value={upToDateCount} icon={CheckCircle} color="green" subtitle="Compliant" />
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <Card className="mb-6 border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">{overdueCount} vaccination{overdueCount !== 1 ? 's' : ''} overdue</p>
              <p className="text-sm text-red-700">Contact pet owners immediately to schedule rabies booster shots.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automated SMS Reminder Dispatcher Engine */}
      <div className="mb-6">
        <SmsBoosterEngine />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by pet name, owner, or vaccine..." className="pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due-soon">Due Soon</SelectItem>
                <SelectItem value="up-to-date">Up-to-Date</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBarangay} onValueChange={setFilterBarangay}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Barangay" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barangays</SelectItem>
                {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vaccination Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Syringe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No vaccination records found.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Pet</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Owner</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Barangay</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Vaccine</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Date Given</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Next Booster</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Veterinarian</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map(v => (
                      <tr key={v.id} className={`hover:bg-muted/30 ${isOverdue(v.nextBoosterDue) ? 'bg-red-50/50' : isDueSoon(v.nextBoosterDue, 30) ? 'bg-yellow-50/50' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link to={`/pets/${v.petId}`} className="flex items-center gap-2 hover:text-primary">
                            <PetAvatar photo={v.pet!.photo} name={v.pet!.name} species={v.pet!.species} size="sm" />
                            <span className="font-medium">{v.pet!.name}</span>
                            <Badge variant="outline" className="text-xs capitalize">{v.pet!.species}</Badge>
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{v.pet!.ownerName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{v.pet!.barangay}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{v.vaccineType}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDateShort(v.dateAdministered)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={isOverdue(v.nextBoosterDue) ? 'text-red-600 font-semibold' : isDueSoon(v.nextBoosterDue, 7) ? 'text-yellow-600 font-semibold' : ''}>
                            {formatDateShort(v.nextBoosterDue)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{v.veterinarian}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><VaccinationStatusBadge nextDue={v.nextBoosterDue} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (<md) */}
              <div className="md:hidden divide-y">
                {filtered.map(v => (
                  <div
                    key={v.id}
                    className={`p-4 space-y-2.5 ${isOverdue(v.nextBoosterDue) ? 'bg-red-50/40' : isDueSoon(v.nextBoosterDue, 30) ? 'bg-yellow-50/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/pets/${v.petId}`} className="flex items-center gap-2.5">
                        <PetAvatar photo={v.pet!.photo} name={v.pet!.name} species={v.pet!.species} size="md" />
                        <div>
                          <p className="font-semibold text-sm text-foreground">{v.pet!.name}</p>
                          <p className="text-xs text-muted-foreground">{v.pet!.ownerName} · Brgy. {v.pet!.barangay}</p>
                        </div>
                      </Link>
                      <VaccinationStatusBadge nextDue={v.nextBoosterDue} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Vaccine:</span>
                        <span className="font-medium">{v.vaccineType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Administered:</span>
                        <span>{formatDateShort(v.dateAdministered)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Next Booster:</span>
                        <span className={isOverdue(v.nextBoosterDue) ? 'text-red-600 font-bold' : isDueSoon(v.nextBoosterDue, 7) ? 'text-yellow-600 font-bold' : 'font-medium'}>
                          {formatDateShort(v.nextBoosterDue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Veterinarian:</span>
                        <span className="truncate block">{v.veterinarian}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
