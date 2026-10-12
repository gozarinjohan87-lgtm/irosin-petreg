export type UserRole = 'admin' | 'operator' | 'owner' | 'bite_center' | 'vet_clinic' | 'public';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  password: string;
  role: UserRole;
  barangay?: string;
  facilityName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  purok?: string;
  contactNumber?: string;
  contact?: string;
  address?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  proofDocument?: string;
  avatarUrl?: string;
  idDocumentUrl?: string;
  operatorPosition?: string;
}

export type Species = 'dog' | 'cat';
export type Sex = 'male' | 'female';
export type PetStatus = 'owned' | 'stray';
export type VaccinationStatus = 'up-to-date' | 'due-soon' | 'overdue' | 'none';
export type PetVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string;
  color: string;
  age: number;
  sex: Sex;
  ownerName: string;
  ownerContact: string;
  ownerAddress: string;
  barangay: string;
  status: PetStatus;
  isSpayedNeutered: boolean;
  photo?: string;
  registeredById: string;
  registeredAt: string;
  qrCode: string;
  // New fields
  ownerId?: string;
  verificationStatus?: PetVerificationStatus;
  impounded?: boolean;
  eligibleForAdoption?: boolean;
  isForAdoptionOrSale?: boolean;
  adoptionType?: 'free' | 'sale';
  adoptionPrice?: number;
  adoptionNotes?: string;
  sightingLocation?: string;
  behavior?: string;
  lifecycleStatus?: 'active' | 'transferred' | 'deceased';
  deceasedAt?: string;
  deceasedReason?: string;
  previousOwners?: {
    ownerId?: string;
    ownerName: string;
    ownerContact: string;
    transferDate: string;
    authorizedBy?: string;
  }[];
}

// ─── Bite Cases ────────────────────────────────────────────────────────
export type QuarantineStatus = 'pending' | 'under-quarantine' | 'released' | 'euthanized' | 'completed';

export interface BiteCase {
  id: string;
  patientName: string;
  patientAge: number;
  incidentDate: string;
  biteLocation: string;
  barangay: string;
  animalType: Species | 'unknown';
  petId?: string;
  quarantineStatus: QuarantineStatus;
  quarantineNotes?: string;
  treatmentNotes?: string;
  reportedAt: string;
  reportedBy: string; // user id of bite_center staff
  statusHistory?: { status: QuarantineStatus; date: string; note?: string }[];
}

// ─── Adoption Listings ─────────────────────────────────────────────────
export type AdoptionStatus = 'active' | 'adopted' | 'unlisted';

export interface AdoptionListing {
  id: string;
  petId: string;
  petName: string;
  petClass: Species;
  petBreed: string;
  petBarangay: string;
  petPhoto?: string;
  adoptionType: 'free' | 'sale';
  adoptionPrice?: number;
  ownerNotes?: string;
  status: AdoptionStatus;
  postedAt: string;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  requests?: AdoptionRequest[];
}

