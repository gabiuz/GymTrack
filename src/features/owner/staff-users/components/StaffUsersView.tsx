"use client";

import { useState } from "react";
import { Plus, UserX, Check } from "lucide-react";
import { OwnerToast } from "@/features/owner/_ui";

interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: "Staff" | "Owner";
  status: "active" | "disabled";
  lastActive: string;
  isYou?: boolean;
}

const INITIAL_USERS: StaffUser[] = [
  { id: "USR-001", name: "Elena Garcia",  username: "elena.g",  role: "Owner", status: "active",   lastActive: "Now",        isYou: true  },
  { id: "USR-002", name: "Rico Santos",   username: "rico.s",   role: "Staff", status: "active",   lastActive: "2h ago"                   },
  { id: "USR-003", name: "Mia Cruz",      username: "mia.c",    role: "Staff", status: "active",   lastActive: "Yesterday"                },
  { id: "USR-004", name: "Ben Reyes",     username: "ben.r",    role: "Staff", status: "disabled", lastActive: "3 weeks ago"              },
];

function InitialsAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="rounded-full bg-gray-100 flex items-center justify-center shrink-0 font-inter font-semibold text-gray-400 tracking-wide"
    >
      {initials}
    </div>
  );
}

function RolePill({ role }: { role: "Staff" | "Owner" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-inter ${
      role === "Owner"
        ? "bg-gym-lime/20 text-gym-dark"
        : "bg-gray-100 text-gray-500"
    }`}>
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: "active" | "disabled" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-inter ${status === "active" ? "text-green-600" : "text-gray-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-gray-300"}`} />
      {status === "active" ? "Active" : "Disabled"}
    </span>
  );
}

/* ── Modals ── */
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
      <span className="font-space font-bold text-[16px] text-gym-dark tracking-tight">{title}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gym-dark transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-1.5 font-inter">{label}</label>
      {children}
    </div>
  );
}

function GTInput({ placeholder, defaultValue, type = "text" }: { placeholder?: string; defaultValue?: string; type?: string }) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors"
    />
  );
}

function RoleSelector({ value, onChange }: { value: "Staff" | "Owner"; onChange: (v: "Staff" | "Owner") => void }) {
  return (
    <div className="flex gap-2">
      {(["Staff", "Owner"] as const).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`flex-1 py-3 rounded-xl border text-center cursor-pointer transition-all font-inter ${
            value === r
              ? "border-gym-lime bg-gym-lime/10 text-gym-dark"
              : "border-black/14 bg-white text-gray-400 hover:border-gray-300"
          }`}
        >
          <div className="text-[13px] font-bold text-gym-dark">{r}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{r === "Staff" ? "counter tools" : "+ reports & users"}</div>
          {value === r && <Check size={12} className="text-gym-dark mx-auto mt-1" />}
        </button>
      ))}
    </div>
  );
}

