"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Mode = "login" | "find" | "reset" | "done";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  // ── Login state ────────────────────────────────────────────────────────────
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Forgot password state ──────────────────────────────────────────────────
  const [fpIdentifier, setFpIdentifier] = useState("");
  const [fpFindError, setFpFindError] = useState("");
  const [fpFindLoading, setFpFindLoading] = useState(false);
  const [fpUserName, setFpUserName] = useState("");
  const [fpToken, setFpToken] = useState("");

  const [fpNewPw, setFpNewPw] = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpShowNew, setFpShowNew] = useState(false);
  const [fpShowConfirm, setFpShowConfirm] = useState(false);
  const [fpResetError, setFpResetError] = useState("");
  const [fpResetLoading, setFpResetLoading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (res.ok) {
        router.push("/admin/scanner");
      } else {
        const data = await res.json();
        setLoginError(data.error ?? "Login failed");
      }
    } catch {
      setLoginError("Network error — please try again");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleFpFind(e: React.FormEvent) {
    e.preventDefault();
    setFpFindError("");
    setFpFindLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: fpIdentifier }),
      });
      const data = await res.json();
      if (!res.ok) { setFpFindError(data.error ?? "Something went wrong."); return; }
      if (!data.found) { setFpFindError("No account found with that username, email or name."); return; }
      setFpToken(data.token);
      setFpUserName(data.userName);
      setMode("reset");
    } catch {
      setFpFindError("Network error — please try again.");
    } finally {
      setFpFindLoading(false);
    }
  }

  async function handleFpReset(e: React.FormEvent) {
    e.preventDefault();
    setFpResetError("");
    if (fpNewPw !== fpConfirmPw) { setFpResetError("Passwords do not match."); return; }
    if (fpNewPw.length < 6) { setFpResetError("Password must be at least 6 characters."); return; }
    setFpResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fpToken, newPassword: fpNewPw }),
      });
      const data = await res.json();
      if (!res.ok) { setFpResetError(data.error ?? "Reset failed."); return; }
      setMode("done");
    } catch {
      setFpResetError("Network error — please try again.");
    } finally {
      setFpResetLoading(false);
    }
  }

  function backToLogin() {
    setMode("login");
    setFpIdentifier(""); setFpFindError(""); setFpUserName(""); setFpToken("");
    setFpNewPw(""); setFpConfirmPw(""); setFpResetError("");
  }

  const EyeBtn = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors">
      {show
        ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gym-gray-bg">
      <div className="w-full max-w-100">

        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gym-dark rounded-full w-14 h-14 flex items-center justify-center">
              <Image src="/icons/dumbbell.svg" alt="GymTrack Logo" width={28} height={28} className="object-contain" />
            </div>
          </div>
          <div className="font-space font-bold text-[28px] tracking-tight text-gym-dark mb-1">GymTrack</div>
          <p className="text-sm text-gray-500 font-inter">
            {mode === "login" ? "Staff & Admin — sign in to continue" : "Reset your password"}
          </p>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="bg-white border border-black/8 rounded-xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5 font-inter">
                Name, username or email
              </label>
              <input
                id="admin-username"
                type="text"
                placeholder="e.g. Rico, rico@gym.app"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors"
              />
            </div>
            <div className="mb-2">
              <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5 font-inter">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 pr-10 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {showPassword
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end mb-5">
              <button
                type="button"
                onClick={() => setMode("find")}
                className="text-[11px] font-inter text-gray-400 hover:text-gym-dark transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Forgot password?
              </button>
            </div>

            {loginError && (
              <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-inter">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="flex items-center justify-center gap-2 w-full py-3 text-[15px] font-bold font-space tracking-tight rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loginLoading ? <span>Signing in…</span> : (
                <>
                  <span>Sign in</span>
                  <Image src="/icons/arrow-right.svg" alt="" width={16} height={16} className="object-contain" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── FIND ACCOUNT ── */}
        {mode === "find" && (
          <div className="bg-white border border-black/8 rounded-xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <button type="button" onClick={backToLogin} className="flex items-center gap-1.5 text-xs font-inter text-gray-400 hover:text-gym-dark transition-colors mb-5 cursor-pointer bg-transparent border-none p-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back to login
            </button>
            <div className="mb-5">
              <div className="font-space font-bold text-lg text-gym-dark mb-1">Forgot password</div>
              <p className="text-[13px] text-gray-400 font-inter">Enter your username, email, or name to find your account.</p>
            </div>
            <form onSubmit={handleFpFind} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5 font-inter">Username, email or name</label>
                <input
                  id="admin-fp-identifier"
                  type="text"
                  placeholder="e.g. Rico, rico@gym.app"
                  value={fpIdentifier}
                  onChange={(e) => setFpIdentifier(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors"
                />
              </div>
              {fpFindError && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-inter">{fpFindError}</div>
              )}
              <button type="submit" disabled={!fpIdentifier.trim() || fpFindLoading}
                className={`w-full py-3 text-[15px] font-bold font-space tracking-tight rounded-full transition-opacity ${fpIdentifier.trim() && !fpFindLoading ? "bg-gym-lime text-gym-dark hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                {fpFindLoading ? "Searching…" : "Find account →"}
              </button>
            </form>
          </div>
        )}

        {/* ── RESET PASSWORD ── */}
        {mode === "reset" && (
          <div className="bg-white border border-black/8 rounded-xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="mb-5">
              <div className="font-space font-bold text-lg text-gym-dark mb-1">Reset password</div>
              <p className="text-[13px] text-gray-400 font-inter">
                Account found: <span className="font-semibold text-gym-dark">{fpUserName}</span>. Set a new password.
              </p>
            </div>
            <form onSubmit={handleFpReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5 font-inter">New password</label>
                <div className="relative">
                  <input id="admin-fp-newpw" type={fpShowNew ? "text" : "password"} value={fpNewPw} onChange={(e) => setFpNewPw(e.target.value)} placeholder="Min. 6 characters" required
                    className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 pr-9 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors" />
                  <EyeBtn show={fpShowNew} toggle={() => setFpShowNew(!fpShowNew)} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5 font-inter">Confirm password</label>
                <div className="relative">
                  <input id="admin-fp-confirmpw" type={fpShowConfirm ? "text" : "password"} value={fpConfirmPw} onChange={(e) => setFpConfirmPw(e.target.value)} placeholder="Re-enter password" required
                    className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 pr-9 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors" />
                  <EyeBtn show={fpShowConfirm} toggle={() => setFpShowConfirm(!fpShowConfirm)} />
                </div>
              </div>
              {fpResetError && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-inter">{fpResetError}</div>
              )}
              <button type="submit" disabled={!fpNewPw || !fpConfirmPw || fpResetLoading}
                className={`w-full py-3 text-[15px] font-bold font-space tracking-tight rounded-full transition-opacity ${fpNewPw && fpConfirmPw && !fpResetLoading ? "bg-gym-lime text-gym-dark hover:opacity-90" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                {fpResetLoading ? "Resetting…" : "Reset password →"}
              </button>
            </form>
          </div>
        )}

        {/* ── DONE ── */}
        {mode === "done" && (
          <div className="bg-white border border-black/8 rounded-xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)] text-center flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-gym-lime/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3A5000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <div className="font-space font-bold text-lg text-gym-dark mb-1">Password reset!</div>
              <p className="text-[13px] text-gray-400 font-inter">Your password has been updated. You can now sign in.</p>
            </div>
            <button onClick={backToLogin} className="w-full py-3 text-[15px] font-bold font-space tracking-tight rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity cursor-pointer border-none">
              Back to sign in →
            </button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-1.5 font-inter">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Accounts are created by the admin. No public sign-up.
        </div>
      </div>
    </div>
  );
}
