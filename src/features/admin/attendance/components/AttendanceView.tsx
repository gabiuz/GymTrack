"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { StatusPill } from "@/features/admin/_ui";

type Range = "today" | "3d" | "7d" | "30d";

interface AttendanceRow {
  id: number;
  memberName: string;
  memberId: string | null;
  checkInTime: string;
  visitType: string;
  staffName: string;
}

interface ChartEntry {
  date: string;
  count: number;
}

const rangeLabels: Record<Range, string> = {
  "today": "Today",
  "3d":    "Last 3 days",
  "7d":    "Last 7 days",
  "30d":   "Last 30 days",
};

function typeVariant(visitType: string): "monthly" | "daily" | "unassigned" {
  if (visitType === "monthly_plan") return "monthly";
  if (visitType === "daily")        return "daily";
  return "unassigned";
}

function typeLabel(visitType: string) {
  if (visitType === "monthly_plan") return "Monthly plan";
  if (visitType === "daily")        return "Daily visit";
  return visitType;
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function AttendanceView() {
  const [range, setRange]           = useState<Range>("today");
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [chartData, setChartData]   = useState<ChartEntry[]>([]);
  const [loading, setLoading]       = useState(true);

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/attendance?range=${range}&limit=50`).then((r) => r.json()),
      fetch(`/api/admin/attendance/chart?range=${range}`).then((r) => r.json()),
    ]).then(([list, chart]) => {
      setAttendance(list.data ?? []);
      // Chart: for "today" backend returns dates (may be 1 entry); we still display it
      setChartData(
        (chart.data ?? []).map((c: { date: string; count: number }) => ({
          date: c.date,
          count: c.count,
        }))
      );
    }).finally(() => setLoading(false));
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const todayCount = attendance.filter((a) => {
    const d = new Date(a.checkInTime);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

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
                range === r
                  ? "bg-gym-lime text-gym-dark font-semibold"
                  : "bg-transparent text-gray-400 font-normal hover:text-gray-600"
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        {[
          { label: "Today",
            val: loading ? "—" : String(todayCount) },
          { label: range === "today" ? "Check-ins" : range === "3d" ? "3-day total" : range === "7d" ? "7-day total" : "30-day total",
            val: loading ? "—" : String(attendance.length) },
          { label: "Visit types",
            val: loading ? "—" : `${attendance.filter((a) => a.visitType === "monthly_plan").length} monthly` },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">{s.label}</div>
            <div className="font-space text-[28px] font-bold tracking-tight text-gym-dark">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 mb-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter">
            Check-ins by day
          </div>
          <div className="text-[11px] text-gray-300 font-inter">{rangeLabels[range]}</div>
        </div>
        {loading || chartData.length === 0 ? (
          <div className="h-[90px] flex items-center justify-center text-gray-300 text-xs font-inter">
            {loading ? "Loading…" : "No data for this period"}
          </div>
        ) : (
          <ResponsiveContainer key={range} width="100%" height={90}>
            <BarChart data={chartData} barCategoryGap="35%">
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "Inter, sans-serif" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.14)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#111",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                }}
                itemStyle={{ color: "#111" }}
                formatter={(v) => [v as number, "check-ins"]}
                cursor={{ fill: "#f5ffe0" }}
              />
              <Bar dataKey="count" fill="#C8FF00" radius={[4, 4, 0, 0]} isAnimationActive={false} />
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
            {loading ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-300 font-inter">Loading…</div>
            ) : attendance.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-gray-300 font-inter">No check-ins for this period</div>
            ) : attendance.map((a, i) => {
              const dateLabel = relativeDate(a.checkInTime);
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < attendance.length - 1 ? "border-b border-black/8" : ""}`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gym-dark">{a.memberName}</div>
                    <div className="text-[11px] text-gray-300 font-mono mt-0.5">{a.memberId ?? "Walk-in"}</div>
                  </div>
                  <span className="w-32">
                    <StatusPill variant={typeVariant(a.visitType)}>{typeLabel(a.visitType)}</StatusPill>
                  </span>
                  <span className={`w-[90px] text-right text-xs font-inter ${dateLabel === "Today" ? "text-green-600 font-semibold" : "text-gray-400"}`}>
                    {dateLabel}
                  </span>
                  <span className="w-[72px] text-right text-gray-400">
                    {new Date(a.checkInTime).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center mt-3 font-inter">
        {attendance.length} check-ins shown · {rangeLabels[range].toLowerCase()}
      </div>
    </>
  );
}
