"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, UserX, Check } from "lucide-react";
import { OwnerToast } from "@/features/owner/_ui";

interface StaffUser {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: "staff" | "owner";
  isActive: boolean;
  lastActive: string | null;
  isYou?: boolean;
}

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

function RolePill({ role }: { role: "staff" | "owner" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-inter ${
      role === "owner" ? "bg-gym-lime/20 text-gym-dark" : "bg-gray-100 text-gray-500"
    }`}>
      {role === "owner" ? "Owner" : "Staff"}
    </span>
  );
}

function StatusDot({ status }: { status: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-inter ${status ? "text-green-600" : "text-gray-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status ? "bg-green-500" : "bg-gray-300"}`} />
      {status ? "Active" : "Disabled"}
    </span>
  );
}

function fmtLastActive(iso: string | null) {
  if (!iso) return "Never";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 5) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

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
      <button onClick={onClose} className="text-gray-400 hover:text-gym-dark transition-colors cursor-pointer border-none bg-transparent">
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

function GTInput({ placeholder, defaultValue, type = "text", inputRef }: { placeholder?: string; defaultValue?: string; type?: string; inputRef?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      ref={inputRef}
      className="w-full bg-gray-50 border border-black/14 rounded-lg px-3.5 py-2.5 text-sm text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors"
    />
  );
}

