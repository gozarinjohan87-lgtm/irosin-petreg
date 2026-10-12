import { useState } from 'react';
import { UserCheck, UserX, FileText, CheckCircle, Clock, ShieldCheck, MapPin, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import type { User } from '@/types/types';

interface Props {
  barangayFilter?: string; // If supplied (e.g. for operator), only show for that barangay
}

export function PendingOwnersTable({ barangayFilter }: Props) {
  const {
    users,
    updateUser,
    addNotification,
    currentUser,
    purokRequests,
    approvePurokRequest,
    rejectPurokRequest,
    dispatchOfflineNotification,
  } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'purok' | 'all'>('pending');

  const isAdmin = currentUser?.role === 'admin';

  // Filter owners
  const allOwners = users.filter(u => {
    if (u.role !== 'owner') return false;
    if (barangayFilter && u.barangay?.toLowerCase() !== barangayFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const pendingOwners = allOwners.filter(u => u.verificationStatus === 'pending');
  const verifiedOwners = allOwners.filter(u => u.verificationStatus === 'verified');

  // Filter purok requests for this barangay
  const brgyPurokRequests = purokRequests.filter(r =>
    !barangayFilter || r.barangay.toLowerCase() === barangayFilter.toLowerCase()
  );
  const pendingPurokRequests = brgyPurokRequests.filter(r => r.status === 'pending');

  const displayList = activeTab === 'pending'
    ? pendingOwners
    : activeTab === 'verified'
    ? verifiedOwners
    : allOwners;

  function handleApprove(owner: User, isDirectVerify = false) {
    const updated: User = {
      ...owner,
      verificationStatus: 'verified',
    };
    updateUser(updated);

    // Send notification to owner
    addNotification({
      id: 'NOT' + generateId(),
      type: 'owner-verified',
      title: 'Residency Verification Approved',
      message: `Your pet owner registration for Brgy. ${owner.barangay} has been verified and approved by ${currentUser?.name ?? 'the barangay operator'}.${isDirectVerify ? ' (Direct Operator Verification)' : ''}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      userId: owner.id,
    });

    // Multi-channel offline notification
    dispatchOfflineNotification({
      userId: owner.id,
      recipientName: owner.name,
      recipientPhone: owner.contactNumber || '09170000000',
      recipientEmail: owner.email,
      subject: 'Residency Verification Approved',
      message: `IROSIN LGU NOTICE: Your pet owner account for Brgy. ${owner.barangay} has been verified and approved by your Barangay Operator.`,
      channel: 'SMS_AND_EMAIL',
    });

    if (proofModalOpen) setProofModalOpen(false);
  }

  function handleReject(owner: User) {
    const reason = window.prompt('Please enter reason for rejection (optional):', 'Incomplete or invalid residency proof document.');
    if (reason === null) return;

    const updated: User = {
      ...owner,
      verificationStatus: 'rejected',
    };
    updateUser(updated);

    addNotification({
      id: 'NOT' + generateId(),
      type: 'incident-update',
      title: 'Registration Verification Status',
      message: `Your residency registration for Brgy. ${owner.barangay} was not approved: ${reason}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      userId: owner.id,
    });

    if (proofModalOpen) setProofModalOpen(false);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Owner Account Registrations
              {pendingOwners.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {pendingOwners.length} Pending Approval
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {barangayFilter
                ? `Managing resident pet owners in Brgy. ${barangayFilter}`
                : 'All 28 barangays in Irosin — Distinguish pending vs verified pet owners'}
            </CardDescription>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-muted p-1 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending ({pendingOwners.length})
            </button>
            <button
              onClick={() => setActiveTab('purok')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'purok'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Purok Change</span>
              {pendingPurokRequests.length > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                  {pendingPurokRequests.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('verified')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'verified'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Verified ({verifiedOwners.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({allOwners.length})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {activeTab === 'purok' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Resident Details</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Barangay</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Current Purok</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Requested Purok</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Date Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {brgyPurokRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No Purok change requests for this barangay.
                    </td>
                  </tr>
                ) : (
                  brgyPurokRequests.map(req => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';

                    return (
                      <tr key={req.id} className={`hover:bg-muted/30 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-foreground">{req.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {req.userUsername ? `@${req.userUsername}` : ''} {req.contactNumber ? `• ${req.contactNumber}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            <span>Brgy. {req.barangay}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {req.previousPurok || 'Unassigned'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-primary">
                          {req.requestedPurok}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {req.requestedAt}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isPending && (
                            <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 text-xs">
                              Pending Review
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 text-xs">
                              Approved
                            </Badge>
                          )}
                          {req.status === 'rejected' && (
                            <Badge variant="destructive" className="text-xs">
                              Rejected
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
                                onClick={() => approvePurokRequest(req.id)}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const reason = window.prompt('Reason for rejecting purok change (optional):');
                                  if (reason !== null) rejectPurokRequest(req.id, reason);
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Owner Details</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Barangay &amp; Purok</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Residency Proof</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    {activeTab === 'pending'
                      ? 'No pending owner registrations awaiting approval.'
                      : 'No owner records found.'}
                  </td>
                </tr>
              ) : (
                displayList.map(owner => {
                  const isPending = owner.verificationStatus === 'pending';
                  const isVerified = owner.verificationStatus === 'verified';

                  return (
                    <tr
                      key={owner.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isPending ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {owner.avatarUrl ? (
                            <img
                              src={owner.avatarUrl}
                              alt={owner.name}
                              className="h-8 w-8 rounded-full object-cover border shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center shrink-0">
                              {owner.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">{owner.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {owner.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-xs">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>Brgy. {owner.barangay ?? 'Not specified'}</span>
                        </div>
                        {owner.purok && (
                          <div className="text-xs text-muted-foreground pl-4.5">
                            {owner.purok}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {owner.contactNumber || 'No contact provided'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Joined: {owner.createdAt}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {isVerified ? (
                          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1">
                            <CheckCircle className="h-3 w-3" /> Verified Owner
                          </Badge>
                        ) : isPending ? (
                          <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 text-xs gap-1">
                            <Clock className="h-3 w-3 animate-pulse" /> Pending Approval
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <UserX className="h-3 w-3" /> Rejected
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {owner.proofDocument ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setSelectedUser(owner);
                              setProofModalOpen(true);
                            }}
                          >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            View Proof
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No proof uploaded
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
                              onClick={() => handleApprove(owner)}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                            {!isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                                title="Approve directly if resident is personally known to you in this barangay"
                                onClick={() => handleApprove(owner, true)}
                              >
                                Direct Verify
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(owner)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : isVerified ? (
                          <span className="text-xs text-emerald-700 font-medium flex items-center justify-end gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> Approved
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleApprove(owner)}
                          >
                            Re-approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </CardContent>

      {/* Proof Document Preview Modal */}
      {selectedUser && (
        <Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Residency Proof Document Review
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-3 pb-2 border-b">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-primary shadow-sm"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm text-foreground">{selectedUser.name}</p>
                    <p className="text-muted-foreground text-xs">{selectedUser.email}</p>
                    {selectedUser.avatarUrl && (
                      <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        Photo ID attached
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barangay:</span>
                  <span className="font-semibold text-foreground">Brgy. {selectedUser.barangay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purok:</span>
                  <span className="font-medium text-foreground">{selectedUser.purok || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-medium text-foreground">{selectedUser.contactNumber || '—'}</span>
                </div>
              </div>

              {(selectedUser.idDocumentUrl || selectedUser.proofDocument) ? (
                <div className="border rounded-lg p-3 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Attached ID / Residency Document</span>
                    <Badge variant="secondary" className="text-[10px]">Official Proof</Badge>
                  </div>

                  {(selectedUser.idDocumentUrl || selectedUser.proofDocument)?.startsWith('data:image') || (selectedUser.idDocumentUrl || selectedUser.proofDocument)?.startsWith('http') ? (
                    <div className="border rounded-md overflow-hidden bg-muted flex items-center justify-center max-h-64">
                      <img
                        src={selectedUser.idDocumentUrl || selectedUser.proofDocument}
                        alt="Proof of residency"
                        className="max-h-60 w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/60 rounded-md text-center space-y-2">
                      <FileText className="h-10 w-10 text-primary mx-auto" />
                      <p className="text-xs font-medium">{selectedUser.proofDocument || selectedUser.idDocumentUrl}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Document verified and signed by Barangay Captain / Secretary
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-center text-xs text-amber-800">
                  No residency proof document was attached. If you personally know this resident in Brgy. {selectedUser.barangay}, you can use Direct Verification.
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProofModalOpen(false)}
              >
                Close
              </Button>
              {selectedUser.verificationStatus === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(selectedUser)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleApprove(selectedUser)}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Approve Resident Owner
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}