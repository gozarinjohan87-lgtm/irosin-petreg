import { useState, useMemo } from 'react';
import {
  MapPin, ShieldAlert, AlertTriangle, ShieldCheck, Flame, Info,
  Filter, Download, ChevronRight, Layers, HeartPulse, RefreshCw,
  Search, CheckCircle2, LayoutGrid, Map
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/context/AppContext';
import { BARANGAYS } from '@/types/types';
import { isOverdue } from '@/lib/utils';

// Approximate 2D coordinate placement for Irosin 28 Barangays (Normalized 0-100 grid)
const BARANGAY_COORDINATES: Record<string, { x: number; y: number; zone: 'Poblacion' | 'North' | 'South' | 'East' | 'West' }> = {
  // Poblacion Urban Core
  'Bacolod (Poblacion)': { x: 50, y: 50, zone: 'Poblacion' },
  'San Agustin (Poblacion)': { x: 55, y: 45, zone: 'Poblacion' },
  'San Juan (Poblacion)': { x: 45, y: 46, zone: 'Poblacion' },
  'San Julian (Poblacion)': { x: 53, y: 55, zone: 'Poblacion' },
  'San Pedro (Poblacion)': { x: 44, y: 54, zone: 'Poblacion' },

  // Northern Barangays (Mt. Bulusan flank / Upland)
  'Batang': { x: 48, y: 22, zone: 'North' },
  'Mapaso': { x: 59, y: 20, zone: 'North' },
  'Monbon': { x: 69, y: 24, zone: 'North' },
  'Patag': { x: 37, y: 19, zone: 'North' },
  'San Isidro (Palogtok)': { x: 59, y: 32, zone: 'North' },
  'Cawayan': { x: 75, y: 34, zone: 'North' },

  // Eastern Valley & Rolling Hills
  'Bagsangan': { x: 71, y: 47, zone: 'East' },
  'Buenavista': { x: 82, y: 53, zone: 'East' },
  'Bulawan': { x: 77, y: 64, zone: 'East' },
  'Carriedo': { x: 85, y: 69, zone: 'East' },
  'Casini': { x: 65, y: 58, zone: 'East' },

  // Southern Highway & Agricultural Plains
  'Bolos': { x: 57, y: 73, zone: 'South' },
  'Gabao': { x: 48, y: 69, zone: 'South' },
  'Gulang-Gulang': { x: 39, y: 75, zone: 'South' },
  'Gumapia': { x: 63, y: 83, zone: 'South' },
  'Santo Domingo (Lamboon)': { x: 50, y: 85, zone: 'South' },
  'Tongdol': { x: 33, y: 87, zone: 'South' },

  // Western Belt
  'Cogon': { x: 31, y: 39, zone: 'West' },
  'Liang': { x: 23, y: 48, zone: 'West' },
  'Macawayan': { x: 25, y: 61, zone: 'West' },
  'Salvacion': { x: 35, y: 61, zone: 'West' },
  'Tabon-Tabon': { x: 21, y: 71, zone: 'West' },
  'Tinampo': { x: 37, y: 30, zone: 'West' },
};

type MapMetric = 'vaccination' | 'bites' | 'strays' | 'risk';

export function IrosinBarangayMap() {
  const { pets, vaccinations, biteCases, straySightings } = useApp();
  const [metric, setMetric] = useState<MapMetric>('vaccination');
  const [selectedBrgy, setSelectedBrgy] = useState<string>('Bacolod (Poblacion)');
  const [hoveredBrgy, setHoveredBrgy] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [gridSearch, setGridSearch] = useState('');

  // Compute metrics per barangay
  const barangayData = useMemo(() => {
    return BARANGAYS.map(name => {
      const brgyPets = pets.filter(p => p.barangay === name);
      const ownedPets = brgyPets.filter(p => p.status === 'owned');
      const strayPets = brgyPets.filter(p => p.status === 'stray');
      const dogs = brgyPets.filter(p => p.species === 'dog');
      const cats = brgyPets.filter(p => p.species === 'cat');

      const vaccinated = ownedPets.filter(p => {
        const vList = vaccinations.filter(v => v.petId === p.id);
        const latest = vList.sort((a, b) => b.dateAdministered.localeCompare(a.dateAdministered))[0];
        return latest && !isOverdue(latest.nextBoosterDue);
      });

      const coverage = ownedPets.length > 0
        ? Math.round((vaccinated.length / ownedPets.length) * 100)
        : (brgyPets.length > 0 ? 30 : 0);

      const bites = biteCases.filter(b => b.barangay === name);
      const activeBites = bites.filter(b => b.quarantineStatus !== 'completed').length;
      const sightings = (straySightings || []).filter(s => s.barangay === name);

      // Risk score: low coverage + high bites + high strays
      let riskScore = 0;
      if (coverage < 50) riskScore += 40;
      else if (coverage < 70) riskScore += 20;
      riskScore += activeBites * 20;
      riskScore += sightings.length * 10;
      const riskLevel = riskScore >= 50 ? 'High' : riskScore >= 25 ? 'Moderate' : 'Low';

      const coords = BARANGAY_COORDINATES[name] || { x: 50, y: 50, zone: 'Poblacion' };

      return {
        name,
        cleanName: name.replace(' (Poblacion)', '').replace(' (Palogtok)', '').replace(' (Lamboon)', ''),
        zone: coords.zone,
        x: coords.x,
        y: coords.y,
        totalPets: brgyPets.length,
        ownedPets: ownedPets.length,
        strayPets: strayPets.length,
        dogs: dogs.length,
        cats: cats.length,
        vaccinated: vaccinated.length,
        coverage,
        bitesTotal: bites.length,
        activeBites,
        sightingsTotal: sightings.length,
        riskScore,
        riskLevel,
      };
    });
  }, [pets, vaccinations, biteCases, straySightings]);

  const activeBrgy = barangayData.find(b => b.name === selectedBrgy) || barangayData[0];

  const getColorByMetric = (b: typeof barangayData[0]) => {
    if (metric === 'vaccination') {
      if (b.coverage >= 70) return '#10b981'; // Emerald Green
      if (b.coverage >= 50) return '#f59e0b'; // Amber
      return '#ef4444'; // Rose Red
    }
    if (metric === 'bites') {
      if (b.activeBites >= 2) return '#ef4444';
      if (b.activeBites === 1) return '#f97316';
      return '#10b981';
    }
    if (metric === 'strays') {
      if (b.sightingsTotal >= 3) return '#ea580c';
      if (b.sightingsTotal >= 1) return '#f59e0b';
      return '#3b82f6';
    }
    // Overall Risk
    if (b.riskLevel === 'High') return '#ef4444';
    if (b.riskLevel === 'Moderate') return '#f59e0b';
    return '#10b981';
  };

  const highRiskCount = barangayData.filter(b => b.riskLevel === 'High').length;
  const herdImmunityPassedCount = barangayData.filter(b => b.coverage >= 70).length;
  const belowHerdImmunityCount = barangayData.filter(b => b.coverage < 70).length;
  const activeBiteCount = barangayData.reduce((acc, b) => acc + b.activeBites, 0);

  const filteredGridBarangays = barangayData.filter(b => {
    const matchesZone = zoneFilter === 'all' || b.zone === zoneFilter;
    const matchesSearch = gridSearch === '' || b.name.toLowerCase().includes(gridSearch.toLowerCase());
    return matchesZone && matchesSearch;
  });

  return (
    <Card className="border shadow-sm bg-card">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg font-bold">
                  Irosin 28 Barangays Surveillance &amp; Hotspot Map
                </CardTitle>
                <CardDescription className="text-xs">
                  Eye-friendly rabies prevention monitoring, risk assessment, and vaccination coverage
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View switcher: Map vs Quick Grid */}
            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
              <Button
                size="sm"
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                className="h-7 text-xs px-2.5 gap-1"
                onClick={() => setViewMode('map')}
              >
                <Map className="h-3.5 w-3.5" />
                Map View
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className="h-7 text-xs px-2.5 gap-1"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Barangay Quick Grid (28)
              </Button>
            </div>

            <Select value={metric} onValueChange={(v) => setMetric(v as MapMetric)}>
              <SelectTrigger className="w-[170px] h-8 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vaccination" className="text-xs">
                  🛡️ Vaccination Coverage
                </SelectItem>
                <SelectItem value="bites" className="text-xs">
                  ⚠️ Bite Hotspots
                </SelectItem>
                <SelectItem value="strays" className="text-xs">
                  🐾 Stray Sightings
                </SelectItem>
                <SelectItem value="risk" className="text-xs">
                  🔥 Risk Vulnerability
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-[125px] h-8 text-xs">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Zones (28)</SelectItem>
                <SelectItem value="Poblacion" className="text-xs">Poblacion Core</SelectItem>
                <SelectItem value="North" className="text-xs">Northern Flank</SelectItem>
                <SelectItem value="South" className="text-xs">Southern Plain</SelectItem>
                <SelectItem value="East" className="text-xs">Eastern Valley</SelectItem>
                <SelectItem value="West" className="text-xs">Western Belt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick summary chips for non-technical users */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">Herd Protected</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-200 text-sm">{herdImmunityPassedCount} / 28</span>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-300 font-medium">Under 70% Target</span>
            <span className="font-bold text-amber-700 dark:text-amber-200 text-sm">{belowHerdImmunityCount} brgys</span>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
            <span className="text-rose-800 dark:text-rose-300 font-medium">Active Bite Cases</span>
            <span className="font-bold text-rose-700 dark:text-rose-200 text-sm">{activeBiteCount} cases</span>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-300 font-medium">Priority Attention</span>
            <span className="font-bold text-blue-700 dark:text-blue-200 text-sm">{highRiskCount} brgys</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {viewMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SVG Eye-Friendly Map Container */}
            <div className="lg:col-span-8 bg-slate-900 rounded-xl p-4 border border-slate-700 relative overflow-hidden shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  IROSIN MUNICIPAL CARTOGRAPHIC OVERVIEW
                </span>
                <span className="text-[11px] text-slate-400">
                  Tap or click any barangay node to inspect details
                </span>
              </div>

              <div className="relative aspect-[16/10] w-full">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full select-none"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <radialGradient id="poblacionGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </radialGradient>
                    <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#334155" strokeWidth="0.25" opacity="0.4" />
                    </pattern>
                  </defs>

                  <rect width="100" height="100" fill="url(#gridPattern)" />

                  {/* Mt. Bulusan & Upland Ridge Indicator (North) */}
                  <path
                    d="M 20 18 Q 50 10 85 20"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />
                  <text x="50" y="13" fill="#94a3b8" fontSize="2.4" textAnchor="middle" fontWeight="500">
                    ▲ Mt. Bulusan Natural Park Foothills
                  </text>

                  {/* Maharlika Highway Corridor (North-South) */}
                  <path
                    d="M 48 22 L 50 50 L 53 55 L 48 69 L 50 85"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity="0.5"
                  />

                  {/* Poblacion Core Halo */}
                  <circle cx="50" cy="50" r="14" fill="url(#poblacionGlow)" />
                  <text x="50" y="42" fill="#cbd5e1" fontSize="2.3" textAnchor="middle" fontWeight="bold">
                    POBLACION CORE
                  </text>

                  {/* Selected Barangay Pulsing Beacon */}
                  {activeBrgy && (
                    <circle
                      cx={activeBrgy.x}
                      cy={activeBrgy.y}
                      r="6.5"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1"
                      className="animate-ping"
                      opacity="0.8"
                    />
                  )}

                  {/* Barangay Interactive Nodes (Jitter-free and stabilized) */}
                  {barangayData
                    .filter(b => zoneFilter === 'all' || b.zone === zoneFilter)
                    .map(b => {
                      const isSelected = b.name === selectedBrgy;
                      const isHovered = b.name === hoveredBrgy;
                      const color = getColorByMetric(b);

                      return (
                        <g
                          key={b.name}
                          className="cursor-pointer"
                          onClick={() => setSelectedBrgy(b.name)}
                          onMouseEnter={() => setHoveredBrgy(b.name)}
                          onMouseLeave={() => setHoveredBrgy(null)}
                        >
                          {/* Invisible expanded hit target to prevent enter/leave oscillation */}
                          <circle
                            cx={b.x}
                            cy={b.y}
                            r={6}
                            fill="transparent"
                            className="cursor-pointer"
                          />

                          {/* Hover/Selection Halo Ring */}
                          {(isSelected || isHovered) && (
                            <circle
                              cx={b.x}
                              cy={b.y}
                              r={isSelected ? 5.8 : 4.8}
                              fill="none"
                              stroke={isSelected ? '#38bdf8' : '#93c5fd'}
                              strokeWidth={isSelected ? 1.0 : 0.8}
                              strokeDasharray={isSelected ? undefined : '1.5,1.5'}
                              className="pointer-events-none transition-all duration-150"
                            />
                          )}

                          {/* Node circle */}
                          <circle
                            cx={b.x}
                            cy={b.y}
                            r={isSelected ? 4.2 : isHovered ? 3.6 : 3}
                            fill={color}
                            stroke={isSelected ? '#ffffff' : isHovered ? '#38bdf8' : '#0f172a'}
                            strokeWidth={isSelected ? 1.4 : isHovered ? 1.1 : 0.8}
                            className="transition-all duration-150 filter drop-shadow pointer-events-none"
                          />

                          {/* Metric Value Label on Node */}
                          <text
                            x={b.x}
                            y={b.y + 0.9}
                            fill="#ffffff"
                            fontSize="1.9"
                            fontWeight="bold"
                            textAnchor="middle"
                            pointerEvents="none"
                            className="select-none"
                          >
                            {metric === 'vaccination'
                              ? `${b.coverage}%`
                              : metric === 'bites'
                              ? b.activeBites
                              : metric === 'strays'
                              ? b.sightingsTotal
                              : b.riskScore}
                          </text>

                          {/* Barangay Name Label */}
                          <text
                            x={b.x}
                            y={b.y - 3.8}
                            fill={isSelected ? '#38bdf8' : isHovered ? '#93c5fd' : '#f1f5f9'}
                            fontSize={isSelected ? 2.7 : isHovered ? 2.4 : 2.1}
                            fontWeight={isSelected || isHovered ? 'bold' : '500'}
                            textAnchor="middle"
                            pointerEvents="none"
                            className="drop-shadow-md select-none transition-colors duration-150"
                          >
                            {b.cleanName}
                          </text>
                        </g>
                      );
                    })}
                </svg>
              </div>

              {/* Map footer helper */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-300 border-t border-slate-800 pt-2.5">
                <span>Color code: 🟢 Safe / Protected · 🟡 Monitor · 🔴 High Risk / Action</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBrgy('Bacolod (Poblacion)')}
                  className="h-6 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Reset to Poblacion
                </Button>
              </div>
            </div>

            {/* Deep Dive Barangay Inspector Panel */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="border-2 border-primary/20 bg-muted/10 shadow-sm">
                <CardHeader className="pb-3 border-b bg-card rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {activeBrgy.zone} Zone
                    </Badge>
                    <Badge
                      className={`text-[10px] font-semibold ${
                        activeBrgy.coverage >= 70
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {activeBrgy.coverage >= 70 ? '✓ Herd Protected' : '⚠ Below Target'}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold mt-1.5 flex items-center justify-between">
                    <span>Brgy. {activeBrgy.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${
                        activeBrgy.riskLevel === 'High'
                          ? 'border-red-400 text-red-600 bg-red-50'
                          : activeBrgy.riskLevel === 'Moderate'
                          ? 'border-yellow-400 text-yellow-700 bg-yellow-50'
                          : 'border-green-400 text-green-700 bg-green-50'
                      }`}
                    >
                      {activeBrgy.riskLevel} Risk
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Republic Act 9482 Anti-Rabies Compliance Status
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-3">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Anti-Rabies Coverage:</span>
                      <span className={activeBrgy.coverage >= 70 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {activeBrgy.coverage}% {activeBrgy.coverage >= 70 ? '(Goal Met)' : '(Target: 70%)'}
                      </span>
                    </div>
                    <Progress value={Math.min(activeBrgy.coverage, 100)} className="h-2" />
                  </div>

                  {/* Metric Highlights */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-card rounded-lg border">
                      <span className="text-muted-foreground block text-[11px]">Vaccinated Pets</span>
                      <span className="text-lg font-bold text-foreground">
                        {activeBrgy.vaccinated} <span className="text-xs font-normal text-muted-foreground">/ {activeBrgy.ownedPets}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {activeBrgy.ownedPets - activeBrgy.vaccinated} pending boosters
                      </span>
                    </div>

                    <div className="p-2.5 bg-card rounded-lg border">
                      <span className="text-muted-foreground block text-[11px]">Active Bite Cases</span>
                      <span className={`text-lg font-bold ${activeBrgy.activeBites > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {activeBrgy.activeBites}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {activeBrgy.bitesTotal} total logged
                      </span>
                    </div>

                    <div className="p-2.5 bg-card rounded-lg border">
                      <span className="text-muted-foreground block text-[11px]">Total Animals</span>
                      <span className="text-lg font-bold text-foreground">
                        {activeBrgy.totalPets}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {activeBrgy.dogs} dogs · {activeBrgy.cats} cats
                      </span>
                    </div>

                    <div className="p-2.5 bg-card rounded-lg border">
                      <span className="text-muted-foreground block text-[11px]">Stray Sightings</span>
                      <span className="text-lg font-bold text-foreground">
                        {activeBrgy.sightingsTotal}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        Risk score: {activeBrgy.riskScore}
                      </span>
                    </div>
                  </div>

                  {/* Action Recommendation */}
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                      <HeartPulse className="h-4 w-4 shrink-0" />
                      Intervention Recommendation
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      {activeBrgy.coverage < 70
                        ? `Priority mobile vaccination drive recommended for Brgy. ${activeBrgy.name}. Target at least ${Math.max(1, Math.ceil(activeBrgy.ownedPets * 0.7) - activeBrgy.vaccinated)} more canines to meet the 70% threshold.`
                        : `Barangay ${activeBrgy.name} maintains satisfactory herd immunity under RA 9482. Continue regular booster monitoring.`}
                    </p>
                  </div>

                  {/* Barangay Quick Selector */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Select Barangay to Inspect:</label>
                    <Select value={selectedBrgy} onValueChange={setSelectedBrgy}>
                      <SelectTrigger className="h-8 text-xs bg-card">
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
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* 28-Barangay Quick Grid for effortless non-technical inspection */
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative max-w-xs flex-1">
                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter 28 barangays..."
                  value={gridSearch}
                  onChange={e => setGridSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <span className="text-xs text-muted-foreground">
                Showing {filteredGridBarangays.length} of 28 Barangays
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredGridBarangays.map(b => {
                const isSelected = b.name === selectedBrgy;
                return (
                  <div
                    key={b.name}
                    onClick={() => {
                      setSelectedBrgy(b.name);
                      setViewMode('map');
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="font-bold text-sm text-foreground truncate">{b.cleanName}</span>
                      <Badge
                        className={`text-[10px] shrink-0 ${
                          b.riskLevel === 'High'
                            ? 'bg-rose-100 text-rose-800'
                            : b.riskLevel === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {b.riskLevel} Risk
                      </Badge>
                    </div>

                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Vaccination:</span>
                        <span className={`font-semibold ${b.coverage >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {b.coverage}%
                        </span>
                      </div>
                      <Progress value={Math.min(b.coverage, 100)} className="h-1.5" />
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t text-[10px] text-center text-muted-foreground">
                      <div>
                        <span className="block font-semibold text-foreground">{b.totalPets}</span>
                        <span>Pets</span>
                      </div>
                      <div>
                        <span className={`block font-semibold ${b.activeBites > 0 ? 'text-rose-600' : 'text-foreground'}`}>
                          {b.activeBites}
                        </span>
                        <span>Bites</span>
                      </div>
                      <div>
                        <span className="block font-semibold text-foreground">{b.sightingsTotal}</span>
                        <span>Strays</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
