"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { StatusPill } from "@/features/admin/_ui";

interface PaymentRow {
  id: number;
  receiptNumber: string;
  memberName: string;
  memberId: string | null;
  walkInName: string | null;
  paymentType: string;
  amount: number;
  paymentDate: string;
  staffName: string;
}

type Range = "today" | "week" | "month";

function typeLabel(t: string) {
  if (t === "daily_visit")  return "Daily";
  if (t === "monthly_plan") return "Monthly";
  if (t === "membership_fee") return "Membership";
  return t;
}

function typeVariant(t: string): "monthly" | "daily" | "membership" | "unassigned" {
  if (t === "monthly_plan")   return "monthly";
  if (t === "daily_visit")    return "daily";
  if (t === "membership_fee") return "membership";
  return "unassigned";
}

export function PaymentsView() {
  const [range, setRange]       = useState<Range>("today");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/payments?range=${range}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.data ?? []);
        setTotal(data.totalAmount ?? 0);
      })
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const rangeLabels: Record<Range, string> = { today: "Today", week: "This week", month: "This month" };

  return (
    <>
      <div className="flex items-center justify-between mb-4.5">
        {/* Range filter */}
        <div className="flex bg-gray-100 rounded-full p-1 border border-black/8 gap-0.5">
          {(["today", "week", "month"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full border-none cursor-pointer text-[13px] font-inter transition-all duration-100 ${
                range === r
                  ? "bg-gym-lime text-gym-dark font-semibold"
                  : "bg-transparent text-gray-400 font-normal hover:text-gray-600"
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">
          <Download size={13} /> Export
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <div className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">{rangeLabels[range]}</div>
          <div className="font-space text-[26px] font-bold tracking-tight text-gym-dark">
            {loading ? "—" : `₱${total.toLocaleString()}`}
          </div>
        </div>
        <div className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">Transactions</div>
          <div className="font-space text-[26px] font-bold tracking-tight text-gym-dark">
            {loading ? "—" : payments.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto">
        <div className="min-w-[500px] lg:min-w-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter sticky top-0 z-10">
            <span className="flex-1">Member</span>
            <span className="w-[106px]">Type</span>
            <span className="w-[76px] text-right">Amount</span>
            <span className="w-[80px] text-right">Time</span>
            <span className="w-[46px] text-right">Staff</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-300 font-inter">Loading…</div>
            ) : payments.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-300 font-inter">No payments found for this period</div>
            ) : payments.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < payments.length - 1 ? "border-b border-black/8" : ""}`}>
                <div className="flex-1">
                  <div className="font-semibold text-gym-dark">
                    {p.memberId ? p.memberName : (p.walkInName || p.memberName || 'Guest visitor')}
                  </div>
                  <div className="text-[11px] font-mono mt-0.5 text-gray-300">
                    {p.memberId ? p.memberId : 'Guest visitor'}
                  </div>
                </div>
                <span className="w-[106px]">
                  <StatusPill variant={typeVariant(p.paymentType)}>{typeLabel(p.paymentType)}</StatusPill>
                </span>
                <span className="w-[76px] text-right font-bold text-gym-dark font-space text-sm">
                  ₱{p.amount.toLocaleString()}
                </span>
                <span className="w-[80px] text-right text-gray-400 text-xs">
                  {new Date(p.paymentDate).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="w-[46px] text-right text-gray-400">{p.staffName.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center mt-3 font-inter">
        {payments.length} transactions · total{" "}
        <strong className="text-gym-dark font-space">₱{total.toLocaleString()}</strong>
      </div>
    </>
  );
}