function RoleSelector({ value, onChange }: { value: "staff" | "owner"; onChange: (v: "staff" | "owner") => void }) {
  return (
    <div className="flex gap-2">
      {(["staff", "owner"] as const).map((r) => (
        <button key={r} onClick={() => onChange(r)}
          className={`flex-1 py-3 rounded-xl border text-center cursor-pointer transition-all font-inter ${
            value === r ? "border-gym-lime bg-gym-lime/10 text-gym-dark" : "border-black/14 bg-white text-gray-400 hover:border-gray-300"
          }`}
        >
          <div className="text-[13px] font-bold text-gym-dark capitalize">{r}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{r === "staff" ? "counter tools" : "+ reports & users"}</div>
          {value === r && <Check size={12} className="text-gym-dark mx-auto mt-1" />}
        </button>
      ))}
    </div>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

export function StaffUsersView() {
  const [users, setUsers]     = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal]     = useState<"add" | "edit" | "disable" | null>(null);
  const [selected, setSelected] = useState<StaffUser | null>(null);
  const [newRole, setNewRole] = useState<"staff" | "owner">("staff");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");
  const [toast, setToast]     = useState({ show: false, title: "", subtitle: "" });

  const addNameRef  = useRef<HTMLInputElement>(null);
  const addUserRef  = useRef<HTMLInputElement>(null);
  const addEmailRef = useRef<HTMLInputElement>(null);
  const addPassRef  = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);
  const editUserRef = useRef<HTMLInputElement>(null);

  const close = () => { setModal(null); setSelected(null); setFormError(""); };
  const showToast = (title: string, subtitle: string) => setToast({ show: true, title, subtitle });

  const loadUsers = () => {
    setIsLoading(true);
    fetch("/api/owner/staff").then((r) => r.json()).then((d) => setUsers(d.data ?? [])).finally(() => setIsLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const openEdit = (u: StaffUser) => { setSelected(u); setNewRole(u.role); setModal("edit"); };
  const openDisable = (u: StaffUser) => { setSelected(u); setModal("disable"); };

  async function handleAdd() {
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     addNameRef.current?.value ?? "",
          username: addUserRef.current?.value ?? "",
          email:    addEmailRef.current?.value || undefined,
          role:     newRole,
          password: addPassRef.current?.value ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to create user"); return; }
      close(); showToast("User saved", "Account can now sign in to the staff tools"); loadUsers();
    } catch { setFormError("Network error — please try again"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit() {
    if (!selected) return;
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/owner/staff/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     editNameRef.current?.value || undefined,
          username: editUserRef.current?.value || undefined,
          role:     newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Failed to update user"); return; }
      close(); showToast("User updated", `${selected.name} · changes saved`); loadUsers();
    } catch { setFormError("Network error — please try again"); }
    finally { setSubmitting(false); }
  }

  async function handleToggle(u: StaffUser, toDisable: boolean) {
    try {
      const res = await fetch(`/api/owner/staff/${u.id}/toggle`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) { showToast("Error", data.error ?? "Action failed"); return; }
      if (toDisable) { showToast("User disabled", "Access removed · history kept"); }
      else { showToast("User enabled", `${u.name} can sign in again`); }
      loadUsers();
      close();
    } catch { showToast("Error", "Network error"); }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-space font-bold text-[20px] tracking-tight text-gym-dark m-0">Staff &amp; Users</h2>
          <p className="text-[12px] text-gray-400 font-inter mt-0.5">Owner-only. Accounts here can sign in to the staff tools.</p>
        </div>
        <button
          onClick={() => { setNewRole("staff"); setModal("add"); }}
          className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90"
        >
          <Plus size={13} /> Add user
        </button>
      </div>

      <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto mt-4">
        <div className="min-w-[560px] lg:min-w-0">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter">
            <span className="flex-1">User</span>
            <span className="w-[72px]">Role</span>
            <span className="w-[80px]">Status</span>
            <span className="w-[90px]">Last active</span>
            <span className="w-[100px] text-right">Actions</span>
          </div>
          {isLoading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-black/8">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="flex-1 h-8" />
              <Skeleton className="w-[72px] h-5" />
              <Skeleton className="w-[80px] h-5" />
              <Skeleton className="w-[90px] h-4" />
              <Skeleton className="w-[100px] h-6" />
            </div>
          )) : users.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 px-4 py-3 font-inter transition-opacity ${i < users.length - 1 ? "border-b border-black/8" : ""} ${!u.isActive ? "opacity-60" : ""}`}
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
              <span className="w-[80px]"><StatusDot status={u.isActive} /></span>
              <span className="w-[90px] text-[12px] text-gray-400">{fmtLastActive(u.lastActive)}</span>
              <span className="w-[100px] flex gap-2 justify-end">
                <button onClick={() => openEdit(u)} className="px-3 py-1.5 text-[11px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">Edit</button>
                {!u.isYou && (
                  !u.isActive
                    ? <button onClick={() => handleToggle(u, false)} className="px-3 py-1.5 text-[11px] font-medium font-inter border border-green-200 rounded-full bg-green-50 text-green-700 cursor-pointer hover:bg-green-100 transition-colors">Enable</button>
                    : <button onClick={() => openDisable(u)} className="px-3 py-1.5 text-[11px] font-medium font-inter border border-red-200 rounded-full bg-red-50 text-red-600 cursor-pointer hover:bg-red-100 transition-colors">Disable</button>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-gym-lime/10 border border-gym-lime/25 rounded-xl text-[11.5px] text-gym-dark font-inter leading-relaxed">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Disabled users keep their history. At least one Owner account is always required.
      </div>

      {/* Add modal */}
      {modal === "add" && (
        <ModalBackdrop onClose={close}>
          <ModalHeader title="Add user account" onClose={close} />
          <div className="px-5 py-4">
            <Field label="Full name"><GTInput placeholder="Mia Santos" inputRef={addNameRef} /></Field>
            <Field label="Username"><GTInput placeholder="mia.s" inputRef={addUserRef} /></Field>
            <Field label="Email (optional)"><GTInput placeholder="mia@gym.app" type="email" inputRef={addEmailRef} /></Field>
            <Field label="Role"><RoleSelector value={newRole} onChange={setNewRole} /></Field>
            <Field label="Password"><GTInput placeholder="min 8 characters" type="password" inputRef={addPassRef} /></Field>
            {formError && <div className="text-xs text-red-600 font-inter mt-1 mb-2">{formError}</div>}
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={close} className="flex-1 py-3 text-[14px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">Cancel</button>
            <button onClick={handleAdd} disabled={submitting} className="flex-1 py-3 text-[14px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 disabled:opacity-60">
              {submitting ? "Saving…" : "Save user"}
            </button>
          </div>
        </ModalBackdrop>
      )}

      {/* Edit modal */}
      {modal === "edit" && selected && (
        <ModalBackdrop onClose={close}>
          <ModalHeader title="Edit user account" onClose={close} />
          <div className="px-5 py-4">
            <Field label="Full name"><GTInput defaultValue={selected.name} inputRef={editNameRef} /></Field>
            <Field label="Username"><GTInput defaultValue={selected.username} inputRef={editUserRef} /></Field>
            <Field label="Role"><RoleSelector value={newRole} onChange={setNewRole} /></Field>
            {formError && <div className="text-xs text-red-600 font-inter mt-1 mb-2">{formError}</div>}
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={close} className="flex-1 py-3 text-[14px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50">Cancel</button>
            <button onClick={handleEdit} disabled={submitting} className="flex-1 py-3 text-[14px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90 disabled:opacity-60">
              {submitting ? "Saving…" : "Save changes"}
            </button>
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
            <button onClick={() => handleToggle(selected, true)} className="flex-1 py-3 text-[14px] font-bold font-space rounded-full bg-red-500 text-white border-none cursor-pointer hover:bg-red-600">Disable access</button>
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
