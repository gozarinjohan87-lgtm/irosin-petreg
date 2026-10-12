import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { BARANGAYS } from '@/types/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { isOverdue } from '@/lib/utils';
import { Activity, TrendingUp, Shield, AlertTriangle, Dog, Cat, MapPin } from 'lucide-react';
import { IrosinBarangayMap } from '@/components/analytics/IrosinBarangayMap';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AnalyticsPage() {
  const { pets, vaccinations, incidents, biteCases, straySightings } = useApp();

  // Per-barangay vaccination coverage
  const barangayStats = BARANGAYS.map(brgy => {
    const brgyPets = pets.filter(p => p.barangay === brgy && p.status === 'owned');
    const vaccinated = brgyPets.filter(p => {
      const vacc = vaccinations.filter(v => v.petId === p.id);
      const latest = vacc.sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered))[0];
      return latest && !isOverdue(latest.nextBoosterDue);
    });
    const overdue = brgyPets.filter(p => {
      const vacc = vaccinations.filter(v => v.petId === p.id);
      const latest = vacc.sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered))[0];
      return !latest || isOverdue(latest.nextBoosterDue);
    });
    return {
      brgy: brgy.length > 10 ? brgy.slice(0, 10) + '…' : brgy,
      fullName: brgy,
      total: brgyPets.length,
      vaccinated: vaccinated.length,
      overdue: overdue.length,
      coverage: brgyPets.length > 0 ? Math.round((vaccinated.length / brgyPets.length) * 100) : 0,
      biteCases: biteCases.filter(b => b.barangay === brgy).length,
      sightings: (straySightings || []).filter(s => s.barangay === brgy).length,
    };
  }).filter(b => b.total > 0).sort((a, b) => b.total - a.total).slice(0, 15);

  // Species breakdown
  const speciesData = [
    { name: 'Dogs', value: pets.filter(p => p.species === 'dog').length, color: CHART_COLORS[0] },
    { name: 'Cats', value: pets.filter(p => p.species === 'cat').length, color: CHART_COLORS[1] },
  ];

  // Status breakdown
  const statusData = [
    { name: 'Owned', value: pets.filter(p => p.status === 'owned').length, color: CHART_COLORS[0] },
    { name: 'Stray', value: pets.filter(p => p.status === 'stray').length, color: CHART_COLORS[2] },
    { name: 'Impounded', value: pets.filter(p => p.impounded).length, color: CHART_COLORS[3] },
  ];

  // Incident type breakdown
  const incidentTypes = ['animal-bite', 'road-accident', 'stray-sighting', 'sanitation-violation'] as const;
  const incidentData = incidentTypes.map((type, i) => ({
    name: type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: incidents.filter(i => i.type === type).length,
    color: CHART_COLORS[i],
  }));

  // Overall stats
  const totalPets = pets.length;
  const vaccinatedPets = pets.filter(p => {
    const vacc = vaccinations.filter(v => v.petId === p.id);
    const latest = vacc.sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered))[0];
    return latest && !isOverdue(latest.nextBoosterDue);
  }).length;
  const coverageRatio = totalPets > 0 ? Math.round((vaccinatedPets / totalPets) * 100) : 0;
  const openSightings = (straySightings || []).filter(s => s.status === 'open').length;

  return (
    <div>
      <PageHeader
        title="Analytics & Disease Monitoring"
        subtitle="Vaccination coverage, disease hotspots, and community pet health data"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Registered Pets', value: totalPets, icon: Activity, color: 'text-primary' },
          { label: 'Vaccination Coverage', value: `${coverageRatio}%`, icon: Shield, color: 'text-green-500' },
          { label: 'Active Bite Cases', value: biteCases.filter(b => b.quarantineStatus !== 'completed').length, icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Open Stray Sightings', value: openSightings, icon: MapPin, color: 'text-orange-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Geographic Map Surveillance */}
      <div className="mb-6">
        <IrosinBarangayMap />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Species breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dog className="h-4 w-4" />Species Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={speciesData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {speciesData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {speciesData.map((d, i) => (
                <div key={i} className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cat className="h-4 w-4" />Pet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Incident types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />Incident Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={incidentData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {incidentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Barangay vaccination coverage chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vaccination Coverage by Barangay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barangayStats} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <XAxis dataKey="brgy" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'vaccinated' ? 'Vaccinated' : 'Overdue']}
                  labelFormatter={label => {
                    const found = barangayStats.find(b => b.brgy === label);
                    return found?.fullName || label;
                  }}
                />
                <Legend layout="horizontal" wrapperStyle={{ paddingTop: 8 }} />
                <Bar dataKey="vaccinated" name="Vaccinated" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue / Unvaccinated" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Disease hotspot table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Disease Hotspots & Stray Activity by Barangay
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 whitespace-nowrap">Barangay</th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">Pets</th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">Coverage</th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">Bite Cases</th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">Stray Sightings</th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {barangayStats.map(b => {
                  const risk = b.biteCases >= 2 ? 'High' : b.biteCases === 1 || b.coverage < 50 ? 'Medium' : 'Low';
                  const riskColor = risk === 'High' ? 'bg-red-100 text-red-800' : risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
                  return (
                    <tr key={b.fullName} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3 font-medium whitespace-nowrap">{b.fullName}</td>
                      <td className="py-2 px-3 text-center">{b.total}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${b.coverage}%`, backgroundColor: b.coverage >= 70 ? 'hsl(var(--primary))' : b.coverage >= 40 ? '#f59e0b' : '#ef4444' }}
                            />
                          </div>
                          <span className="text-xs">{b.coverage}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">{b.biteCases}</td>
                      <td className="py-2 px-3 text-center">{b.sightings}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge className={riskColor}>{risk}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
