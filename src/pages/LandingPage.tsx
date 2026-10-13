import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode, Shield, Bell, BarChart2, PawPrint,
  CheckCircle, AlertTriangle, Users, MapPin,
  LogIn, UserPlus, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export function LandingPage() {
  const { pets, incidents, vaccinations, login, currentUser } = useApp();
  const { signInWithUsername } = useAuth();
  const navigate = useNavigate();

  const [landingEmail, setLandingEmail] = useState('');
  const [landingPass, setLandingPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    navigate(currentUser.role === 'owner' && !currentUser.purok ? '/complete-profile' : '/dashboard', { replace: true });
  }, [currentUser, navigate]);

  async function handleLandingLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    if (import.meta.env.DEV && !isSupabaseConfigured) {
      const user = login(landingEmail, landingPass);
      if (!user) setLoginError('Invalid demo credentials. Please try again.');
      return;
    }

    const { error } = await signInWithUsername(landingEmail, landingPass);
    if (error) {
      setLoginError(error.message);
    }
  }

  const stats = [
    { label: 'Registered Pets', value: pets.length, icon: PawPrint },
    { label: 'Resolved Incidents', value: incidents.filter(i => i.status === 'resolved').length, icon: CheckCircle },
    { label: 'Vaccinations Logged', value: vaccinations.length, icon: Shield },
    { label: 'Barangays Covered', value: 28, icon: MapPin },
  ];

  const features = [
    {
      icon: PawPrint, title: 'Centralized Pet Registry',
      desc: 'Digitize registration of owned and stray cats and dogs in Irosin, replacing fragmented manual logbooks.',
    },
    {
      icon: QrCode, title: 'QR Code Identification',
      desc: 'Generate unique QR codes for each animal. Instantly scan a collar tag to view full profile and vaccination status.',
    },
    {
      icon: Shield, title: 'Vaccination Tracking',
      desc: 'Monitor anti-rabies and other vaccine histories. Receive automated booster reminders aligned with RA 9482.',
    },
    {
      icon: AlertTriangle, title: 'Incident Reporting',
      desc: 'Community portal for reporting animal bites, road accidents, stray sightings, and sanitation violations.',
    },
    {
      icon: BarChart2, title: 'Analytics Dashboard',
      desc: 'Data-driven governance tools for LGU officials to monitor population trends and vaccination compliance.',
    },
    {
      icon: Bell, title: 'Automated Alerts',
      desc: 'Timely notifications keep pet owners informed about upcoming boosters and LGU officers about incidents.',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero with Embedded Centered Login Form */}
      <section className="hero-gradient py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge variant="secondary" className="mb-3 text-xs md:text-sm px-3 py-1 font-medium">
              RA 9482 Compliant System
            </Badge>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 text-balance tracking-tight">
              Web-Based Pet Registry &amp; Monitoring System
            </h1>
            <p className="text-base sm:text-lg text-foreground/80 mb-2 text-pretty">
              A centralized digital platform for cats and dogs in <strong>Irosin, Sorsogon</strong>
            </p>
            <p className="text-xs sm:text-sm text-foreground/70 max-w-lg mx-auto">
              Digitizing pet registration, vaccination tracking, and behavioral monitoring 
              to protect public health and ensure municipal compliance.
            </p>
          </div>

          {/* Centered Login Card */}
          <div className="max-w-md mx-auto w-full">
            <Card className="shadow-xl border-border/80 bg-card/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-2 pt-6 px-6">
                <CardTitle className="text-xl font-bold tracking-tight">Log In to Your Account</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Access pet records, rabies vaccination tracking, and municipal services
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2 space-y-4">
                {loginError && (
                  <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium text-center">
                    {loginError}
                  </div>
                )}
                <form onSubmit={handleLandingLogin} className="space-y-3">
                  <div className="space-y-1.5 text-left">
                    <Label htmlFor="landing-email" className="text-xs font-semibold">
                      {import.meta.env.DEV && !isSupabaseConfigured ? 'Username or Email' : 'Email Address'}
                    </Label>
                    <Input
                      id="landing-email"
                      type={import.meta.env.DEV && !isSupabaseConfigured ? 'text' : 'email'}
                      placeholder={import.meta.env.DEV && !isSupabaseConfigured ? 'e.g. owner or admin@irosin.gov.ph' : 'you@example.com'}
                      value={landingEmail}
                      onChange={e => setLandingEmail(e.target.value)}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="landing-pass" className="text-xs font-semibold">Password</Label>
                      {import.meta.env.DEV && !isSupabaseConfigured && (
                        <button
                          type="button"
                          onClick={() => setForgotPasswordOpen(true)}
                          className="text-[11px] text-primary hover:underline font-medium"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="landing-pass"
                        type={showPass ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={landingPass}
                        onChange={e => setLandingPass(e.target.value)}
                        required
                        className="h-10 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full font-bold h-11 text-sm shadow-md mt-1">
                    <LogIn className="h-4 w-4 mr-1.5" />
                    Log In
                  </Button>
                </form>

                {/* Sign Up Redirect */}
                <div className="pt-3 text-center">
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-card px-2 text-muted-foreground">New to PetReg Irosin?</span>
                    </div>
                  </div>
                  <Button variant="secondary" asChild className="w-full font-semibold h-11 text-sm shadow-sm">
                    <Link to="/register">
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      Create New Pet Owner Account
                    </Link>
                  </Button>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Looking to report a stray animal or incident?{' '}
                    <Link to="/report-incident" className="text-primary hover:underline font-medium">
                      Report Incident Here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {import.meta.env.DEV && !isSupabaseConfigured && (
              <ForgotPasswordModal
                open={forgotPasswordOpen}
                onOpenChange={setForgotPasswordOpen}
                initialIdentifier={landingEmail}
              />
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-foreground py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-primary">{value}+</p>
                <p className="text-sm text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">System Features</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
            Comprehensive tools for LGU officials, barangay operators, and pet owners in Irosin.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-balance">{title}</h3>
                <p className="text-sm text-muted-foreground text-pretty">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-muted py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <Badge variant="secondary" className="mb-3">About the System</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">
                Bridging the Digital Gap in Animal Health Governance
              </h2>
              <p className="text-muted-foreground mb-4 text-pretty">
                In many barangays of Irosin, Sorsogon, pet registration still relies on fragmented 
                manual logbooks. This system digitizes the entire process — from registration to 
                QR identification — ensuring LGUs can comply with RA 9482.
              </p>
              <p className="text-muted-foreground mb-6 text-pretty">
                Part of the <strong>Zero by 30</strong> framework, this platform helps eliminate 
                dog-mediated human rabies deaths by maintaining real-time vaccination records and 
                enabling rapid response during bite incidents.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: PawPrint, label: 'Dogs & Cats Only', sub: 'Owned & Stray' },
                { icon: QrCode, label: 'QR Collar Tags', sub: 'Instant Scan' },
                { icon: Shield, label: 'RA 9482', sub: 'Compliant' },
                { icon: MapPin, label: 'Irosin LGU', sub: 'All Barangays' },
              ].map(({ icon: Icon, label, sub }) => (
                <Card key={label} className="h-full">
                  <CardContent className="p-4 text-center">
                    <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-pretty">
          LGU officials and barangay operators can log in to access the full system.
          Community members can report incidents without an account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const el = document.getElementById('landing-email');
              if (el) el.focus();
            }}
            className="gap-2 shadow-md cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            Back to Login Form
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/report-incident">Submit Incident Report</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          Capstone Project · BSIT · Veritas College of Irosin, Sorsogon · 2026
        </p>
      </section>
    </div>
  );
}
