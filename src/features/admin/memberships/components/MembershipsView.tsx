"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusPill } from "@/features/admin/_ui";
import { ManageMembershipModal } from "@/features/admin/members/components/ManageMembershipModal";

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

type Tab = "annual" | "monthly";
interface MembershipsViewProps { onToast: (title: string, sub: string) => void; }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function expiresColor(isActive: boolean, endDate: string) {
  if (!isActive) return "text-red-500";
  const daysLeft = (new Date(endDate).getTime() - Date.now()) / 86400000;
  if (daysLeft <= 7) return "text-amber-500";
  return "text-gray-400";
}

function statusVariant(isActive: boolean, endDate: string): "active" | "expired" | "expiring" {
  if (!isActive) return "expired";
  const daysLeft = (new Date(endDate).getTime() - Date.now()) / 86400000;
  return daysLeft <= 7 ? "expiring" : "active";
}

export function MembershipsView({ onToast }: MembershipsViewProps) {
  const [tab, setTab] = useState<Tab>("annual");
  const [annualData, setAnnualData] = useState<AnnualRow[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageOpen, setManageOpen] = useState(false);
<<<<<<< HEAD
  const [manageCtx, setManageCtx] = useState<{ name: string; id: string; numericId: number | null; status: "active" | "expired" | "unassigned" }>({
    name: "", id: "", numericId: null, status: "unassigned",
  });
  const [renewingId, setRenewingId] = useState<number | null>(null);
=======
  const [manageCtx, setManageCtx] = useState<{ name: string; id: string; numericId: number | null; status: "active" | "expired" | "unassigned"; annualEndDate: string | null; monthlyEndDate: string | null }>({
    name: "", id: "", numericId: null, status: "unassigned", annualEndDate: null, monthlyEndDate: null
  });
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
>>>>>>> origin/dev

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/memberships?type=annual&limit=50").then((r) => r.json()),
      fetch("/api/admin/memberships?type=monthly&limit=50").then((r) => r.json()),
    ]).then(([annual, monthly]) => {
      setAnnualData(annual.data ?? []);
      setMonthlyData(monthly.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

<<<<<<< HEAD
  async function handleRenewAnnual(row: AnnualRow) {
    setRenewingId(row.id);
    try {
      const res = await fetch("/api/admin/memberships/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: row.memberDbId }),
      });
      if (res.ok) {
        onToast("Membership renewed", `${row.memberName} · 1 year extension recorded`);
        fetchData();
      } else {
        const d = await res.json();
        onToast("Renewal failed", d.error ?? "Could not renew membership");
      }
    } finally {
      setRenewingId(null);
    }
  }
=======
>>>>>>> origin/dev

  const activeAnnual = annualData.filter((m) => m.isActive).length;
  const expiredAnnual = annualData.filter((m) => !m.isActive).length;
  const expiringAnnual = annualData.filter((m) => {
    if (!m.isActive) return false;
    return (new Date(m.endDate).getTime() - Date.now()) / 86400000 <= 7;
  }).length;

  const data = tab === "annual" ? annualData : monthlyData;

  return (
    <>
      {/* Tab switcher */}
      <div className="inline-flex bg-gray-100 rounded-full p-1 mb-5 border border-black/8">
        {(["annual", "monthly"] as Tab[]).map((t) => (
          <span
            key={t}
            onClick={() => setTab(t)}
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
        {[
          { label: "All active",    val: String(activeAnnual),   className: "text-gym-dark" },
          { label: "Expiring (7d)", val: String(expiringAnnual), className: "text-amber-500" },
          { label: "Expired",       val: String(expiredAnnual),  className: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">{s.label}</div>
            <div className={`font-space text-[28px] font-bold tracking-tight ${s.className}`}>{s.val}</div>
          </div>
        ))}
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
            {loading ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-300 font-inter">Loading…</div>
            ) : data.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-300 font-inter">No records found</div>
            ) : data.map((m, i) => {
              const isActive = m.isActive;
              const variant = statusVariant(isActive, m.endDate);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < data.length - 1 ? "border-b border-black/8" : ""}`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gym-dark">{m.memberName}</div>
                    <div className="text-[11px] text-gray-300 font-mono mt-0.5">{m.memberId}</div>
                  </div>
                  <span className={`w-26 text-[13px] ${expiresColor(isActive, m.endDate)}`}>{fmtDate(m.endDate)}</span>
                  <span className="w-22">
                    <StatusPill variant={variant}>
                      {variant === "active" ? "Active" : variant === "expired" ? "Expired" : "Expiring"}
                    </StatusPill>
                  </span>
                  <span className="w-20 text-right">
                    {tab === "annual" ? (
                      isActive ? (
                        <button
<<<<<<< HEAD
                          onClick={() => {
                            setManageCtx({ name: m.memberName, id: m.memberId, numericId: m.memberDbId, status: "active" });
                            setManageOpen(true);
                          }}
                          className="px-3.5 py-1.5 text-xs font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          Manage
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRenewAnnual(m as AnnualRow)}
                          disabled={renewingId === m.id}
                          className="px-3.5 py-1.5 text-xs font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 disabled:opacity-60"
                        >
                          {renewingId === m.id ? "…" : "Renew"}
=======
                          onClick={() => openManageModal(m.memberDbId, m.memberName, m.memberId)}
                          disabled={openingManageId === m.memberDbId}
                          className="px-3.5 py-1.5 text-xs font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-60"
                        >
                          {openingManageId === m.memberDbId ? "…" : "Manage"}
                        </button>
                      ) : (
                        <button
                          onClick={() => openManageModal(m.memberDbId, m.memberName, m.memberId)}
                          disabled={openingManageId === m.memberDbId}
                          className="px-3.5 py-1.5 text-xs font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 disabled:opacity-60"
                        >
                          {openingManageId === m.memberDbId ? "…" : "Renew"}
>>>>>>> origin/dev
                        </button>
                      )
                    ) : (
                      <button
<<<<<<< HEAD
                        onClick={() => {
                          setManageCtx({ name: m.memberName, id: m.memberId, numericId: m.memberDbId, status: isActive ? "active" : "expired" });
                          setManageOpen(true);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-bold font-space rounded-full border-none cursor-pointer hover:opacity-90 ${
                          isActive ? "bg-white border border-black/14 font-medium font-inter text-gym-dark" : "bg-gym-lime text-gym-dark"
                        }`}
                      >
                        {isActive ? "Manage" : "Renew"}
=======
                        onClick={() => openManageModal(m.memberDbId, m.memberName, m.memberId)}
                        disabled={openingManageId === m.memberDbId}
                        className={`px-3.5 py-1.5 text-xs font-bold font-space rounded-full border-none cursor-pointer hover:opacity-90 disabled:opacity-60 ${
                          isActive ? "bg-white border border-black/14 font-medium font-inter text-gym-dark" : "bg-gym-lime text-gym-dark"
                        }`}
                      >
                        {openingManageId === m.memberDbId ? "…" : isActive ? "Manage" : "Renew"}
>>>>>>> origin/dev
                      </button>
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
<<<<<<< HEAD
=======
        annualEndDate={manageCtx.annualEndDate}
        monthlyEndDate={manageCtx.monthlyEndDate}
>>>>>>> origin/dev
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); fetchData(); }}
      />
    </>
  );
}
