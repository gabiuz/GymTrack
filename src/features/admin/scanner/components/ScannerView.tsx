"use client";

import {
  Camera,
  CameraOff,
  RefreshCw,
  QrCode,
  Search,
  CheckCircle,
  AlertTriangle,
  FlaskConical,
  Check,
  X as XIcon,
} from "lucide-react";
import { useState } from "react";
import { ManageMembershipModal } from "@/features/admin/members/components/ManageMembershipModal";
import { StatusPill } from "@/features/admin/_ui";

type ScanState =
  | "perm"
  | "blocked"
  | "ready"
  | "res-a"
  | "res-b"
  | "res-c"
  | "res-d"
  | "res-guest"
  | "res-invalid"
  | "outcome";

interface OutcomeData { kind: "ok" | "deny"; title: string; sub: string; }
interface ScannerViewProps { onToast: (title: string, sub: string) => void; }

function InitialsAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      className="rounded-full bg-gray-100 flex items-center justify-center shrink-0 font-inter font-semibold text-gray-400 tracking-wide"
    >
      {initials}
    </div>
  );
}

function MemberHeader({ name, id, pill }: { name: string; id: string; pill: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 mb-5">
      <InitialsAvatar name={name} />
      <div className="flex-1">
        <div className="font-space font-bold text-[18px] tracking-tight text-gym-dark">{name}</div>
        <div className="text-[13px] text-gray-400 font-mono mt-0.5">{id}</div>
      </div>
      {pill}
    </div>
  );
}

function ScanCard({
  children,
  borderColor,
}: {
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div className="max-w-[580px] mx-auto">
      <div
        className="bg-white rounded-[20px] p-5 lg:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
        style={{ border: `1.5px solid ${borderColor ?? "rgba(0,0,0,0.08)"}` }}
      >
        {children}
      </div>
    </div>
  );
}

const DEMO_STATES: [ScanState, string][] = [
  ["res-a", "Unassigned"],
  ["res-b", "Daily · member"],
  ["res-c", "Active plan"],
  ["res-d", "Expired"],
  ["res-guest", "Daily · guest"],
  ["res-invalid", "Invalid QR"],
];

