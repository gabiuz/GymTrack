"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  gender: string;
  photoUrl: string | null;
  createdAt: string;
  membershipStatus: 'active' | 'expired' | 'unassigned';
}

interface MemberDetail extends MemberRow {
  address: string;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  qrCode: string | null;
  hasActiveMembership: boolean;
  hasActiveMonthlyPlan: boolean;
  latestMembership: { endDate: string } | null;
  latestMonthlyPlan: { endDate: string } | null;
}

interface MembersViewProps { onToast: (title: string, sub: string) => void; }

export function MembersView({ onToast }: MembersViewProps) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const [listWidth, setListWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, w: 0 });

  useEffect(() => {
    const saved = localStorage.getItem("gymtrack:owner-members-list-width");
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 200 && val <= 600) {
        setListWidth(val);
      }
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, w: listWidth };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x;
      const newWidth = dragStart.current.w + deltaX;
      const clamped = Math.max(200, Math.min(600, newWidth));
      setListWidth(clamped);
      localStorage.setItem("gymtrack:owner-members-list-width", String(clamped));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const fetchMembers = useCallback(() => {
    setLoading(true);
    fetch(`/api/members?search=${encodeURIComponent(search)}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.data ?? []);
        if (!selectedId && data.data?.length > 0) {
          setSelectedId(data.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [search, selectedId]);

  useEffect(() => {
    fetchMembers();
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDetail = useCallback(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    fetch(`/api/members/${selectedId}`)
      .then((r) => r.json())
      .then((data) => setDetail(data.data ?? null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const memberStatus = detail
    ? detail.hasActiveMonthlyPlan || detail.hasActiveMembership
      ? "active"
      : detail.latestMembership
        ? "expired"
        : "unassigned"
    : "unassigned";

  const pillVariant = memberStatus === "active" ? "active" : memberStatus === "expired" ? "expired" : "unassigned";
  const pillLabel = memberStatus === "active" ? "Active" : memberStatus === "expired" ? "Expired" : "Unassigned";

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
        <div
          className="w-full lg:w-[var(--list-width)] relative border-b lg:border-b-0 lg:border-r border-black/8 p-3.5 shrink-0 flex flex-col"
          style={{ "--list-width": `${listWidth}px` } as React.CSSProperties}
        >
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
            {loading ? (
              <div className="text-[13px] text-gray-300 font-inter px-2 py-4 text-center">Loading…</div>
            ) : members.length === 0 ? (
              <div className="text-[13px] text-gray-300 font-inter px-2 py-4 text-center">No members found</div>
            ) : members.map((m) => {
              const active = selectedId === m.id;
              const statusVariant = m.membershipStatus === 'active' ? 'active' : m.membershipStatus === 'expired' ? 'expired' : 'unassigned';
              const statusLabel = m.membershipStatus === 'active' ? 'Active' : m.membershipStatus === 'expired' ? 'Expired' : 'Unassigned';
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${active ? "bg-gym-lime/20" : "hover:bg-gray-50"}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-gray-400 shrink-0 ${active ? "bg-gym-lime/40" : "bg-gray-100"}`}>
                    <User size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-gym-dark whitespace-nowrap overflow-hidden text-ellipsis font-inter">{m.fullName}</div>
                    <div className="text-[10px] text-gray-300 font-mono">{m.memberId}</div>
                  </div>
                  <StatusPill variant={statusVariant}>{statusLabel}</StatusPill>
                </div>
              );
            })}
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className="hidden lg:block absolute top-0 bottom-0 right-[-3px] w-[6px] cursor-col-resize z-50 group select-none"
          >
            <div className="w-[2px] h-full mx-auto bg-transparent group-hover:bg-gym-lime group-active:bg-gym-lime/80 transition-colors" />
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-4 lg:p-5.5 min-w-0">
          {detailLoading || !detail ? (
            <div className="h-full flex items-center justify-center text-gray-300 font-inter text-sm">
              {detailLoading ? "Loading…" : "Select a member"}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3.5 mb-5">
                {detail.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.photoUrl} alt={detail.fullName} className="w-[54px] h-[54px] rounded-full object-cover" />
                ) : (
                  <div className="w-[54px] h-[54px] rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <User size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-space font-bold text-xl tracking-tight text-gym-dark">{detail.fullName}</div>
                  <div className="text-xs text-gray-400 font-mono">{detail.memberId} · joined {new Date(detail.createdAt).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })}</div>
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
                  <KV label="Phone" value={detail.contactNumber} />
                  <KV label="Address" value={detail.address} />
                  <KV label="Emergency" value={detail.emergencyContact ?? "—"} last />
                </div>
                <div className="mt-4 lg:mt-0">
                  <div className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase mb-2.5 font-inter">Membership</div>
                  <KV label="Annual expires" value={detail.latestMembership ? new Date(detail.latestMembership.endDate).toLocaleDateString("en-PH") : "—"} />
                  <KV label="Monthly expires" value={detail.latestMonthlyPlan ? new Date(detail.latestMonthlyPlan.endDate).toLocaleDateString("en-PH") : "—"} />
                  <KV label="Daily rate" value={detail.hasActiveMembership ? "₱70" : "₱75"} last />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConfirm={(t, s) => { setAddOpen(false); onToast(t, s); fetchMembers(); }}
      />
      <EditMemberModal
        open={editOpen}
        member={detail ? { id: detail.id, name: detail.fullName, memberId: detail.memberId, contact: detail.contactNumber, address: detail.address, emergency: detail.emergencyContact ?? "", birth: detail.dateOfBirth ? new Date(detail.dateOfBirth).toLocaleDateString("en-PH") : "" } : null}
        onClose={() => setEditOpen(false)}
        onConfirm={(t, s) => { setEditOpen(false); onToast(t, s); if (selectedId) setSelectedId(selectedId); fetchMembers(); }}
      />
      <QRModal
        open={qrOpen}
        memberName={detail?.fullName ?? ""}
        memberId={detail?.memberId ?? ""}
        memberNumericId={detail?.id ?? null}
        onClose={() => setQrOpen(false)}
        onConfirm={(t, s) => { setQrOpen(false); onToast(t, s); }}
      />
      <ManageMembershipModal
        open={manageOpen}
        memberName={detail?.fullName ?? ""}
        memberId={detail?.memberId ?? ""}
        memberNumericId={detail?.id ?? null}
        memberStatus={memberStatus}
        monthlyEndDate={detail?.latestMonthlyPlan?.endDate ?? null}
        annualEndDate={detail?.latestMembership?.endDate ?? null}
        onClose={() => setManageOpen(false)}
        onConfirm={(t, s) => { setManageOpen(false); onToast(t, s); fetchMembers(); fetchDetail(); }}
      />
    </>
  );
}
