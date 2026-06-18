"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  QrCode,
  Users,
  BadgeCheck,
  Banknote,
  CalendarDays,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { AdminToast } from "@/features/admin/_ui";

const navItems = [
  { href: "/admin/scanner", icon: QrCode, label: "Scanner" },
  { href: "/admin/members", icon: Users, label: "Members" },
  { href: "/admin/memberships", icon: BadgeCheck, label: "Memberships" },
  { href: "/admin/payments", icon: Banknote, label: "Payments" },
  { href: "/admin/attendance", icon: CalendarDays, label: "Attendance" },
];

const sectionTitles: Record<string, string> = {
  "/admin/scanner": "QR Check-In",
  "/admin/members": "Members",
  "/admin/memberships": "Memberships",
  "/admin/payments": "Payments",
  "/admin/attendance": "Attendance",
};

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  const pageTitle = sectionTitles[pathname] ?? "Admin";

  // Fetch the logged-in user's name from the session
  useEffect(() => {
    fetch("/api/auth/admin-me")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) {
          setUserName(d.name);
          setUserRole(d.role === "owner" ? "Owner" : "Staff");
        }
      })
      .catch(() => {});
  }, []);

  const firstName = userName.split(" ")[0] || "Staff";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-gym-gray-bg font-inter">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-white border-r border-black/8 flex flex-col shrink-0 overflow-y-auto shadow-[1px_0_0_rgba(0,0,0,0.06)] transition-transform duration-300 transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-0 lg:shadow-[1px_0_0_rgba(0,0,0,0.06)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-black/8 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gym-dark rounded-full w-9 h-9 flex items-center justify-center shrink-0">
              <Image
                src="/icons/dumbbell.svg"
                alt="GymTrack Logo"
                width={18}
                height={18}
                className="object-contain"
              />
            </div>
            <div>
              <div className="font-space font-bold text-[17px] tracking-tight text-gym-dark leading-tight">
                GymTrack
              </div>
              <div className="text-[10px] text-gray-400 font-inter tracking-widest uppercase">
                Staff &amp; Admin
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gym-dark transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5 p-3.5 pt-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full text-sm font-inter transition-all duration-100 ${
                  active
                    ? "bg-gym-lime text-gym-dark font-semibold"
                    : "text-gray-500 hover:bg-gray-100 font-normal"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User / sign-out */}
        <div className="border-t border-black/8 p-3.5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 cursor-pointer group w-full text-left bg-transparent border-none p-0"
          >
            <div className="w-8 h-8 rounded-full bg-gym-dark flex items-center justify-center text-gym-lime shrink-0 text-[10px] font-bold font-space">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-gym-dark font-inter truncate">
                {firstName}
              </div>
              <div className="text-[11px] text-gray-400 font-inter">{userRole || "Staff"}</div>
            </div>
            <LogOut
              size={14}
              className="text-gray-300 group-hover:text-gray-500 transition-colors"
            />
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-black/8 px-4 lg:px-7 py-3.5 flex items-center sticky top-0 z-10">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1 mr-3 text-gray-500 hover:text-gym-dark transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <span className="font-space font-bold text-xl tracking-tight text-gym-dark">
            {pageTitle}
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gym-lime shadow-[0_0_0_3px_rgba(200,255,0,0.25)]" />
              <span className="text-xs text-gray-400 font-inter">
                gymtrack.app/admin
              </span>
            </div>
            {/* User pill */}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 bg-gray-50 border border-black/10 rounded-full px-2.5 py-1 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-gym-dark flex items-center justify-center text-gym-lime text-[8px] font-bold font-space">
                {initials}
              </div>
              <span className="text-xs font-semibold font-inter text-gym-dark hidden sm:inline">
                {firstName}
              </span>
              <LogOut size={12} className="text-gray-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-7 overflow-y-auto">{children}</main>
      </div>

      <AdminToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </div>
  );
}