// ─── Adoption Requests ─────────────────────────────────────────────────
export interface AdoptionRequest {
  id: string;
  listingId: string;
  petId: string;
  requesterUserId?: string;
  requesterUsername?: string;
  requesterName: string;
  requesterContact: string;
  requesterBarangay?: string;
  requesterAddress?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

// ─── Purok Modification Requests ───────────────────────────────────────
export interface PurokChangeRequest {
  id: string;
  userId: string;
  userName: string;
  userUsername?: string;
  barangay: string;
  previousPurok: string;
  requestedPurok: string;
  contactNumber?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// ─── Offline SMS & Email Multi-Channel Dispatch Logs ───────────────────
export interface OfflineDispatchLog {
  id: string;
  userId?: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  channel: 'SMS' | 'EMAIL' | 'SMS_AND_EMAIL';
  subject: string;
  message: string;
  dispatchedAt: string;
  status: 'delivered' | 'sent';
}

export interface Vaccination {
  id: string;
  petId: string;
  vaccineType: string;
  dateAdministered: string;
  nextBoosterDue: string;
  veterinarian: string;
  clinicName?: string;
  notes?: string;
  createdAt: string;
}

export type IncidentType = 'animal-bite' | 'road-accident' | 'stray-sighting' | 'sanitation-violation';
export type IncidentStatus = 'pending' | 'under-investigation' | 'resolved';

export interface Incident {
  id: string;
  type: IncidentType;
  dateTime: string;
  barangay: string;
  address: string;
  description: string;
  animalDescription?: string;
  reporterName?: string;
  reporterContact?: string;
  photo?: string;
  status: IncidentStatus;
  assignedTo?: string;
  resolutionNotes?: string;
  linkedPetId?: string;
  reportedAt: string;
}

export type NotificationType =
  | 'booster-due'
  | 'booster-overdue'
  | 'new-incident'
  | 'incident-update'
  | 'pet-pending'
  | 'new-bite-case'
  | 'adoption-request'
  | 'stray-alert'
  | 'owner-pending'
  | 'owner-verified'
  | 'transfer-request'
  | 'pet-transferred'
  | 'pet-deceased'
  | 'sms-alert'
  | 'purok-change-request'
  | 'purok-approved'
  | 'purok-rejected';

export interface AuditLog {
  id: string;
  action: 'TRANSFER_OWNERSHIP' | 'MARK_DECEASED' | 'VERIFY_OWNER' | 'VERIFY_PET' | 'PASSWORD_RESET' | 'REGISTER_PET' | 'PUROK_CHANGE';
  targetType: 'pet' | 'user' | 'vaccination';
  targetId: string;
  targetName?: string;
  details: string;
  performedBy: string;
  performedByName?: string;
  timestamp: string;
}

export interface SmsReminderLog {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  recipientName: string;
  recipientPhone: string;
  vaccineType: string;
  dueDate: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed';
  sentAt: string;
}

// ─── Stray Sightings ───────────────────────────────────────────────────
export interface StraySighting {
  id: string;
  species: Species;
  barangay: string;
  address?: string;
  description: string;
  photo?: string;
  reporterName?: string;
  reporterContact?: string;
  collarTag?: string;
  linkedPetId?: string;
  status: 'open' | 'reviewed' | 'captured' | 'returned';
  reportedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
  crossBarangayAlert?: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  relatedId?: string;
  petId?: string;
  incidentId?: string;
  userId?: string;
  targetRole?: UserRole;
  targetBarangay?: string;
  isRead: boolean;
  createdAt: string;
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Municipal Admin',
  operator: 'Barangay Operator',
  owner: 'Pet Owner',
  bite_center: 'Bite Center Staff',
  vet_clinic: 'Private Vet Clinic',
};

export const BARANGAYS = [
  'Bacolod (Poblacion)',
  'Bagsangan',
  'Batang',
  'Bolos',
  'Buenavista',
  'Bulawan',
  'Carriedo',
  'Casini',
  'Cawayan',
  'Cogon',
  'Gabao',
  'Gulang-Gulang',
  'Gumapia',
  'Liang',
  'Macawayan',
  'Mapaso',
  'Monbon',
  'Patag',
  'Salvacion',
  'San Agustin (Poblacion)',
  'San Isidro (Palogtok)',
  'San Juan (Poblacion)',
  'San Julian (Poblacion)',
  'San Pedro (Poblacion)',
  'Santo Domingo (Lamboon)',
  'Tabon-Tabon',
  'Tinampo',
  'Tongdol',
];

export const VACCINE_TYPES = [
  'Anti-Rabies Vaccine', 'DHLPP (5-in-1)', 'Bordetella',
  'Leptospirosis', 'Canine Influenza', 'Feline FVRCP',
  'Feline Leukemia (FeLV)', 'Rabies Booster',
];

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  'animal-bite': 'Animal Bite',
  'road-accident': 'Road Accident',
  'stray-sighting': 'Stray Sighting',
  'sanitation-violation': 'Sanitation Violation',
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  'pending': 'Pending',
  'under-investigation': 'Under Investigation',
  'resolved': 'Resolved',
};
