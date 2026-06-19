"use client";

import { useState, useEffect } from "react";
import { X, User, Check, Banknote } from "lucide-react";
import { StatusPill } from "@/features/owner/_ui";

interface ManageMembershipModalProps {
  open: boolean;
  memberName: string;
  memberId: string;
  memberDbId: number;
  memberStatus: "active" | "expired" | "unassigned";
  monthlyEndDate: string | null;
  annualEndDate: string | null;
  onClose: () => void;
  onConfirm: (title: string, sub: string) => void;
}

const plans = [
  { key: "none", label: "None",     sub: "daily rate", price: 0,    duration: 0 as 1 | 3 | 6 | 12 | 0 },
  { key: "1m",   label: "1 month",  sub: "₱799",       price: 799,  duration: 1 as 1 | 3 | 6 | 12 | 0 },
  { key: "3m",   label: "3 months", sub: "₱2,199",     price: 2199, duration: 3 as 1 | 3 | 6 | 12 | 0 },
  { key: "6m",   label: "6 months", sub: "₱3,999",     price: 3999, duration: 6 as 1 | 3 | 6 | 12 | 0 },
];

export function ManageMembershipModal({
  open,
  memberName,
  memberId,
  memberDbId,
  memberStatus,
  monthlyEndDate,
  annualEndDate,
  onClose,
  onConfirm,
}: ManageMembershipModalProps) {
  const now = new Date();
  let hasActivePlan = false;
  let canExtend = false;
  let monthlyExpiryStr = "";

  if (monthlyEndDate) {
    const end = new Date(monthlyEndDate);
    if (end >= now) {
      hasActivePlan = true;
      monthlyExpiryStr = end.toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" });
      const diffMs = end.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) {
        canExtend = true;
      }
    }
  }

  let hasActiveAnnual = false;
  if (annualEndDate) {
    const end = new Date(annualEndDate);
    if (end >= now) {
      hasActiveAnnual = true;
    }
  }

  const [membership, setMembership] = useState(!hasActiveAnnual);
  const [plan, setPlan]             = useState(hasActivePlan && !canExtend ? "none" : "1m");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMembership(!hasActiveAnnual);
      setPlan(hasActivePlan && !canExtend ? "none" : "1m");
      setError("");
      setLoading(false);
    }
  }, [open, hasActiveAnnual, hasActivePlan, canExtend]);

  if (!open) return null;

  const membershipFee = membership ? 200 : 0;
  const selectedPlan  = plans.find((p) => p.key === plan)!;
  const planFee       = selectedPlan.price;
  const total         = membershipFee + planFee;

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  const expiryStr = expiry.toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" });

  const pillVariant = memberStatus === "active" ? "active" : memberStatus === "expired" ? "expired" : "unassigned";

  async function handleConfirm() {
    setError("");
    setLoading(true);
    try {
      const requests: Promise<Response>[] = [];

      if (membership) {
        requests.push(
          fetch("/api/owner/memberships/renew", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId: memberDbId }),
          })
        );
      }

      if (plan !== "none" && selectedPlan.duration > 0) {
        requests.push(
          fetch("/api/owner/monthly-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId: memberDbId, duration: selectedPlan.duration, amount: planFee }),
          })
        );
      }

      if (requests.length === 0) {
        setError("Please select at least one option.");
        setLoading(false);
        return;
      }

      const results = await Promise.all(requests);
      const failed = results.find((r) => !r.ok);
      if (failed) {
        const errData = await failed.json().catch(() => ({}));
        setError((errData as { error?: string }).error ?? "Request failed");
        setLoading(false);
        return;
      }

      onConfirm("Membership activated", `${memberName} · ₱${total.toLocaleString()} recorded`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-40 overflow-y-auto backdrop-blur-sm"
    >
      <div className="w-full max-w-[480px] bg-white border border-black/8 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
          <span className="font-space font-bold text-base text-gym-dark">Manage Membership</span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors flex">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4.5">
          {/* Member row */}
          <div className="flex items-center gap-3 mb-5 px-3.5 py-3 bg-gray-50 rounded-lg border border-black/8">
            <div className="w-9.5 h-9.5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <User size={17} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-gym-dark font-space">{memberName}</div>
              <div className="text-[11px] text-gray-400 font-mono">{memberId}</div>
            </div>
            <StatusPill variant={pillVariant}>
              {memberStatus === "active" ? "Active" : memberStatus === "expired" ? "Expired" : "Unassigned"}
            </StatusPill>
          </div>

          {/* Annual membership */}
          <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2 font-inter">
            Annual membership
          </div>
          <div
            onClick={() => !hasActiveAnnual && setMembership(!membership)}
            className={`flex items-center gap-3 mb-5 border rounded-lg px-3.5 py-3 transition-all duration-100 ${
              hasActiveAnnual
                ? "border border-black/8 bg-gray-50 cursor-not-allowed opacity-60"
                : membership
                ? "border-[2px] border-gym-lime bg-gym-lime/15 cursor-pointer"
                : "border border-black/14 bg-gray-50 cursor-pointer"
            }`}
          >
            <div className={`w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 transition-all ${
              membership ? "bg-gym-lime" : "bg-white border border-black/14"
            }`}>
              {membership && <Check size={13} color="#000" strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gym-dark font-inter">
                {hasActiveAnnual ? "Already active" : "Activate membership"}
              </div>
              <div className="text-xs text-gray-400 font-inter">Today → {expiryStr} · 1 year</div>
            </div>
            <span className="text-[15px] font-bold text-gym-dark font-space">₱200</span>
          </div>

          {/* Monthly plan */}
          <div className="flex items-center justify-between mb-2.5 mt-2">
            <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase font-inter">Monthly plan</span>
            {membership && !hasActivePlan && <span className="text-[11px] text-green-600 font-semibold font-inter">requires membership ✓</span>}
          </div>
          
          {hasActivePlan && !canExtend ? (
            <div className="flex items-center gap-3 mb-2 border border-black/8 rounded-lg px-3.5 py-3 bg-gray-50 opacity-60 cursor-not-allowed">
              <div className="w-5 h-5 rounded-[5px] bg-white border border-black/14 flex items-center justify-center shrink-0">
                <Check size={13} color="#000" strokeWidth={3} className="opacity-0" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gym-dark font-inter">Already active</div>
                <div className="text-xs text-gray-400 font-inter">Expires on {monthlyExpiryStr} · cannot change yet</div>
              </div>
            </div>
          ) : (
            <>
              {hasActivePlan && canExtend && (
                <div className="text-xs text-orange-600 font-inter mb-3 bg-orange-50 p-2.5 rounded border border-orange-200">
                  Current plan expires on {monthlyExpiryStr}. Extending will add time to the end of the current plan.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {plans.map((p) => (
                  <div
                    key={p.key}
                    onClick={() => setPlan(p.key)}
                    className={`border rounded-lg px-3.5 py-3 cursor-pointer text-center transition-all duration-100 ${
                      plan === p.key ? "border-[2px] border-gym-lime bg-gym-lime/15" : "border border-black/14 bg-white"
                    }`}
                  >
                    <div className="text-sm font-bold text-gym-dark font-space">{p.label}</div>
                    <div className="text-xs text-gray-400 font-inter">{p.sub}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="px-5 py-4 bg-gray-50 border-t border-black/8">
          <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2.5 font-inter">Payment due now</div>
          {membership && (
            <div className="flex justify-between text-[13px] mb-1 font-inter">
              <span className="text-gray-400">Membership fee</span>
              <span className="text-gym-dark font-medium">₱200</span>
            </div>
          )}
          {planFee > 0 && (
            <div className="flex justify-between text-[13px] mb-2 font-inter">
              <span className="text-gray-400">Monthly plan · {selectedPlan.label}</span>
              <span className="text-gym-dark font-medium">₱{planFee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2.5 border-t border-black/8 font-space text-gym-dark">
            <span>Total</span>
            <span>₱{total.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="px-5 py-2.5 bg-red-50 border-t border-red-200 text-sm text-red-600 font-inter">{error}</div>
        )}

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-black/8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (!membership && selectedPlan.duration === 0)}
            className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-60"
          >
            <Banknote size={15} />
            {loading ? "Processing…" : "Record payment & activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
