"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, BadgeCheck, QrCode, Pencil, User } from "lucide-react";
import { StatusPill } from "@/features/owner/_ui";
import { AddMemberModal } from "./AddMemberModal";
import { EditMemberModal } from "./EditMemberModal";
import { QRModal } from "./QRModal";
import { ManageMembershipModal } from "./ManageMembershipModal";

interface MemberRow {
  id: number;
  memberId: string;
  fullName: string;
  contactNumber: string;
  address: string;
  gender: string;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  photoUrl: string | null;
  createdAt: string;
  membershipStatus: "active" | "expired" | "unassigned";
  annualEndDate: string | null;
  monthlyEndDate: string | null;
}

interface MembersViewProps { onToast: (title: string, sub: string) => void; }

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

const KV = ({ label, value, last = false }: { label: string; value: string; last?: boolean }) => (
  <div className={`flex justify-between items-start text-[13px] py-2 font-inter ${last ? "" : "border-b border-black/8"}`}>
    <span className="text-gray-400">{label}</span>
    <span className="text-gym-dark text-right max-w-[170px] font-medium">{value}</span>
  </div>
);

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MembersView({ onToast }: MembersViewProps) {
  const [search, setSearch]         = useState("");
  const [members, setMembers]       = useState<MemberRow[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen]       = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [qrOpen, setQrOpen]         = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const loadMembers = useCallback((q = "") => {
    setIsLoading(true);
    fetch(`/api/members?search=${encodeURIComponent(q)}&limit=50`)
      .then((r) => r.json())
      .then((d) => {
        const rows: MemberRow[] = d.data ?? [];
        setMembers(rows);
        if (!selectedId && rows.length > 0) setSelectedId(rows[0].memberId);
      })
      .finally(() => setIsLoading(false));
  }, [selectedId]);

  useEffect(() => { loadMembers(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadMembers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const member = members.find((m) => m.memberId === selectedId) ?? members[0] ?? null;

  const pillVariant = member?.membershipStatus === "active" ? "active" : member?.membershipStatus === "expired" ? "expired" : "unassigned";
  const pillLabel   = member?.membershipStatus === "active" ? "Active" : member?.membershipStatus === "expired" ? "Expired" : "Unassigned";

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
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[46px] rounded-lg" />
            )) : members.length === 0 ? (
              <div className="text-[12px] text-gray-400 font-inter px-2 py-4 text-center">No members found.</div>
            ) : members.map((m) => {
              const active  = selectedId === m.memberId;
              const variant = m.membershipStatus === "active" ? "active" : m.membershipStatus === "expired" ? "expired" : "unassigned";
              const label   = m.membershipStatus === "active" ? "Active" : m.membershipStatus === "expired" ? "Expired" : "Unassigned";
              return (
                <div
                  key={m.memberId}
                  onClick={() => setSelectedId(m.memberId)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${active ? "bg-gym-lime/20" : "hover:bg-gray-50"}`}
                >
                  <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-gray-400 shrink-0 ${active ? "bg-gym-lime/40" : "bg-gray-100"}`}>
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gym-dark whitespace-nowrap overflow-hidden text-ellipsis font-inter">{m.fullName}</div>
                    <div className="text-[10px] text-gray-300 font-mono">{m.memberId}</div>
                  </div>
                  <StatusPill variant={variant}>{label}</StatusPill>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {member ? (
          <div className="flex-1 p-4 lg:p-5.5 min-w-0">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-[54px] h-[54px] rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                <User size={24} />
              </div>
              <div className="flex-1">
                <div className="font-space font-bold text-xl tracking-tight text-gym-dark">{member.fullName}</div>
                <div className="text-xs text-gray-400 font-mono">{member.memberId} · joined {fmtDate(member.createdAt)}</div>
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
                <KV label="Phone"     value={member.contactNumber} />
                <KV label="Address"   value={member.address} />
                <KV label="Emergency" value={member.emergencyContact ?? "—"} last />
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2.5 font-inter">Membership</div>
                <KV label="Annual"    value={fmtDate(member.annualEndDate)} />
                <KV label="Monthly"   value={fmtDate(member.monthlyEndDate)} />
                <KV label="Daily rate" value={member.membershipStatus === "active" ? "₱70" : "₱75"} last />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-inter text-[13px]">
            {isLoading ? "Loading members…" : "Select a member"}
          </div>
        )}
      </div>

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConfirm={(t, s) => { setAddOpen(false); onToast(t, s); loadMembers(search); }}
      />
      <EditMemberModal
        open={editOpen}
        member={member ? { name: member.fullName, id: member.memberId, contact: member.contactNumber, birth: member.dateOfBirth ?? "", address: member.address, emergency: member.emergencyContact ?? "" } : null}
        onClose={() => setEditOpen(false)}
        onConfirm={(t, s) => { setEditOpen(false); onToast(t, s); loadMembers(search); }}
      />
      <QRModal
        open={qrOpen}
        memberName={member?.fullName ?? ""}
        memberId={member?.memberId ?? ""}
        onClose={() => setQrOpen(false)}
        onConfirm={(t, s) => { setQrOpen(false); onToast(t, s); }}
      />
      <ManageMembershipModal
        open={manageOpen}
        memberName={member?.fullName ?? ""}
        memberId={member?.memberId ?? ""}
        memberDbId={member?.id ?? 0}
        memberStatus={member?.membershipStatus ?? "unassigned"}
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); loadMembers(search); }}
      />
    </>
  );
}
