"use client";

import { useState } from "react";
import { StatusPill } from "@/features/owner/_ui";
import { ManageMembershipModal } from "@/features/owner/members/components/ManageMembershipModal";
// NOTE: owner copy — diverge from admin/memberships/MembershipsView as needed

const annualMembers = [
  { id: "MEM-000023", name: "Jose Santos", expires: "01/06/2026",  status: "expired"  as const },
  { id: "MEM-000008", name: "Mark Cruz",   expires: "14/06/2026", status: "expiring" as const },
  { id: "MEM-000001", name: "Ana Reyes",   expires: "12/01/2027", status: "active"   as const },
  { id: "MEM-000044", name: "Grace Uy",    expires: "03/09/2026",  status: "active"   as const },
];
const monthlyMembers = [
  { id: "MEM-000001", name: "Ana Reyes", expires: "09/07/2026",  status: "active"   as const },
  { id: "MEM-000008", name: "Mark Cruz", expires: "14/06/2026", status: "expiring" as const },
  { id: "MEM-000003", name: "Pedro Lim", expires: "30/06/2026", status: "active"   as const },
];

type Tab = "annual" | "monthly";
interface MembershipsViewProps { onToast: (title: string, sub: string) => void; }

function expiresColor(status: string) {
  if (status === "expired")  return "text-red-500";
  if (status === "expiring") return "text-amber-500";
  return "text-gray-400";
}

export function MembershipsView({ onToast }: MembershipsViewProps) {
  const [tab, setTab]           = useState<Tab>("annual");
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCtx, setManageCtx]   = useState({ name: "", id: "", status: "active" as "active" | "expired" | "unassigned" });

  const data = tab === "annual" ? annualMembers : monthlyMembers;

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
          { label: "All active",     val: "231", className: "text-gym-dark" },
          { label: "Expiring (7d)",  val: "9",   className: "text-amber-500" },
          { label: "Expired",        val: "8",   className: "text-red-500" },
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
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter sticky top-0 z-10">
            <span className="flex-1">Member</span>
            <span className="w-26">Expires</span>
            <span className="w-22">Status</span>
            <span className="w-20 text-right">Action</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {data.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < data.length - 1 ? "border-b border-black/8" : ""}`}
              >
                <div className="flex-1">
                  <div className="font-semibold text-gym-dark">{m.name}</div>
                  <div className="text-[11px] text-gray-300 font-mono mt-0.5">{m.id}</div>
                </div>
                <span className={`w-26 text-[13px] ${expiresColor(m.status)}`}>{m.expires}</span>
                <span className="w-22">
                  <StatusPill variant={m.status === "expiring" ? "expiring" : m.status}>
                    {m.status === "active" ? "Active" : m.status === "expired" ? "Expired" : "Expiring"}
                  </StatusPill>
                </span>
                <span className="w-20 text-right">
                  {m.status !== "active" ? (
                    <button
                      onClick={() => { setManageCtx({ name: m.name, id: m.id, status: m.status === "expired" ? "expired" : "active" }); setManageOpen(true); }}
                      className="px-3.5 py-1.5 text-xs font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90"
                    >
                      Renew
                    </button>
                  ) : (
                    <button
                      onClick={() => { setManageCtx({ name: m.name, id: m.id, status: "active" }); setManageOpen(true); }}
                      className="px-3.5 py-1.5 text-xs font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Manage
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ManageMembershipModal
        open={manageOpen}
        memberName={manageCtx.name}
        memberId={manageCtx.id}
        memberStatus={manageCtx.status}
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); }}
      />
    </>
  );
}
