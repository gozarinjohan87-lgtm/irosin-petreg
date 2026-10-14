import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { PawPrint, Eye, EyeOff, LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export function LoginPage() {
  const { login, registerUser, currentUser, dispatchOfflineNotification, users } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const isRegisterRoute =
    location.pathname.toLowerCase().includes('register') ||
    location.pathname.toLowerCase().includes('signup') ||
    tabParam === 'register';

  const [activeTab, setActiveTab] = useState(isRegisterRoute ? 'register' : 'login');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', username: '', email: '', password: '', confirm: '', role: 'owner' });

  const cleanUsername = regForm.username.trim().toLowerCase();
  const isUsernameTaken = Boolean(
    cleanUsername &&
    users.some(u => u.username?.toLowerCase() === cleanUsername)
  );
  const isUsernameValid = cleanUsername.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(cleanUsername);
  const isUsernameAvailable = Boolean(isUsernameValid && !isUsernameTaken);

  useEffect(() => {
    if (isRegisterRoute) {
      setActiveTab('register');
    }
  }, [isRegisterRoute, location.pathname, tabParam]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'owner' && !currentUser.purok) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  if (currentUser) {
    return null;
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const user = login(loginForm.email, loginForm.password);
    if (user) {
      if (user.role === 'owner' && !user.purok) {
        navigate('/complete-profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError('Invalid email or password. Please try again.');
    }
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!regForm.name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!isUsernameValid) {
      setError('Username must be at least 3 characters and contain only letters, numbers, hyphens, or underscores.');
      return;
    }
    if (isUsernameTaken) {
      setError(`The username "@${regForm.username.trim()}" is already taken by another resident. Please choose a unique username.`);
      return;
    }
    if (regForm.password !== regForm.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (regForm.password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }
    const newUser = {
      id: 'USR' + generateId(),
      name: regForm.name.trim(),
      username: regForm.username.trim(),
      email: regForm.email.trim(),
      password: regForm.password,
      role: 'owner' as const,
      status: 'active' as const,
      verificationStatus: 'pending' as const,
      createdAt: new Date().toISOString().split('T')[0],
    };
    registerUser(newUser);
    navigate('/complete-profile', { replace: true });
  }

  const demoAccounts = [
    { role: 'Municipal Admin', email: 'admin', pass: '123', color: 'bg-red-100 text-red-800' },
    { role: 'Pet Owner', email: 'owner', pass: '123', color: 'bg-green-100 text-green-800' },
    { role: 'Brgy Operator', email: 'op_bacolod', pass: '123', color: 'bg-blue-100 text-blue-800' },
    { role: 'Bite Center', email: 'bite_center', pass: '123', color: 'bg-orange-100 text-orange-800' },
    { role: 'Vet Clinic', email: 'vet_clinic', pass: '123', color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-10">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-md">
          <PawPrint className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">PetReg Irosin</h1>
        <p className="text-sm text-muted-foreground mt-1">Pet Registry &amp; Monitoring System</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-lg">Welcome</CardTitle>
          <CardDescription className="text-center text-xs text-muted-foreground">
            Log in to access the registry or create a new pet owner account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="login" className="flex-1">
                <LogIn className="h-4 w-4 mr-1" /> Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                <UserPlus className="h-4 w-4 mr-1" /> Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email">Username or Email</Label>
                  <Input
                    id="email" type="text" placeholder="e.g. admin or admin@example.com" required
                    value={loginForm.email}
                    onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordOpen(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                      value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      className="pr-10"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(o => !o)}>
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
                <Button type="submit" className="w-full" size="lg">Log In</Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="rname">Full Name</Label>
                  <Input
                    id="rname" placeholder="Juan dela Cruz" required
                    value={regForm.name}
                    onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="rusername">Unique Handle / Username *</Label>
                    {cleanUsername.length > 0 && (
                      isUsernameTaken ? (
                        <span className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Taken
                        </span>
                      ) : isUsernameAvailable ? (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Available
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Min. 3 characters</span>
                      )
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">@</span>
                    <Input
                      id="rusername"
                      placeholder="e.g. johan_keeper"
                      required
                      value={regForm.username}
                      onChange={e => setRegForm(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') }))}
                      className="pl-7 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This username is displayed on your pet cards and ensures your profile is unique across Irosin.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="remail">Email Address</Label>
                  <Input
                    id="remail" type="email" placeholder="you@example.com" required
                    value={regForm.email}
                    onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rpass">Password</Label>
                  <Input
                    id="rpass" type="password" placeholder="Min. 6 characters" required
                    value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rconfirm">Confirm Password</Label>
                  <Input
                    id="rconfirm" type="password" placeholder="Re-enter password" required
                    value={regForm.confirm}
                    onChange={e => setRegForm(p => ({ ...p, confirm: e.target.value }))}
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
                {success && <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">{success}</p>}
                <p className="text-xs text-muted-foreground">New accounts are registered as Pet Owner. Contact your Barangay Operator for elevated access.</p>
                <Button type="submit" className="w-full" size="lg">Create Account</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Need to report an incident?{' '}
        <Link to="/report-incident" className="text-primary hover:underline">Click here — no login required</Link>
      </p>

      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        initialIdentifier={loginForm.email}
      />
    </div>
  );
}
