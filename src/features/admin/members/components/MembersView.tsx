"use client";

import { useState } from "react";
import { Search, Plus, BadgeCheck, QrCode, Pencil, User } from "lucide-react";
import { StatusPill } from "@/features/admin/_ui";
import { AddMemberModal } from "./AddMemberModal";
import { EditMemberModal } from "./EditMemberModal";
import { QRModal } from "./QRModal";
import { ManageMembershipModal } from "./ManageMembershipModal";

const MEMBERS = [
  { id: "MEM-000001", name: "Ana Reyes",   status: "active"     as const, joined: "12 Jan 2026", phone: "0917 123 4567", address: "12 Mabini St., Pasig",   birth: "04/12/2001", emergency: "Maria R. · 0917 765 4321", memberships: { annual: "exp 12 Jan 27", monthly: "exp 9 Jul 26",  daily: "₱70" } },
  { id: "MEM-000008", name: "Mark Cruz",   status: "active"     as const, joined: "5 Mar 2026",  phone: "0918 234 5678", address: "45 Rizal Ave., Makati",   birth: "11/03/1998", emergency: "Pedro C. · 0918 876 5432", memberships: { annual: "exp 5 Mar 27",  monthly: "exp 14 Jun 26", daily: "₱70" } },
  { id: "MEM-000014", name: "Liza Tan",    status: "unassigned" as const, joined: "2 Jun 2026",  phone: "0919 345 6789", address: "7 Quezon Blvd., QC",     birth: "08/22/2003", emergency: "Tony T. · 0919 654 3210",  memberships: { annual: "—",            monthly: "—",              daily: "₱75" } },
  { id: "MEM-000023", name: "Jose Santos", status: "expired"    as const, joined: "15 Dec 2025", phone: "0920 456 7890", address: "22 Balagtas St., Pasay", birth: "03/15/1990", emergency: "Carmen S. · 0920 543 2109", memberships: { annual: "exp 1 Jun 26",  monthly: "expired 1 Jun 26", daily: "₱70" } },
];

interface MembersViewProps { onToast: (title: string, sub: string) => void; }

export function MembersView({ onToast }: MembersViewProps) {
  const [search, setSearch]         = useState("");
  const [selectedId, setSelectedId] = useState("MEM-000001");
  const [addOpen, setAddOpen]       = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [qrOpen, setQrOpen]         = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const filtered = MEMBERS.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search)
  );
  const member = MEMBERS.find((m) => m.id === selectedId) ?? MEMBERS[0];

  const pillVariant = member.status === "active" ? "active" : member.status === "expired" ? "expired" : "unassigned";
  const pillLabel   = member.status === "active" ? "Active" : member.status === "expired" ? "Expired" : "Unassigned";

  const KV = ({ label, value, last = false }: { label: string; value: string; last?: boolean }) => (
    <div className={`flex justify-between items-start text-[13px] py-2 font-inter ${last ? "" : "border-b border-black/8"}`}>
      <span className="text-gray-400">{label}</span>
      <span className="text-gym-dark text-right max-w-[170px] font-medium">{value}</span>
    </div>
  );

  return (
    <>
      <div className="bg-white border border-black/8 rounded-xl flex flex-col lg:flex-row overflow-hidden min-h-[520px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

        {/* List panel */}
        <div className="w-full lg:w-56 border-b lg:border-b-0 lg:border-r border-black/8 p-3.5 shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="font-space font-bold text-sm text-gym-dark">Members</span>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
              <Plus size={11} /> Add
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-black/8 rounded-lg py-2 pl-7.5 pr-2 text-[13px] text-gym-dark font-inter outline-none focus:border-gym-lime transition-colors box-border"
            />
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[240px] lg:max-h-[380px]">
            {filtered.map((m) => {
              const active = selectedId === m.id;
              const variant = m.status === "active" ? "active" : m.status === "expired" ? "expired" : "unassigned";
              const label   = m.status === "active" ? "Active" : m.status === "expired" ? "Expired" : "Unassigned";
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${active ? "bg-gym-lime/20" : "hover:bg-gray-50"}`}
                >
                  <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-gray-400 shrink-0 ${active ? "bg-gym-lime/40" : "bg-gray-100"}`}>
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gym-dark whitespace-nowrap overflow-hidden text-ellipsis font-inter">{m.name}</div>
                    <div className="text-[10px] text-gray-300 font-mono">{m.id}</div>
                  </div>
                  <StatusPill variant={variant}>{label}</StatusPill>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-4 lg:p-5.5 min-w-0">
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-[54px] h-[54px] rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
              <User size={24} />
            </div>
            <div className="flex-1">
              <div className="font-space font-bold text-xl tracking-tight text-gym-dark">{member.name}</div>
              <div className="text-xs text-gray-400 font-mono">{member.id} · joined {member.joined}</div>
            </div>
            <StatusPill variant={pillVariant} size="md">{pillLabel}</StatusPill>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            <button onClick={() => setManageOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-bold font-space rounded-full bg-gym-lime text-gym-dark border-none cursor-pointer hover:opacity-90">
              <BadgeCheck size={14} /> Manage membership
            </button>
            <button onClick={() => setQrOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">
              <QrCode size={14} /> View QR
            </button>
            <button onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">
              <Pencil size={14} /> Edit
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2.5 font-inter">Contact</div>
              <KV label="Phone"     value={member.phone} />
              <KV label="Address"   value={member.address} />
              <KV label="Emergency" value={member.emergency.split("·")[0].trim()} last />
            </div>
            <div className="mt-4 lg:mt-0">
              <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2.5 font-inter">Membership</div>
              <KV label="Annual"     value={member.memberships.annual} />
              <KV label="Monthly"    value={member.memberships.monthly} />
              <KV label="Daily rate" value={member.memberships.daily} last />
            </div>
          </div>

          <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase my-5.5 font-inter">Recent activity</div>
          <div className="border border-black/8 rounded-lg overflow-hidden max-h-[180px] overflow-y-auto">
            <div className="flex justify-between px-3.5 py-2.5 text-[13px] border-b border-black/8 text-gym-dark font-inter">
              <span>Check-in</span>
              <span className="text-gray-400">Today 7:42 · Monthly</span>
            </div>
            <div className="flex justify-between px-3.5 py-2.5 text-[13px] text-gym-dark font-inter">
              <span>Payment · Monthly</span>
              <span className="text-gray-400">9 Jun · ₱799</span>
            </div>
          </div>
        </div>
      </div>

      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} onConfirm={(t, s) => { setAddOpen(false); onToast(t, s); }} />
      <EditMemberModal
        open={editOpen}
        member={{ name: member.name, id: member.id, contact: member.phone, birth: member.birth, address: member.address, emergency: member.emergency }}
        onClose={() => setEditOpen(false)}
        onConfirm={(t, s) => { setEditOpen(false); onToast(t, s); }}
      />
      <QRModal open={qrOpen} memberName={member.name} memberId={member.id} onClose={() => setQrOpen(false)} onConfirm={(t, s) => { setQrOpen(false); onToast(t, s); }} />
      <ManageMembershipModal
        open={manageOpen}
        memberName={member.name}
        memberId={member.id}
        memberStatus={member.status === "unassigned" ? "unassigned" : member.status}
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); }}
      />
    </>
  );
}
