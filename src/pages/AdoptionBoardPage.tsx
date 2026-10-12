import { useState } from 'react';
import {
  HeartHandshake, Plus, PawPrint, Phone, MapPin, Tag, X,
  Pencil, CheckCircle, UserCheck, MessageSquare, AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatCard } from '@/components/shared/StatCard';
import { PetAvatar } from '@/components/shared/PetAvatar';
import type { AdoptionListing, AdoptionRequest, Pet } from '@/types/types';
import { generateId, formatDateShort } from '@/lib/utils';
import { toast } from 'sonner';

function ListingCard({
  listing,
  currentRole,
  currentUserId,
  currentUserName,
  onRequest,
  onMarkAdopted,
  onUnlist,
  onEdit,
  onConfirmAdoption,
}: {
  listing: AdoptionListing;
  currentRole: string;
  currentUserId: string;
  currentUserName: string;
  onRequest: (listing: AdoptionListing) => void;
  onMarkAdopted: (id: string) => void;
  onUnlist: (id: string) => void;
  onEdit: (listing: AdoptionListing) => void;
  onConfirmAdoption: (listing: AdoptionListing, req: AdoptionRequest) => void;
}) {
  const isAdmin = currentRole === 'admin' || currentRole === 'operator';
  const isOwnerPet = Boolean(
    (currentUserId && listing.ownerId && listing.ownerId === currentUserId) ||
    (currentUserName && listing.ownerName && listing.ownerName.trim().toLowerCase() === currentUserName.trim().toLowerCase())
  );

  const pendingRequests = (listing.requests ?? []).filter(r => r.status === 'pending');
  const allRequests = listing.requests ?? [];

  return (
    <Card className={`overflow-hidden transition-all ${isOwnerPet ? 'border-primary/40 ring-1 ring-primary/20 bg-primary/[0.01]' : ''}`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Pet avatar */}
          <div className="sm:w-36 sm:h-auto h-44 bg-muted/50 flex items-center justify-center shrink-0 rounded-t-lg sm:rounded-l-lg sm:rounded-t-none overflow-hidden relative">
            {listing.petPhoto ? (
              <img src={listing.petPhoto} alt={listing.petName} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="h-12 w-12 text-muted-foreground/40" />
            )}
            {isOwnerPet && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow">
                YOUR PET
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-base">{listing.petName}</p>
                  <Badge variant="outline" className="capitalize text-xs">{listing.petClass}</Badge>
                  {listing.adoptionType === 'free' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-xs">
                      Free Adoption
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-xs">
                      ₱{listing.adoptionPrice?.toLocaleString()}
                    </Badge>
                  )}
                  {isOwnerPet && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                      Your Listing
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{listing.petBreed}</p>
              </div>

              {listing.status === 'active' && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 shrink-0 text-xs">
                  Active Listing
                </Badge>
              )}
              {listing.status === 'adopted' && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 shrink-0 text-xs">
                  Adopted
                </Badge>
              )}
              {listing.status === 'unlisted' && (
                <Badge variant="outline" className="text-muted-foreground shrink-0 text-xs">
                  Cancelled / Unlisted
                </Badge>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>Brgy. {listing.petBarangay}</span>
              </div>
              {listing.ownerName && (
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Owner: <strong className="text-foreground">{listing.ownerName}</strong></span>
                </div>
              )}
              {listing.ownerPhone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <a href={`tel:${listing.ownerPhone}`} className="hover:underline">{listing.ownerPhone}</a>
                </div>
              )}
            </div>

            {listing.ownerNotes && (
              <p className="text-xs text-muted-foreground mt-2.5 bg-muted/40 p-2.5 rounded-md leading-relaxed border border-border/50">
                "{listing.ownerNotes}"
              </p>
            )}

            <p className="text-[11px] text-muted-foreground mt-2">Posted on {formatDateShort(listing.postedAt)}</p>

            {/* Actions for active listings */}
            {listing.status === 'active' && (
              <div className="mt-4 flex gap-2 flex-wrap items-center">
                {/* When logged in as the owner of this pet */}
                {isOwnerPet ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 border-primary/40 hover:bg-primary/5 text-primary"
                      onClick={() => onEdit(listing)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Adoption Details
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => onUnlist(listing.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel Adoption
                    </Button>
                  </>
                ) : (
                  /* When browsing another user's pet */
                  !isAdmin && (
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                      onClick={() => onRequest(listing)}
                    >
                      <HeartHandshake className="h-3.5 w-3.5" />
                      {listing.adoptionType === 'free' ? 'Request for Adoption' : 'Inquire for Adoption'}
                    </Button>
                  )
                )}

                {/* Admin controls */}
                {isAdmin && (
                  <>
                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => onMarkAdopted(listing.id)}>
                      <CheckCircle className="h-3.5 w-3.5" /> Mark Adopted
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onUnlist(listing.id)}>
                      <X className="h-3.5 w-3.5" /> Unlist
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Incoming adoption inquiries section (Visible to Owner & Admin) */}
            {(isOwnerPet || isAdmin) && allRequests.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    Incoming Adoption Inquiries ({allRequests.length})
                  </span>
                  {pendingRequests.length > 0 && (
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                      {pendingRequests.length} pending decision
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {allRequests.map(req => (
                    <div
                      key={req.id}
                      className="p-3 rounded-lg border border-border/60 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">{req.requesterName}</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3 text-primary" />
                            <a href={`tel:${req.requesterContact}`} className="font-mono text-primary hover:underline">
                              {req.requesterContact}
                            </a>
                          </span>
                          <Badge
                            className={`text-[10px] ${
                              req.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {req.status === 'approved' ? 'Confirmed Adopter' : req.status === 'rejected' ? 'Declined' : 'Pending Review'}
                          </Badge>
                        </div>
                        {req.message && (
                          <p className="text-muted-foreground italic flex items-start gap-1 mt-1">
                            <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/60" />
                            <span>"{req.message}"</span>
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">Requested on {req.requestedAt}</p>
                      </div>

                      {/* Direct Confirm Adoption button for the owner */}
                      {listing.status === 'active' && req.status === 'pending' && (
                        <div className="shrink-0 flex items-center gap-2">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm gap-1"
                            onClick={() => onConfirmAdoption(listing, req)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Confirm Adoption to {req.requesterName}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdoptionBoardPage() {
  const {
    currentUser,
    pets,
    users,
    adoptionListings,
    addAdoptionListing,
    updateAdoptionListing,
    addAdoptionRequest,
    updatePet,
    addNotification,
    addAuditLog,
    dispatchOfflineNotification,
  } = useApp();
  const [filter, setFilter] = useState<'all' | 'dog' | 'cat' | 'free' | 'sale'>('all');
  const [search, setSearch] = useState('');
  const [requestListing, setRequestListing] = useState<AdoptionListing | null>(null);
  const [editListing, setEditListing] = useState<AdoptionListing | null>(null);
  const [postOpen, setPostOpen] = useState(false);

  const [reqForm, setReqForm] = useState({ name: '', contact: '', message: '' });
  const [postForm, setPostForm] = useState({
    petId: '', adoptionType: 'free' as 'free' | 'sale',
    adoptionPrice: '', ownerNotes: '',
  });
  const [editForm, setEditForm] = useState({
    adoptionType: 'free' as 'free' | 'sale',
    adoptionPrice: '',
    ownerNotes: '',
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'operator';
  const isOwner = currentUser?.role === 'owner';

  // Eligible stray / impounded pets for admin to post
  const eligiblePets = pets.filter(p =>
    (p.impounded || p.status === 'stray') &&
    p.verificationStatus === 'verified' &&
    !adoptionListings.some(l => l.petId === p.id && l.status === 'active')
  );

  // Owner's verified pets not already listed
  const myPetsForAdoption = isOwner
    ? pets.filter(p =>
        (p.ownerId === currentUser?.id || (currentUser?.name && p.ownerName === currentUser.name)) &&
        p.verificationStatus === 'verified' &&
        !adoptionListings.some(l => l.petId === p.id && l.status === 'active')
      )
    : [];

  const activeListings = adoptionListings.filter(l => l.status === 'active');

  const filtered = activeListings.filter(l => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'dog' && l.petClass === 'dog') ||
      (filter === 'cat' && l.petClass === 'cat') ||
      (filter === 'free' && l.adoptionType === 'free') ||
      (filter === 'sale' && l.adoptionType === 'sale');
    const matchSearch =
      search === '' ||
      l.petName.toLowerCase().includes(search.toLowerCase()) ||
      l.petBarangay.toLowerCase().includes(search.toLowerCase()) ||
      l.petBreed.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function handleRequest(listing: AdoptionListing) {
    setRequestListing(listing);
    setReqForm({ name: currentUser?.name ?? '', contact: currentUser?.contact ?? '', message: '' });
  }

  function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestListing) return;
    const req: AdoptionRequest = {
      id: 'REQ' + generateId(),
      listingId: requestListing.id,
      petId: requestListing.petId,
      requesterUserId: currentUser?.id,
      requesterUsername: currentUser?.username,
      requesterName: reqForm.name.trim(),
      requesterContact: reqForm.contact.trim(),
      requesterBarangay: currentUser?.barangay,
      requesterAddress: currentUser?.address,
      message: reqForm.message ? reqForm.message.trim() : undefined,
      status: 'pending',
      requestedAt: new Date().toISOString().split('T')[0],
    };
    addAdoptionRequest(requestListing.id, req);

    // Notify the pet owner privately about this adoption inquiry
    if (requestListing.ownerId) {
      addNotification({
        id: 'NOT' + generateId(),
        type: 'adoption-request',
        title: 'New Adoption Request Received',
        message: `${reqForm.name} submitted an adoption request for ${requestListing.petName}. Contact: ${reqForm.contact}${reqForm.message ? ` — "${reqForm.message}"` : ''}`,
        createdAt: new Date().toISOString(),
        isRead: false,
        userId: requestListing.ownerId,
        relatedId: requestListing.id,
        petId: requestListing.petId,
      });
    }

    toast.success(`Adoption request sent! The owner (${requestListing.ownerName || 'owner'}) has received your contact details.`);
    setRequestListing(null);
  }

  function handleMarkAdopted(id: string) {
    const listing = adoptionListings.find(l => l.id === id);
    if (!listing) return;
    updateAdoptionListing({ ...listing, status: 'adopted' });
    const p = pets.find(pet => pet.id === listing.petId);
    if (p) {
      updatePet({ ...p, isForAdoptionOrSale: false });
    }
    toast.success('Pet marked as adopted.');
  }

  function handleUnlist(id: string) {
    const listing = adoptionListings.find(l => l.id === id);
    if (!listing) return;
    updateAdoptionListing({ ...listing, status: 'unlisted' });
    const p = pets.find(pet => pet.id === listing.petId);
    if (p) {
      updatePet({ ...p, isForAdoptionOrSale: false });
    }
    toast.success('Adoption listing cancelled. Your pet remains active in your registry.');
  }

  function handleEditListing(listing: AdoptionListing) {
    setEditListing(listing);
    setEditForm({
      adoptionType: listing.adoptionType,
      adoptionPrice: listing.adoptionPrice ? String(listing.adoptionPrice) : '',
      ownerNotes: listing.ownerNotes || '',
    });
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editListing) return;
    const updated: AdoptionListing = {
      ...editListing,
      adoptionType: editForm.adoptionType,
      adoptionPrice: editForm.adoptionType === 'sale' ? parseFloat(editForm.adoptionPrice) || 0 : undefined,
      ownerNotes: editForm.ownerNotes || undefined,
    };
    updateAdoptionListing(updated);
    const p = pets.find(pet => pet.id === editListing.petId);
    if (p) {
      updatePet({
        ...p,
        adoptionType: editForm.adoptionType,
        adoptionPrice: editForm.adoptionType === 'sale' ? parseFloat(editForm.adoptionPrice) || 0 : undefined,
      });
    }
    toast.success('Adoption details updated successfully.');
    setEditListing(null);
  }

  function handleConfirmAdoption(listing: AdoptionListing, req: AdoptionRequest) {
    const targetPet = pets.find(p => p.id === listing.petId);
    if (!targetPet) {
      toast.error('Pet record not found.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const prevOwners = targetPet.previousOwners || [];
    const updatedPrevOwners = [
      ...prevOwners,
      {
        ownerId: targetPet.ownerId || listing.ownerId || 'PREV_OWNER',
        ownerName: targetPet.ownerName || listing.ownerName || 'Previous Owner',
        ownerContact: targetPet.ownerContact || listing.ownerPhone || 'N/A',
        transferDate: today,
        authorizedBy: currentUser?.name || 'Owner Consent',
      },
    ];

    // Find the adopter in registered users if available
    const adopterUser = users.find(u =>
      (req.requesterUserId && u.id === req.requesterUserId) ||
      (req.requesterUsername && u.username?.toLowerCase() === req.requesterUsername.toLowerCase()) ||
      (u.name && u.name.trim().toLowerCase() === req.requesterName.trim().toLowerCase()) ||
      (req.requesterContact && (u.contactNumber === req.requesterContact || u.contact === req.requesterContact))
    );

    const newOwnerId = adopterUser?.id || req.requesterUserId || ('USR_' + generateId());
    const newOwnerName = adopterUser?.name || req.requesterName.trim();
    const newOwnerBarangay = adopterUser?.barangay || req.requesterBarangay || targetPet.barangay;
    const newOwnerAddress = adopterUser?.address || req.requesterAddress || (newOwnerBarangay ? `Brgy. ${newOwnerBarangay}, Irosin` : targetPet.ownerAddress);

    // Transfer ownership of pet in registry and update ownerId to adopter
    const updatedPet: Pet = {
      ...targetPet,
      ownerId: newOwnerId,
      ownerName: newOwnerName,
      ownerContact: req.requesterContact,
      barangay: newOwnerBarangay,
      ownerAddress: newOwnerAddress,
      isForAdoptionOrSale: false,
      adoptionType: undefined,
      adoptionPrice: undefined,
      previousOwners: updatedPrevOwners,
      lifecycleStatus: 'transferred',
    };
    updatePet(updatedPet);

    // Update listing status to adopted and mark this request approved
    const updatedRequests = (listing.requests || []).map(r =>
      r.id === req.id ? { ...r, status: 'approved' as const } : { ...r, status: 'rejected' as const }
    );
    updateAdoptionListing({
      ...listing,
      status: 'adopted',
      requests: updatedRequests,
    });

    // Notify the previous owner who confirmed adoption
    addNotification({
      id: 'NOT' + generateId(),
      type: 'pet-transferred',
      title: 'Pet Adoption Confirmed',
      message: `Congratulations! ${listing.petName} has been officially adopted by ${newOwnerName}. Ownership has been transferred in the Irosin Municipal Registry.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      userId: currentUser?.id,
      petId: listing.petId,
    });

    // Notify the new adopter in-app
    addNotification({
      id: 'NOT' + generateId(),
      type: 'pet-transferred',
      title: 'Adoption Approved & Ownership Transferred',
      message: `Congratulations! Your adoption of ${listing.petName} has been officially approved. ${listing.petName} is now registered under your profile.`,
      createdAt: new Date().toISOString(),
      isRead: false,
      userId: newOwnerId,
      petId: listing.petId,
    });

    // Log municipal audit record
    addAuditLog({
      action: 'TRANSFER_OWNERSHIP',
      targetType: 'pet',
      targetId: listing.petId,
      targetName: listing.petName,
      details: `Pet adoption completed: Ownership transferred from ${targetPet.ownerName} to ${newOwnerName} (${req.requesterContact}).`,
      performedBy: currentUser?.id ?? 'SYSTEM',
      performedByName: currentUser?.name ?? 'Pet Owner',
    });

    // Multi-channel offline notifications (SMS & Email simulation)
    dispatchOfflineNotification({
      userId: newOwnerId,
      recipientName: newOwnerName,
      recipientPhone: req.requesterContact,
      recipientEmail: adopterUser?.email,
      subject: `Adoption Confirmed: Welcome ${listing.petName}!`,
      message: `IROSIN LGU NOTICE: You are now the official registered owner of ${listing.petName}. The pet collar QR tag has been updated to your custody.`,
      channel: 'SMS_AND_EMAIL',
    });

    if (currentUser) {
      dispatchOfflineNotification({
        userId: currentUser.id,
        recipientName: currentUser.name,
        recipientPhone: currentUser.contactNumber || currentUser.contact || '09170000000',
        recipientEmail: currentUser.email,
        subject: `Pet Adopted: ${listing.petName}`,
        message: `IROSIN LGU NOTICE: ${listing.petName} was officially adopted by ${newOwnerName}. Your registered pet count has been deducted accordingly.`,
        channel: 'SMS_AND_EMAIL',
      });
    }

    toast.success(`Adoption confirmed! ${listing.petName} ownership has been officially transferred to ${newOwnerName}.`);
  }

  function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postForm.petId) { toast.error('Select a pet.'); return; }
    const pet = pets.find(p => p.id === postForm.petId);
    if (!pet) return;

    const listing: AdoptionListing = {
      id: 'ADO' + generateId(),
      petId: pet.id,
      petName: pet.name,
      petClass: pet.species,
      petBreed: pet.breed,
      petBarangay: pet.barangay,
      petPhoto: pet.photo,
      adoptionType: postForm.adoptionType,
      adoptionPrice: postForm.adoptionType === 'sale' ? parseFloat(postForm.adoptionPrice) || 0 : undefined,
      ownerNotes: postForm.ownerNotes || undefined,
      status: 'active',
      postedAt: new Date().toISOString().split('T')[0],
      ownerId: currentUser?.id,
      ownerName: currentUser?.name,
      ownerPhone: currentUser?.contact || currentUser?.contactNumber || (currentUser?.barangay ? `Brgy. ${currentUser.barangay}` : undefined),
      requests: [],
    };
    addAdoptionListing(listing);
    updatePet({ ...pet, isForAdoptionOrSale: true, adoptionType: postForm.adoptionType });
    toast.success('Adoption listing published!');
    setPostOpen(false);
    setPostForm({ petId: '', adoptionType: 'free', adoptionPrice: '', ownerNotes: '' });
  }

  const petsForPost = isAdmin ? eligiblePets : myPetsForAdoption;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-pink-500" />
            Public Adoption Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Irosin Pet Profile Gallery — Find your forever companion
          </p>
        </div>
        {(isAdmin || isOwner) && petsForPost.length > 0 && (
          <Dialog open={postOpen} onOpenChange={setPostOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                {isAdmin ? 'Post Pound Animal' : 'List My Pet'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {isAdmin ? 'Post New Pound Animal for Adoption' : 'List Pet for Adoption'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePost} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Select Pet <span className="text-destructive">*</span></Label>
                  <Select value={postForm.petId} onValueChange={v => setPostForm(p => ({ ...p, petId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choose a pet" /></SelectTrigger>
                    <SelectContent>
                      {petsForPost.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — {p.breed}, Brgy. {p.barangay}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Adoption Type</Label>
                  <Select value={postForm.adoptionType} onValueChange={v => setPostForm(p => ({ ...p, adoptionType: v as 'free' | 'sale' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Adoption</SelectItem>
                      <SelectItem value="sale">For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {postForm.adoptionType === 'sale' && (
                  <div className="space-y-1">
                    <Label>Price (₱)</Label>
                    <Input type="number" min="0" value={postForm.adoptionPrice} onChange={e => setPostForm(p => ({ ...p, adoptionPrice: e.target.value }))} placeholder="e.g. 500" />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>Notes for Adopter</Label>
                  <Textarea rows={3} value={postForm.ownerNotes} onChange={e => setPostForm(p => ({ ...p, ownerNotes: e.target.value }))} placeholder="Describe the pet's personality, needs, and what you're looking for in an adopter..." />
                </div>
                <Button type="submit" className="w-full">Publish Adoption Post</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Listings" value={activeListings.length} icon={HeartHandshake} color="blue" />
        <StatCard title="Dogs Available" value={activeListings.filter(l => l.petClass === 'dog').length} icon={PawPrint} color="yellow" />
        <StatCard title="Cats Available" value={activeListings.filter(l => l.petClass === 'cat').length} icon={PawPrint} color="green" />
        <StatCard title="Free Adoption" value={activeListings.filter(l => l.adoptionType === 'free').length} icon={HeartHandshake} color="red" subtitle="No cost" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search by name, breed, barangay..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'dog', 'cat', 'free', 'sale'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">
              {f === 'all' ? 'All' : f === 'free' ? 'Free' : f === 'sale' ? 'For Sale' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
            </Button>
          ))}
        </div>
      </div>

      {/* Listings grid */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <HeartHandshake className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No listings found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeListings.length === 0
                  ? 'No pets are currently listed for adoption.'
                  : 'Try adjusting your filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              currentRole={currentUser?.role ?? 'owner'}
              currentUserId={currentUser?.id ?? ''}
              currentUserName={currentUser?.name ?? ''}
              onRequest={handleRequest}
              onMarkAdopted={handleMarkAdopted}
              onUnlist={handleUnlist}
              onEdit={handleEditListing}
              onConfirmAdoption={handleConfirmAdoption}
            />
          ))
        )}
      </div>

      {/* Past listings (admin) */}
      {isAdmin && adoptionListings.filter(l => l.status !== 'active').length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Past Listings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {adoptionListings.filter(l => l.status !== 'active').map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm">
                <PawPrint className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 min-w-0 truncate">{l.petName} — {l.petBreed}, Brgy. {l.petBarangay}</span>
                <Badge className={l.status === 'adopted' ? 'bg-purple-100 text-purple-800' : 'bg-muted text-muted-foreground'}>
                  {l.status === 'adopted' ? 'Adopted' : 'Unlisted'}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0">{formatDateShort(l.postedAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Adoption Request Dialog */}
      <Dialog open={!!requestListing} onOpenChange={o => { if (!o) setRequestListing(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {requestListing?.adoptionType === 'free' ? 'Request Free Adoption' : 'Inquire About This Pet'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRequest} className="space-y-4 pt-2">
            {requestListing && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium">{requestListing.petName}</p>
                <p className="text-xs text-muted-foreground">{requestListing.petBreed} · Brgy. {requestListing.petBarangay}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label>Your Name <span className="text-destructive">*</span></Label>
              <Input value={reqForm.name} onChange={e => setReqForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" required />
            </div>
            <div className="space-y-1">
              <Label>Contact Number <span className="text-destructive">*</span></Label>
              <Input value={reqForm.contact} onChange={e => setReqForm(p => ({ ...p, contact: e.target.value }))} placeholder="09XXXXXXXXX" required />
            </div>
            <div className="space-y-1">
              <Label>Message (Optional)</Label>
              <Textarea rows={3} value={reqForm.message} onChange={e => setReqForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us why you'd like to adopt this pet..." />
            </div>
            <Button type="submit" className="w-full">
              <HeartHandshake className="h-4 w-4 mr-2" /> Submit Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Adoption Details Dialog for Pet Owner */}
      <Dialog open={!!editListing} onOpenChange={o => { if (!o) setEditListing(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Adoption Details — {editListing?.petName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Adoption Type</Label>
              <Select
                value={editForm.adoptionType}
                onValueChange={v => setEditForm(p => ({ ...p, adoptionType: v as 'free' | 'sale' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Adoption</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.adoptionType === 'sale' && (
              <div className="space-y-1">
                <Label>Adoption / Rehoming Fee (₱)</Label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.adoptionPrice}
                  onChange={e => setEditForm(p => ({ ...p, adoptionPrice: e.target.value }))}
                  placeholder="e.g. 500"
                  required
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>Notes for Adopters / Care Requirements</Label>
              <Textarea
                rows={3}
                value={editForm.ownerNotes}
                onChange={e => setEditForm(p => ({ ...p, ownerNotes: e.target.value }))}
                placeholder="Update description, diet, personality, or rehoming requirements..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setEditListing(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
