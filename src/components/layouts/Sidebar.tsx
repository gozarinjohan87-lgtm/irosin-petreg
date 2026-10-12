import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PawPrint, Syringe, AlertTriangle,
  BarChart2, Bell, Settings, LogOut, QrCode, X,
  HeartHandshake, Stethoscope, ShieldAlert, MapPin, Shield,
  User as UserIcon, Pencil, Check, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ROLE_LABELS, type User as UserType } from '@/types/types';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  badge?: number;
}

interface Props {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: Props) {
  const { currentUser, updateUser, logout, unreadCount, addPurokRequest, dispatchOfflineNotification, users } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    contact: currentUser?.contactNumber || currentUser?.contact || '',
    address: currentUser?.address || '',
    purok: currentUser?.purok || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  const handleOpenEditProfile = () => {
    if (!currentUser || currentUser.role === 'admin') return;
    setProfileForm({
      username: currentUser.username || '',
      email: currentUser.email || '',
      contact: currentUser.contactNumber || currentUser.contact || '',
      address: currentUser.address || '',
      purok: currentUser.purok || '',
      newPassword: '',
      confirmPassword: '',
    });
    setEditProfileOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanUname = (profileForm.username || '').trim().toLowerCase();
    const isTaken = Boolean(
      cleanUname &&
      cleanUname !== currentUser.username?.toLowerCase() &&
      users.some(u => u.id !== currentUser.id && u.username?.toLowerCase() === cleanUname)
    );

    if (isTaken) {
      toast.error(`The username "@${profileForm.username.trim()}" is already taken by another resident. Please choose a unique username.`);
      return;
    }

    if (profileForm.newPassword) {
      if (profileForm.newPassword.length < 3) {
        toast.error('New password must be at least 3 characters.');
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        toast.error('New password and confirmation do not match.');
        return;
      }
    }

    const purokChanged =
      profileForm.purok.trim() !== (currentUser.purok || '').trim() &&
      Boolean(profileForm.purok.trim());

    if (purokChanged && currentUser.role === 'owner') {
      addPurokRequest({
        userId: currentUser.id,
        userName: currentUser.name,
        userUsername: profileForm.username.trim() || currentUser.username,
        barangay: currentUser.barangay || 'Salvacion',
        previousPurok: currentUser.purok || 'Unassigned',
        requestedPurok: profileForm.purok.trim(),
        contactNumber: profileForm.contact.trim() || currentUser.contactNumber,
      });
    }

    const updatedUser: UserType = {
      ...currentUser,
      username: profileForm.username.trim() || undefined,
      email: profileForm.email.trim() || currentUser.email,
      contact: profileForm.contact.trim() || undefined,
      contactNumber: profileForm.contact.trim() || undefined,
      address: profileForm.address.trim() || undefined,
      purok: purokChanged && currentUser.role === 'owner' ? currentUser.purok : (profileForm.purok.trim() || currentUser.purok),
      password: profileForm.newPassword ? profileForm.newPassword : currentUser.password,
    };
    updateUser(updatedUser);

    if (profileForm.newPassword) {
      dispatchOfflineNotification({
        userId: currentUser.id,
        recipientName: currentUser.name,
        recipientPhone: profileForm.contact.trim() || currentUser.contactNumber || '09170000000',
        recipientEmail: profileForm.email.trim() || currentUser.email,
        subject: 'Account Security: Password Updated',
        message: 'IROSIN LGU NOTICE: Your account password was updated successfully. If you did not perform this update, please inform the municipal administrator.',
        channel: 'SMS_AND_EMAIL',
      });
    }

    if (purokChanged && currentUser.role === 'owner') {
      toast.success('Profile saved! Purok change request submitted to your Barangay Operator for review.');
    } else {
      toast.success('Profile details updated successfully!');
    }
    setEditProfileOpen(false);
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard',      href: '/dashboard',    icon: LayoutDashboard, roles: ['admin','operator','owner','bite_center','vet_clinic'] },
    { label: 'Pet Registry',   href: '/pets',         icon: PawPrint,        roles: ['admin','operator','owner','vet_clinic'] },
    { label: 'Vaccinations',   href: '/vaccinations', icon: Syringe,         roles: ['admin','operator','vet_clinic'] },
    { label: 'Incidents',      href: '/incidents',    icon: AlertTriangle,   roles: ['admin','operator'] },
    { label: 'Bite Cases',     href: '/bite-cases',   icon: ShieldAlert,     roles: ['admin','bite_center'] },
    { label: 'Vet Clinic',     href: '/vet-clinic',   icon: Stethoscope,     roles: ['vet_clinic'] },
    { label: 'Adoption Board', href: '/adoption',     icon: HeartHandshake,  roles: ['admin','operator','owner','bite_center','vet_clinic'] },
    { label: 'Stray Reports',  href: '/stray-reports',icon: MapPin,          roles: ['admin','operator'] },
    { label: 'Analytics',      href: '/analytics',    icon: BarChart2,       roles: ['admin','operator'] },
    { label: 'Notifications',  href: '/notifications',icon: Bell,            roles: ['admin','operator','owner','bite_center','vet_clinic'], badge: unreadCount },
    { label: 'QR Scanner',     href: '/qr-lookup',    icon: QrCode,          roles: ['admin','operator','owner','bite_center','vet_clinic'] },
    { label: 'User Management',href: '/settings',     icon: Settings,        roles: ['admin'] },
  ];

