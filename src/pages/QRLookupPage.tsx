import { useState } from 'react';
import { QrCode, Search, ArrowRight, Camera, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { useApp } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { LiveCameraScanner } from '@/components/qr/LiveCameraScanner';

export function QRLookupPage() {
  const { pets, currentUser } = useApp();
  const navigate = useNavigate();
  const [petId, setPetId] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');

  const resolvePetFromScanned = (scannedText: string) => {
    setError('');
    const trimmed = scannedText.trim();
    // Try to extract PET ID pattern (e.g., PET001 or URL ending with PET001)
    const match = trimmed.match(/PET\d+/i);
    const candidateId = match ? match[0].toUpperCase() : trimmed.toUpperCase();

    const found = pets.find(p =>
      p.id.toUpperCase() === candidateId ||
      p.qrCode.toUpperCase() === candidateId ||
      trimmed.toUpperCase().includes(p.id.toUpperCase())
    );

    if (found) {
      if (currentUser) {
        navigate(`/pets/${found.id}`);
      } else {
        navigate(`/public/pet/${found.id}`);
      }
    } else {
      setError(`Scanned code "${trimmed}" does not match any registered pet record in Irosin LGU.`);
    }
  };

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!petId.trim()) return;
    resolvePetFromScanned(petId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pet Collar QR Tag Scanner"
        subtitle="Live camera viewfinder & instant lookup for Irosin Municipal pet identification tags"
      />

      <div className="max-w-xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Live Camera Scanner
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Manual ID Lookup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            <LiveCameraScanner
              onScan={(code) => resolvePetFromScanned(code)}
            />

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">
                {error}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Enter Pet Registration ID
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter the alphanumeric tag printed on the collar (e.g., PET001 or QR code text).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLookup} className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 text-base font-mono uppercase"
                      placeholder="e.g., PET001"
                      value={petId}
                      onChange={e => { setPetId(e.target.value); setError(''); }}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                  )}
                  <Button type="submit" className="w-full" size="lg">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Look Up Pet Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Tag Testing Simulator */}
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Test Collar Tag Simulator
              </CardTitle>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Demo helper
              </span>
            </div>
            <CardDescription className="text-xs">
              Click any collar tag below to simulate an instantaneous camera decode:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pets.slice(0, 6).map(pet => (
                <Button
                  key={pet.id}
                  variant="outline"
                  size="sm"
                  onClick={() => resolvePetFromScanned(pet.id)}
                  className="text-xs font-mono h-8 border-primary/20 hover:border-primary"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1 text-primary" />
                  {pet.id} ({pet.name})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick access list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Recently Registered Pets in Irosin</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-60 overflow-y-auto">
              {pets.slice(0, 10).map(pet => (
                <Link
                  key={pet.id}
                  to={currentUser ? `/pets/${pet.id}` : `/public/pet/${pet.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{pet.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{pet.id}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-muted-foreground capitalize">{pet.species}</p>
                    <p className="text-xs text-muted-foreground">Brgy. {pet.barangay}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          QR codes are printed on each pet's collar tag. Compliant with Republic Act No. 9482 (Anti-Rabies Act of 2007).
        </p>
      </div>
    </div>
  );
}
