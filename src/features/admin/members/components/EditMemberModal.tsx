"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";

interface MemberData {
  name: string;
  id: string;
  contact?: string;
  birth?: string;
  address?: string;
  emergency?: string;
}

interface EditMemberModalProps {
  open: boolean;
  member: MemberData | null;
  onClose: () => void;
  onConfirm: (title: string, sub: string) => void;
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-1.5 font-inter">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-black/14 rounded-lg px-3 py-2.5 text-[13px] text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors box-border"
      />
    </div>
  );
}

export function EditMemberModal({ open, member, onClose, onConfirm }: EditMemberModalProps) {
  const [form, setForm] = useState({
    name: member?.name ?? "",
    contact: member?.contact ?? "",
    birth: member?.birth ?? "",
    address: member?.address ?? "",
    emergency: member?.emergency ?? "",
  });

  if (!open || !member) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-40 backdrop-blur-sm"
    >
      <div className="w-full max-w-[440px] bg-white border border-black/8 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
          <span className="font-space font-bold text-base text-gym-dark">Edit Member</span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors flex">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4.5">
          <Field label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact" value={form.contact} onChange={(v) => setForm((f) => ({ ...f, contact: v }))} />
            <Field label="Birth date" value={form.birth} onChange={(v) => setForm((f) => ({ ...f, birth: v }))} />
          </div>
          <Field label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
          <Field label="Emergency contact" value={form.emergency} onChange={(v) => setForm((f) => ({ ...f, emergency: v }))} />
        </div>
        <div className="flex justify-between gap-2 px-5 py-3.5 border-t border-black/8">
          <button className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium border border-red-200 rounded-full bg-red-50 text-red-600 cursor-pointer font-inter">
            <Trash2 size={13} />
            Archive
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4.5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm("Changes saved", `${member.name} · profile updated`)}
              className="px-5 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity cursor-pointer border-none"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
