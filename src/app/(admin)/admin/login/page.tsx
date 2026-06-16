"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
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
        setError(data.error ?? "Login failed");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gym-gray-bg">
      <div className="w-full max-w-100">

        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gym-dark rounded-full w-14 h-14 flex items-center justify-center">
              <Image
                src="/icons/dumbbell.svg"
                alt="GymTrack Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
          </div>
          <div className="font-space font-bold text-[28px] tracking-tight text-gym-dark mb-1">GymTrack</div>
          <p className="text-sm text-gray-500 font-inter">Staff &amp; Admin — sign in to continue</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-black/8 rounded-xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        >
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
          <div className="mb-6">
            <label className="block text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-1.5 font-inter">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors"
            />
          </div>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-inter">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 text-[15px] font-bold font-space tracking-tight rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <span>Signing in…</span>
            ) : (
              <>
                <span>Sign in</span>
                <Image
                  src="/icons/arrow-right.svg"
                  alt="Arrow Right"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-1.5 font-inter">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          Accounts are created by the admin. No public sign-up.
        </div>
      </div>
    </div>
  );
}
