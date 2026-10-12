import type { User, Pet, Vaccination, Incident, Notification, BiteCase, AdoptionListing, StraySighting } from '@/types/types';

// ─── Users ────────────────────────────────────────────────────────────
export const SEED_USERS: User[] = [
  {
    id: 'USR001', name: 'Admin LGU Irosin', email: 'admin@irosin.gov.ph',
    password: '123', role: 'admin', barangay: 'San Julian (Poblacion)',
    status: 'active', createdAt: '2024-01-10',
  },
  {
    id: 'USR002', name: 'Maria Santos', email: 'operator@irosin.gov.ph',
    password: 'operator123', role: 'operator', barangay: 'San Juan (Poblacion)',
    operatorPosition: 'Barangay Health Worker (BHW)',
    status: 'active', createdAt: '2024-01-15',
  },
  {
    id: 'USR003', name: 'Juan dela Cruz', email: 'owner@gmail.com',
    password: '123', role: 'owner', barangay: 'Salvacion',
    purok: 'Purok 1', contactNumber: '09171234567',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    verificationStatus: 'verified',
    status: 'active', createdAt: '2024-02-01',
  },
  {
    id: 'USR004', name: 'Rosa Bautista', email: 'rosa@gmail.com',
    password: 'rosa123', role: 'owner', barangay: 'Tinampo',
    purok: 'Purok 4', contactNumber: '09281234567',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    verificationStatus: 'verified',
    status: 'active', createdAt: '2024-02-10',
  },
  {
    id: 'USR005', name: 'Pedro Reyes', email: 'pedro@barangay.gov.ph',
    password: 'pedro123', role: 'operator', barangay: 'San Pedro (Poblacion)',
    operatorPosition: 'Animal Control Officer',
    status: 'active', createdAt: '2024-01-20',
  },
  // Credential-matched users (username = email prefix, password = 123)
  {
    id: 'USR006', name: 'LGU Administrator', email: 'admin@petreg.gov.ph',
    password: '123', role: 'admin', barangay: 'San Julian (Poblacion)',
    facilityName: 'Irosin Municipal Hall',
    status: 'active', createdAt: '2024-01-01',
  },
  {
    id: 'USR007', name: 'Pet Owner Account', email: 'owner@petreg.gov.ph',
    password: '123', role: 'owner', barangay: 'Salvacion',
    purok: 'Purok 3', contactNumber: '09187654321',
    verificationStatus: 'verified',
    status: 'active', createdAt: '2024-01-05',
  },
  {
    id: 'USR008', name: 'Bacolod Barangay Operator', email: 'op_bacolod@petreg.gov.ph',
    password: '123', role: 'operator', barangay: 'Bacolod (Poblacion)',
    operatorPosition: 'Animal Control Officer',
    status: 'active', createdAt: '2024-01-08',
  },
  {
    id: 'USR009', name: 'Irosin ABTC Staff', email: 'bite_center@petreg.gov.ph',
    password: '123', role: 'bite_center', barangay: 'San Julian (Poblacion)',
    facilityName: 'Irosin Animal Bite Treatment Center',
    status: 'active', createdAt: '2024-01-10',
  },
  {
    id: 'USR010', name: 'Dr. Grace Sanchez', email: 'vet_clinic@petreg.gov.ph',
    password: '123', role: 'vet_clinic', barangay: 'San Julian (Poblacion)',
    facilityName: 'Irosin Veterinary Clinic',
    status: 'active', createdAt: '2024-01-12',
  },
  // Pending Owner for demonstration of verification workflow
  {
    id: 'USR011', name: 'Elena Cruz', email: 'elena.cruz@gmail.com',
    password: '123', role: 'owner', barangay: 'Bacolod (Poblacion)',
    purok: 'Purok 2', contactNumber: '09198765432',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    verificationStatus: 'pending',
    proofDocument: 'Barangay_Certificate_Residency.pdf',
    idDocumentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    status: 'active', createdAt: '2024-05-15',
  },
  {
    id: 'USR012', name: 'Mark Ramos', email: 'mark.ramos@gmail.com',
    password: '123', role: 'owner', barangay: 'San Juan (Poblacion)',
    purok: 'Purok 5', contactNumber: '09223344556',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    verificationStatus: 'pending',
    proofDocument: 'Utility_Bill_Proof_Meralco.jpg',
    idDocumentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'active', createdAt: '2024-05-18',
  },
  {
    id: 'USR_JOHAN', name: 'John Noel Obiado', email: 'casini.owner@gmail.com',
    username: 'Johan',
    password: '123', role: 'owner', barangay: 'Casini',
    purok: 'Purok 7', contactNumber: '09750612469',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    verificationStatus: 'verified',
    status: 'active', createdAt: '2024-03-10',
  },
];