  const visible = navItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div className={cn('flex flex-col h-full max-h-screen w-64 bg-sidebar border-r border-sidebar-border overflow-hidden select-none', !open && 'hidden lg:flex')}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <PawPrint className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-sidebar-foreground">PetReg Irosin</p>
            <p className="text-xs text-muted-foreground truncate">RA 9482 System</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden shrink-0 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* User info */}
      {currentUser && (
        <div
          onClick={handleOpenEditProfile}
          className={cn(
            'px-4 py-3 border-b border-sidebar-border shrink-0 transition-colors group',
            currentUser.role !== 'admin' && 'cursor-pointer hover:bg-sidebar-accent/60'
          )}
          title={currentUser.role !== 'admin' ? 'Click to edit your email, password, purok and profile' : undefined}
        >
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate text-sidebar-foreground">
                  {currentUser.username ? (
                    <span>@{currentUser.username}</span>
                  ) : (
                    currentUser.name
                  )}
                </p>
                {currentUser.role !== 'admin' && (
                  <Pencil className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
              </div>
              {currentUser.username && (
                <p className="text-[11px] text-muted-foreground truncate">
                  ({currentUser.name})
                </p>
              )}
              <p className="text-xs text-muted-foreground truncate">{ROLE_LABELS[currentUser.role] ?? currentUser.role}</p>
              {currentUser.facilityName && (
                <p className="text-xs text-muted-foreground truncate">{currentUser.facilityName}</p>
              )}
              {!currentUser.facilityName && currentUser.barangay && (
                <p className="text-xs text-muted-foreground truncate">
                  Brgy. {currentUser.barangay}{currentUser.purok ? ` • ${currentUser.purok}` : ''}
                </p>
              )}
            </div>
            {currentUser.role !== 'admin' && (
              <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary py-0 px-1 font-normal">
                Edit
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Nav items - strictly scrollable in middle */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto min-h-0">
        {visible.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant={active ? 'secondary' : 'default'} className="h-5 min-w-5 text-xs px-1.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pinned Logout footer - fixed state without scrolling */}
      <div className="shrink-0 border-t border-sidebar-border bg-sidebar p-2 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Log Out</span>
        </Button>
      </div>

      {/* Edit Profile & Password Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <UserIcon className="h-5 w-5 text-primary" />
              Edit Profile &amp; Account Settings
            </DialogTitle>
            <DialogDescription className="text-xs">
              Manage your personal details, email, password, and residency Purok.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                {(() => {
                  const cleanUname = (profileForm.username || '').trim().toLowerCase();
                  const isTaken = Boolean(
                    cleanUname &&
                    cleanUname !== currentUser?.username?.toLowerCase() &&
                    users.some(u => u.id !== currentUser?.id && u.username?.toLowerCase() === cleanUname)
                  );
                  const isAvailable = Boolean(cleanUname.length >= 3 && !isTaken);

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="profile-username" className="text-xs font-semibold">
                          Custom Username (Privacy)
                        </Label>
                        {cleanUname.length > 0 && (
                          isTaken ? (
                            <span className="text-[10px] font-bold text-destructive">Taken</span>
                          ) : isAvailable ? (
                            <span className="text-[10px] font-bold text-emerald-600">Available</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Min. 3 chars</span>
                          )
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">@</span>
                        <Input
                          id="profile-username"
                          value={profileForm.username}
                          onChange={e => setProfileForm(p => ({ ...p, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') }))}
                          placeholder="e.g. johan_keeper"
                          className="pl-7 text-xs h-9"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <Label htmlFor="profile-email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="owner@example.com"
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="profile-contact" className="text-xs font-semibold">
                  Contact Mobile Number
                </Label>
                <Input
                  id="profile-contact"
                  value={profileForm.contact}
                  onChange={e => setProfileForm(p => ({ ...p, contact: e.target.value }))}
                  placeholder="09XXXXXXXXX"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="profile-purok" className="text-xs font-semibold flex items-center justify-between">
                  <span>Purok</span>
                  {currentUser?.barangay && (
                    <span className="text-[10px] text-muted-foreground">Brgy. {currentUser.barangay}</span>
                  )}
                </Label>
                <Select
                  value={profileForm.purok}
                  onValueChange={val => setProfileForm(p => ({ ...p, purok: val }))}
                >
                  <SelectTrigger id="profile-purok" className="text-xs h-9">
                    <SelectValue placeholder="Select Purok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Purok 1">Purok 1</SelectItem>
                    <SelectItem value="Purok 2">Purok 2</SelectItem>
                    <SelectItem value="Purok 3">Purok 3</SelectItem>
                    <SelectItem value="Purok 4">Purok 4</SelectItem>
                    <SelectItem value="Purok 5">Purok 5</SelectItem>
                    <SelectItem value="Purok 6">Purok 6</SelectItem>
                    <SelectItem value="Purok 7">Purok 7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {profileForm.purok !== (currentUser?.purok || '') && Boolean(profileForm.purok) && (
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                <span className="font-bold">Notice:</span>
                <span>
                  Changing your Purok residency from <strong>{currentUser?.purok || 'Unassigned'}</strong> to <strong>{profileForm.purok}</strong> requires verification &amp; approval from the Operator of Brgy. {currentUser?.barangay || 'your barangay'}.
                </span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="profile-address" className="text-xs font-semibold">
                Residential Street Address
              </Label>
              <Input
                id="profile-address"
                value={profileForm.address}
                onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                placeholder="e.g. Near Chapel, Main Road"
                className="text-xs h-9"
              />
            </div>

            {/* Password Section */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Change Password <span className="text-muted-foreground font-normal">(Leave blank to keep current)</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={profileForm.newPassword}
                    onChange={e => setProfileForm(p => ({ ...p, newPassword: e.target.value }))}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={profileForm.confirmPassword}
                    onChange={e => setProfileForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5 font-semibold">
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
