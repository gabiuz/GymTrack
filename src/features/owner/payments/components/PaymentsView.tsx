"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { StatusPill } from "@/features/owner/_ui";

type Range = "today" | "week" | "month";

interface Payment {
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

function typeVariant(t: string): "monthly" | "daily" | "membership" | "unassigned" {
  if (t === "monthly_plan")    return "monthly";
  if (t === "daily_visit")     return "daily";
  if (t === "membership_fee")  return "membership";
  return "unassigned";
}

function typeLabel(t: string) {
  if (t === "monthly_plan")   return "Monthly";
  if (t === "daily_visit")    return "Daily";
  if (t === "membership_fee") return "Membership";
  return t;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

const rangeLabels: Record<Range, string> = { today: "Today", week: "This week", month: "This month" };

export function PaymentsView() {
  const [range, setRange]         = useState<Range>("today");
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalAmt, setTotalAmt]   = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/owner/payments/export?range=${range}`);
      if (!res.ok) { alert("Export failed — please try again."); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const dateSuffix = new Date().toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
      const rangeSlug  = { today: "Today", week: "This-Week", month: "This-Month" }[range] ?? range;
      a.href     = url;
      a.download = `GymTrack_Payments_${rangeSlug}_${dateSuffix}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/owner/payments?range=${range}&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        setPayments(d.data ?? []);
        setTotal(d.total ?? 0);
        setTotalAmt(d.totalAmount ?? 0);
      })
      .finally(() => setIsLoading(false));
  }, [range]);

  return (
    <>
      <div className="flex justify-end mb-4.5">
        <button
          onClick={handleExport}
          disabled={exporting || isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <Download size={13} /> {exporting ? "Exporting…" : "Export"}
        </button>
      </div>

      {/* Range filter */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {(["today", "week", "month"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`text-xs px-3.5 py-1.5 rounded-full cursor-pointer font-semibold font-inter border transition-all duration-100 ${
              range === r
                ? "border-gym-lime bg-gym-lime text-gym-dark"
                : "border-black/14 bg-white text-gray-400 hover:border-gray-300"
            }`}
          >
            {rangeLabels[r]}
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
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-3 border-b border-black/8">
                  <Skeleton className="flex-1 h-8" />
                  <Skeleton className="w-[106px] h-5" />
                  <Skeleton className="w-[76px] h-5" />
                  <Skeleton className="w-[52px] h-5" />
                  <Skeleton className="w-[46px] h-5" />
                </div>
              ))
            ) : payments.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-400 font-inter">No payments found for this period.</div>
            ) : payments.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < payments.length - 1 ? "border-b border-black/8" : ""}`}>
                <div className="flex-1">
                  <div className="font-semibold text-gym-dark">{p.memberName}</div>
                  <div className="text-[11px] text-gray-300 font-mono mt-0.5">
                    {p.memberId ? p.memberId : (p.walkInName ? "Guest visitor" : "—")}
                  </div>
                </div>
                <span className="w-[106px]">
                  <StatusPill variant={typeVariant(p.paymentType)}>{typeLabel(p.paymentType)}</StatusPill>
                </span>
                <span className="w-[76px] text-right font-bold text-gym-dark font-space text-sm">
                  ₱{p.amount.toLocaleString()}
                </span>
                <span className="w-[52px] text-right text-gray-400">{fmtTime(p.paymentDate)}</span>
                <span className="w-[46px] text-right text-gray-400 truncate">{p.staffName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center mt-3 font-inter">
        {total} transactions · total{" "}
        <strong className="text-gym-dark font-space">₱{totalAmt.toLocaleString()}</strong>
      </div>
    </>
  );
}