// ─── Pets ─────────────────────────────────────────────────────────────
export const SEED_PETS: Pet[] = [
  {
    id: 'PET001', name: 'Bantay', species: 'dog', breed: 'Aspin', color: 'Brown & White',
    age: 3, sex: 'male', ownerName: 'Juan dela Cruz', ownerContact: '09171234567',
    ownerAddress: '12 Rizal St., Salvacion', barangay: 'Salvacion',
    status: 'owned', isSpayedNeutered: false, registeredById: 'USR002',
    registeredAt: '2024-03-01', qrCode: 'PET001', ownerId: 'USR003',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80',
  },
  {
    id: 'PET002', name: 'Muning', species: 'cat', breed: 'Puspin', color: 'Orange Tabby',
    age: 2, sex: 'female', ownerName: 'John Noel Obiado', ownerContact: '09750612469',
    ownerAddress: 'Purok 7, Casini, Irosin', barangay: 'Casini',
    status: 'owned', isSpayedNeutered: true, registeredById: 'USR002',
    registeredAt: '2024-03-05', qrCode: 'PET002', ownerId: 'USR_JOHAN',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80',
    previousOwners: [
      {
        ownerId: 'USR003',
        ownerName: 'Juan dela Cruz',
        ownerContact: '09171234567',
        transferDate: '2026-10-11',
        authorizedBy: 'Juan dela Cruz',
      },
    ],
  },
  {
    id: 'PET003', name: 'Rex', species: 'dog', breed: 'German Shepherd', color: 'Black & Tan',
    age: 5, sex: 'male', ownerName: 'Rosa Bautista', ownerContact: '09281234567',
    ownerAddress: '7 Mabini Ave., Tinampo', barangay: 'Tinampo',
    status: 'owned', isSpayedNeutered: false, registeredById: 'USR005',
    registeredAt: '2024-02-20', qrCode: 'PET003', ownerId: 'USR004',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1568572933382-74d440642117?w=200&q=80',
  },
  {
    id: 'PET004', name: 'Mikmik', species: 'cat', breed: 'Puspin', color: 'Black & White',
    age: 1, sex: 'female', ownerName: 'Rosa Bautista', ownerContact: '09281234567',
    ownerAddress: '7 Mabini Ave., Tinampo', barangay: 'Tinampo',
    status: 'owned', isSpayedNeutered: true, registeredById: 'USR005',
    registeredAt: '2024-04-10', qrCode: 'PET004', ownerId: 'USR004',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=200&q=80',
  },
  {
    id: 'PET005', name: 'Brownie', species: 'dog', breed: 'Labrador Mix', color: 'Brown',
    age: 4, sex: 'female', ownerName: 'Carlos Gomez', ownerContact: '09391234567',
    ownerAddress: '3 Quezon Blvd., San Juan', barangay: 'San Juan',
    status: 'owned', isSpayedNeutered: true, registeredById: 'USR002',
    registeredAt: '2024-01-25', qrCode: 'PET005',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=200&q=80',
  },
  {
    id: 'PET006', name: 'Stray Dog #1', species: 'dog', breed: 'Aspin', color: 'Gray',
    age: 2, sex: 'male', ownerName: 'LGU Irosin', ownerContact: '056-555-0001',
    ownerAddress: 'Barangay Hall, San Pedro (Poblacion)', barangay: 'San Pedro (Poblacion)',
    status: 'stray', isSpayedNeutered: false, registeredById: 'USR005',
    registeredAt: '2024-05-01', qrCode: 'PET006',
    verificationStatus: 'verified', impounded: true, eligibleForAdoption: true,
    isForAdoptionOrSale: true, adoptionType: 'free',
  },
  {
    id: 'PET007', name: 'Snowball', species: 'cat', breed: 'Persian Mix', color: 'White',
    age: 3, sex: 'male', ownerName: 'Ana Villanueva', ownerContact: '09451234567',
    ownerAddress: '22 Luna St., San Agustin', barangay: 'San Agustin',
    status: 'owned', isSpayedNeutered: true, registeredById: 'USR002',
    registeredAt: '2024-03-18', qrCode: 'PET007',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&q=80',
  },
  {
    id: 'PET008', name: 'Blackie', species: 'dog', breed: 'Aspin', color: 'Black',
    age: 6, sex: 'male', ownerName: 'Ben Torres', ownerContact: '09561234567',
    ownerAddress: '5 Aguinaldo St., Cogon', barangay: 'Cogon',
    status: 'owned', isSpayedNeutered: false, registeredById: 'USR002',
    registeredAt: '2024-02-14', qrCode: 'PET008',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&q=80',
  },
  {
    id: 'PET009', name: 'Kitty', species: 'cat', breed: 'Puspin', color: 'Calico',
    age: 2, sex: 'female', ownerName: 'Luz Fernandez', ownerContact: '09671234567',
    ownerAddress: '18 Bonifacio St., Gate', barangay: 'Gate',
    status: 'owned', isSpayedNeutered: true, registeredById: 'USR005',
    registeredAt: '2024-04-22', qrCode: 'PET009',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200&q=80',
  },
  {
    id: 'PET010', name: 'Bruno', species: 'dog', breed: 'Shih Tzu', color: 'Golden White',
    age: 1, sex: 'male', ownerName: 'Mae Ocampo', ownerContact: '09781234567',
    ownerAddress: '9 Rizal St., Pag-asa', barangay: 'Pag-asa',
    status: 'owned', isSpayedNeutered: false, registeredById: 'USR002',
    registeredAt: '2024-06-01', qrCode: 'PET010',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200&q=80',
  },
  {
    id: 'PET011', name: 'Luna', species: 'dog', breed: 'Beagle Mix', color: 'Tri-color',
    age: 2, sex: 'female', ownerName: 'Rico Mendoza', ownerContact: '09891234567',
    ownerAddress: '14 Gen. Luna, Polvorista', barangay: 'Polvorista',
    status: 'owned', isSpayedNeutered: true, registeredById: 'USR005',
    registeredAt: '2024-05-15', qrCode: 'PET011',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&q=80',
  },
  {
    id: 'PET012', name: 'Stray Cat #1', species: 'cat', breed: 'Puspin', color: 'Gray Striped',
    age: 1, sex: 'female', ownerName: 'LGU Irosin', ownerContact: '056-555-0001',
    ownerAddress: 'Barangay Hall, Monbon', barangay: 'Monbon',
    status: 'stray', isSpayedNeutered: false, registeredById: 'USR002',
    registeredAt: '2024-05-20', qrCode: 'PET012',
    verificationStatus: 'verified', impounded: true, eligibleForAdoption: true,
    isForAdoptionOrSale: true, adoptionType: 'free',
  },
  // Pending verification – submitted by a pet owner
  {
    id: 'PET013', name: 'Pogi', species: 'dog', breed: 'Shih Tzu Mix', color: 'White & Brown',
    age: 1, sex: 'male', ownerName: 'Pet Owner Account', ownerContact: '09121234567',
    ownerAddress: '5 Mabini St., Salvacion', barangay: 'Salvacion',
    status: 'owned', isSpayedNeutered: false, registeredById: 'USR007',
    registeredAt: '2024-06-10', qrCode: 'PET013', ownerId: 'USR007',
    verificationStatus: 'pending',
    photo: 'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=200&q=80',
  },
  {
    id: 'PET014', name: 'Whiskers', species: 'cat', breed: 'Puspin', color: 'Tabby Orange',
    age: 2, sex: 'female', ownerName: 'Bacolod Barangay Operator', ownerContact: '09131234567',
    ownerAddress: '10 Rizal St., Bacolod', barangay: 'Bacolod',
    status: 'owned', isSpayedNeutered: true, registeredById: 'USR008',
    registeredAt: '2024-06-12', qrCode: 'PET014', ownerId: 'USR008',
    verificationStatus: 'pending',
    photo: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=200&q=80',
  },
  {
    id: 'PET015', name: 'Edor', species: 'dog', breed: 'Aspin', color: 'Brown',
    age: 2, sex: 'male', ownerName: 'John Noel Obiado', ownerContact: '09750612469',
    ownerAddress: 'Purok 7, Casini, Irosin', barangay: 'Casini',
    status: 'owned', isSpayedNeutered: false, registeredById: 'USR002',
    registeredAt: '2024-04-12', qrCode: 'PET015', ownerId: 'USR_JOHAN',
    verificationStatus: 'verified',
    photo: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&q=80',
  },
];

