/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { User, Pet, Vaccination, Incident, Notification, UserRole, BiteCase, AdoptionListing, AdoptionRequest, StraySighting, AuditLog, SmsReminderLog, PurokChangeRequest, OfflineDispatchLog } from '@/types/types';
import {
  SEED_USERS, SEED_PETS, SEED_VACCINATIONS,
  SEED_INCIDENTS, SEED_NOTIFICATIONS, SEED_BITE_CASES, SEED_ADOPTION_LISTINGS, SEED_STRAY_SIGHTINGS,
} from '@/data/seedData';

interface AppState {
  users: User[];
  pets: Pet[];
  vaccinations: Vaccination[];
  incidents: Incident[];
  notifications: Notification[];
  biteCases: BiteCase[];
  adoptionListings: AdoptionListing[];
  straySightings: StraySighting[];
  auditLogs: AuditLog[];
  smsLogs: SmsReminderLog[];
  purokRequests: PurokChangeRequest[];
  offlineDispatches: OfflineDispatchLog[];
  currentUser: User | null;
}

interface AppContextType extends AppState {
  login: (emailOrUsername: string, password: string) => User | null;
  logout: () => void;
  sendPasswordResetCode: (identifier: string) => { success: boolean; code?: string; message: string };
  verifyResetCode: (identifier: string, code: string) => boolean;
  resetPassword: (identifier: string, newPass: string) => boolean;
  addPet: (pet: Pet) => void;
  updatePet: (pet: Pet) => void;
  deletePet: (id: string) => void;
  transferPetOwnership: (petId: string, newOwnerId: string, newOwnerName: string, newOwnerContact: string, newOwnerAddress: string, newBarangay: string) => boolean;
  markPetDeceased: (petId: string, date: string, reason: string) => boolean;
  addVaccination: (vacc: Vaccination) => void;
  updateVaccination: (vacc: Vaccination) => void;
  simulateBoosterReminders: () => SmsReminderLog[];
  addIncident: (inc: Incident) => void;
  updateIncident: (inc: Incident) => void;
  addUser: (user: User) => void;
  registerUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (n: Notification) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  getPetVaccinations: (petId: string) => Vaccination[];
  getPetIncidents: (petId: string) => Incident[];
  canAccess: (roles: UserRole[]) => boolean;
  unreadCount: number;
  // Bite cases
  addBiteCase: (bc: BiteCase) => void;
  updateBiteCase: (bc: BiteCase) => void;
  // Adoption
  addAdoptionListing: (listing: AdoptionListing) => void;
  updateAdoptionListing: (listing: AdoptionListing) => void;
  addAdoptionRequest: (listingId: string, req: AdoptionRequest) => void;
  // Stray sightings
  addStraySighting: (s: StraySighting) => void;
  updateStraySighting: (id: string, updates: Partial<StraySighting>) => void;
  // Purok Change Requests
  addPurokRequest: (req: Omit<PurokChangeRequest, 'id' | 'requestedAt' | 'status'>) => void;
  approvePurokRequest: (requestId: string) => void;
  rejectPurokRequest: (requestId: string, reason?: string) => void;
  // Multi-Channel Offline Dispatcher
  dispatchOfflineNotification: (payload: {
    recipientName: string;
    recipientPhone: string;
    recipientEmail?: string;
    subject: string;
    message: string;
    channel?: 'SMS' | 'EMAIL' | 'SMS_AND_EMAIL';
    userId?: string;
  }) => void;
}

