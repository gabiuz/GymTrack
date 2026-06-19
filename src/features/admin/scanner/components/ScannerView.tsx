"use client";

import {
  Camera,
  CameraOff,
  RefreshCw,
  QrCode,
  Search,
  CheckCircle,
  AlertTriangle,
  Check,
  X as XIcon,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { ManageMembershipModal } from "@/features/admin/members/components/ManageMembershipModal";
import { StatusPill } from "@/features/admin/_ui";

// ── Types ────────────────────────────────────────────────────────────────────

type ScanState =
  | "perm"
  | "blocked"
  | "ready"
  | "loading"
  | "res-a"
  | "res-b"
  | "res-c"
  | "res-d"
  | "res-guest"
  | "res-invalid"
  | "res-duplicate"
  | "outcome";

interface OutcomeData { kind: "ok" | "deny"; title: string; sub: string; }

interface CheckinResult {
  status: "monthly_active" | "member_daily" | "guest" | "expired" | "unassigned" | "already_checked_in";
  member?: { id: number; memberId: string; fullName: string; photoUrl: string | null };
  rate?: number;
  planEndDate?: string;
  membershipEndDate?: string;
  checkedInAt?: string;
}

interface ScannerViewProps { onToast: (title: string, sub: string) => void; }

// ── UI helpers ───────────────────────────────────────────────────────────────

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

function ScanCard({ children, borderColor }: { children: React.ReactNode; borderColor?: string }) {
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

// ── Main component ───────────────────────────────────────────────────────────

export function ScannerView({ onToast }: ScannerViewProps) {
  const [state, setState]         = useState<ScanState>("perm");
  const [outcome, setOutcome]     = useState<OutcomeData>({ kind: "ok", title: "", sub: "" });
  const [manageOpen, setManageOpen] = useState(false);
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);
  const [lookupVal, setLookupVal] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [lookupError, setLookupError] = useState("");
  // Override rate used when an unassigned member does a daily visit (₱75 instead of member ₱70)
  const [memberDailyRate, setMemberDailyRate] = useState<number | null>(null);
  const [cameras, setCameras]         = useState<MediaDeviceInfo[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);

  const scannerRef = useRef<HTMLDivElement>(null);
  // We store the scanner instance in a ref to avoid it affecting render
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);

  const go = (s: ScanState) => setState(s);

  // ── Check-in API call ───────────────────────────────────────────────────
  const doCheckin = useCallback(async (memberId: string | null) => {
    go("loading");
    setLookupError("");
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (res.status === 404) {
        setCheckinResult(null);
        go("res-invalid");
        return;
      }

      if (!res.ok) {
        setCheckinResult(null);
        go("res-invalid");
        return;
      }

      const data: CheckinResult = await res.json();
      setCheckinResult(data);

      switch (data.status) {
        case "monthly_active":     go("res-c"); break;
        case "member_daily":       go("res-b"); break;
        case "guest":              go("res-guest"); break;
        case "expired":            go("res-d"); break;
        case "unassigned":         go("res-a"); break;
        case "already_checked_in": go("res-duplicate"); break;
        default:                   go("res-invalid");
      }
    } catch {
      go("res-invalid");
    }
  }, []);

  // ── Confirm daily payment ───────────────────────────────────────────────
  const confirmPayment = useCallback(async (
    memberId: string | null,
    amount: number,
    walkIn?: string
  ) => {
    try {
      const res = await fetch("/api/admin/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          walkInName: walkIn ?? null,
          visitType: "daily",
          amount,
        }),
      });
      if (res.status === 409) {
        const errData = await res.json();
        setCheckinResult((prev) => prev ? { ...prev, checkedInAt: errData.checkedInAt } : prev);
        go("res-duplicate");
        return false;
      }
      return res.ok;
    } catch {
      // best-effort — we still show the outcome
      return false;
    }
  }, []);

  const recordOutcome = (kind: "ok" | "deny", title: string, sub: string) => {
    setOutcome({ kind, title, sub });
    go("outcome");
  };

  const openManage = () => {
    setManageOpen(true);
  };

  // ── Camera / QR scanner setup ───────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch { /* ignore */ }
      html5QrRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async (cameraId?: string | null) => {
    if (!scannerRef.current) return;
    await stopScanner();

    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    html5QrRef.current = scanner;

    // Use specific deviceId if provided, otherwise prefer back/environment camera
    const cameraConstraint: MediaTrackConstraints = cameraId
      ? { deviceId: { exact: cameraId } }
      : { facingMode: "environment" };

    try {
      await scanner.start(
        cameraConstraint,
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          stopScanner();
          doCheckin(decodedText.trim());
        },
        () => { /* quiet scan errors */ }
      );
      // After permission granted, enumerate devices (labels are only available post-permission)
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setCameras(videoDevices);
        if (!cameraId && videoDevices.length > 0) setActiveCameraId(videoDevices[0].deviceId);
      }
    } catch {
      go("blocked");
    }
  }, [stopScanner, doCheckin]);

  const handleCameraChange = useCallback(async (deviceId: string) => {
    setActiveCameraId(deviceId);
    await startScanner(deviceId);
  }, [startScanner]);

  useEffect(() => {
    if (state === "ready") {
      startScanner(activeCameraId ?? undefined);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Manage context (for unassigned / expired) ───────────────────────────
  const manageCtx = checkinResult?.member
    ? {
        name: checkinResult.member.fullName,
        id: checkinResult.member.memberId,
        numericId: checkinResult.member.id,
        status: (checkinResult.status === "unassigned" ? "unassigned" : "expired") as "active" | "expired" | "unassigned",
      }
    : { name: "", id: "", numericId: null, status: "unassigned" as const };

  const handleLookup = () => {
    if (!lookupVal.trim()) return;
    const full = `MEM-${lookupVal.trim().padStart(6, "0")}`;
    doCheckin(full);
  };

  const handleLookupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setLookupVal(val);
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" }) : "";

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
          <div className="flex gap-2.5 items-center">
            <div className="flex items-center flex-1 bg-gray-50 border border-black/14 rounded-lg overflow-hidden focus-within:border-gym-lime transition-colors">
              <span className="pl-3.5 text-sm font-mono text-gray-400 select-none">MEM-</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={lookupVal}
                onChange={handleLookupChange}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                className="flex-1 bg-transparent border-none outline-none px-1 py-2.5 text-sm font-mono text-gym-dark"
              />
            </div>
            <button onClick={handleLookup} className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 whitespace-nowrap">
              <Search size={13} /> Look up
            </button>
          </div>
        </ScanCard>
      )}

      {/* ── LOADING ── */}
      {state === "loading" && (
        <ScanCard>
          <div className="h-[160px] flex items-center justify-center text-gray-400 font-inter text-sm gap-2">
            <div className="w-5 h-5 border-2 border-gym-lime border-t-transparent rounded-full animate-spin" />
            Looking up member…
          </div>
        </ScanCard>
      )}

      {/* ── READY TO SCAN ── */}
      {state === "ready" && (
        <div className="max-w-[580px] mx-auto flex flex-col gap-3.5">
          {/* Viewfinder with real camera */}
          <div className="relative bg-gray-50 border border-black/8 rounded-2xl overflow-hidden">
            {/* Corner brackets */}
            {[
              { top: 14, left: 14, borderTop: "2.5px solid #C5FF00", borderLeft: "2.5px solid #C5FF00", borderRadius: "4px 0 0 0" },
              { top: 14, right: 14, borderTop: "2.5px solid #C5FF00", borderRight: "2.5px solid #C5FF00", borderRadius: "0 4px 0 0" },
              { bottom: 14, left: 14, borderBottom: "2.5px solid #C5FF00", borderLeft: "2.5px solid #C5FF00", borderRadius: "0 0 0 4px" },
              { bottom: 14, right: 14, borderBottom: "2.5px solid #C5FF00", borderRight: "2.5px solid #C5FF00", borderRadius: "0 0 4px 0" },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 24, height: 24, zIndex: 10, ...s }} />
            ))}
            <div style={{ position: "absolute", left: 44, right: 44, height: 2, zIndex: 10, background: "#C5FF00", opacity: 0.8, top: "18%", animation: "spscan 2s ease-in-out infinite", borderRadius: 1 }} />
            {/* html5-qrcode mounts the camera here */}
            <div id="qr-reader" ref={scannerRef} className="w-full" style={{ minHeight: 220 }} />
          </div>


          {/* Camera selector — shown once 2+ cameras are detected */}
          {cameras.length > 1 && (
            <div className="bg-white border border-black/8 rounded-xl px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase font-inter shrink-0">Camera</span>
              <select
                value={activeCameraId ?? ""}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-gym-dark font-inter cursor-pointer min-w-0"
              >
                {cameras.map((cam, i) => {
                  const label = cam.label
                    ? (/front|user|facing front/i.test(cam.label) ? "Front Camera"
                      : /back|rear|environment|facing back/i.test(cam.label) ? "Back Camera"
                      : cam.label.length > 40 ? cam.label.slice(0, 37) + "…" : cam.label)
                    : `Camera ${i + 1}`;
                  return <option key={cam.deviceId} value={cam.deviceId}>{label}</option>;
                })}
              </select>
            </div>
          )}

          {/* Manual lookup */}
          <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className="text-[11px] font-semibold text-gray-400 tracking-widests uppercase mb-2 font-inter">Or enter Member ID manually</div>
            <div className="flex gap-2.5 items-center">
              <div className="flex items-center flex-1 bg-gray-50 border border-black/14 rounded-lg overflow-hidden focus-within:border-gym-lime transition-colors">
                <span className="pl-3.5 text-sm font-mono text-gray-400 select-none">MEM-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={lookupVal}
                  onChange={handleLookupChange}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  className="flex-1 bg-transparent border-none outline-none px-1 py-2.5 text-sm font-mono text-gym-dark"
                />
              </div>
              <button onClick={handleLookup} className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 whitespace-nowrap">
                <Search size={13} /> Look up
              </button>
            </div>
          </div>

          {/* Walk-in button */}
          <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
            <div className="text-[11px] font-semibold text-gray-400 tracking-widests uppercase mb-2 font-inter">Walk-in / guest</div>
            <div className="flex gap-2.5">
              <input type="text" placeholder="Guest name (optional)" value={walkInName} onChange={(e) => setWalkInName(e.target.value)}
                className="flex-1 bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm font-inter text-gym-dark outline-none focus:border-gym-lime transition-colors" />
              <button onClick={() => doCheckin(null)} className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 whitespace-nowrap">
                Guest visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RES A — Unassigned ── */}
      {state === "res-a" && checkinResult?.member && (
        <ScanCard>
          <MemberHeader
            name={checkinResult.member.fullName}
            id={checkinResult.member.memberId}
            pill={<StatusPill variant="unassigned" size="md">Unassigned</StatusPill>}
          />
          <div className="flex items-start gap-2.5 bg-gym-lime/15 rounded-xl px-4 py-3.5 mb-5 font-inter">
            <span className="text-[15px] text-[#3A5000] leading-relaxed">No membership or plan on file. Choose how to proceed.</span>
          </div>
          <button
            onClick={() => openManage()}
            className="w-full py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 mb-2.5"
          >
            Register membership · ₱200/yr
          </button>
          <button
            onClick={() => { setMemberDailyRate(75); go("res-b"); }}
            className="w-full py-4 text-[15px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Daily visit (₱75)
          </button>
        </ScanCard>
      )}

      {/* ── RES B — Daily visit (member) ── */}
      {state === "res-b" && checkinResult?.member && (() => {
        const rate = memberDailyRate ?? checkinResult.rate ?? 70;
        const isUnassigned = memberDailyRate === 75;
        return (
          <ScanCard>
            <MemberHeader
              name={checkinResult.member.fullName}
              id={checkinResult.member.memberId}
              pill={
                isUnassigned
                  ? <StatusPill variant="unassigned" size="md">Unassigned</StatusPill>
                  : <StatusPill variant="active" size="md">Active member</StatusPill>
              }
            />
            <div className="text-center px-4 py-5 bg-gray-50 rounded-xl mb-3.5">
              <div className="text-[11px] font-semibold text-gray-400 tracking-[0.08em] uppercase font-inter mb-1.5">Daily visit · amount due</div>
              <div className="font-space text-[52px] font-bold text-gym-dark tracking-tight leading-none">₱{rate}</div>
              <div className="text-[13px] text-gray-400 font-inter mt-1.5">
                {isUnassigned ? "no membership · members with plan pay ₱70" : "member rate · non-member is ₱75"}
              </div>
            </div>
            <div className="text-[13px] text-gray-400 text-center mb-4.5 font-inter">
              Paid records attendance + payment. Unpaid denies access.
            </div>
            <div className="flex flex-col lg:flex-row gap-2.5">
              <button
                onClick={async () => {
                  const ok = await confirmPayment(checkinResult.member!.memberId, rate);
                  if (ok === false) return; // already_checked_in handled inside
                  setMemberDailyRate(null);
                  recordOutcome("ok", "Payment recorded", `Daily visit · ₱${rate} · ${checkinResult.member!.fullName} · attendance logged`);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90"
              >
                <Check size={16} strokeWidth={2.5} /> Mark paid
              </button>
              <button
                onClick={() => { setMemberDailyRate(null); recordOutcome("deny", "Access denied", "Visit not paid — no attendance recorded"); }}
                className="flex items-center justify-center gap-2 px-5 py-4 text-[15px] font-bold font-space border border-black/14 rounded-full bg-white text-red-600 cursor-pointer hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                <XIcon size={16} strokeWidth={2.5} /> Unpaid
              </button>
            </div>
          </ScanCard>
        );
      })()}

      {/* ── RES GUEST — Daily visit (guest / walk-in) ── */}
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
            <button
              onClick={async () => {
                await confirmPayment(null, 75, walkInName || undefined);
                recordOutcome("ok", "Payment recorded", `Guest daily visit · ₱75 · attendance logged`);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90"
            >
              <Check size={16} strokeWidth={2.5} /> Mark paid
            </button>
            <button
              onClick={() => recordOutcome("deny", "Access denied", "Visit not paid — no attendance recorded")}
              className="flex items-center justify-center gap-2 px-5 py-4 text-[15px] font-bold font-space border border-black/14 rounded-full bg-white text-red-600 cursor-pointer hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              <XIcon size={16} strokeWidth={2.5} /> Unpaid
            </button>
          </div>
        </ScanCard>
      )}

      {/* ── RES C — Access granted (monthly active) ── */}
      {state === "res-c" && checkinResult?.member && (
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
              <InitialsAvatar name={checkinResult.member.fullName} />
              <div className="flex-1">
                <div className="font-space font-bold text-[17px] text-gym-dark">{checkinResult.member.fullName}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{checkinResult.member.memberId}</div>
              </div>
            </div>
            <div className="text-left lg:text-right">
              <StatusPill variant="active" size="md">Monthly · active</StatusPill>
              {checkinResult.planEndDate && (
                <div className="text-xs text-gray-400 font-inter mt-1">expires {formatDate(checkinResult.planEndDate)}</div>
              )}
            </div>
          </div>
          <button onClick={() => go("ready")}
            className="w-full flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
            <QrCode size={16} /> Scan next member
          </button>
        </ScanCard>
      )}

      {/* ── RES D — Expired ── */}
      {state === "res-d" && checkinResult?.member && (
        <ScanCard borderColor="rgba(217,119,6,0.25)">
          <MemberHeader
            name={checkinResult.member.fullName}
            id={checkinResult.member.memberId}
            pill={<StatusPill variant="expired" size="md">Plan expired</StatusPill>}
          />
          <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5 font-inter">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span className="text-[15px] text-amber-600">
              Membership expired{checkinResult.membershipEndDate ? ` on ${formatDate(checkinResult.membershipEndDate)}` : ""}.
            </span>
          </div>
          <button
            onClick={() => openManage()}
            className="w-full py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 mb-2.5"
          >
            Renew monthly plan
          </button>
          <button
            onClick={async () => {
              await confirmPayment(checkinResult.member!.memberId, 70);
              recordOutcome("ok", "Payment recorded", `Daily visit · ₱70 · attendance logged`);
            }}
            className="w-full py-4 text-[15px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors"
          >
            Switch to daily visit (₱70)
          </button>
        </ScanCard>
      )}

      {/* ── RES INVALID ── */}
      {state === "res-invalid" && (
        <ScanCard>
          <div className="text-center mb-5">
            <div className="w-[60px] h-[60px] rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4.5">
              <XIcon size={28} className="text-red-400" strokeWidth={2} />
            </div>
            <div className="font-space font-bold text-xl text-gym-dark mb-2">QR Code Invalid</div>
            <div className="text-sm text-gray-400 leading-relaxed mx-auto max-w-[340px] font-inter">
              Cannot identify member. Enter the Member ID manually to check in.
            </div>
          </div>
          {lookupError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-inter text-center">{lookupError}</div>
          )}
          <div className="border-t border-black/8 pt-5">
            <div className="text-[11px] font-semibold text-gray-400 tracking-[0.07em] uppercase mb-2.5 font-inter">Search by Member ID</div>
            <div className="flex gap-2.5 items-center mb-3.5">
              <div className="flex items-center flex-1 bg-gray-50 border border-black/14 rounded-lg overflow-hidden focus-within:border-gym-lime transition-colors">
                <span className="pl-3.5 text-sm font-mono text-gray-400 select-none">MEM-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={lookupVal}
                  onChange={handleLookupChange}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  className="flex-1 bg-transparent border-none outline-none px-1 py-2.5 text-sm font-mono text-gym-dark"
                />
              </div>
              <button
                onClick={handleLookup}
                className="flex items-center gap-1.5 px-4.5 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 whitespace-nowrap"
              >
                <Search size={13} /> Search
              </button>
            </div>
            <button onClick={() => { go("ready"); setLookupVal(""); }}
              className="w-full flex items-center justify-center gap-1.5 px-7 py-3.5 text-[15px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">
              <RefreshCw size={15} /> Back to scanner
            </button>
          </div>
        </ScanCard>
      )}

      {/* ── RES DUPLICATE — already checked in today ── */}
      {state === "res-duplicate" && checkinResult?.member && (
        <ScanCard borderColor="rgba(99,102,241,0.3)">
          <div className="text-center pb-5.5 border-b border-black/8 mb-5.5">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={34} className="text-indigo-500" strokeWidth={2} />
            </div>
            <div className="font-space font-bold text-2xl text-indigo-500 tracking-tight mb-1">Already checked in</div>
            <div className="text-sm text-gray-400 font-inter">
              {checkinResult.checkedInAt
                ? `Logged today at ${new Date(checkinResult.checkedInAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`
                : "Already logged for today"}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5.5">
            <div className="flex items-center gap-3.5">
              <InitialsAvatar name={checkinResult.member.fullName} />
              <div className="flex-1">
                <div className="font-space font-bold text-[17px] text-gym-dark">{checkinResult.member.fullName}</div>
                <div className="text-xs text-gray-400 font-mono mt-0.5">{checkinResult.member.memberId}</div>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3.5 mb-5 font-inter">
            <CheckCircle size={15} className="text-indigo-500 shrink-0 mt-0.5" />
            <span className="text-[14px] text-indigo-700 leading-snug">
              This member&apos;s attendance has already been recorded today. No duplicate entry will be created.
            </span>
          </div>
          <button onClick={() => { setCheckinResult(null); setLookupVal(""); setWalkInName(""); go("ready"); }}
            className="w-full flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
            <QrCode size={16} /> Scan next member
          </button>
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
          <button onClick={() => { go("ready"); setLookupVal(""); setWalkInName(""); }}
            className="w-full flex items-center justify-center gap-2 py-4 text-[15px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
            <QrCode size={16} /> Scan next member
          </button>
        </ScanCard>
      )}

      <ManageMembershipModal
        open={manageOpen}
        memberName={manageCtx.name}
        memberId={manageCtx.id}
        memberNumericId={manageCtx.numericId}
        memberStatus={manageCtx.status}
        monthlyEndDate={null}
        annualEndDate={null}
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); go("ready"); }}
      />
    </>
  );
}
