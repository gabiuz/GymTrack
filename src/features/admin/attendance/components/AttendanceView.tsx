"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { StatusPill } from "@/features/admin/_ui";

type Range = "today" | "3d" | "7d" | "30d";

const rangeData: Record<Range, {
  stats: { today: string; total: string; peak: string };
  chart: { hour: string; count: number }[];
  checkins: { member: string; id: string; type: string; time: string; date: string }[];
}> = {
  "today": {
    stats: { today: "24", total: "24", peak: "4–5 PM" },
    chart: [
      { hour: "8a", count: 3 }, { hour: "9a", count: 5 }, { hour: "10a", count: 9 },
      { hour: "11a", count: 7 }, { hour: "12p", count: 4 }, { hour: "1p", count: 6 },
      { hour: "2p", count: 8 }, { hour: "3p", count: 11 }, { hour: "4p", count: 14 },
      { hour: "5p", count: 10 }, { hour: "6p", count: 6 },
    ],
    checkins: [
      { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly plan",   time: "7:42 AM", date: "Today" },
      { member: "Mark Cruz",   id: "MEM-000008", type: "Daily · member", time: "7:40 AM", date: "Today" },
      { member: "Liza Tan",    id: "MEM-000014", type: "Daily · guest",  time: "7:38 AM", date: "Today" },
      { member: "Pedro Lim",   id: "MEM-000031", type: "Monthly plan",   time: "7:30 AM", date: "Today" },
      { member: "Grace Uy",    id: "MEM-000044", type: "Monthly plan",   time: "7:22 AM", date: "Today" },
      { member: "Jose Santos", id: "MEM-000023", type: "Daily · member", time: "7:15 AM", date: "Today" },
    ],
  },
  "3d": {
    stats: { today: "24", total: "71", peak: "6–7 PM" },
    chart: [
      { hour: "8a", count: 3 }, { hour: "9a", count: 5 }, { hour: "10a", count: 9 },
      { hour: "11a", count: 7 }, { hour: "12p", count: 4 }, { hour: "1p", count: 6 },
      { hour: "2p", count: 8 }, { hour: "3p", count: 11 }, { hour: "4p", count: 14 },
      { hour: "5p", count: 10 }, { hour: "6p", count: 6 },
    ],
    checkins: [
      { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly plan",   time: "7:42 AM", date: "Today" },
      { member: "Mark Cruz",   id: "MEM-000008", type: "Daily · member", time: "7:40 AM", date: "Today" },
      { member: "Liza Tan",    id: "MEM-000014", type: "Daily · guest",  time: "7:38 AM", date: "Today" },
      { member: "Pedro Lim",   id: "MEM-000031", type: "Monthly plan",   time: "7:30 AM", date: "Today" },
      { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly plan",   time: "8:01 AM", date: "Yesterday" },
      { member: "Grace Uy",    id: "MEM-000044", type: "Monthly plan",   time: "7:55 AM", date: "Yesterday" },
      { member: "Jose Santos", id: "MEM-000023", type: "Daily · member", time: "7:22 AM", date: "2 days ago" },
    ],
  },
  "7d": {
    stats: { today: "24", total: "186", peak: "6–7 PM" },
    chart: [
      { hour: "Mon", count: 22 }, { hour: "Tue", count: 18 }, { hour: "Wed", count: 27 },
      { hour: "Thu", count: 31 }, { hour: "Fri", count: 29 }, { hour: "Sat", count: 35 },
      { hour: "Sun", count: 24 },
    ],
    checkins: [
      { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly plan",   time: "7:42 AM", date: "Today" },
      { member: "Mark Cruz",   id: "MEM-000008", type: "Daily · member", time: "7:40 AM", date: "Today" },
      { member: "Liza Tan",    id: "MEM-000014", type: "Daily · guest",  time: "7:38 AM", date: "Today" },
      { member: "Grace Uy",    id: "MEM-000044", type: "Monthly plan",   time: "9:12 AM", date: "Yesterday" },
      { member: "Jose Santos", id: "MEM-000023", type: "Daily · member", time: "7:05 AM", date: "Yesterday" },
      { member: "Pedro Lim",   id: "MEM-000031", type: "Monthly plan",   time: "8:44 AM", date: "3 days ago" },
      { member: "Mark Cruz",   id: "MEM-000008", type: "Daily · member", time: "7:18 AM", date: "4 days ago" },
      { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly plan",   time: "7:50 AM", date: "5 days ago" },
    ],
  },
  "30d": {
    stats: { today: "24", total: "714", peak: "6–7 PM" },
    chart: [
      { hour: "W1", count: 148 }, { hour: "W2", count: 172 },
      { hour: "W3", count: 209 }, { hour: "W4", count: 185 },
    ],
    checkins: [
      { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly plan",   time: "7:42 AM", date: "Today" },
      { member: "Mark Cruz",   id: "MEM-000008", type: "Daily · member", time: "7:40 AM", date: "Today" },
      { member: "Grace Uy",    id: "MEM-000044", type: "Monthly plan",   time: "9:12 AM", date: "3 days ago" },
      { member: "Pedro Lim",   id: "MEM-000031", type: "Monthly plan",   time: "8:44 AM", date: "7 days ago" },
      { member: "Jose Santos", id: "MEM-000023", type: "Daily · member", time: "7:05 AM", date: "10 days ago" },
      { member: "Liza Tan",    id: "MEM-000014", type: "Daily · guest",  time: "7:38 AM", date: "14 days ago" },
      { member: "Ana Reyes",   id: "MEM-000001", type: "Monthly plan",   time: "7:50 AM", date: "18 days ago" },
      { member: "Mark Cruz",   id: "MEM-000008", type: "Monthly plan",   time: "7:18 AM", date: "22 days ago" },
    ],
  },
};

const rangeLabels: Record<Range, string> = {
  "today": "Today",
  "3d":    "Last 3 days",
  "7d":    "Last 7 days",
  "30d":   "Last 30 days",
};
const xAxisLabel: Record<Range, string> = {
  "today": "by hour",
  "3d":    "by hour today",
  "7d":    "by day",
  "30d":   "by week",
};

function typeVariant(type: string): "monthly" | "daily" | "unassigned" {
  if (type.startsWith("Monthly")) return "monthly";
  if (type.startsWith("Daily"))   return "daily";
  return "unassigned";
}

export function AttendanceView() {
  const [range, setRange] = useState<Range>("today");
  const { stats, chart, checkins } = rangeData[range];

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
      <div className="flex gap-3 mb-5">
        {[
          { label: "Today",                                                                                                     val: stats.today },
          { label: range === "today" ? "Check-ins" : range === "3d" ? "3-day total" : range === "7d" ? "7-day total" : "30-day total", val: stats.total },
          { label: "Peak hour", val: stats.peak },
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
            Check-ins {xAxisLabel[range]}
          </div>
          <div className="text-[11px] text-gray-300 font-inter">{rangeLabels[range]}</div>
        </div>
        <ResponsiveContainer key={range} width="100%" height={90}>
          <BarChart data={chart} barCategoryGap="35%">
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#9ca3af", fontFamily: "Inter, sans-serif" }}
              axisLine={false}
              tickLine={false}
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
      </div>

      {/* Check-in log */}
      <div className="bg-white border border-black/8 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border-b border-black/8 text-[11px] text-gray-400 font-semibold tracking-widest uppercase font-inter sticky top-0 z-10">
          <span className="flex-1">Member</span>
          <span className="w-32">Visit type</span>
          <span className="w-[90px] text-right">Date</span>
          <span className="w-[72px] text-right">Time</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {checkins.map((c, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-4 py-3 text-[13px] font-inter ${i < checkins.length - 1 ? "border-b border-black/8" : ""}`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gym-dark">{c.member}</div>
                <div className="text-[11px] text-gray-300 font-mono mt-0.5">{c.id}</div>
              </div>
              <span className="w-32">
                <StatusPill variant={typeVariant(c.type)}>{c.type}</StatusPill>
              </span>
              <span className={`w-[90px] text-right text-xs font-inter ${c.date === "Today" ? "text-green-600 font-semibold" : "text-gray-400"}`}>
                {c.date}
              </span>
              <span className="w-[72px] text-right text-gray-400">{c.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center mt-3 font-inter">
        {checkins.length} check-ins shown · {rangeLabels[range].toLowerCase()}
      </div>
    </>
  );
}
