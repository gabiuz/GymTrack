"use client";

import { useState, useEffect } from "react";
import { StatusPill } from "@/features/owner/_ui";
import { ManageMembershipModal } from "@/features/owner/members/components/ManageMembershipModal";

type Tab = "annual" | "monthly";

interface AnnualRow {
  id: number;
  memberDbId: number;
  memberId: string;
  memberName: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
interface MonthlyRow {
  id: number;
  memberDbId: number;
  memberId: string;
  memberName: string;
  duration: number;
  amount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface MembershipsViewProps { onToast: (title: string, sub: string) => void; }

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getVariant(isActive: boolean, endDate: string): "active" | "expired" | "expiring" {
  if (!isActive) return "expired";
  const daysLeft = (new Date(endDate).getTime() - Date.now()) / 86400000;
  if (daysLeft <= 7) return "expiring";
  return "active";
}

function expiresColor(v: "active" | "expired" | "expiring") {
  if (v === "expired")  return "text-red-500";
  if (v === "expiring") return "text-amber-500";
  return "text-gray-400";
}

export function MembershipsView({ onToast }: MembershipsViewProps) {
  const [tab, setTab]               = useState<Tab>("annual");
  const [annual, setAnnual]         = useState<AnnualRow[]>([]);
  const [monthly, setMonthly]       = useState<MonthlyRow[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCtx, setManageCtx]   = useState({ name: "", id: "", numericId: 0, status: "active" as "active" | "expired" | "unassigned", annualEndDate: null as string | null, monthlyEndDate: null as string | null });
  const [openingManageId, setOpeningManageId] = useState<number | null>(null);

  const openManageModal = async (memberDbId: number, memberName: string, memberId: string) => {
    setOpeningManageId(memberDbId);
    try {
      const res = await fetch(`/api/members/${memberDbId}`);
      if (!res.ok) return;
      const { data: detail } = await res.json();
      
      setManageCtx({
        name: memberName,
        id: memberId,
        numericId: memberDbId,
        status: detail.hasActiveMonthlyPlan || detail.hasActiveMembership ? "active" : detail.latestMembership ? "expired" : "unassigned",
        annualEndDate: detail.latestMembership?.endDate ?? null,
        monthlyEndDate: detail.latestMonthlyPlan?.endDate ?? null,
      });
      setManageOpen(true);
    } catch {
      onToast("Error", "Could not load member details");
    } finally {
      setOpeningManageId(null);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/owner/memberships?type=annual&limit=50").then((r) => r.json()),
      fetch("/api/owner/memberships?type=monthly&limit=50").then((r) => r.json()),
    ]).then(([ann, mon]) => {
      setAnnual(ann.data ?? []);
      setMonthly(mon.data ?? []);
    }).finally(() => setIsLoading(false));
  }, []);

  const reload = () => {
    setIsLoading(true);
    Promise.all([
      fetch("/api/owner/memberships?type=annual&limit=50").then((r) => r.json()),
      fetch("/api/owner/memberships?type=monthly&limit=50").then((r) => r.json()),
    ]).then(([ann, mon]) => {
      setAnnual(ann.data ?? []);
      setMonthly(mon.data ?? []);
    }).finally(() => setIsLoading(false));
  };

  const data: (AnnualRow | MonthlyRow)[] = tab === "annual" ? annual : monthly;

  const activeCount  = [...annual, ...monthly].filter((r) => r.isActive).length;
  const expiringCount = [...annual, ...monthly].filter((r) => {
    if (!r.isActive) return false;
    return (new Date(r.endDate).getTime() - Date.now()) / 86400000 <= 7;
  }).length;
  const expiredCount = [...annual, ...monthly].filter((r) => !r.isActive).length;

  return (
    <>
      {/* Tab switcher */}
      <div className="inline-flex bg-gray-100 rounded-full p-1 mb-5 border border-black/8">
        {(["annual", "monthly"] as Tab[]).map((t) => (
          <span key={t} onClick={() => setTab(t)}
            className={`px-4.5 py-1.5 rounded-full cursor-pointer text-[13px] font-semibold font-inter transition-all duration-100 ${
              tab === t ? "bg-gym-lime text-gym-dark" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "annual" ? "Annual memberships" : "Monthly plans"}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="flex-1 h-[82px] rounded-xl" />) : (
          [
            { label: "All active",    val: activeCount,   className: "text-gym-dark" },
            { label: "Expiring (7d)", val: expiringCount, className: "text-amber-500" },
            { label: "Expired",       val: expiredCount,  className: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">{s.label}</div>
              <div className={`font-space text-[28px] font-bold tracking-tight ${s.className}`}>{s.val}</div>
            </div>
          ))
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto">
        <div className="min-w-[540px] lg:min-w-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter sticky top-0 z-10">
            <span className="flex-1">Member</span>
            <span className="w-26">Expires</span>
            <span className="w-22">Status</span>
            <span className="w-20 text-right">Action</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-4 py-3 border-b border-black/8">
                <Skeleton className="flex-1 h-8" /><Skeleton className="w-26 h-5" /><Skeleton className="w-22 h-5" /><Skeleton className="w-20 h-5" />
              </div>
            )) : data.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-400 font-inter">No records found.</div>
            ) : data.map((m, i) => {
              const v = getVariant(m.isActive, m.endDate);
              return (
                <div key={m.id} className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < data.length - 1 ? "border-b border-black/8" : ""}`}>
                  <div className="flex-1">
                    <div className="font-semibold text-gym-dark">{m.memberName}</div>
                    <div className="text-[11px] text-gray-300 font-mono mt-0.5">{m.memberId}</div>
                  </div>
                  <span className={`w-26 text-[13px] ${expiresColor(v)}`}>{fmtDate(m.endDate)}</span>
                  <span className="w-22">
                    <StatusPill variant={v}>
                      {v === "active" ? "Active" : v === "expired" ? "Expired" : "Expiring"}
                    </StatusPill>
                  </span>
                  <span className="w-20 text-right">
                    {!m.isActive ? (
                      <button
                        onClick={() => openManageModal(m.memberDbId, m.memberName, m.memberId)}
                        disabled={openingManageId === m.memberDbId}
                        className="px-3.5 py-1.5 text-xs font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 disabled:opacity-60"
                      >{openingManageId === m.memberDbId ? "…" : "Renew"}</button>
                    ) : (
                      <button
                        onClick={() => openManageModal(m.memberDbId, m.memberName, m.memberId)}
                        disabled={openingManageId === m.memberDbId}
                        className="px-3.5 py-1.5 text-xs font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >{openingManageId === m.memberDbId ? "…" : "Manage"}</button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ManageMembershipModal
        open={manageOpen}
        memberName={manageCtx.name}
        memberId={manageCtx.id}
        memberNumericId={manageCtx.numericId}
        memberStatus={manageCtx.status}
        annualEndDate={manageCtx.annualEndDate}
        monthlyEndDate={manageCtx.monthlyEndDate}
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); reload(); }}
      />
    </>
  );
}
