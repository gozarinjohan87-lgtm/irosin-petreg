import { useState } from 'react';
import { KeyRound, Mail, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIdentifier?: string;
  onSuccess?: () => void;
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
  initialIdentifier = '',
  onSuccess,
}: ForgotPasswordModalProps) {
  const { sendPasswordResetCode, verifyResetCode, resetPassword } = useApp();

  const [step, setStep] = useState<'request' | 'verify' | 'new_password' | 'complete'>('request');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetFlow = () => {
    setStep('request');
    setError('');
    setCode('');
    setGeneratedCode(null);
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetFlow();
    onOpenChange(newOpen);
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your registered email address or phone number.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const res = sendPasswordResetCode(identifier.trim());
      setLoading(false);
      if (res.success) {
        setGeneratedCode(res.code ?? '123456');
        setStep('verify');
      } else {
        setError(res.message);
      }
    }, 400);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const valid = verifyResetCode(identifier, code.trim());
      if (valid) {
        setStep('new_password');
      } else {
        setError('Invalid verification code. Please check and try again.');
      }
    }, 300);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 3) {
      setError('New password must be at least 3 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const success = resetPassword(identifier, newPassword);
      if (success) {
        setStep('complete');
        if (onSuccess) onSuccess();
      } else {
        setError('Failed to update password. User not found.');
      }
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg md:text-xl font-bold">
            {step === 'complete' ? 'Password Reset Successful' : 'Reset Your Password'}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {step === 'request' && 'Enter your registered email or phone to receive a 6-digit verification code.'}
            {step === 'verify' && 'Enter the 6-digit verification code dispatched for your account.'}
            {step === 'new_password' && 'Choose a strong new password for your account.'}
            {step === 'complete' && 'You can now log in with your updated credentials.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-xs rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Step 1: Request Code */}
        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Registered Email or Phone *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="e.g. owner@gmail.com or 09171234567"
                  className="pl-9 text-sm"
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tip: You can use any demo account email (e.g. <code>owner@gmail.com</code> or <code>admin</code>).
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Verification Code
            </Button>
          </form>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-4 pt-2">
            {generatedCode && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-xs text-primary space-y-1">
                <p className="font-semibold">Simulated Verification Dispatch:</p>
                <p>
                  Code: <strong className="font-mono text-sm tracking-wider">{generatedCode}</strong> (or test with <code>123456</code>)
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">6-Digit Verification Code *</Label>
              <Input
                required
                maxLength={6}
                placeholder="123456"
                className="text-center font-mono text-lg tracking-widest"
                value={code}
                onChange={e => { setCode(e.target.value); setError(''); }}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('request')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify Code
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 'new_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">New Password *</Label>
              <Input
                type="password"
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Confirm New Password *</Label>
              <Input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </form>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Your password has been successfully updated.
            </p>
            <p className="text-xs text-muted-foreground">
              You can now log in using your updated credentials.
            </p>
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Back to Log In
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