const STORAGE_KEY = 'pet_registry_data_v6';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('pet_registry_data_v5') || localStorage.getItem('pet_registry_data_v4');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      // Merge new seed users if missing (e.g. bite_center / vet_clinic / USR_JOHAN)
      const existingUserIds = new Set((parsed.users || []).map(u => u.id));
      const newSeedUsers = SEED_USERS.filter(u => !existingUserIds.has(u.id));
      let mergedUsers = [...(parsed.users || []), ...newSeedUsers];

      // Ensure USR_JOHAN full name and username are correct
      mergedUsers = mergedUsers.map(u => {
        if (u.id === 'USR_JOHAN' || u.username === 'Johan' || u.email === 'casini.owner@gmail.com') {
          return {
            ...u,
            name: 'John Noel Obiado',
            username: 'Johan',
            barangay: 'Casini',
            purok: u.purok || 'Purok 7',
            contactNumber: u.contactNumber || '09750612469',
          };
        }
        return u;
      });

      // Synchronize pets so Muning (PET002) and Edor (PET015) are properly anchored to USR_JOHAN
      let mergedPets = [...(parsed.pets || SEED_PETS)];
      const hasEdor = mergedPets.some(p => p.id === 'PET015' || p.name.toLowerCase() === 'edor');
      if (!hasEdor) {
        const edor = SEED_PETS.find(p => p.id === 'PET015');
        if (edor) mergedPets.push(edor);
      }

      mergedPets = mergedPets.map(p => {
        // Anchor Casini pets owned by John Noel Obiado / Johan to USR_JOHAN
        if (p.id === 'PET002' || p.id === 'PET015' || (p.barangay === 'Casini' && (p.ownerName?.toLowerCase().includes('obiado') || p.ownerName?.toLowerCase() === 'johan'))) {
          return {
            ...p,
            ownerId: 'USR_JOHAN',
            ownerName: 'John Noel Obiado',
            ownerContact: '09750612469',
            barangay: 'Casini',
            ownerAddress: 'Purok 7, Casini, Irosin',
            previousOwners: p.id === 'PET002' && (!p.previousOwners || p.previousOwners.length === 0) ? [
              {
                ownerId: 'USR003',
                ownerName: 'Juan dela Cruz',
                ownerContact: '09171234567',
                transferDate: '2026-10-11',
                transferType: 'adoption',
              }
            ] : p.previousOwners,
          };
        }
        // Auto-anchor any owned pet that lacks ownerId to registered user by name
        if (!p.ownerId && p.ownerName && p.status === 'owned') {
          const matchedUser = mergedUsers.find(u => u.name.trim().toLowerCase() === p.ownerName.trim().toLowerCase());
          if (matchedUser) {
            return { ...p, ownerId: matchedUser.id };
          }
        }
        return p;
      });

      return {
        users: mergedUsers,
        pets: mergedPets,
        vaccinations: parsed.vaccinations ?? SEED_VACCINATIONS,
        incidents: parsed.incidents ?? SEED_INCIDENTS,
        notifications: parsed.notifications ?? SEED_NOTIFICATIONS,
        biteCases: parsed.biteCases ?? SEED_BITE_CASES,
        adoptionListings: parsed.adoptionListings ?? SEED_ADOPTION_LISTINGS,
        straySightings: parsed.straySightings ?? SEED_STRAY_SIGHTINGS,
        auditLogs: parsed.auditLogs ?? [],
        smsLogs: parsed.smsLogs ?? [],
        purokRequests: parsed.purokRequests ?? [],
        offlineDispatches: parsed.offlineDispatches ?? [],
        currentUser: parsed.currentUser ?? null,
      };
    }
  } catch {
    // ignore
  }
  return {
    users: SEED_USERS,
    pets: SEED_PETS,
    vaccinations: SEED_VACCINATIONS,
    incidents: SEED_INCIDENTS,
    notifications: SEED_NOTIFICATIONS,
    biteCases: SEED_BITE_CASES,
    adoptionListings: SEED_ADOPTION_LISTINGS,
    straySightings: SEED_STRAY_SIGHTINGS,
    auditLogs: [],
    smsLogs: [],
    purokRequests: [],
    offlineDispatches: [],
    currentUser: null,
  };
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = (partial: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...partial }));
  };
  

  // Support login by email OR by username (email prefix before @)
  const login = (emailOrUsername: string, password: string): User | null => {
    const input = emailOrUsername.trim().toLowerCase();
    const user = state.users.find(u => {
      const emailMatch = u.email.toLowerCase() === input;
      const usernameMatch = u.email.toLowerCase().split('@')[0] === input;
      return (emailMatch || usernameMatch) && u.password === password && u.status === 'active';
    });
    if (user) update({ currentUser: user });
    return user ?? null;
  };

  const logout = () => update({ currentUser: null });

  // Password reset storage (in memory mock)
  const resetCodesRef = React.useRef<Map<string, string>>(new Map());

  const sendPasswordResetCode = (identifier: string): { success: boolean; code?: string; message: string } => {
    const input = identifier.trim().toLowerCase();
    const user = state.users.find(u =>
      u.email.toLowerCase() === input ||
      u.email.toLowerCase().split('@')[0] === input ||
      (u.contactNumber && u.contactNumber.replace(/[^0-9]/g, '') === input.replace(/[^0-9]/g, ''))
    );
    if (!user) {
      return { success: false, message: 'No registered user found with that email or phone number.' };
    }
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodesRef.current.set(user.id, code);
    return {
      success: true,
      code,
      message: `Reset verification code generated for ${user.name} (${user.email}).`,
    };
  };

  const verifyResetCode = (identifier: string, code: string): boolean => {
    const input = identifier.trim().toLowerCase();
    const user = state.users.find(u =>
      u.email.toLowerCase() === input ||
      u.email.toLowerCase().split('@')[0] === input ||
      (u.contactNumber && u.contactNumber.replace(/[^0-9]/g, '') === input.replace(/[^0-9]/g, ''))
    );
    if (!user) return false;
    const storedCode = resetCodesRef.current.get(user.id);
    return storedCode === code.trim() || code.trim() === '123456'; // support testing fallback
  };

  const resetPassword = (identifier: string, newPass: string): boolean => {
    const input = identifier.trim().toLowerCase();
    const user = state.users.find(u =>
      u.email.toLowerCase() === input ||
      u.email.toLowerCase().split('@')[0] === input ||
      (u.contactNumber && u.contactNumber.replace(/[^0-9]/g, '') === input.replace(/[^0-9]/g, ''))
    );
    if (!user) return false;
    const updatedUsers = state.users.map(u => u.id === user.id ? { ...u, password: newPass } : u);
    update({ users: updatedUsers });
    addAuditLog({
      action: 'PASSWORD_RESET',
      targetType: 'user',
      targetId: user.id,
      targetName: user.name,
      details: `Password reset successfully completed for ${user.email}`,
      performedBy: user.id,
      performedByName: user.name,
    });
    return true;
  };

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newEntry: AuditLog = {
      ...log,
      id: 'LOG' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
    };
    update({ auditLogs: [newEntry, ...(state.auditLogs ?? [])] });
  };

  const transferPetOwnership = (
    petId: string,
    newOwnerId: string,
    newOwnerName: string,
    newOwnerContact: string,
    newOwnerAddress: string,
    newBarangay: string
  ): boolean => {
    const pet = state.pets.find(p => p.id === petId);
    if (!pet) return false;

    const oldOwnerName = pet.ownerName;
    const oldOwnerId = pet.ownerId;
    const historyItem = {
      ownerId: oldOwnerId,
      ownerName: oldOwnerName,
      ownerContact: pet.ownerContact,
      transferDate: new Date().toISOString().split('T')[0],
      authorizedBy: state.currentUser?.name ?? 'System',
    };

    const updatedPet: Pet = {
      ...pet,
      ownerId: newOwnerId,
      ownerName: newOwnerName,
      ownerContact: newOwnerContact,
      ownerAddress: newOwnerAddress,
      barangay: newBarangay,
      previousOwners: [...(pet.previousOwners ?? []), historyItem],
      lifecycleStatus: 'transferred',
    };

    update({
      pets: state.pets.map(p => p.id === petId ? updatedPet : p),
    });

    addAuditLog({
      action: 'TRANSFER_OWNERSHIP',
      targetType: 'pet',
      targetId: pet.id,
      targetName: pet.name,
      details: `Transferred ownership of ${pet.name} (${pet.id}) from ${oldOwnerName} to ${newOwnerName} (Brgy. ${newBarangay})`,
      performedBy: state.currentUser?.id ?? 'SYSTEM',
      performedByName: state.currentUser?.name ?? 'System Operator',
    });

    addNotification({
      id: 'NOTIF' + Date.now(),
      type: 'pet-transferred',
      title: 'Pet Ownership Transferred',
      message: `${pet.name} (${pet.id}) ownership has been transferred to ${newOwnerName}.`,
      petId: pet.id,
      userId: newOwnerId,
      isRead: false,
      createdAt: new Date().toISOString().split('T')[0],
    });

    return true;
  };

  const markPetDeceased = (petId: string, date: string, reason: string): boolean => {
    const pet = state.pets.find(p => p.id === petId);
    if (!pet) return false;

    const updatedPet: Pet = {
      ...pet,
      lifecycleStatus: 'deceased',
      deceasedAt: date || new Date().toISOString().split('T')[0],
      deceasedReason: reason || 'Not specified',
    };

    update({
      pets: state.pets.map(p => p.id === petId ? updatedPet : p),
    });

    addAuditLog({
      action: 'MARK_DECEASED',
      targetType: 'pet',
      targetId: pet.id,
      targetName: pet.name,
      details: `Pet ${pet.name} (${pet.id}) archived as deceased. Reason: ${reason || 'Natural causes'}`,
      performedBy: state.currentUser?.id ?? 'SYSTEM',
      performedByName: state.currentUser?.name ?? 'System Operator',
    });

    addNotification({
      id: 'NOTIF' + Date.now(),
      type: 'pet-deceased',
      title: 'Pet Record Archived (Deceased)',
      message: `${pet.name} (${pet.id}) has been archived as deceased. Medical and legal history retained.`,
      petId: pet.id,
      isRead: false,
      createdAt: new Date().toISOString().split('T')[0],
    });

    return true;
  };

  const simulateBoosterReminders = (): SmsReminderLog[] => {
    const now = new Date();
    const newLogs: SmsReminderLog[] = [];

    state.pets.filter(p => p.lifecycleStatus !== 'deceased').forEach(pet => {
      const petVaccs = state.vaccinations.filter(v => v.petId === pet.id);
      if (petVaccs.length === 0) return;
      const latest = [...petVaccs].sort((a, b) => b.nextBoosterDue.localeCompare(a.nextBoosterDue))[0];
      const dueDate = new Date(latest.nextBoosterDue);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let message = '';
      if (diffDays < 0) {
        message = `IROSIN LGU ALERT: Anti-Rabies vaccination for ${pet.name} is OVERDUE by ${Math.abs(diffDays)} days. Please visit your Barangay Animal Health center immediately to comply with RA 9482.`;
      } else if (diffDays <= 30) {
        message = `IROSIN LGU NOTICE: Anti-Rabies booster for ${pet.name} is DUE in ${diffDays} day(s) on ${latest.nextBoosterDue}. Keep your pet rabies-free!`;
      }

      if (message) {
        const log: SmsReminderLog = {
          id: 'SMS' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          petId: pet.id,
          petName: pet.name,
          ownerName: pet.ownerName,
          recipientName: pet.ownerName,
          recipientPhone: pet.ownerContact || '09170000000',
          vaccineType: latest.vaccineType,
          dueDate: latest.nextBoosterDue,
          message,
          status: 'delivered',
          sentAt: new Date().toISOString(),
        };
        newLogs.push(log);
      }
    });

    update({ smsLogs: [...newLogs, ...(state.smsLogs ?? [])] });
    return newLogs;
  };

  const addPet = (pet: Pet) => update({ pets: [...state.pets, pet] });
  const updatePet = (pet: Pet) =>
    update({ pets: state.pets.map(p => p.id === pet.id ? pet : p) });
  const deletePet = (id: string) =>
    update({ pets: state.pets.filter(p => p.id !== id) });

  const addVaccination = (vacc: Vaccination) =>
    update({ vaccinations: [...state.vaccinations, vacc] });
  const updateVaccination = (vacc: Vaccination) =>
    update({ vaccinations: state.vaccinations.map(v => v.id === vacc.id ? vacc : v) });

  const addIncident = (inc: Incident) =>
    update({ incidents: [...state.incidents, inc] });
  const updateIncident = (inc: Incident) =>
    update({ incidents: state.incidents.map(i => i.id === inc.id ? inc : i) });

  const addUser = (user: User) =>
    update({ users: [...state.users, user] });
  const registerUser = (user: User) =>
    update({
      users: [...state.users, user],
      currentUser: user,
    });
  const updateUser = (user: User) =>
    update({
      users: state.users.map(u => u.id === user.id ? user : u),
      currentUser: state.currentUser?.id === user.id ? user : state.currentUser,
    });
  const deleteUser = (id: string) =>
    update({ users: state.users.filter(u => u.id !== id) });

  const markNotificationRead = (id: string) =>
    update({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    });
  const markAllNotificationsRead = () =>
    update({ notifications: state.notifications.map(n => ({ ...n, isRead: true })) });
  const addNotification = (n: Notification) =>
    update({ notifications: [n, ...state.notifications] });

  const getPetVaccinations = (petId: string) =>
    state.vaccinations.filter(v => v.petId === petId);
  const getPetIncidents = (petId: string) =>
    state.incidents.filter(i => i.linkedPetId === petId);

  const canAccess = (roles: UserRole[]) =>
    state.currentUser !== null && roles.includes(state.currentUser.role);

  // Compute unread count specific to the user's role and barangay
  const filteredNotifs = state.notifications.filter(n => {
    if (!state.currentUser) return false;
    if (state.currentUser.role === 'admin') return true;

    if (state.currentUser.role === 'operator') {
      // Strictly personal notifications are private to the concerned user
      if (n.type === 'owner-verified' || n.type === 'transfer-request' || n.type === 'pet-transferred' || n.type === 'purok-approved' || n.type === 'purok-rejected') {
        return n.userId === state.currentUser.id;
      }
      if (n.userId && n.userId === state.currentUser.id) return true;
      if (n.userId && n.userId !== state.currentUser.id && n.type !== 'owner-pending' && n.type !== 'pet-pending' && n.type !== 'purok-change-request') {
        return false;
      }

      // Operational barangay tasks
      if (n.type === 'purok-change-request') {
        return Boolean(state.currentUser.barangay && (n.targetBarangay?.toLowerCase() === state.currentUser.barangay.toLowerCase() || n.message.toLowerCase().includes(state.currentUser.barangay.toLowerCase())));
      }
      if (n.type === 'owner-pending') {
        return Boolean(state.currentUser.barangay && n.message.toLowerCase().includes(state.currentUser.barangay.toLowerCase()));
      }
      if (n.petId) {
        const pet = state.pets.find(p => p.id === n.petId);
        if (pet) return pet.barangay.toLowerCase() === state.currentUser.barangay?.toLowerCase();
      }
      if (n.incidentId) {
        const inc = state.incidents.find(i => i.id === n.incidentId);
        if (inc) return inc.barangay.toLowerCase() === state.currentUser.barangay?.toLowerCase();
      }
      if (n.type === 'new-incident' || n.type === 'stray-alert' || n.type === 'pet-pending') {
        if (state.currentUser.barangay && n.message.toLowerCase().includes(state.currentUser.barangay.toLowerCase())) {
          return true;
        }
      }
      return false;
    }

    if (state.currentUser.role === 'owner') {
      // Newly created account waiting for verification has 0 notifications until operator approves/rejects
      if (state.currentUser.verificationStatus !== 'verified') {
        return n.userId === state.currentUser.id && (n.type === 'owner-verified' || n.title?.toLowerCase().includes('verification'));
      }
      if (n.type === 'pet-pending' || n.type === 'owner-pending') return false;
      if (n.userId) return n.userId === state.currentUser.id;
      if (n.petId) {
        const pet = state.pets.find(p => p.id === n.petId);
        if (pet && (pet.ownerId === state.currentUser.id || (Boolean(pet.ownerName) && pet.ownerName.trim().toLowerCase() === state.currentUser.name.trim().toLowerCase()))) {
          return true;
        }
      }
      return false;
    }

    if (n.userId && n.userId !== state.currentUser.id) return false;
    return true;
  });

  const unreadCount = filteredNotifs.filter(n => !n.isRead).length;

  // Bite Cases
  const addBiteCase = (bc: BiteCase) =>
    update({ biteCases: [bc, ...state.biteCases] });
  const updateBiteCase = (bc: BiteCase) =>
    update({ biteCases: state.biteCases.map(b => b.id === bc.id ? bc : b) });

  // Adoption
  const addAdoptionListing = (listing: AdoptionListing) =>
    update({ adoptionListings: [listing, ...state.adoptionListings] });
  const updateAdoptionListing = (listing: AdoptionListing) =>
    update({ adoptionListings: state.adoptionListings.map(l => l.id === listing.id ? listing : l) });
  const addAdoptionRequest = (listingId: string, req: AdoptionRequest) =>
    update({
      adoptionListings: state.adoptionListings.map(l =>
        l.id === listingId
          ? { ...l, requests: [...(l.requests ?? []), req] }
          : l
      ),
    });

  // Stray sightings
  const addStraySighting = (s: StraySighting) =>
    update({ straySightings: [s, ...state.straySightings] });
  const updateStraySighting = (id: string, updates: Partial<StraySighting>) =>
    update({
      straySightings: state.straySightings.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    });

  // Multi-Channel Offline Dispatcher
  const dispatchOfflineNotification = (payload: {
    recipientName: string;
    recipientPhone: string;
    recipientEmail?: string;
    subject: string;
    message: string;
    channel?: 'SMS' | 'EMAIL' | 'SMS_AND_EMAIL';
    userId?: string;
  }) => {
    const channel = payload.channel || 'SMS_AND_EMAIL';
    const email = payload.recipientEmail || (payload.userId ? state.users.find(u => u.id === payload.userId)?.email : undefined) || 'resident@irosin.ph';
    const phone = payload.recipientPhone || '09170000000';

    const newLog: OfflineDispatchLog = {
      id: 'DISP' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId: payload.userId,
      recipientName: payload.recipientName,
      recipientPhone: phone,
      recipientEmail: email,
      channel,
      subject: payload.subject,
      message: payload.message,
      dispatchedAt: new Date().toISOString(),
      status: 'delivered',
    };

    update({ offlineDispatches: [newLog, ...(state.offlineDispatches ?? [])] });

    // Show visible toast simulation
    toast.success(`Offline Alert Sent: ${payload.subject}`, {
      description: `Dispatched to ${phone} (SMS) & ${email} (Email) for offline delivery.`,
      duration: 4000,
    });
  };

  // Purok Change Requests
  const addPurokRequest = (req: Omit<PurokChangeRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newReq: PurokChangeRequest = {
      ...req,
      id: 'PUR' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    update({ purokRequests: [newReq, ...(state.purokRequests ?? [])] });

    addNotification({
      id: 'NOT' + Date.now(),
      type: 'purok-change-request',
      title: 'New Purok Change Request',
      message: `${req.userName} requested to change residency from ${req.previousPurok || 'Unassigned'} to ${req.requestedPurok} in Brgy. ${req.barangay}. Please review and approve.`,
      targetBarangay: req.barangay,
      targetRole: 'operator',
      createdAt: new Date().toISOString(),
      isRead: false,
    });

    toast.info('Purok Change Request Submitted', {
      description: `Sent to the Barangay Operator of Brgy. ${req.barangay} for review.`,
    });
  };

  const approvePurokRequest = (requestId: string) => {
    const req = state.purokRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedUsers = state.users.map(u => {
      if (u.id === req.userId) {
        return { ...u, purok: req.requestedPurok };
      }
      return u;
    });

    const updatedPurokRequests = state.purokRequests.map(r =>
      r.id === requestId ? { ...r, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: state.currentUser?.name || 'Barangay Operator' } : r
    );

    update({
      users: updatedUsers,
      purokRequests: updatedPurokRequests,
      currentUser: state.currentUser?.id === req.userId ? { ...state.currentUser, purok: req.requestedPurok } : state.currentUser,
    });

    addAuditLog({
      action: 'PUROK_CHANGE',
      targetType: 'user',
      targetId: req.userId,
      targetName: req.userName,
      details: `Approved Purok change for ${req.userName} in Brgy. ${req.barangay} to ${req.requestedPurok}`,
      performedBy: state.currentUser?.id ?? 'OPERATOR',
      performedByName: state.currentUser?.name ?? 'Barangay Operator',
    });

    addNotification({
      id: 'NOT' + Date.now(),
      type: 'purok-approved',
      title: 'Purok Change Request Approved',
      message: `Your residency update to ${req.requestedPurok}, Brgy. ${req.barangay} has been verified and approved by your Barangay Operator.`,
      userId: req.userId,
      createdAt: new Date().toISOString(),
      isRead: false,
    });

    const targetUser = state.users.find(u => u.id === req.userId);
    dispatchOfflineNotification({
      userId: req.userId,
      recipientName: req.userName,
      recipientPhone: req.contactNumber || targetUser?.contactNumber || '09170000000',
      recipientEmail: targetUser?.email,
      subject: 'Residency / Purok Change Approved',
      message: `IROSIN LGU NOTICE: Your Purok modification to ${req.requestedPurok} in Brgy. ${req.barangay} has been approved by your Barangay Operator. Your official pet owner record has been updated.`,
      channel: 'SMS_AND_EMAIL',
    });
  };

  const rejectPurokRequest = (requestId: string, reason?: string) => {
    const req = state.purokRequests.find(r => r.id === requestId);
    if (!req) return;

    const updatedPurokRequests = state.purokRequests.map(r =>
      r.id === requestId ? { ...r, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: state.currentUser?.name || 'Barangay Operator' } : r
    );

    update({ purokRequests: updatedPurokRequests });

    addNotification({
      id: 'NOT' + Date.now(),
      type: 'purok-rejected',
      title: 'Purok Change Request Rejected',
      message: `Your Purok change request for Brgy. ${req.barangay} was declined.${reason ? ` Reason: ${reason}` : ''}`,
      userId: req.userId,
      createdAt: new Date().toISOString(),
      isRead: false,
    });

    const targetUser = state.users.find(u => u.id === req.userId);
    dispatchOfflineNotification({
      userId: req.userId,
      recipientName: req.userName,
      recipientPhone: req.contactNumber || targetUser?.contactNumber || '09170000000',
      recipientEmail: targetUser?.email,
      subject: 'Residency / Purok Change Request Update',
      message: `IROSIN LGU NOTICE: Your Purok modification request for Brgy. ${req.barangay} was declined by the Barangay Operator.${reason ? ` Reason: ${reason}` : ''}`,
      channel: 'SMS_AND_EMAIL',
    });
  };

  return (
    <AppContext.Provider value={{
      ...state, login, logout,
      addPet, updatePet, deletePet,
      addVaccination, updateVaccination,
      addIncident, updateIncident,
      addUser, registerUser, updateUser, deleteUser,
      markNotificationRead, markAllNotificationsRead, addNotification,
      getPetVaccinations, getPetIncidents,
      canAccess, unreadCount,
      addBiteCase, updateBiteCase,
      addAdoptionListing, updateAdoptionListing, addAdoptionRequest,
      addStraySighting, updateStraySighting,
      sendPasswordResetCode, verifyResetCode, resetPassword,
      transferPetOwnership, markPetDeceased,
      simulateBoosterReminders, addAuditLog,
      addPurokRequest, approvePurokRequest, rejectPurokRequest,
      dispatchOfflineNotification,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
