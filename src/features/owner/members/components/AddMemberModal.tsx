"use client";

import { useState } from "react";
import { X, QrCode } from "lucide-react";

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (title: string, sub: string) => void;
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border border-black/14 rounded-lg px-3 py-2.5 text-[13px] text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors box-border"
      />
    </div>
  );
}

export function AddMemberModal({ open, onClose, onConfirm }: AddMemberModalProps) {
  const [form, setForm]     = useState({ name: "", contact: "", gender: "Male", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  if (!open) return null;

  async function handleConfirm() {
    setError("");
    if (!form.name || !form.contact || !form.address) {
      setError("Full name, contact, and address are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.name,
          contactNumber: form.contact,
          gender: form.gender,
          address: form.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create member"); return; }
      onConfirm("Member added", `${form.name} · ${data.member?.memberId ?? ""} created`);
      setForm({ name: "", contact: "", gender: "Male", address: "" });
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-40 backdrop-blur-sm"
    >
      <div className="w-full max-w-[440px] bg-white border border-black/8 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
          <span className="font-space font-bold text-base text-gym-dark">Add Member</span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors flex">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4.5">
          <Field
            label="Full name"
            placeholder="Juan dela Cruz"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Field
              label="Contact"
              placeholder="09XX XXX XXXX"
              value={form.contact}
              onChange={(v) => setForm((f) => ({ ...f, contact: v }))}
            />
            <div className="mb-3.5">
              <label className="block text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-1.5 font-inter">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                className="w-full bg-gray-50 border border-black/14 rounded-lg px-3 py-2.5 text-[13px] text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors box-border"
              >
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>
          <Field
            label="Address"
            placeholder="Street, barangay, city"
            value={form.address}
            onChange={(v) => setForm((f) => ({ ...f, address: v }))}
          />
          <div className="px-3 py-2.5 bg-gym-lime/15 rounded-lg text-xs text-[#5A7000] leading-relaxed flex items-center gap-1.5 font-inter mt-1">
            <QrCode size={13} className="shrink-0" />
            Creates a Member ID + QR. Status starts Unassigned.
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-black/8">
          <button
            onClick={onClose}
            className="px-4.5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {error && (
            <div className="mb-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-inter">{error}</div>
          )}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create member"}
          </button>
        </div>
      </div>
    </div>
  );
}
