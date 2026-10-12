import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import { BARANGAYS } from '@/types/types';

interface AccessPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

export function AccessPortalModal({ open, onOpenChange, defaultTab = 'login' }: AccessPortalModalProps) {
  const { login, addUser, users } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Register form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'owner' as 'owner' | 'operator',
    barangay: BARANGAYS[0],
    operatorPosition: 'Barangay Health Worker (BHW)',
  });

  const demoAccounts = [
    { label: 'Admin', email: 'admin', pass: '123' },
    { label: 'Owner', email: 'owner', pass: '123' },
    { label: 'Op Bacolod', email: 'op_bacolod', pass: '123' },
    { label: 'Bite Center', email: 'bite_center', pass: '123' },
    { label: 'Vet Clinic', email: 'vet_clinic', pass: '123' },
  ];

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const user = login(loginForm.email, loginForm.password);
    if (user) {
      onOpenChange(false);
      if (user.role === 'owner' && !user.purok) {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError('Invalid username/email or password. Please try again.');
    }
  }

  function handleDemoSelect(email: string, pass: string) {
    setLoginForm({ email, password: pass });
    setError('');
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (regForm.password !== regForm.confirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (regForm.password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    // Check if email already exists
    const exists = users.some(u => u.email.toLowerCase() === regForm.email.toLowerCase());
    if (exists) {
      setError('An account with this email already exists.');
      return;
    }

    const newId = 'USR' + generateId();
    const newUser = {
      id: newId,
      name: regForm.name,
      email: regForm.email,
      password: regForm.password,
      role: regForm.role,
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0],
      barangay: regForm.role === 'operator' ? regForm.barangay : undefined,
      operatorPosition: regForm.role === 'operator' ? regForm.operatorPosition : undefined,
      verificationStatus: regForm.role === 'owner' ? ('pending' as const) : ('verified' as const),
    };

    addUser(newUser);
    login(regForm.email, regForm.password);
    onOpenChange(false);

    if (regForm.role === 'owner') {
      navigate('/complete-profile');
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md max-h-[90dvh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-2">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">PetReg Irosin Portal</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Log in to your account or register to access pet management services.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as 'login' | 'register'); setError(''); setSuccess(''); }}>
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="login" className="gap-1.5">
              <LogIn className="h-4 w-4" /> Log In
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-1.5">
              <UserPlus className="h-4 w-4" /> Create Account
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium">
              {success}
            </div>
          )}

          {/* Login View */}
          <TabsContent value="login" className="space-y-4 m-0">
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="modal-email">Username or Email</Label>
                <Input
                  id="modal-email"
                  placeholder="e.g. admin or owner@gmail.com"
                  required
                  value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-password">Password</Label>
                <div className="relative">
                  <Input
                    id="modal-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full font-semibold">
                Log In to Dashboard
              </Button>
            </form>

            <div className="pt-2 border-t">
              <p className="text-[11px] font-medium text-muted-foreground mb-2 text-center">
                Quick Demo Access (Click to auto-fill):
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {demoAccounts.map(demo => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => handleDemoSelect(demo.email, demo.pass)}
                    className="text-[11px] px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-md font-medium text-foreground transition-colors border"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Register View */}
          <TabsContent value="register" className="space-y-4 m-0">
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  placeholder="Juan Dela Cruz"
                  required
                  value={regForm.name}
                  onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email">Email Address</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="juan@example.com"
                  required
                  value={regForm.email}
                  onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-role">Account Type</Label>
                <Select
                  value={regForm.role}
                  onValueChange={v => setRegForm(p => ({ ...p, role: v as 'owner' | 'operator' }))}
                >
                  <SelectTrigger id="reg-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Pet Owner (Resident)</SelectItem>
                    <SelectItem value="operator">Barangay Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {regForm.role === 'operator' && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="reg-brgy">Assigned Barangay</Label>
                    <Select
                      value={regForm.barangay}
                      onValueChange={v => setRegForm(p => ({ ...p, barangay: v }))}
                    >
                      <SelectTrigger id="reg-brgy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {BARANGAYS.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="reg-position">Position in Barangay</Label>
                    <Input
                      id="reg-position"
                      placeholder="e.g. Barangay Health Worker (BHW)"
                      required
                      value={regForm.operatorPosition}
                      onChange={e => setRegForm(p => ({ ...p, operatorPosition: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label htmlFor="reg-pass">Password</Label>
                <Input
                  id="reg-pass"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  value={regForm.password}
                  onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-confirm">Confirm Password</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="Re-enter password"
                  required
                  value={regForm.confirm}
                  onChange={e => setRegForm(p => ({ ...p, confirm: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full font-semibold mt-2">
                {regForm.role === 'owner' ? 'Continue to Owner Profile' : 'Complete Registration'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
