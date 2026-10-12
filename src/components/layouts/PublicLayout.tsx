import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PawPrint, Menu, X, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PublicLayoutProps {
  children?: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Report Incident', href: '/report-incident' },
    { label: 'About', href: '/#about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">PetReg Irosin</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link
                key={l.href}
                to={l.href}
                className={`text-sm font-medium hover:text-primary transition-colors ${location.pathname === l.href ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button
              size="sm"
              asChild
              className="gap-1.5 font-semibold"
            >
              <Link to="/register">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
            {links.map(l => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-foreground py-1"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2">
              <Button
                size="sm"
                asChild
                className="w-full gap-1.5 font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                <Link to="/register">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-primary py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PawPrint className="h-5 w-5 text-primary-foreground" />
            <span className="font-bold text-primary-foreground">PetReg Irosin</span>
          </div>
          <p className="text-sm text-primary-foreground/80">
            Web-Based Pet Registry and Monitoring System — RA 9482 Compliant
          </p>
          <p className="text-xs text-primary-foreground/60 mt-1">
            Irosin, Sorsogon, Philippines · Veritas College of Irosin Capstone Project 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
