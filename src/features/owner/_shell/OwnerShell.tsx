"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X, QrCode } from "lucide-react";
import { OwnerToast } from "@/features/owner/_ui";

/* ── Nav items with inline SVG icons matching the Figma ── */
const navItems = [
  {
    href: "/owner/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/owner/scanner",
    label: "Scanner",
    icon: <QrCode size={17} />,
  },
  {
    href: "/owner/members",
    label: "Members",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="4"/>
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        <path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
      </svg>
    ),
  },
  {
    href: "/owner/memberships",
    label: "Memberships",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    href: "/owner/payments",
    label: "Payments",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
  },
  {
    href: "/owner/attendance",
    label: "Attendance",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  },
  {
    href: "/owner/staff-users",
    label: "Staff & users",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

/* Section → URL slug for the top bar */
const sectionSlug: Record<string, string> = {
  "/owner/dashboard":   "dashboard",
  "/owner/scanner":     "scanner",
  "/owner/members":     "members",
  "/owner/memberships": "memberships",
  "/owner/payments":    "payments",
  "/owner/attendance":  "attendance",
  "/owner/staff-users": "staff-users",
};

interface OwnerShellProps { children: React.ReactNode }

export function OwnerShell({ children }: OwnerShellProps) {
  const pathname = usePathname();
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });
  const [mobileOpen, setMobileOpen] = useState(false);

  const slug = sectionSlug[pathname] ?? "owner";

  return (
    <div className="min-h-screen flex bg-[#E8E8E8] font-inter">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white flex flex-col shrink-0 overflow-y-auto transition-transform duration-300 transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 200, borderRight: "1px solid rgba(0,0,0,0.10)", padding: "18px 12px" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between" style={{ gap: 10, padding: "0 6px 22px" }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <span
              className="flex items-center justify-center shrink-0"
              style={{ width: 32, height: 32, borderRadius: "50%", background: "#0F0F0F" }}
            >
              <Image
                src="/icons/dumbbell.svg"
                alt="GymTrack Logo"
                width={16}
                height={16}
                className="object-contain"
              />
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-space-grotesk, sans-serif)", color: "#0F0F0F", letterSpacing: "-0.03em" }}>
              GymTrack
            </span>
          </div>
          {/* Close button (mobile only) */}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gym-dark cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {navItems.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", fontSize: 13, borderRadius: 999,
                  cursor: "pointer", fontWeight: active ? 700 : 500,
                  marginBottom: 4, transition: "background 0.12s",
                  background: active ? "#C8FF00" : "transparent",
                  color: active ? "#0A0A0A" : "#5C5C5C",
                  fontFamily: "var(--font-inter, sans-serif)",
                  textDecoration: "none",
                }}
              >
                <span style={{ color: active ? "#0A0A0A" : "#9A9A9A", display: "flex", flexShrink: 0 }}>
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User / sign-out — initials avatar "EG", name "Elena G.", role "Owner" */}
        <Link
          href="/owner/login"
          onClick={() => setMobileOpen(false)}
          style={{
            borderTop: "1px solid rgba(0,0,0,0.10)",
            paddingTop: 14, marginTop: 8,
            display: "flex", alignItems: "center", gap: 9,
            cursor: "pointer", padding: "14px 8px 4px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 30, height: 30, borderRadius: "50%", background: "#F0F0F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#5C5C5C", flexShrink: 0, border: "1px solid rgba(0,0,0,0.10)",
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-space-grotesk, sans-serif)",
            }}
          >
            EG
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#0F0F0F", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Elena G.
            </div>
            <div style={{ fontSize: 10, color: "#9A9A9A" }}>Owner</div>
          </div>
          {/* Logout icon matching Figma */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </Link>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar — matches Figma exactly: lock icon + URL on left, initials + name·role on right */}
        <div
          className="flex items-center shrink-0 px-4 lg:px-6"
          style={{
            height: 46, borderBottom: "1px solid rgba(0,0,0,0.10)",
            background: "#FFFFFF", gap: 8,
          }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden mr-2 text-gray-500 hover:text-gym-dark cursor-pointer"
          >
            <Menu size={18} />
          </button>

          {/* Lock icon */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>

          {/* URL slug in monospace */}
          <span style={{ fontSize: 11, color: "#9A9A9A", fontFamily: "var(--font-mono, monospace)" }}>
            gymtrack.app/{slug}
          </span>

          {/* Right: initials avatar + name · role */}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9A9A9A", display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 22, height: 22, borderRadius: "50%", background: "#0F0F0F",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "#C8FF00",
                fontFamily: "var(--font-space-grotesk, sans-serif)",
              }}
            >
              EG
            </span>
            <span className="hidden sm:inline">Elena G. · Owner</span>
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      <OwnerToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  );
}
