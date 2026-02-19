"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Database,
  ListChecks,
  Export,
  GearSix,
  List,
  X,
  SignOut,
  Question,
} from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { HelpGuide } from "@/components/app/HelpGuide";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/data", label: "Data", icon: Database },
  { href: "/360-view", label: "360 View", icon: ListChecks },
  { href: "/exports", label: "Exports", icon: Export },
];

function SidebarContent({
  isActive,
  handleSignOut,
  onLinkClick,
  onHelpClick,
}: {
  isActive: (path: string) => boolean;
  handleSignOut: () => void;
  onLinkClick?: () => void;
  onHelpClick: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onLinkClick}>
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">5S</span>
          </div>
          <span className="font-semibold text-gray-900">Baseline</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-primary-100 text-primary"
                  : "text-gray-600 hover:bg-gray-50 hover:text-primary"
              )}
            >
              <Icon className="w-5 h-5" aria-hidden="true" weight="duotone" />
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/settings"
          onClick={onLinkClick}
          aria-current={isActive("/settings") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive("/settings")
              ? "bg-primary-100 text-primary"
              : "text-gray-600 hover:bg-gray-50 hover:text-primary"
          )}
        >
          <GearSix className="w-5 h-5" aria-hidden="true" weight="duotone" />
          Settings
        </Link>
      </nav>

      {/* Help */}
      <div className="px-3 pb-1">
        <button
          onClick={() => {
            onLinkClick?.();
            onHelpClick();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-primary w-full transition-colors"
        >
          <Question className="w-5 h-5" weight="duotone" />
          Help
        </button>
      </div>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={() => {
            onLinkClick?.();
            handleSignOut();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
        >
          <SignOut className="w-5 h-5" weight="duotone" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export function AppNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { signOut } = useAuth();

  const isActive = (path: string) => pathname?.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-40">
        <SidebarContent isActive={isActive} handleSignOut={handleSignOut} onHelpClick={() => setIsHelpOpen(true)} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white font-bold text-sm">5S</span>
          </div>
          <span className="font-semibold text-gray-900">Baseline</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-50"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" weight="bold" />
          ) : (
            <List className="w-5 h-5" weight="bold" />
          )}
        </button>
      </div>

      {/* Mobile slide-out drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 inset-y-0 w-64 bg-white shadow-xl flex flex-col animate-fade-in">
            <SidebarContent
              isActive={isActive}
              handleSignOut={handleSignOut}
              onLinkClick={() => setIsMobileMenuOpen(false)}
              onHelpClick={() => setIsHelpOpen(true)}
            />
          </div>
        </div>
      )}

      <HelpGuide isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}
