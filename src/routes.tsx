import type { ReactNode } from 'react';

import { AppLayout } from '@/components/layouts/AppLayout';
import { PublicLayout } from '@/components/layouts/PublicLayout';

import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PetRegistryPage } from '@/pages/PetRegistryPage';
import { RegisterPetPage } from '@/pages/RegisterPetPage';
import { PetProfilePage } from '@/pages/PetProfilePage';
import { VaccinationsPage } from '@/pages/VaccinationsPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { IncidentDetailPage } from '@/pages/IncidentDetailPage';
import { ReportIncidentPage } from '@/pages/ReportIncidentPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { QRLookupPage } from '@/pages/QRLookupPage';
import { PublicPetPage } from '@/pages/PublicPetPage';
import { BiteCenterPage } from '@/pages/BiteCenterPage';
import { VetClinicPage } from '@/pages/VetClinicPage';
import { AdoptionBoardPage } from '@/pages/AdoptionBoardPage';
import { StrayReportPage } from '@/pages/StrayReportPage';
import { PublicVerifyPage } from '@/pages/PublicVerifyPage';

import { OwnerCompleteProfilePage } from '@/pages/OwnerCompleteProfilePage';

export interface RouteConfig {
  path: string;
  element: ReactNode;
}

export const routes: RouteConfig[] = [
  // ── Public routes ──────────────────────────────────────────────────
  { path: '/', element: <PublicLayout><LandingPage /></PublicLayout> },
  { path: '/login', element: <PublicLayout><LandingPage /></PublicLayout> },
  { path: '/register', element: <LoginPage /> },
  { path: '/Register', element: <LoginPage /> },
  { path: '/signup', element: <LoginPage /> },
  { path: '/SignUp', element: <LoginPage /> },
  { path: '/register-owner', element: <LoginPage /> },
  { path: '/Register-owner', element: <LoginPage /> },
  { path: '/report-incident', element: <PublicLayout><ReportIncidentPage /></PublicLayout> },
  { path: '/pet/:id', element: <PublicPetPage /> },
  { path: '/complete-profile', element: <OwnerCompleteProfilePage /> },

  // ── Authenticated routes ───────────────────────────────────────────
  { path: '/dashboard', element: <AppLayout><DashboardPage /></AppLayout> },
  { path: '/pets', element: <AppLayout><PetRegistryPage /></AppLayout> },
  { path: '/pets/register', element: <AppLayout><RegisterPetPage /></AppLayout> },
  { path: '/pets/:id', element: <AppLayout><PetProfilePage /></AppLayout> },
  { path: '/vaccinations', element: <AppLayout><VaccinationsPage /></AppLayout> },
  { path: '/incidents', element: <AppLayout><IncidentsPage /></AppLayout> },
  { path: '/incidents/:id', element: <AppLayout><IncidentDetailPage /></AppLayout> },
  { path: '/analytics', element: <AppLayout><AnalyticsPage /></AppLayout> },
  { path: '/notifications', element: <AppLayout><NotificationsPage /></AppLayout> },
  { path: '/qr-lookup', element: <AppLayout><QRLookupPage /></AppLayout> },
  { path: '/settings', element: <AppLayout><SettingsPage /></AppLayout> },

  // ── New role-specific routes ───────────────────────────────────────
  { path: '/bite-cases',    element: <AppLayout><BiteCenterPage /></AppLayout> },
  { path: '/vet-clinic',    element: <AppLayout><VetClinicPage /></AppLayout> },
  { path: '/adoption',      element: <AppLayout><AdoptionBoardPage /></AppLayout> },
  { path: '/stray-reports', element: <AppLayout><StrayReportPage /></AppLayout> },
  // ── Public (no auth required) ──────────────────────────────────────
  { path: '/verify',        element: <PublicVerifyPage /> },
];
