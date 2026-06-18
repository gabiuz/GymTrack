"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "find" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("find");

  // Step 1 — find account
  const [identifier, setIdentifier] = useState("");
  const [findLoading, setFindLoading] = useState(false);
  const [findError, setFindError] = useState("");
  const [userName, setUserName] = useState("");
  const [token, setToken] = useState("");

  // Step 2 — reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // ── Step 1: Find account ─────────────────────────────────────────────────
  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    setFindError("");
    setFindLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFindError(data.error ?? "Something went wrong.");
        return;
      }
      if (!data.found) {
        setFindError("No account found with that Member ID or name. Please check and try again.");
        return;
      }
      setToken(data.token);
      setUserName(data.userName);
      setStep("reset");
    } catch {
      setFindError("Network error — please try again.");
    } finally {
      setFindLoading(false);
    }
  }

  // ── Step 2: Reset password ───────────────────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error ?? "Reset failed.");
        return;
      }
      setStep("done");
    } catch {
      setResetError("Network error — please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );

  return (
    <div className="w-full bg-gym-gray-bg px-5 py-10 grow flex flex-col justify-start">
      <div className="max-w-120 sm:max-w-160 mx-auto w-full flex flex-col gap-6 pt-2">

        {/* Back link */}
        <Link href="/login" className="flex items-center gap-1.5 text-xs font-inter text-[#9aa2b1] hover:text-gym-dark transition-colors w-fit">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to login
        </Link>

        {/* ── STEP 1: Find account ── */}
        {step === "find" && (
          <>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-space font-bold text-3xl leading-[30.8px] tracking-[-0.5px] text-gym-dark">
                Forgot password
              </h1>
              <p className="font-inter font-normal text-sm leading-5 tracking-tight text-[#6b7280]">
                Enter your Member ID or full name to find your account.
              </p>
            </div>

            <form onSubmit={handleFind} className="flex flex-col gap-5 mt-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="fp-identifier" className="font-inter font-semibold text-xs tracking-[-0.08px] text-gym-dark">
                  Member ID or full name
                </label>
                <input
                  id="fp-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="MEM-000001 or Juan dela Cruz"
                  required
                  className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-2xl h-12.5 px-4 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 tracking-[-0.23px] transition-all"
                />
              </div>

              {findError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="font-inter font-normal text-xs leading-5 text-red-700">{findError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!identifier.trim() || findLoading}
                className={`w-full flex gap-2 items-center justify-center rounded-full py-3.5 px-6 font-space font-medium text-base text-center transition-all duration-200 ${
                  identifier.trim() && !findLoading
                    ? "bg-gym-lime text-gym-dark cursor-pointer hover:opacity-90 active:scale-[0.99]"
                    : "bg-[#f3f5fa] text-[#6b7280] cursor-not-allowed"
                }`}
              >
                {findLoading ? "Searching…" : "Find my account →"}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2: Reset password ── */}
        {step === "reset" && (
          <>
            <div className="flex flex-col gap-1.5">
              <h1 className="font-space font-bold text-3xl leading-[30.8px] tracking-[-0.5px] text-gym-dark">
                Reset password
              </h1>
              <p className="font-inter font-normal text-sm leading-5 tracking-tight text-[#6b7280]">
                Account found for <span className="font-semibold text-gym-dark">{userName}</span>. Set a new password below.
              </p>
            </div>

            <form onSubmit={handleReset} className="flex flex-col gap-5 mt-2">
              {/* New password */}
              <div className="flex flex-col gap-2">
                <label htmlFor="fp-newpw" className="font-inter font-semibold text-xs tracking-[-0.08px] text-gym-dark">
                  New password
                </label>
                <div className="relative w-full">
                  <input
                    id="fp-newpw"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-2xl h-12.5 px-4 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 tracking-[-0.23px] w-full transition-all"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gym-gray-bg rounded-md transition-colors">
                    <EyeIcon open={showNew} />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-2">
                <label htmlFor="fp-confirmpw" className="font-inter font-semibold text-xs tracking-[-0.08px] text-gym-dark">
                  Confirm password
                </label>
                <div className="relative w-full">
                  <input
                    id="fp-confirmpw"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-2xl h-12.5 px-4 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 tracking-[-0.23px] w-full transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gym-gray-bg rounded-md transition-colors">
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>

              {resetError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="font-inter font-normal text-xs leading-5 text-red-700">{resetError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!newPassword || !confirmPassword || resetLoading}
                className={`w-full flex gap-2 items-center justify-center rounded-full py-3.5 px-6 font-space font-medium text-base text-center transition-all duration-200 ${
                  newPassword && confirmPassword && !resetLoading
                    ? "bg-gym-lime text-gym-dark cursor-pointer hover:opacity-90 active:scale-[0.99]"
                    : "bg-[#f3f5fa] text-[#6b7280] cursor-not-allowed"
                }`}
              >
                {resetLoading ? "Resetting…" : "Reset password →"}
              </button>
            </form>
          </>
        )}

        {/* ── STEP 3: Done ── */}
        {step === "done" && (
          <div className="flex flex-col items-center gap-5 mt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gym-lime/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3A5000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h1 className="font-space font-bold text-2xl tracking-tight text-gym-dark mb-1">Password reset!</h1>
              <p className="font-inter text-sm text-[#6b7280]">Your password has been updated successfully.</p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-gym-lime text-gym-dark font-space font-medium text-base rounded-full py-3.5 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer border-none"
            >
              Back to login →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
