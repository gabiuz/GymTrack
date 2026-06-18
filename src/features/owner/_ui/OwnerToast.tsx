"use client";

import { Check, X } from "lucide-react";
import { useEffect } from "react";

interface OwnerToastProps {
  show: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
}

export function OwnerToast({ show, title, subtitle, onClose }: OwnerToastProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3500);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 w-[calc(100%-2rem)] lg:w-80 bg-white border border-black/8 border-l-[3px] border-l-gym-lime rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-3.5 flex items-start gap-3 z-50 font-inter">
      <div className="w-7 h-7 rounded-full bg-gym-lime/20 flex items-center justify-center text-green-600 shrink-0">
        <Check size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-gym-dark font-space">{title}</div>
        <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{subtitle}</div>
      </div>
      <button onClick={onClose} className="text-gray-300 hover:text-gray-400 transition-colors p-0 bg-transparent border-none cursor-pointer flex">
        <X size={14} />
      </button>
    </div>
  );
}