/* ── Main component ── */
export function StaffUsersView() {
  const [users, setUsers] = useState<StaffUser[]>(INITIAL_USERS);
  const [modal, setModal] = useState<"add" | "edit" | "disable" | null>(null);
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [newRole, setNewRole] = useState<"Staff" | "Owner">("Staff");
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });

  const close = () => { setModal(null); setSelected(null); };
  const showToast = (title: string, subtitle: string) => setToast({ show: true, title, subtitle });

  const openEdit = (u: StaffUser) => { setSelected(u); setNewRole(u.role); setModal("edit"); };
  const openDisable = (u: StaffUser) => { setSelected(u); setModal("disable"); };
  const handleEnable = (u: StaffUser) => {
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, status: "active" } : p));
    showToast("User enabled", `${u.name} can sign in again`);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-space font-bold text-[20px] tracking-tight text-gym-dark m-0">Staff &amp; Users</h2>
          <p className="text-[12px] text-gray-400 font-inter mt-0.5">Owner-only. Accounts here can sign in to the staff tools.</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90"
        >
          <Plus size={13} /> Add user
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto mt-4">
        <div className="min-w-[560px] lg:min-w-0">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter">
            <span className="flex-1">User</span>
            <span className="w-[72px]">Role</span>
            <span className="w-[80px]">Status</span>
            <span className="w-[90px]">Last active</span>
            <span className="w-[100px] text-right">Actions</span>
          </div>
          {/* Rows */}
          {users.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 px-4 py-3 font-inter transition-opacity ${i < users.length - 1 ? "border-b border-black/8" : ""} ${u.status === "disabled" ? "opacity-60" : ""}`}
            >
              <InitialsAvatar name={u.name} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-gym-dark">
                  {u.name}
                  {u.isYou && <span className="text-[10px] text-gray-400 font-normal ml-1">(you)</span>}
                </div>
                <div className="text-[10px] text-gray-400 font-mono">{u.username}</div>
              </div>
              <span className="w-[72px]"><RolePill role={u.role} /></span>
              <span className="w-[80px]"><StatusDot status={u.status} /></span>
              <span className="w-[90px] text-[12px] text-gray-400">{u.lastActive}</span>
              <span className="w-[100px] flex gap-2 justify-end">
                <button
                  onClick={() => openEdit(u)}
                  className="px-3 py-1.5 text-[11px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors"
                >Edit</button>
                {!u.isYou && (
                  u.status === "disabled"
                    ? <button onClick={() => handleEnable(u)} className="px-3 py-1.5 text-[11px] font-medium font-inter border border-green-200 rounded-full bg-green-50 text-green-700 cursor-pointer hover:bg-green-100 transition-colors">Enable</button>
                    : <button onClick={() => openDisable(u)} className="px-3 py-1.5 text-[11px] font-medium font-inter border border-red-200 rounded-full bg-red-50 text-red-600 cursor-pointer hover:bg-red-100 transition-colors">Disable</button>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-gym-lime/10 border border-gym-lime/25 rounded-xl text-[11.5px] text-gym-dark font-inter leading-relaxed">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Disabled users keep their history. At least one Owner account is always required.
      </div>

      {/* Add modal */}
      {modal === "add" && (
        <ModalBackdrop onClose={close}>
          <ModalHeader title="Add user account" onClose={close} />
          <div className="px-5 py-4">
            <Field label="Full name"><GTInput placeholder="Mia Santos" /></Field>
            <Field label="Username or email"><GTInput placeholder="mia.s" /></Field>
            <Field label="Role"><RoleSelector value={newRole} onChange={setNewRole} /></Field>
            <Field label="Temporary password"><GTInput defaultValue="Gym-4821" type="text" /></Field>
            <div className="text-[11px] text-gym-dark bg-gym-lime/10 border border-gym-lime/25 rounded-lg px-3 py-2.5 font-inter mt-1">
              New users are asked to change this on first login.
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={close} className="flex-1 py-3 text-[14px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">Cancel</button>
            <button onClick={() => { close(); showToast("User saved", "Account can now sign in to the staff tools"); }}
              className="flex-1 py-3 text-[14px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">Save user</button>
          </div>
        </ModalBackdrop>
      )}

      {/* Edit modal */}
      {modal === "edit" && selected && (
        <ModalBackdrop onClose={close}>
          <ModalHeader title="Edit user account" onClose={close} />
          <div className="px-5 py-4">
            <Field label="Full name"><GTInput defaultValue={selected.name} /></Field>
            <Field label="Username or email"><GTInput defaultValue={selected.username} /></Field>
            <Field label="Role"><RoleSelector value={newRole} onChange={setNewRole} /></Field>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={close} className="flex-1 py-3 text-[14px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">Cancel</button>
            <button onClick={() => { close(); showToast("User updated", `${selected.name} · changes saved`); }}
              className="flex-1 py-3 text-[14px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">Save changes</button>
          </div>
        </ModalBackdrop>
      )}

      {/* Disable modal */}
      {modal === "disable" && selected && (
        <ModalBackdrop onClose={close}>
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <UserX size={22} className="text-amber-600" />
            </div>
            <div className="font-space font-bold text-[17px] text-gym-dark mb-2 tracking-tight">Disable this user?</div>
            <div className="text-[13px] text-gray-400 font-inter leading-relaxed max-w-[260px] mx-auto">
              They won&apos;t be able to sign in. Past payments and check-ins stay recorded. You can re-enable anytime.
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={close} className="flex-1 py-3 text-[14px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">Cancel</button>
            <button onClick={() => {
              setUsers((prev) => prev.map((u) => u.id === selected.id ? { ...u, status: "disabled" } : u));
              showToast("User disabled", "Access removed · history kept");
              close();
            }} className="flex-1 py-3 text-[14px] font-bold font-space rounded-full bg-red-500 text-white border-none cursor-pointer hover:bg-red-600">Disable access</button>
          </div>
        </ModalBackdrop>
      )}

      <OwnerToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
