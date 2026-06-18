"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { StatusPill } from "@/features/owner/_ui";

type Range = "today" | "3d" | "7d" | "30d";

interface AttendanceEntry {
  id: number;
  memberName: string;
  memberId: string | null;
  checkInTime: string;
  visitType: string;
  staffName: string;
}
interface ChartEntry { date: string; count: number; }

function typeVariant(type: string): "monthly" | "daily" | "unassigned" {
  if (type === "monthly_plan") return "monthly";
  if (type === "daily")        return "daily";
  return "unassigned";
}

function typeLabel(type: string) {
  if (type === "monthly_plan") return "Monthly plan";
  if (type === "daily")        return "Daily";
  return type;
}

function relDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

const rangeLabels: Record<Range, string> = { today: "Today", "3d": "Last 3 days", "7d": "Last 7 days", "30d": "Last 30 days" };

export function AttendanceView() {
  const [range, setRange]         = useState<Range>("today");
  const [checkins, setCheckins]   = useState<AttendanceEntry[]>([]);
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [total, setTotal]         = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const chartRange = range === "30d" ? "30d" : range === "7d" ? "7d" : "7d";
    Promise.all([
      fetch(`/api/owner/attendance?range=${range}&limit=50`).then((r) => r.json()),
      fetch(`/api/owner/attendance/chart?range=${chartRange}`).then((r) => r.json()),
    ]).then(([att, chart]) => {
      setCheckins(att.data ?? []);
      setTotal(att.total ?? 0);
      setChartData(chart.data ?? []);
    }).finally(() => setIsLoading(false));
  }, [range]);

  const barData = chartData.map((r) => ({ label: r.date.slice(5), val: r.count }));

  return (
    <>
      {/* Date range filter */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex bg-gray-100 rounded-full p-1 border border-black/8 gap-0.5">
          {(["today", "3d", "7d", "30d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full border-none cursor-pointer text-[13px] font-inter transition-all duration-100 ${
                range === r ? "bg-gym-lime text-gym-dark font-semibold" : "bg-transparent text-gray-400 font-normal hover:text-gray-600"
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        {isLoading ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="flex-1 h-[82px] rounded-xl" />) : (
          <>
            <div className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">
                {range === "today" ? "Today" : rangeLabels[range]}
              </div>
              <div className="font-space text-[28px] font-bold tracking-tight text-gym-dark">{total}</div>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 mb-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter">Check-ins by day</div>
          <div className="text-[11px] text-gray-300 font-inter">{rangeLabels[range]}</div>
        </div>
        {isLoading ? <Skeleton className="h-[90px]" /> : (
          <ResponsiveContainer key={range} width="100%" height={90}>
            <BarChart data={barData} barCategoryGap="35%">
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 8, fontSize: 12, color: "#111", fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
                itemStyle={{ color: "#111" }}
                formatter={(v) => [v as number, "check-ins"]}
                cursor={{ fill: "#f5ffe0" }}
              />
              <Bar dataKey="val" fill="#C8FF00" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Check-in log */}
      <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto">
        <div className="min-w-[500px] lg:min-w-0">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter sticky top-0 z-10">
            <span className="flex-1">Member</span>
            <span className="w-32">Visit type</span>
            <span className="w-[90px] text-right">Date</span>
            <span className="w-[72px] text-right">Time</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-4 py-3 border-b border-black/8">
                <Skeleton className="flex-1 h-8" /><Skeleton className="w-32 h-5" /><Skeleton className="w-[90px] h-4" /><Skeleton className="w-[72px] h-4" />
              </div>
            )) : checkins.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-400 font-inter">No check-ins for this period.</div>
            ) : checkins.map((c, i) => {
              const dateLabel = relDate(c.checkInTime);
              return (
                <div key={c.id} className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < checkins.length - 1 ? "border-b border-black/8" : ""}`}>
                  <div className="flex-1">
                    <div className="font-semibold text-gym-dark">{c.memberName}</div>
                    <div className="text-[11px] text-gray-300 font-mono mt-0.5">{c.memberId ?? "Guest"}</div>
                  </div>
                  <span className="w-32"><StatusPill variant={typeVariant(c.visitType)}>{typeLabel(c.visitType)}</StatusPill></span>
                  <span className={`w-[90px] text-right text-xs font-inter ${dateLabel === "Today" ? "text-green-600 font-semibold" : "text-gray-400"}`}>{dateLabel}</span>
                  <span className="w-[72px] text-right text-gray-400">{fmtTime(c.checkInTime)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center mt-3 font-inter">
        {total} check-ins shown · {rangeLabels[range].toLowerCase()}
      </div>
    </>
  );
}
