import type { ReactNode } from 'react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, unreadCount, cloudLoading, cloudError } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser) return <Navigate to="/" replace />;

  if (cloudLoading || cloudError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">
            {cloudLoading ? 'Loading your registry...' : 'Registry data unavailable'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {cloudLoading
              ? 'Please wait while PetReg loads the latest data from Supabase.'
              : cloudError}
          </p>
          {cloudError && (
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Desktop Sidebar - Sticky and viewport constrained */}
      <aside className="hidden lg:flex shrink-0 sticky top-0 h-screen max-h-screen z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar open onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        {/* Top header (mobile) */}
        <header className="flex lg:hidden items-center gap-3 px-4 py-3 bg-background border-b sticky top-0 z-40">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary-foreground">PR</span>
            </div>
            <span className="font-semibold text-sm truncate">PetReg Irosin</span>
          </div>
          <Link to="/notifications" className="relative shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 text-xs px-1 pointer-events-none">
                {unreadCount}
              </Badge>
            )}
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