export function ScannerView({ onToast }: ScannerViewProps) {
  const [state, setState] = useState<ScanState>("ready");
  const [outcome, setOutcome] = useState<OutcomeData>({ kind: "ok", title: "", sub: "" });
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCtx, setManageCtx] = useState({
    name: "",
    id: "",
    status: "unassigned" as "active" | "expired" | "unassigned",
  });
  const [lookupVal, setLookupVal] = useState("");

  const go = (s: ScanState) => setState(s);
  const recordOutcome = (kind: "ok" | "deny", title: string, sub: string) => {
    setOutcome({ kind, title, sub });
    go("outcome");
  };
  const openManage = (name: string, id: string, status: "active" | "expired" | "unassigned") => {
    setManageCtx({ name, id, status });
    setManageOpen(true);
  };

  return (
    <>
      <style>{`@keyframes spscan{0%{top:18%}50%{top:80%}100%{top:18%}}`}</style>

      {/* ── CAMERA PERM ── */}
      {state === "perm" && (
        <ScanCard>
          <div className="relative h-[260px] bg-gray-50 border border-black/8 rounded-xl overflow-hidden flex items-center justify-center mb-5">
            <div className="opacity-30 blur-sm flex flex-col items-center gap-1.5 text-gray-300">
              <Camera size={40} />
              <span className="text-xs font-inter">Camera feed</span>
            </div>
            <div className="absolute top-4 left-4 right-4 bg-white border border-black/8 rounded-xl p-4 flex items-start gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              <Camera size={20} className="text-gray-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold mb-1 text-gym-dark font-space">Allow camera access?</div>
                <div className="text-[13px] text-gray-400 mb-3.5 font-inter">Needed to scan member QR codes.</div>
                <div className="flex gap-2">
                  <button onClick={() => go("ready")} className="flex items-center px-5 py-2 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">Allow</button>
                  <button onClick={() => go("blocked")} className="flex items-center px-4 py-2 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">Block</button>
                </div>
              </div>
            </div>
          </div>
        </ScanCard>
      )}

      {/* ── CAMERA BLOCKED ── */}
      {state === "blocked" && (
        <ScanCard>
          <div className="h-[180px] bg-gray-50 border-[1.5px] border-dashed border-black/14 rounded-xl flex flex-col items-center justify-center gap-2.5 mb-5">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <CameraOff size={26} />
            </div>
            <div className="text-base font-bold text-gym-dark font-space">Can&apos;t access the camera</div>
            <div className="text-[13px] text-gray-400 text-center max-w-[280px] leading-relaxed font-inter">Blocked, in use, or no camera. Use Member ID below, or retry.</div>
            <button onClick={() => go("perm")} className="flex items-center gap-1.5 px-4.5 py-2 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 mt-1">
              <RefreshCw size={13} /> Retry camera
            </button>
          </div>
          <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2 font-inter flex items-center gap-1.5">
            <Search size={12} /> Check in by Member ID
          </div>
          <div className="flex gap-2.5">
            <input type="text" placeholder="MEM-000000" value={lookupVal} onChange={(e) => setLookupVal(e.target.value)}
              className="flex-1 bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm font-mono text-gym-dark outline-none focus:border-gym-lime transition-colors" />
            <button onClick={() => go("res-c")} className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
              <Search size={13} /> Look up
            </button>
          </div>
        </ScanCard>
      )}

      {/* ── READY TO SCAN ── */}
      {state === "ready" && (
        <div className="max-w-[580px] mx-auto flex flex-col gap-3.5">
          {/* Viewfinder */}
          <div className="relative h-[220px] bg-gray-50 border border-black/8 rounded-2xl flex flex-col items-center justify-center gap-2.5 overflow-hidden">
            {/* Corner brackets */}
            {[
              { top: 14, left: 14, borderTop: "2.5px solid #C5FF00", borderLeft: "2.5px solid #C5FF00", borderRadius: "4px 0 0 0" },
              { top: 14, right: 14, borderTop: "2.5px solid #C5FF00", borderRight: "2.5px solid #C5FF00", borderRadius: "0 4px 0 0" },
              { bottom: 14, left: 14, borderBottom: "2.5px solid #C5FF00", borderLeft: "2.5px solid #C5FF00", borderRadius: "0 0 0 4px" },
              { bottom: 14, right: 14, borderBottom: "2.5px solid #C5FF00", borderRight: "2.5px solid #C5FF00", borderRadius: "0 0 4px 0" },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }} />
            ))}
            <div
              style={{
                position: "absolute", left: 44, right: 44, height: 2,
                background: "#C5FF00", opacity: 0.8, top: "18%",
                animation: "spscan 2s ease-in-out infinite", borderRadius: 1,
              }}
            />
            <QrCode size={36} className="text-black/14" />
            <span className="text-[13px] text-gray-400 font-inter">Point the member&apos;s QR at the camera</span>
          </div>

          {/* Manual lookup */}
          <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2 font-inter">Or enter Member ID manually</div>
            <div className="flex gap-2.5">
              <input type="text" placeholder="MEM-000000" value={lookupVal} onChange={(e) => setLookupVal(e.target.value)}
                className="flex-1 bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm font-mono text-gym-dark outline-none focus:border-gym-lime transition-colors" />
              <button onClick={() => go("res-c")} className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">
                <Search size={13} /> Look up
              </button>
            </div>
          </div>

          {/* Demo bar */}
          <div className="border border-dashed border-black/14 rounded-[10px] px-3.5 py-2.5 flex items-center gap-2 flex-wrap bg-white">
            <span className="text-[11px] text-gray-300 font-semibold flex items-center gap-1.5 font-inter">
              <FlaskConical size={11} /> Demo · simulate a scan:
            </span>
            {DEMO_STATES.map(([s, l]) => (
              <button key={s} onClick={() => go(s)}
                className="text-[11px] px-3 py-1 rounded-full border border-black/14 bg-gray-50 text-gray-400 cursor-pointer font-medium font-inter hover:bg-gray-100 transition-colors">
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── RES A — Unassigned ── */}
      {state === "res-a" && (
        <ScanCard>
          <MemberHeader name="Liza Tan" id="MEM-000014" pill={<StatusPill variant="unassigned" size="md">Unassigned</StatusPill>} />
          <div className="flex items-start gap-2.5 bg-gym-lime/15 rounded-xl px-4 py-3.5 mb-5 font-inter">
            <div className="w-5 h-5 rounded-full border-[1.5px] border-[#5A7000] flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-0.5 h-2 bg-[#5A7000] rounded-sm mt-0.5" />
            </div>
            <span className="text-[15px] text-[#3A5000] leading-relaxed">No membership or plan on file. Choose how to proceed.</span>
          </div>
          <button onClick={() => openManage("Liza Tan", "MEM-000014", "unassigned")}
            className="w-full py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 mb-2.5">
            Register membership · ₱200/yr
          </button>
          <button onClick={() => go("res-guest")}
            className="w-full py-4 text-[15px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">
            Daily visit
          </button>
        </ScanCard>
      )}

      {/* ── RES B — Daily visit (member) ── */}
      {state === "res-b" && (
        <ScanCard>
          <MemberHeader name="Mark Cruz" id="MEM-000008" pill={<StatusPill variant="active" size="md">Active member</StatusPill>} />
          <div className="text-center px-4 py-5 bg-gray-50 rounded-xl mb-3.5">
            <div className="text-[11px] font-semibold text-gray-400 tracking-[0.08em] uppercase font-inter mb-1.5">Daily visit · amount due</div>
            <div className="font-space text-[52px] font-bold text-gym-dark tracking-tight leading-none">₱70</div>
            <div className="text-[13px] text-gray-400 font-inter mt-1.5">member rate · non-member is ₱75</div>
          </div>
          <div className="text-[13px] text-gray-400 text-center mb-4.5 font-inter">
            Paid records attendance + payment. Unpaid denies access.
          </div>
          <div className="flex flex-col lg:flex-row gap-2.5">
            <button onClick={() => recordOutcome("ok", "Payment recorded", "Daily visit · ₱70 · attendance logged")}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
              <Check size={16} strokeWidth={2.5} /> Mark paid
            </button>
            <button onClick={() => recordOutcome("deny", "Access denied", "Visit not paid — no attendance recorded")}
              className="flex items-center justify-center gap-2 px-5 py-4 text-[15px] font-bold font-space border border-black/14 rounded-full bg-white text-red-600 cursor-pointer hover:bg-red-50 transition-colors whitespace-nowrap">
              <XIcon size={16} strokeWidth={2.5} /> Unpaid
            </button>
          </div>
        </ScanCard>
      )}

      {/* ── RES GUEST — Daily visit (guest) ── */}
      {state === "res-guest" && (
        <ScanCard>
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-[52px] h-[52px] rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <QrCode size={22} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="font-space font-bold text-[18px] tracking-tight text-gym-dark">Guest visitor</div>
              <div className="text-[13px] text-gray-400 font-inter mt-0.5">No membership on file</div>
            </div>
            <StatusPill variant="guest" size="md">Guest</StatusPill>
          </div>
          <div className="text-center px-4 py-5 bg-gray-50 rounded-xl mb-3.5">
            <div className="text-[11px] font-semibold text-gray-400 tracking-[0.08em] uppercase font-inter mb-1.5">Daily visit · amount due</div>
            <div className="font-space text-[52px] font-bold text-gym-dark tracking-tight leading-none">₱75</div>
            <div className="text-[13px] text-gray-400 font-inter mt-1.5">guest rate · members pay ₱70</div>
          </div>
          <div className="text-[13px] text-gray-400 text-center mb-4.5 font-inter">
            Paid records attendance + payment. Unpaid denies access.
          </div>
          <div className="flex flex-col lg:flex-row gap-2.5">
            <button onClick={() => recordOutcome("ok", "Payment recorded", "Guest daily visit · ₱75 · attendance logged")}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
              <Check size={16} strokeWidth={2.5} /> Mark paid
            </button>
            <button onClick={() => recordOutcome("deny", "Access denied", "Visit not paid — no attendance recorded")}
              className="flex items-center justify-center gap-2 px-5 py-4 text-[15px] font-bold font-space border border-black/14 rounded-full bg-white text-red-600 cursor-pointer hover:bg-red-50 transition-colors whitespace-nowrap">
              <XIcon size={16} strokeWidth={2.5} /> Unpaid
            </button>
          </div>
        </ScanCard>
      )}

      {/* ── RES C — Access granted ── */}
      {state === "res-c" && (
        <ScanCard borderColor="rgba(22,163,74,0.25)">
          <div className="text-center pb-5.5 border-b border-black/8 mb-5.5">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={34} className="text-green-600" strokeWidth={2} />
            </div>
            <div className="font-space font-bold text-2xl text-green-600 tracking-tight mb-1">Access granted</div>
            <div className="text-sm text-gray-400 font-inter">Attendance recorded automatically</div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3.5">
              <InitialsAvatar name="Ana Reyes" />
              <div className="flex-1">
                <div className="font-space font-bold text-[17px] text-gym-dark">Ana Reyes</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">MEM-000001</div>
              </div>
            </div>
            <div className="text-left lg:text-right">
              <StatusPill variant="active" size="md">Monthly · active</StatusPill>
              <div className="text-xs text-gray-400 font-inter mt-1">expires 9 Jul 2026</div>
            </div>
          </div>
          <button onClick={() => go("ready")}
            className="w-full flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
            <QrCode size={16} /> Scan next member
          </button>
        </ScanCard>
      )}

      {/* ── RES D — Expired ── */}
      {state === "res-d" && (
        <ScanCard borderColor="rgba(217,119,6,0.25)">
          <MemberHeader name="Jose Santos" id="MEM-000023" pill={<StatusPill variant="expired" size="md">Plan expired</StatusPill>} />
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5 font-inter">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span className="text-[15px] text-amber-600">Monthly plan expired on 1 Jun 2026.</span>
          </div>
          <button onClick={() => openManage("Jose Santos", "MEM-000023", "expired")}
            className="w-full py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 mb-2.5">
            Renew monthly plan
          </button>
          <button onClick={() => go("res-b")}
            className="w-full py-4 text-[15px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">
            Switch to daily visit
          </button>
        </ScanCard>
      )}

      {/* ── RES INVALID ── */}
      {state === "res-invalid" && (
        <ScanCard>
          <div className="text-center mb-5">
            <div className="w-[60px] h-[60px] rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4.5">
              <div className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <div className="w-0.5 h-2.5 bg-gray-300 rounded-sm mb-0.5" />
              </div>
            </div>
            <div className="font-space font-bold text-xl text-gym-dark mb-2">Code not recognized</div>
            <div className="text-sm text-gray-400 leading-relaxed mx-auto max-w-[340px] font-inter">
              This QR isn&apos;t a valid GymTrack member code. Make sure it&apos;s the member&apos;s pass, or enter the ID manually.
            </div>
          </div>
          <div className="flex justify-center mb-5.5">
            <button onClick={() => go("ready")}
              className="flex items-center gap-1.5 px-7 py-3.5 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
              <RefreshCw size={15} /> Scan again
            </button>
          </div>
          <div className="border-t border-black/8 pt-5">
            <div className="text-[11px] font-semibold text-gray-400 tracking-[0.07em] uppercase mb-2.5 font-inter">Enter Member ID manually</div>
            <div className="flex gap-2.5">
              <input type="text" placeholder="MEM-000000" value={lookupVal} onChange={(e) => setLookupVal(e.target.value)}
                className="flex-1 bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm font-mono text-gym-dark outline-none focus:border-gym-lime transition-colors" />
              <button onClick={() => go("res-c")} className="flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">
                <Search size={13} /> Look up
              </button>
            </div>
          </div>
        </ScanCard>
      )}

      {/* ── OUTCOME ── */}
      {state === "outcome" && (
        <ScanCard borderColor={outcome.kind === "ok" ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)"}>
          <div className="text-center py-2 pb-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4.5 border-[1.5px] ${
                outcome.kind === "ok"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {outcome.kind === "ok"
                ? <CheckCircle size={34} className="text-green-600" strokeWidth={2} />
                : <XIcon size={34} className="text-red-600" strokeWidth={2} />}
            </div>
            <div className={`font-space font-bold text-2xl mb-1.5 ${outcome.kind === "ok" ? "text-green-600" : "text-red-600"}`}>
              {outcome.title}
            </div>
            <div className="text-sm text-gray-400 font-inter">{outcome.sub}</div>
          </div>
          <button onClick={() => go("ready")}
            className="w-full flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
            <QrCode size={16} /> Scan next member
          </button>
        </ScanCard>
      )}

      <ManageMembershipModal
        open={manageOpen}
        memberName={manageCtx.name}
        memberId={manageCtx.id}
        memberStatus={manageCtx.status}
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); go("ready"); }}
      />
    </>
  );
}
