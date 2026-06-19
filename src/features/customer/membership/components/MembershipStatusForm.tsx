"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type MemberState = "unassigned" | "guest" | "assigned";

export default function MembershipStatusForm() {
  const [fullName, setFullName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberState, setMemberState] = useState<MemberState>("unassigned");

  const [annualStartDate, setAnnualStartDate] = useState<string | null>(null);
  const [annualEndDate, setAnnualEndDate] = useState<string | null>(null);
  const [monthlyEndDate, setMonthlyEndDate] = useState<string | null>(null);

  // Load member info — fetch from API (uses session cookie), fall back to sessionStorage cache
  useEffect(() => {
    if (typeof window === "undefined") return;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          const m = json.data;
          if (m.fullName) setFullName(m.fullName);
          if (m.memberId) setMemberId(m.memberId);
          if (m.membershipStatus === "active" || m.membershipStatus === "expired") {
            setMemberState("assigned");
          }
          if (m.annualStartDate) setAnnualStartDate(m.annualStartDate);
          if (m.annualEndDate) setAnnualEndDate(m.annualEndDate);
          if (m.monthlyEndDate) setMonthlyEndDate(m.monthlyEndDate);
        }
      })
      .catch(() => {
        // Offline fallback — read from sessionStorage cache
        const memberDataRaw = sessionStorage.getItem("member_data");
        if (memberDataRaw) {
          try {
            const parsed = JSON.parse(memberDataRaw);
            if (parsed.fullName) setFullName(parsed.fullName);
          } catch { /* ignore */ }
        }
        const savedMemberId = sessionStorage.getItem("member_id");
        if (savedMemberId) setMemberId(savedMemberId);
      });
  }, []);

  // Format today's date dynamically (e.g. 12 Jun 2026)
  const getFormattedDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getDaysRemaining = (endDateStr: string | null) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getProgressPercentage = (startStr: string | null, endStr: string | null) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const passed = now - start;
    if (total <= 0) return 100;
    const pct = (passed / total) * 100;
    return Math.max(0, Math.min(100, pct));
  };


  return (
    <div className="w-full bg-gym-gray-bg px-5 py-8 grow flex flex-col justify-start">
      <div className="max-w-120 sm:max-w-160 mx-auto w-full flex flex-col gap-6">

        {/* Header Row */}
        <div className="w-full flex items-start justify-between">
          <h1 className="font-space font-bold text-2xl leading-9 sm:leading-10 tracking-tight text-gym-dark">
            Membership<br />
            Status
          </h1>

          <div className={`border rounded-full px-2.5 py-1 flex items-center justify-center shrink-0 mt-1 transition-colors ${memberState === "unassigned"
            ? "bg-gym-gray-bg border-gray-200 text-gym-gray"
            : memberState === "guest"
              ? "bg-gray-100 border-gray-200 text-gym-gray"
              : "bg-green-50 border-green-600/30 text-green-600"
            }`}>
            <span className="font-inter font-semibold text-xs leading-none tracking-wide capitalize">
              {memberState === "assigned" ? "active" : memberState}
            </span>
          </div>
        </div>

        {/* User Labels */}
        <div className="-mt-3">
          <p className="font-inter font-normal text-sm leading-5 tracking-tight text-gym-gray">
            {fullName} &middot; <span className="font-mono text-xs">{memberId}</span>
          </p>
        </div>

        {/* 1. CONDITIONAL RENDER: UNASSIGNED VIEW */}
        {memberState === "unassigned" && (
          <>
            {/* Unassigned Warning Dark Card */}
            <div className="bg-gym-dark rounded-[20px] p-5 w-full flex flex-col items-start shadow-md animate-in fade-in duration-200">
              <div className="flex gap-3 items-center w-full mb-4">
                <div className="bg-white/10 rounded-2xl w-10 h-10 flex items-center justify-center shrink-0">
                  <svg
                    className="animate-spin text-white/50"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="6 6" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-space font-bold text-base leading-6 text-white">
                    No plan assigned yet
                  </h2>
                  <p className="font-inter font-normal text-xs leading-tight text-white/40">
                    Unassigned member
                  </p>
                </div>
              </div>

              <p className="font-inter font-normal text-sm leading-5 text-white/50 pb-5">
                You&apos;re registered and your QR is ready. Visit the counter to activate a plan or pay for a daily visit.
              </p>

              <Link
                href="/my-pass"
                className="bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-2.5 px-4 inline-flex items-center gap-2 text-gym-dark font-space font-bold text-xs"
              >
                View my QR pass
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            {/* Pricing structure listings */}
            <div className="flex flex-col gap-3 animate-in fade-in duration-200">
              <h3 className="font-inter font-bold text-xs leading-none text-gym-dark tracking-widest uppercase">
                What you can get
              </h3>

              <div className="bg-white border border-gray-200 rounded-2xl w-full flex flex-col p-1 shadow-sm">
                {/* Annual membership row */}
                <div className="border-b border-gray-200 px-4 py-3.5 flex gap-3 items-center justify-between">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="bg-gym-dark rounded-xl w-8 h-8 flex items-center justify-center shrink-0 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                        <line x1="7" y1="8" x2="17" y2="8" />
                        <line x1="7" y1="12" x2="17" y2="12" />
                        <line x1="7" y1="16" x2="13" y2="16" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-inter font-semibold text-xs leading-5 text-gym-dark truncate">
                        Annual membership
                      </h4>
                      <p className="font-inter font-normal text-xs leading-none text-gym-gray/60">
                        Unlocks ₱70 daily rate + monthly plans
                      </p>
                    </div>
                  </div>
                  <span className="font-space font-bold text-xs leading-5 text-gym-dark shrink-0">
                    ₱200 / year
                  </span>
                </div>

                {/* Daily visit row */}
                <div className="border-b border-gray-200 px-4 py-3.5 flex gap-3 items-center justify-between">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="bg-gym-dark rounded-xl w-8 h-8 flex items-center justify-center shrink-0 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-inter font-semibold text-xs leading-5 text-gym-dark truncate">
                        Daily visit
                      </h4>
                      <p className="font-inter font-normal text-xs leading-none text-gym-gray/60">
                        Member rate vs non-member
                      </p>
                    </div>
                  </div>
                  <span className="font-space font-bold text-xs leading-5 text-gym-dark shrink-0">
                    ₱70 / ₱75
                  </span>
                </div>

                {/* Monthly plan row */}
                <div className="px-4 py-3.5 flex gap-3 items-center justify-between">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="bg-gym-dark rounded-xl w-8 h-8 flex items-center justify-center shrink-0 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-inter font-semibold text-xs leading-5 text-gym-dark truncate">
                        Monthly plan
                      </h4>
                      <p className="font-inter font-normal text-xs leading-none text-gym-gray/60">
                        Requires active membership
                      </p>
                    </div>
                  </div>
                  <span className="font-space font-bold text-xs leading-5 text-gym-dark shrink-0">
                    from ₱799
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 2. CONDITIONAL RENDER: DAILY GUEST VIEW */}
        {memberState === "guest" && (
          <>
            {/* Guest Visit Dark Card */}
            <div className="bg-gym-dark rounded-[20px] p-5 w-full flex flex-col items-start shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between w-full">
                <span className="font-inter font-bold text-xs leading-[16.5px] text-white/40 tracking-widest uppercase">
                  Today&apos;s visit
                </span>

                <div className="bg-white/10 border border-white/20 rounded-full px-2.5 py-0.5 flex items-center justify-center shrink-0">
                  <span className="font-inter font-semibold text-xs leading-[16.5px] text-white/60 tracking-wide">
                    Guest
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="pt-1">
                <p className="font-space font-bold text-3.5xl leading-tight text-white">
                  ₱75
                </p>
              </div>

              {/* Rate type */}
              <div className="pt-1 pb-4">
                <p className="font-inter font-normal text-xs text-white/40">
                  daily guest rate &middot; non-member
                </p>
              </div>

              {/* Divider Line */}
              <div className="w-full h-px bg-white/10 my-1" />

              {/* Notice */}
              <p className="font-inter font-normal text-xs leading-normal text-white/50 pt-4 pb-5">
                You&apos;re visiting as a guest today. No membership is required &mdash; just pay at the counter and show your QR pass.
              </p>

              {/* Become a Member Button */}
              <button
                onClick={() => setMemberState("unassigned")}
                className="bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-2.5 px-4 inline-flex items-center justify-center gap-2 text-gym-dark font-space font-bold text-xs focus:outline-none"
              >
                Become a member
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            {/* Guest Pass Ticket */}
            <div className="flex flex-col gap-3 animate-in fade-in duration-200">
              <h3 className="font-inter font-bold text-xs leading-none text-gym-dark tracking-widest uppercase">
                Your guest pass
              </h3>

              <div className="bg-white border border-gray-200 rounded-2xl w-full flex flex-col p-4 shadow-sm">
                <div className="flex gap-3 items-center justify-between pb-3">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="bg-gym-dark rounded-xl w-8 h-8 flex items-center justify-center shrink-0 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                        <line x1="7" y1="8" x2="17" y2="8" />
                        <line x1="7" y1="12" x2="17" y2="12" />
                        <line x1="7" y1="16" x2="13" y2="16" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-inter font-semibold text-sm leading-normal text-gym-dark truncate">
                        Daily visit &mdash; guest
                      </h4>
                      <p className="font-inter font-normal text-xs leading-none text-gym-gray/60">
                        Valid for today only
                      </p>
                    </div>
                  </div>
                  <span className="font-space font-bold text-sm text-gym-dark shrink-0">
                    ₱75
                  </span>
                </div>

                {/* Divider & Date info */}
                <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                  <span className="font-inter font-normal text-xs text-gym-gray">
                    Date
                  </span>
                  <span className="font-inter font-medium text-xs text-gym-dark">
                    {getFormattedDate()}
                  </span>
                </div>
              </div>
            </div>

            {/* Savings section */}
            <div className="flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="bg-gray-100 border border-gray-200 rounded-2xl w-full p-4 flex flex-col gap-3 shadow-xs">
                <h3 className="font-inter font-bold text-xs leading-none text-gym-dark tracking-widest uppercase">
                  Save by becoming a member
                </h3>

                <div className="flex flex-col w-full">
                  {/* Row 1: Annual Membership */}
                  <div className="border-b border-gray-200 pb-2 pt-1.5 flex justify-between items-center">
                    <div>
                      <h4 className="font-inter font-semibold text-xs text-gym-dark">
                        Annual membership
                      </h4>
                      <p className="font-inter font-normal text-xs text-gym-gray/60">
                        One-time fee, unlimited check-ins
                      </p>
                    </div>
                    <span className="font-space font-bold text-xs text-gym-dark">
                      ₱200 / yr
                    </span>
                  </div>

                  {/* Row 2: Member daily rate */}
                  <div className="border-b border-gray-200 py-2.5 flex justify-between items-center">
                    <div>
                      <h4 className="font-inter font-semibold text-xs text-gym-dark">
                        Member daily rate
                      </h4>
                      <p className="font-inter font-normal text-xs text-gym-gray/60">
                        Save ₱5 vs guest rate
                      </p>
                    </div>
                    <span className="font-space font-bold text-xs text-gym-dark">
                      ₱70 / visit
                    </span>
                  </div>

                  {/* Row 3: Monthly plan */}
                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <h4 className="font-inter font-semibold text-xs text-gym-dark">
                        Monthly plan
                      </h4>
                      <p className="font-inter font-normal text-xs text-gym-gray/60">
                        Unlimited access, best value
                      </p>
                    </div>
                    <span className="font-space font-bold text-xs text-gym-dark">
                      from ₱799 / mo
                    </span>
                  </div>
                </div>

                {/* CTA register button */}
                <Link
                  href="/register"
                  className="w-full bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-3.5 flex items-center justify-center gap-2 text-gym-dark font-space font-bold text-sm mt-2"
                >
                  Register now &mdash; it&apos;s free
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* 3. CONDITIONAL RENDER: PLAN ASSIGNED/ACTIVE VIEW */}
        {memberState === "assigned" && (
          <div className="flex flex-col gap-4 w-full">
            {/* Active Status Dark Card */}
            <div className="bg-gym-dark rounded-[20px] p-5 w-full flex flex-col items-start shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between w-full">
                <span className="font-inter font-bold text-xs leading-[16.5px] text-white/45 tracking-widest uppercase">
                  Current status
                </span>

                <div className="bg-green-600/20 border border-green-600/40 rounded-full px-2.5 py-0.5 flex items-center justify-center shrink-0">
                  <span className="font-inter font-semibold text-xs leading-none text-green-400 tracking-wide">
                    Active
                  </span>
                </div>
              </div>

              {/* Price Row */}
              <div className="pt-1 flex items-baseline gap-2">
                <p className="font-space font-bold text-3xl leading-tight text-white">
                  ₱70
                </p>
                <p className="font-space font-normal text-sm leading-tight text-white/30 line-through">
                  ₱75
                </p>
              </div>

              {/* Rate type */}
              <div className="pt-1 pb-4">
                <p className="font-inter font-normal text-xs text-white/40">
                  per daily visit &middot; member rate
                </p>
              </div>

              {/* Divider Line */}
              <div className="w-full h-px bg-white/10 my-1" />

              {/* Dates Row */}
              <div className="flex gap-4 items-start pt-4 w-full">
                <div className="flex flex-col">
                  <span className="font-inter font-normal text-xs text-white/30 tracking-wide">
                    Member since
                  </span>
                  <span className="font-inter font-semibold text-xs text-white mt-0.5">
                    {getFormattedDate(annualStartDate)}
                  </span>
                </div>

                <div className="w-px bg-white/10 h-8 self-center" />

                <div className="flex flex-col">
                  <span className="font-inter font-normal text-xs text-white/30 tracking-wide">
                    Annual expires
                  </span>
                  <span className="font-inter font-semibold text-xs text-white mt-0.5">
                    {getFormattedDate(annualEndDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Annual Membership White Card */}
            <div className="bg-white border border-gray-200 rounded-2xl w-full p-4 flex flex-col shadow-sm animate-in fade-in duration-200">
              <div className="flex gap-3 items-center justify-between pb-3">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="bg-gym-dark rounded-xl w-8 h-8 flex items-center justify-center shrink-0 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                      <line x1="7" y1="8" x2="17" y2="8" />
                      <line x1="7" y1="12" x2="17" y2="12" />
                      <line x1="7" y1="16" x2="13" y2="16" />
                    </svg>
                  </div>
                  <span className="font-inter font-semibold text-sm text-gym-dark truncate">
                    Annual membership
                  </span>
                </div>

                <div className="bg-green-50 border border-green-600/30 rounded-full px-2.5 py-0.5 flex items-center justify-center shrink-0">
                  <span className="font-inter font-semibold text-xs leading-none text-green-600 tracking-wide">
                    Active
                  </span>
                </div>
              </div>

              {/* Started Row */}
              <div className="border-t border-gray-200 py-2.5 flex items-center justify-between">
                <span className="font-inter font-normal text-xs text-gym-gray">
                  Started
                </span>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  {getFormattedDate(annualStartDate)}
                </span>
              </div>

              {/* Expires Row */}
              <div className="border-t border-gray-200 py-2.5 flex items-center justify-between">
                <span className="font-inter font-normal text-xs text-gym-gray">
                  Expires
                </span>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  {getFormattedDate(annualEndDate)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="border-t border-gray-200 pt-3 flex flex-col gap-1.5">
                <div className="bg-gym-gray-bg h-1.5 rounded-full w-full overflow-hidden">
                  <div className="bg-gym-lime h-full rounded-full" style={{ width: `${getProgressPercentage(annualStartDate, annualEndDate)}%` }} />
                </div>
                <span className="font-inter font-normal text-xs text-gym-gray/60">
                  {getDaysRemaining(annualEndDate)} days remaining &middot; ₱200 / year
                </span>
              </div>
            </div>

            {/* Monthly Plan White Card */}
            <div className="bg-white border border-amber-200 rounded-2xl w-full p-4 flex flex-col shadow-sm animate-in fade-in duration-200">
              <div className="flex gap-3 items-center justify-between pb-3">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="bg-gym-dark rounded-[14px] w-8 h-8 flex items-center justify-center shrink-0 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <span className="font-inter font-semibold text-sm text-gym-dark truncate">
                    Monthly plan
                  </span>
                </div>

                {monthlyEndDate && (
                  <div className={`rounded-full px-2.5 py-0.5 flex items-center justify-center shrink-0 ${
                    getDaysRemaining(monthlyEndDate) === 0 ? "bg-red-50" :
                    getDaysRemaining(monthlyEndDate) <= 7 ? "bg-amber-50" :
                    "bg-green-50"
                  }`}>
                    <span className={`font-inter font-semibold text-xs leading-[16.5px] tracking-wide ${
                      getDaysRemaining(monthlyEndDate) === 0 ? "text-red-600" :
                      getDaysRemaining(monthlyEndDate) <= 7 ? "text-amber-600" :
                      "text-green-600"
                    }`}>
                      {getDaysRemaining(monthlyEndDate) === 0 ? "Expired" :
                       getDaysRemaining(monthlyEndDate) <= 7 ? "Expiring soon" :
                       "Active"}
                    </span>
                  </div>
                )}
              </div>

              {/* Plan Row */}
              <div className="border-t border-gray-200 py-2.5 flex items-center justify-between">
                <span className="font-inter font-normal text-xs text-gym-gray">
                  Plan
                </span>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  1 month &middot; ₱799
                </span>
              </div>

              {monthlyEndDate && (
                <>
                  {/* Expires Row */}
                  <div className="border-t border-gray-200 py-2.5 flex items-center justify-between">
                    <span className="font-inter font-normal text-xs text-gym-gray">
                      Expires
                    </span>
                    <span className={`font-inter font-semibold text-xs ${getDaysRemaining(monthlyEndDate) <= 7 ? 'text-amber-600' : 'text-gym-dark'}`}>
                      {getFormattedDate(monthlyEndDate)}
                    </span>
                  </div>

                  {/* Alert Warning Row */}
                  {getDaysRemaining(monthlyEndDate) <= 7 && (
                    <div className="border-t border-gray-200 pt-3 flex items-center gap-1.5 text-amber-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="font-inter font-normal text-xs leading-tight">
                        {getDaysRemaining(monthlyEndDate) === 0 ? "Plan expired — renew at the counter" : `${getDaysRemaining(monthlyEndDate)} days left — renew at the counter`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Daily Visit Rate Benefit White Card */}
            <div className="bg-white border border-gray-200 rounded-2xl w-full p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
              <div className="flex gap-3 items-center min-w-0">
                <div className="bg-gym-dark rounded-xl w-8 h-8 flex items-center justify-center shrink-0 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-inter font-normal text-xs leading-tight text-gym-gray/60">
                    Your member benefit
                  </p>
                  <h4 className="font-inter font-semibold text-sm leading-normal text-gym-dark truncate mt-0.5">
                    Daily visit rate
                  </h4>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="font-space font-bold text-lg text-gym-dark leading-tight">
                  ₱70
                </span>
                <span className="font-inter font-normal text-xs text-gym-gray/60 line-through leading-tight mt-0.5">
                  ₱75 guest
                </span>
              </div>
            </div>

            {/* View my QR Pass button */}
            <Link
              href="/my-pass"
              className="w-full bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-3.5 flex items-center justify-center gap-2 text-gym-dark font-space font-bold text-sm mt-2 shadow-xs"
            >
              View my QR pass
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