// ─── Vaccinations ─────────────────────────────────────────────────────
const today = new Date();
const pastDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};
const futureDate = (daysAhead: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export const SEED_VACCINATIONS: Vaccination[] = [
  {
    id: 'VAC001', petId: 'PET001', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(365), nextBoosterDue: futureDate(5),
    veterinarian: 'Dr. Grace Sanchez', createdAt: pastDate(365),
  },
  {
    id: 'VAC002', petId: 'PET001', vaccineType: 'DHLPP (5-in-1)',
    dateAdministered: pastDate(180), nextBoosterDue: futureDate(185),
    veterinarian: 'Dr. Grace Sanchez', createdAt: pastDate(180),
  },
  {
    id: 'VAC003', petId: 'PET002', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(400), nextBoosterDue: pastDate(35),
    veterinarian: 'Dr. Joel Ramos', createdAt: pastDate(400),
  },
  {
    id: 'VAC004', petId: 'PET002', vaccineType: 'Feline FVRCP',
    dateAdministered: pastDate(200), nextBoosterDue: futureDate(165),
    veterinarian: 'Dr. Joel Ramos', createdAt: pastDate(200),
  },
  {
    id: 'VAC005', petId: 'PET003', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(300), nextBoosterDue: futureDate(65),
    veterinarian: 'Dr. Grace Sanchez', createdAt: pastDate(300),
  },
  {
    id: 'VAC006', petId: 'PET003', vaccineType: 'DHLPP (5-in-1)',
    dateAdministered: pastDate(150), nextBoosterDue: futureDate(215),
    veterinarian: 'Dr. Grace Sanchez', createdAt: pastDate(150),
  },
  {
    id: 'VAC007', petId: 'PET004', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(60), nextBoosterDue: futureDate(305),
    veterinarian: 'Dr. Joel Ramos', createdAt: pastDate(60),
  },
  {
    id: 'VAC008', petId: 'PET005', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(500), nextBoosterDue: pastDate(135),
    veterinarian: 'Dr. Ben Castillo', createdAt: pastDate(500),
  },
  {
    id: 'VAC009', petId: 'PET007', vaccineType: 'Feline FVRCP',
    dateAdministered: pastDate(90), nextBoosterDue: futureDate(275),
    veterinarian: 'Dr. Ben Castillo', createdAt: pastDate(90),
  },
  {
    id: 'VAC010', petId: 'PET008', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(370), nextBoosterDue: pastDate(5),
    veterinarian: 'Dr. Grace Sanchez', createdAt: pastDate(370),
  },
  {
    id: 'VAC011', petId: 'PET010', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(20), nextBoosterDue: futureDate(18),
    veterinarian: 'Dr. Joel Ramos', notes: 'Puppy first vaccine', createdAt: pastDate(20),
  },
  {
    id: 'VAC012', petId: 'PET011', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(10), nextBoosterDue: futureDate(355),
    veterinarian: 'Dr. Ben Castillo', createdAt: pastDate(10),
  },
  {
    id: 'VAC013', petId: 'PET015', vaccineType: 'Anti-Rabies Vaccine',
    dateAdministered: pastDate(365), nextBoosterDue: '2026-10-11',
    veterinarian: 'Dr. Grace Sanchez', createdAt: pastDate(365),
  },
];

// ─── Incidents ────────────────────────────────────────────────────────
export const SEED_INCIDENTS: Incident[] = [
  {
    id: 'INC001', type: 'animal-bite', dateTime: pastDate(30) + 'T10:30',
    barangay: 'Salvacion', address: 'Near elementary school, Salvacion',
    description: 'A brown dog bit a 10-year-old child. Dog appears unvaccinated.',
    animalDescription: 'Brown Aspin, medium size, no collar',
    reporterName: 'Elena Cruz', reporterContact: '09171111111',
    status: 'resolved', linkedPetId: 'PET001',
    resolutionNotes: 'Vaccination records verified. Dog owner contacted.',
    reportedAt: pastDate(30),
  },
  {
    id: 'INC002', type: 'stray-sighting', dateTime: pastDate(15) + 'T14:00',
    barangay: 'San Pedro (Poblacion)', address: 'Main road near San Pedro market',
    description: 'Pack of stray dogs roaming near the market area. Causing disturbance.',
    animalDescription: 'Group of 3 dogs, mixed colors, no collars',
    reporterName: 'Mario Bato', reporterContact: '09282222222',
    status: 'under-investigation', assignedTo: 'USR005',
    reportedAt: pastDate(15),
  },
  {
    id: 'INC003', type: 'road-accident', dateTime: pastDate(7) + 'T08:15',
    barangay: 'Tinampo', address: 'National highway, Tinampo',
    description: 'A dog was hit by a motorcycle on the national highway.',
    animalDescription: 'Black Aspin, large, old collar visible',
    reporterName: 'Nilo Ramos', reporterContact: '09393333333',
    status: 'pending', reportedAt: pastDate(7),
  },
  {
    id: 'INC004', type: 'sanitation-violation', dateTime: pastDate(5) + 'T09:00',
    barangay: 'San Juan', address: 'Plaza area, San Juan',
    description: 'Dog waste found in the plaza. Owner did not clean up.',
    animalDescription: 'Golden retriever with red collar',
    reporterName: 'Anonymous', reporterContact: '',
    status: 'pending', reportedAt: pastDate(5),
  },
  {
    id: 'INC005', type: 'animal-bite', dateTime: pastDate(2) + 'T16:45',
    barangay: 'Cogon', address: 'Residential area, Cogon',
    description: 'Cat scratch and bite during feeding. Minor wound.',
    animalDescription: 'Black cat, domestic, appeared frightened',
    reporterName: 'Celia Tan', reporterContact: '09504444444',
    status: 'pending', reportedAt: pastDate(2),
  },
  {
    id: 'INC006', type: 'stray-sighting', dateTime: pastDate(45) + 'T11:00',
    barangay: 'Gate', address: 'Near health center, Gate',
    description: 'Injured stray dog found near health center.',
    animalDescription: 'Gray dog, limping, no collar',
    reporterName: 'Nurse on duty', reporterContact: '056-555-0020',
    status: 'resolved', assignedTo: 'USR002',
    resolutionNotes: 'Dog rescued and brought to provincial vet. Registered as PET006.',
    linkedPetId: 'PET006', reportedAt: pastDate(45),
  },
];

// ─── Bite Cases ───────────────────────────────────────────────────────
export const SEED_BITE_CASES: BiteCase[] = [
  {
    id: 'BITE001', patientName: 'Elena Cruz', patientAge: 10,
    incidentDate: pastDate(30), biteLocation: 'Left forearm',
    barangay: 'Salvacion', animalType: 'dog', petId: 'PET001',
    quarantineStatus: 'completed',
    quarantineNotes: 'Animal owner contacted. Dog vaccinated. 14-day quarantine completed.',
    treatmentNotes: 'ARV administered. Wound cleaned and dressed.',
    reportedAt: pastDate(30), reportedBy: 'USR009',
    statusHistory: [
      { status: 'pending', date: pastDate(30), note: 'Case logged' },
      { status: 'under-quarantine', date: pastDate(29), note: 'Animal quarantine initiated' },
      { status: 'completed', date: pastDate(16), note: 'Quarantine completed, case closed' },
    ],
  },
  {
    id: 'BITE002', patientName: 'Mario Reyes', patientAge: 35,
    incidentDate: pastDate(15), biteLocation: 'Right hand',
    barangay: 'San Pedro (Poblacion)', animalType: 'dog',
    quarantineStatus: 'under-quarantine',
    quarantineNotes: 'Stray dog. Animal impounded for observation.',
    treatmentNotes: 'ARV Day 1 administered.',
    reportedAt: pastDate(15), reportedBy: 'USR009',
    statusHistory: [
      { status: 'pending', date: pastDate(15), note: 'Case logged' },
      { status: 'under-quarantine', date: pastDate(14), note: 'Stray dog impounded for 14-day observation' },
    ],
  },
  {
    id: 'BITE003', patientName: 'Celia Tan', patientAge: 28,
    incidentDate: pastDate(2), biteLocation: 'Left ankle',
    barangay: 'Cogon', animalType: 'cat', petId: 'PET009',
    quarantineStatus: 'pending',
    treatmentNotes: 'Wound washed. Pending ARV schedule.',
    reportedAt: pastDate(2), reportedBy: 'USR009',
    statusHistory: [
      { status: 'pending', date: pastDate(2), note: 'New case logged' },
    ],
  },
  {
    id: 'BITE004', patientName: 'Nilo Santos', patientAge: 42,
    incidentDate: pastDate(7), biteLocation: 'Right calf',
    barangay: 'Tinampo', animalType: 'dog',
    quarantineStatus: 'released',
    quarantineNotes: 'Owned dog with valid vaccination. Released after 10-day observation.',
    reportedAt: pastDate(7), reportedBy: 'USR009',
    statusHistory: [
      { status: 'pending', date: pastDate(7), note: 'Case logged' },
      { status: 'under-quarantine', date: pastDate(6), note: '10-day home quarantine' },
      { status: 'released', date: pastDate(1), note: 'Animal healthy, released' },
    ],
  },
];

// ─── Adoption Listings ─────────────────────────────────────────────────
export const SEED_ADOPTION_LISTINGS: AdoptionListing[] = [
  {
    id: 'ADO001', petId: 'PET006', petName: 'Stray Dog #1', petClass: 'dog',
    petBreed: 'Aspin', petBarangay: 'San Pedro (Poblacion)',
    adoptionType: 'free',
    ownerNotes: 'Healthy male dog rescued from the streets. Good with kids. Looking for a loving home.',
    status: 'active', postedAt: pastDate(10),
    ownerName: 'LGU Irosin Pound', ownerPhone: '056-555-0001',
    requests: [],
  },
  {
    id: 'ADO002', petId: 'PET012', petName: 'Stray Cat #1', petClass: 'cat',
    petBreed: 'Puspin', petBarangay: 'Monbon',
    adoptionType: 'free',
    ownerNotes: 'Female cat, gentle temperament. Spayed. Ready for adoption.',
    status: 'active', postedAt: pastDate(5),
    ownerName: 'LGU Irosin Pound', ownerPhone: '056-555-0001',
    requests: [
      {
        id: 'REQ001', listingId: 'ADO002', petId: 'PET012',
        requesterName: 'Ana Reyes', requesterContact: '09451110001',
        message: 'I would love to adopt this cat for my kids.',
        status: 'pending', requestedAt: pastDate(2),
      },
    ],
  },
];

// ─── Notifications ────────────────────────────────────────────────────
export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'NOT001', type: 'booster-overdue',
    title: 'Booster Overdue',
    message: 'Muning (PET002) anti-rabies booster is OVERDUE. Please contact the owner immediately.',
    relatedId: 'PET002', petId: 'PET002', userId: 'USR003', isRead: false,
    createdAt: pastDate(2),
  },
  {
    id: 'NOT002', type: 'booster-due',
    title: 'Booster Due Soon',
    message: 'Bantay (PET001) anti-rabies booster is due in 5 days.',
    relatedId: 'PET001', petId: 'PET001', userId: 'USR003', isRead: false,
    createdAt: pastDate(1),
  },
  {
    id: 'NOT003', type: 'new-incident',
    title: 'New Incident Reported',
    message: 'New animal bite incident reported in Cogon (INC005). Needs review.',
    relatedId: 'INC005', incidentId: 'INC005', userId: 'USR002', isRead: false,
    createdAt: pastDate(2),
  },
  {
    id: 'NOT004', type: 'booster-due',
    title: 'Booster Due Soon',
    message: 'Bruno (PET010) rabies booster due in 18 days.',
    relatedId: 'PET010', petId: 'PET010', userId: 'USR002', isRead: true,
    createdAt: pastDate(3),
  },
  {
    id: 'NOT005', type: 'incident-update',
    title: 'Incident Status Updated',
    message: 'Incident INC002 (Stray sighting, San Pedro) is now under investigation.',
    relatedId: 'INC002', incidentId: 'INC002', userId: 'USR001', isRead: false,
    createdAt: pastDate(10),
  },
  {
    id: 'NOT006', type: 'booster-overdue',
    title: 'Booster Overdue',
    message: 'Brownie (PET005) anti-rabies booster is OVERDUE by 135 days.',
    relatedId: 'PET005', petId: 'PET005', userId: 'USR002', isRead: false,
    createdAt: pastDate(1),
  },
  {
    id: 'NOT007', type: 'new-incident',
    title: 'New Incident Reported',
    message: 'New road accident incident in Tinampo (INC003).',
    relatedId: 'INC003', incidentId: 'INC003', userId: 'USR001', isRead: true,
    createdAt: pastDate(7),
  },
  {
    id: 'NOT008', type: 'pet-pending',
    title: 'Pet Registration Pending',
    message: 'Pogi (PET013) submitted by owner account is awaiting verification.',
    relatedId: 'PET013', petId: 'PET013', userId: 'USR001', isRead: false,
    createdAt: pastDate(1),
  },
  {
    id: 'NOT009', type: 'new-bite-case',
    title: 'New Bite Case Logged',
    message: 'New animal bite case logged: Celia Tan, Cogon. Pending ARV schedule.',
    relatedId: 'BITE003', userId: 'USR001', isRead: false,
    createdAt: pastDate(2),
  },
  {
    id: 'NOT010', type: 'owner-pending',
    title: 'New Owner Registration',
    message: 'Elena Cruz registered claiming residency in Bacolod (Poblacion) (Purok 2). Pending verification.',
    userId: 'USR008',
    isRead: false,
    createdAt: pastDate(1),
  },
  {
    id: 'NOT011', type: 'owner-pending',
    title: 'New Owner Registration',
    message: 'Mark Ramos registered claiming residency in San Juan (Poblacion) (Purok 5). Pending verification.',
    userId: 'USR002',
    isRead: false,
    createdAt: pastDate(1),
  },
];

