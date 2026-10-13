import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Plus, UserCheck, UserX, Trash2, Users } from 'lucide-react';
import { BARANGAYS } from '@/types/types';
import type { User, UserRole } from '@/types/types';
import { Navigate } from 'react-router-dom';

const ROLE_LABELS: Partial<Record<UserRole, string>> & Record<'admin' | 'operator' | 'owner', string> = {
  admin: 'LGU Admin',
  operator: 'Barangay Operator',
  owner: 'Pet Owner',
};

const ROLE_COLORS: Partial<Record<UserRole, string>> & Record<'admin' | 'operator' | 'owner', string> = {
  admin: 'bg-red-100 text-red-800',
  operator: 'bg-blue-100 text-blue-800',
  owner: 'bg-green-100 text-green-800',
};

export function SettingsPage() {
  const { users, createManagedUser, updateUser, deleteUser, currentUser } = useApp();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'owner' as UserRole,
    barangay: '',
    operatorPosition: '',
  });
  const [formError, setFormError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  if (currentUser?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (creatingUser) return;
    setFormError('');

    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setFormError('Email already exists.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match. Please verify.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (form.role === 'operator') {
      if (!form.barangay) {
        setFormError('Please select an assigned barangay for the operator.');
        return;
      }
      if (!form.operatorPosition.trim()) {
        setFormError('Please specify the operator\'s position/role in their barangay.');
        return;
      }
    }

    setCreatingUser(true);
    try {
      await createManagedUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        barangay: form.barangay || undefined,
        operatorPosition: form.role === 'operator' ? form.operatorPosition.trim() : undefined,
        verificationStatus: form.role === 'owner' ? 'verified' : undefined,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      });
      setAddOpen(false);
      setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'owner', barangay: '', operatorPosition: '' });
    } catch (error) {
      console.error('Failed to create managed user:', error);
      setFormError(error instanceof Error ? error.message : 'Could not create the account. Please try again.');
    } finally {
      setCreatingUser(false);
    }
  }

  function toggleStatus(user: User) {
    updateUser({ ...user, status: user.status === 'active' ? 'inactive' : 'active' });
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users registered in the system`}
        action={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4" />Add User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1">
                  <Label>Full Name *</Label>
                  <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Email *</Label>
                  <Input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Password *</Label>
                    <Input type="password" required value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Confirm Password *</Label>
                    <Input type="password" required value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v as UserRole }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">LGU Admin</SelectItem>
                      <SelectItem value="operator">Barangay Operator</SelectItem>
                      <SelectItem value="owner">Pet Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.role === 'operator' && (
                  <>
                    <div className="space-y-1">
                      <Label>Assigned Barangay *</Label>
                      <Select value={form.barangay} onValueChange={v => setForm(p => ({ ...p, barangay: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                        <SelectContent className="max-h-56">
                          {BARANGAYS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Operator Position / Role in Barangay *</Label>
                      <Input
                        required
                        placeholder="e.g. Barangay Health Worker (BHW), Animal Control Officer"
                        value={form.operatorPosition}
                        onChange={e => setForm(p => ({ ...p, operatorPosition: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                {formError && <p className="text-xs text-destructive">{formError}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={creatingUser}>
                    {creatingUser ? 'Creating account...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="sm:w-48"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">LGU Admin</SelectItem>
              <SelectItem value="operator">Barangay Operator</SelectItem>
              <SelectItem value="owner">Pet Owner</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* User stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['admin', 'operator', 'owner'] as UserRole[]).map(role => (
          <Card key={role}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{users.filter(u => u.role === role).length}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Barangay</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(user => (
                  <tr key={user.id} className={`hover:bg-muted/30 ${user.status === 'inactive' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      <div>
                        {user.name}
                        {user.operatorPosition && (
                          <p className="text-[11px] text-muted-foreground font-normal">{user.operatorPosition}</p>
                        )}
                        {user.role === 'owner' && (
                          <p className="text-[11px] font-normal">
                            {user.verificationStatus === 'verified' ? (
                              <span className="text-green-600 font-medium">✓ Verified Resident</span>
                            ) : (
                              <span className="text-amber-600 font-medium">⏳ Pending Approval</span>
                            )}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={ROLE_COLORS[user.role] + ' text-xs'}>{ROLE_LABELS[user.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {user.barangay ? `${user.barangay}${user.purok ? ` (${user.purok})` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleStatus(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.status === 'active' ? <UserX className="h-3.5 w-3.5 text-destructive" /> : <UserCheck className="h-3.5 w-3.5 text-green-600" />}
                        </Button>
                        {user.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete">
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove {user.name} from the system? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
