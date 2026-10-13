import type {
  AdoptionListing,
  AuditLog,
  BiteCase,
  Incident,
  Notification,
  OfflineDispatchLog,
  Pet,
  PurokChangeRequest,
  SmsReminderLog,
  StraySighting,
  Vaccination,
} from '@/types/types';

export const CLOUD_COLLECTIONS = [
  'pets',
  'vaccinations',
  'incidents',
  'notifications',
  'biteCases',
  'adoptionListings',
  'straySightings',
  'auditLogs',
  'smsLogs',
  'purokRequests',
  'offlineDispatches',
] as const;

export type CloudCollection = (typeof CLOUD_COLLECTIONS)[number];

export interface CloudRecord {
  record_type: CloudCollection;
  record_id: string;
  owner_profile_id: string | null;
  barangay: string | null;
  payload: Record<string, unknown>;
}

export type CloudRecordRow = CloudRecord & {
  created_by_profile_id: string | null;
  updated_at: string;
};

type CloudCollections = Partial<Record<CloudCollection, unknown[]>>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || !('id' in value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function recordsFromCollections(
  collections: CloudCollections,
  currentProfileId: string,
): CloudRecord[] {
  const petRows = (collections.pets ?? []).filter((value): value is Pet => asRecord(value) !== null);
  const petOwners = new Map(petRows.map(pet => [pet.id, text(pet.ownerId)]));

  return CLOUD_COLLECTIONS.flatMap(recordType =>
    (collections[recordType] ?? []).flatMap(value => {
      const payload = asRecord(value);
      if (!payload) return [];

      let ownerProfileId: string | null = null;
      if (recordType === 'pets') {
        ownerProfileId = text(payload.ownerId);
      } else if (recordType === 'vaccinations') {
        ownerProfileId = petOwners.get(String(payload.petId)) ?? null;
      } else if (recordType === 'notifications') {
        ownerProfileId = text(payload.userId);
      } else if (recordType === 'adoptionListings') {
        ownerProfileId = text(payload.ownerId);
      } else if (recordType === 'purokRequests') {
        ownerProfileId = text(payload.userId);
      } else if (recordType === 'auditLogs' || recordType === 'smsLogs' || recordType === 'offlineDispatches') {
        ownerProfileId = currentProfileId;
      }

      const barangay =
        text(payload.barangay) ??
        text(payload.petBarangay) ??
        text(payload.targetBarangay) ??
        null;

      return [{
        record_type: recordType,
        record_id: String(payload.id),
        owner_profile_id: ownerProfileId,
        barangay,
        payload,
      }];
    }),
  );
}

export function collectionsFromRows(rows: CloudRecordRow[]): CloudCollections {
  const collections: CloudCollections = Object.fromEntries(
    CLOUD_COLLECTIONS.map(collection => [collection, []]),
  ) as CloudCollections;

  for (const row of rows) {
    collections[row.record_type]?.push(row.payload);
  }

  return collections;
}

export function serializeCloudRecord(record: CloudRecord): string {
  return JSON.stringify(record);
}

export type AppCloudRecordTypes =
  | Pet
  | Vaccination
  | Incident
  | Notification
  | BiteCase
  | AdoptionListing
  | StraySighting
  | AuditLog
  | SmsReminderLog
  | PurokChangeRequest
  | OfflineDispatchLog;