// ─── Stray Sightings ──────────────────────────────────────────────────
export const SEED_STRAY_SIGHTINGS: StraySighting[] = [
  {
    id: 'SS001', species: 'dog', barangay: 'Salvacion',
    address: 'Near Salvacion Elementary School',
    description: 'Medium-sized brown dog, no collar, limping on front left leg. Appears malnourished.',
    reporterName: 'Juan Dela Cruz', reporterContact: '09171234567',
    status: 'open', reportedAt: pastDate(1), crossBarangayAlert: false,
  },
  {
    id: 'SS002', species: 'dog', barangay: 'Tinampo',
    address: 'Tinampo Barangay Road, near the basketball court',
    description: 'Black and white dog with red collar but no tag. Very aggressive.',
    reporterName: 'Anonymous', collarTag: 'no-tag',
    status: 'reviewed', reportedAt: pastDate(3), crossBarangayAlert: true,
    reviewedBy: 'USR002', reviewNotes: 'Dispatched patrol. Cross-barangay alert issued to San Juan.',
  },
  {
    id: 'SS003', species: 'cat', barangay: 'San Juan',
    address: 'Public market area',
    description: 'Gray tabby cat, injured ear, wandering the market. Possibly abandoned.',
    reporterName: 'Nena Santos', reporterContact: '09291234567',
    status: 'captured', reportedAt: pastDate(5), crossBarangayAlert: false,
    reviewedBy: 'USR002', reviewNotes: 'Captured and brought to pound.',
  },
  {
    id: 'SS004', species: 'dog', barangay: 'Cogon',
    address: 'Along the highway near Cogon junction',
    description: 'Large brown dog, thick collar with tag ID: PET-COG-002. May be lost.',
    collarTag: 'PET-COG-002',
    status: 'returned', reportedAt: pastDate(7), crossBarangayAlert: false,
    reviewedBy: 'USR001', reviewNotes: 'Owner found via collar tag. Pet returned.',
  },
];
