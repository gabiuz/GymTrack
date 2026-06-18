"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();

  // Form State
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Validation
  const isFormValid = memberId.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: memberId, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Login failed. Please try again.");
        return;
      }

      // Store only safe display data — auth is handled by the server cookie
      if (typeof window !== "undefined") {
        sessionStorage.setItem("member_id", json.data.memberId);
        sessionStorage.setItem("qr_code", json.data.qrCode ?? "");
        sessionStorage.setItem(
          "member_data",
          JSON.stringify({
            memberId: json.data.memberId,
            fullName: json.data.fullName,
            photoUrl: json.data.photoUrl,
          })
        );
      }

      router.push("/my-pass");
    } catch {
      setError("A network error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full bg-gym-gray-bg px-5 py-10 grow flex flex-col justify-start">
      <div className="max-w-120 sm:max-w-160 mx-auto w-full flex flex-col gap-6 pt-2">
        {/* Title and Subtitle */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-space font-bold text-3xl leading-[30.8px] tracking-[-0.5px] text-gym-dark">
            Log in
          </h1>
          <p className="font-inter font-normal text-sm leading-5 tracking-tight text-[#6b7280]">
            Access your QR pass and membership status
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col mt-4 w-full">
          {/* Field 1: Member ID, full name, or contact */}
          <div className="flex flex-col gap-2">
            <label htmlFor="identifier" className="font-inter font-semibold text-xs tracking-[-0.08px] text-gym-dark">
              Member ID or full name
            </label>
            <input
              id="identifier"
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="MEM-000001 or Juan dela Cruz"
              className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-2xl h-12.5 px-4 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 tracking-[-0.23px] transition-all"
              required
            />
          </div>

          {/* Field 2: Password */}
          <div className="flex flex-col gap-2 mt-5 relative">
            <label htmlFor="password" className="font-inter font-semibold text-xs tracking-[-0.08px] text-gym-dark">
              Password
            </label>
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-2xl h-12.5 px-4 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 tracking-[-0.23px] w-full transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gym-gray-bg rounded-md transition-colors focus:outline-none"
              >
                {showPassword ? (
                  /* Eye Slash SVG */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  /* Eye SVG */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end mt-3 w-full">
            <Link
              href="/forgot-password"
              className="font-inter font-medium text-xs text-[#9aa2b1] hover:text-gym-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5 mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="font-inter font-normal text-xs leading-5 text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full flex gap-2 items-center justify-center rounded-full py-3.5 px-6 font-space font-medium text-base text-center transition-all duration-200 mt-8 ${
              isFormValid && !isLoading
                ? "bg-gym-lime text-gym-dark cursor-pointer hover:opacity-90 active:scale-[0.99]"
                : "bg-[#f3f5fa] text-[#6b7280] cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Logging in…
              </>
            ) : (
              <>
                Log in
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

          {/* Separator / Divider */}
          <div className="flex items-center gap-3 py-6 w-full">
            <div className="bg-[#e2e7f0] h-px grow" />
            <span className="font-inter font-normal text-xs text-[#9aa2b1] whitespace-nowrap">
              new to GymTrack?
            </span>
            <div className="bg-[#e2e7f0] h-px grow" />
          </div>

          {/* Create Account Link Action Button */}
          <Link
            href="/register"
            className="w-full border border-[#e2e7f0] hover:bg-gym-dark/5 active:scale-[0.99] transition-all rounded-full py-3.5 font-space font-medium text-base text-center text-gym-dark"
          >
            Create an account
          </Link>
        </form>
      </div>
    </div>
  );
}
