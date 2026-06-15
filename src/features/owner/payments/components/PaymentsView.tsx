"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { StatusPill } from "@/features/owner/_ui";

const allPayments = [
  { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly",    amount: 799, time: "7:42", staff: "Rico" },
  { member: "Mark Cruz",   id: "MEM-000008", type: "Daily",      amount: 70,  time: "7:40", staff: "Rico" },
  { member: "Liza Tan",    id: "MEM-000014", type: "Daily",      amount: 75,  time: "7:38", staff: "Rico" },
  { member: "Pedro Lim",   id: "MEM-000031", type: "Membership", amount: 200, time: "7:31", staff: "Mia"  },
  { member: "Grace Uy",    id: "MEM-000044", type: "Monthly",    amount: 799, time: "7:20", staff: "Mia"  },
  { member: "Ana Reyes",   id: "MEM-000001", type: "Daily",      amount: 70,  time: "7:10", staff: "Rico" },
  { member: "Jose Santos", id: "MEM-000023", type: "Daily",      amount: 75,  time: "7:05", staff: "Mia"  },
];

type Filter = "All types" | "Membership" | "Daily" | "Monthly";
type PaymentType = "Monthly" | "Daily" | "Membership";

function typeVariant(t: string): "monthly" | "daily" | "membership" | "unassigned" {
  if (t === "Monthly")    return "monthly";
  if (t === "Daily")      return "daily";
  if (t === "Membership") return "membership";
  return "unassigned";
}

export function PaymentsView() {
  const [filter, setFilter] = useState<Filter>("All types");
  const filtered = filter === "All types" ? allPayments : allPayments.filter((p) => p.type === filter);
  const total = filtered.reduce((a, b) => a + b.amount, 0);

  return (
    <>
      <div className="flex justify-end mb-4.5">
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">
          <Download size={13} /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        {[
          { label: "Today",      val: "₱1,860" },
          { label: "This week",  val: "₱12,440" },
          { label: "This month", val: "₱48,900" },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">{s.label}</div>
            <div className="font-space text-[26px] font-bold tracking-tight text-gym-dark">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 mb-3.5 flex-wrap">
        {(["All types", "Membership", "Daily", "Monthly"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3.5 py-1.5 rounded-full cursor-pointer font-semibold font-inter border transition-all duration-100 ${
              filter === f
                ? "border-gym-lime bg-gym-lime text-gym-dark"
                : "border-black/14 bg-white text-gray-400 hover:border-gray-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto">
        <div className="min-w-[500px] lg:min-w-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter sticky top-0 z-10">
            <span className="flex-1">Member</span>
            <span className="w-[106px]">Type</span>
            <span className="w-[76px] text-right">Amount</span>
            <span className="w-[52px] text-right">Time</span>
            <span className="w-[46px] text-right">Staff</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {filtered.map((p, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < filtered.length - 1 ? "border-b border-black/8" : ""}`}>
                <div className="flex-1">
                  <div className="font-semibold text-gym-dark">{p.member}</div>
                  <div className="text-[11px] text-gray-300 font-mono mt-0.5">{p.id}</div>
                </div>
                <span className="w-[106px]">
                  <StatusPill variant={typeVariant(p.type)}>{p.type}</StatusPill>
                </span>
                <span className="w-[76px] text-right font-bold text-gym-dark font-space text-sm">
                  ₱{p.amount.toLocaleString()}
                </span>
                <span className="w-[52px] text-right text-gray-400">{p.time}</span>
                <span className="w-[46px] text-right text-gray-400">{p.staff}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center mt-3 font-inter">
        {filtered.length} transactions · total{" "}
        <strong className="text-gym-dark font-space">₱{total.toLocaleString()}</strong>
      </div>
    </>
  );
}
