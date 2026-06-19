"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Home, LogIn, UserPlus, QrCode, IdCard, LogOut } from "lucide-react";

const guestNavItems = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Log in", href: "/login", Icon: LogIn },
  { label: "Register", href: "/register", Icon: UserPlus },
];

const memberNavItems = [
  { label: "Home", href: "/", Icon: Home },
  { label: "My Pass", href: "/my-pass", Icon: QrCode },
  { label: "Status", href: "/membership", Icon: IdCard },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  // Detect session from sessionStorage (written by LoginForm on successful login)
  useEffect(() => {
    const data = sessionStorage.getItem("member_data");
    setIsLoggedIn(!!data);
  }, [pathname]); // re-check on every route change

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = isLoggedIn ? memberNavItems : guestNavItems;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="mx-auto max-w-3xl w-full px-4 h-12.5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="bg-gym-dark rounded-lg w-6 h-6 flex items-center justify-center shrink-0">
            <Image
              src="/icons/dumbbell-white.svg"
              alt="GymTrack Logo"
              width={13}
              height={13}
              className="object-contain"
            />
          </div>
          <span className="font-space font-bold text-base tracking-tight text-gym-dark">
            GymTrack
          </span>
        </Link>

        {/* Tablet Navigation Menu */}
        <nav className="hidden sm:flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <Link
                href="/my-pass"
                className={`font-space text-sm font-bold transition-opacity ${isActive("/my-pass", pathname)
                  ? "text-gym-dark opacity-100"
                  : "text-gym-dark opacity-50 hover:opacity-80"
                  }`}
              >
                My Pass
              </Link>
              <Link
                href="/membership"
                className={`font-space text-sm font-bold transition-opacity ${isActive("/membership", pathname)
                  ? "text-gym-dark opacity-100"
                  : "text-gym-dark opacity-50 hover:opacity-80"
                  }`}
              >
                Status
              </Link>
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/auth/logout", { method: "POST" });
                    sessionStorage.removeItem("member_data");
                    setIsLoggedIn(false);
                    window.location.href = "/login";
                  } catch (e) {
                    console.error("Logout failed:", e);
                  }
                }}
                className="font-space text-xs font-bold border border-gym-dark/20 text-gym-dark rounded-full py-2 px-4 hover:bg-gym-dark/5 transition-colors flex items-center gap-1.5"
              >
                <LogOut size={13} />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-space text-sm font-bold text-gym-dark hover:opacity-80 transition-opacity ml-2"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="font-space text-xs font-bold bg-gym-lime text-gym-dark rounded-full py-2 px-4 hover:opacity-90 transition-opacity"
              >
                Register now
              </Link>
            </>
          )}
        </nav>

        {/* Hamburger Button (Mobile Only) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Toggle menu"
          className="p-1 hover:bg-gym-gray-bg rounded-md transition-colors focus:outline-none select-none sm:hidden z-10"
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Image
              src="/icons/hamburger.svg"
              alt="Menu Icon"
              width={21}
              height={21}
              draggable={false}
              className="object-contain pointer-events-none"
            />
          </motion.div>
        </button>
      </div>

      {/* Interactive Dropdown Menu (Mobile Only) — animated slide-down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.25, ease: [0.87, 0, 0.13, 1] }}
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-md z-50 sm:hidden"
          >
            {/* Menu section header */}
            <div className="mx-auto max-w-3xl px-4 pt-3 pb-1">
              <p className="font-inter text-[11px] font-bold uppercase tracking-[1.4px] text-gym-dark/30 pb-2 border-b border-gray-100">
                Menu
              </p>
            </div>

            {/* Nav items */}
            <div className="mx-auto max-w-3xl px-4 py-1 pb-3 flex flex-col">
              {navItems.map(({ label, href, Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 py-3 px-1 border-b border-gray-100 last:border-b-0 transition-opacity ${active ? "opacity-100" : "opacity-50 hover:opacity-100"
                      }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-gym-dark" : "bg-gym-gray-bg"
                        }`}
                    >
                      <Icon
                        size={15}
                        color={active ? "#C8FF00" : "#6B7280"}
                      />
                    </div>
                    <span className="font-inter text-sm font-medium text-gym-dark">
                      {label}
                    </span>
                  </Link>
                );
              })}

              {/* Logout row (logged-in only) */}
              {isLoggedIn && (
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                      sessionStorage.removeItem("member_data");
                      setIsLoggedIn(false);
                      window.location.href = "/login";
                    } catch (e) {
                      console.error("Logout failed:", e);
                    }
                  }}
                  className="flex items-center gap-3 py-3 px-1 mt-1 opacity-50 hover:opacity-100 transition-opacity w-full text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gym-gray-bg">
                    <LogOut size={15} color="#6B7280" />
                  </div>
                  <span className="font-inter text-sm font-medium text-gym-dark">
                    Log out
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
