"use client";

import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface QRModalProps {
  open: boolean;
  memberName: string;
  memberId: string;
  memberNumericId: number | null;
  onClose: () => void;
  onConfirm: (title: string, sub: string) => void;
}

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
              {loading ? (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-gray-300 text-xs font-inter">Loading…</div>
              ) : qrCode ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt={`QR Code for ${memberId}`} width={160} height={160} className="block" />
              ) : (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-gray-300 text-xs font-inter">No QR code</div>
              )}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-2.5">{memberId}</div>
            <div className="text-[11px] text-gray-600 font-inter mt-0.5">Show this at the counter</div>
          </div>
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
        </div>
      </div>
    </div>
  );
}
