"use client";

<<<<<<< HEAD
=======
import { useState, useEffect } from "react";
>>>>>>> origin/dev
import { X, Download } from "lucide-react";

interface QRModalProps {
  open: boolean;
  memberName: string;
  memberId: string;
<<<<<<< HEAD
=======
  memberNumericId: number | null;
>>>>>>> origin/dev
  onClose: () => void;
  onConfirm: (title: string, sub: string) => void;
}

<<<<<<< HEAD
function QRPattern() {
  const mm = 4;
  let seed = 11;
  function rnd() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  function inFinder(c: number, r: number) {
    return (c < 8 && r < 8) || (c > 16 && r < 8) || (c < 8 && r > 16);
  }
  const dots: { x: number; y: number }[] = [];
  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 25; c++) {
      if (inFinder(c, r)) continue;
      if (rnd() > 0.55) dots.push({ x: c * mm, y: r * mm });
    }
  }
  return (
    <svg viewBox="0 0 100 100" width={160} height={160} style={{ color: "#111111" }}>
      <rect x={0} y={0} width={28} height={28} fill="currentColor" />
      <rect x={4} y={4} width={20} height={20} fill="white" />
      <rect x={8} y={8} width={12} height={12} fill="currentColor" />
      <rect x={72} y={0} width={28} height={28} fill="currentColor" />
      <rect x={76} y={4} width={20} height={20} fill="white" />
      <rect x={80} y={8} width={12} height={12} fill="currentColor" />
      <rect x={0} y={72} width={28} height={28} fill="currentColor" />
      <rect x={4} y={76} width={20} height={20} fill="white" />
      <rect x={8} y={80} width={12} height={12} fill="currentColor" />
      {dots.map((d, i) => (
        <rect key={i} x={d.x} y={d.y} width={mm} height={mm} fill="currentColor" />
      ))}
    </svg>
  );
}

export function QRModal({ open, memberName, memberId, onClose, onConfirm }: QRModalProps) {
  if (!open) return null;
=======
export function QRModal({ open, memberName, memberId, memberNumericId, onClose, onConfirm }: QRModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !memberNumericId) return;
    setLoading(true);
    fetch(`/api/members/${memberNumericId}`)
      .then((r) => r.json())
      .then((data) => setQrCode(data.data?.qrCode ?? null))
      .finally(() => setLoading(false));
  }, [open, memberNumericId]);

  if (!open) return null;

>>>>>>> origin/dev
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-40 backdrop-blur-sm"
    >
      <div className="w-full max-w-[340px] bg-white border border-black/8 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
          <span className="font-space font-bold text-base text-gym-dark">Member QR</span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors flex">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5.5 text-center">
          <div className="text-base font-bold text-gym-dark font-space">{memberName}</div>
          <div className="text-xs text-gray-400 font-mono mb-4.5 mt-0.5">{memberId}</div>
          <div className="bg-gym-dark rounded-xl px-5 pt-5 pb-4 mb-4 inline-block">
            <div className="bg-white rounded-lg p-2 inline-block">
<<<<<<< HEAD
              <QRPattern />
=======
              {loading ? (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-gray-300 text-xs font-inter">Loading…</div>
              ) : qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt={`QR Code for ${memberId}`} width={160} height={160} className="block" />
              ) : (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-gray-300 text-xs font-inter">No QR code</div>
              )}
>>>>>>> origin/dev
            </div>
            <div className="text-xs text-gray-500 font-mono mt-2.5">{memberId}</div>
            <div className="text-[11px] text-gray-600 font-inter mt-0.5">Show this at the counter</div>
          </div>
<<<<<<< HEAD
          <button
            onClick={() => onConfirm("QR downloaded", `${memberName} · ${memberId}`)}
            className="w-full py-3 text-sm font-bold font-space rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 border-none cursor-pointer"
          >
            <Download size={14} />
            Download QR
          </button>
=======
          {qrCode ? (
            <a
              href={qrCode}
              download={`${memberId}.png`}
              onClick={() => onConfirm("QR downloaded", `${memberName} · ${memberId}`)}
              className="w-full py-3 text-sm font-bold font-space rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 border-none cursor-pointer no-underline"
            >
              <Download size={14} />
              Download QR
            </a>
          ) : (
            <button
              disabled
              className="w-full py-3 text-sm font-bold font-space rounded-full bg-gray-100 text-gray-400 flex items-center justify-center gap-1.5 border-none cursor-not-allowed"
            >
              <Download size={14} />
              Download QR
            </button>
          )}
>>>>>>> origin/dev
        </div>
      </div>
    </div>
  );
}
