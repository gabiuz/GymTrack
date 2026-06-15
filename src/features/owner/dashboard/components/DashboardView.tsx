"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

type DashTab = "overview" | "revenue" | "attendance" | "membership";
type Period3 = "Today" | "Week" | "Month";
type PeriodRev = "Week" | "Month" | "Year";
type PeriodAtt = "Week" | "Month";

/* ── Data ── */
const revenueWeekData  = [
  { label: "Th", val: 1500 }, { label: "Fr", val: 2100 }, { label: "Sa", val: 2800 },
  { label: "Su", val: 1200 }, { label: "Mo", val: 2300 }, { label: "Tu", val: 1900 },
  { label: "We", val: 1860 },
];
const revenueMonthData = [
  { label: "Jan", val: 32000 }, { label: "Feb", val: 38000 }, { label: "Mar", val: 35000 },
  { label: "Apr", val: 44000 }, { label: "May", val: 52000 }, { label: "Jun", val: 48900 },
];
const attendanceDayData = [
  { label: "Mon", val: 34 }, { label: "Tue", val: 27 }, { label: "Wed", val: 30 },
  { label: "Thu", val: 25 }, { label: "Fri", val: 32 }, { label: "Sat", val: 20 },
  { label: "Sun", val: 12 },
];
const attendanceHourData = [
  { label: "8a", val: 6 }, { label: "9a", val: 11 }, { label: "10a", val: 18 },
  { label: "11a", val: 14 }, { label: "12p", val: 9 }, { label: "1p", val: 11 },
  { label: "2p", val: 15 }, { label: "3p", val: 21 }, { label: "4p", val: 26 },
  { label: "5p", val: 34 }, { label: "6p", val: 40 }, { label: "7p", val: 28 },
];
const memberGrowthData = [
  { label: "Jan", val: 188 }, { label: "Feb", val: 196 }, { label: "Mar", val: 203 },
  { label: "Apr", val: 215 }, { label: "May", val: 226 }, { label: "Jun", val: 231 },
];

/* ── Shared sub-components ── */
function KpiCard({ label, value, valueColor, sub, subColor }: {
  label: string; value: string; valueColor?: string; sub?: string; subColor?: string;
}) {
  return (
    <div className="flex-1 bg-white border border-black/8 rounded-xl px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase mb-1.5 font-inter">{label}</div>
      <div className={`font-space text-[26px] font-bold tracking-tight ${valueColor ?? "text-gym-dark"}`}>{value}</div>
      {sub && <div className={`text-[11px] mt-0.5 ${subColor ?? "text-gray-400"}`}>{sub}</div>}
    </div>
  );
}

function PeriodToggle<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: T[];
}) {
  return (
    <div className="inline-flex bg-gray-100 rounded-full p-1 border border-black/8">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-3.5 py-1.5 rounded-full text-[11px] cursor-pointer font-inter border-none transition-all duration-100 ${
            o === value ? "bg-gym-lime text-gym-dark font-bold" : "bg-transparent text-gray-400 font-medium hover:text-gray-600"
          }`}
        >{o}</button>
      ))}
    </div>
  );
}

function RevBar({ label, value, pct, opacity = 1 }: { label: string; value: string; pct: number; opacity?: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[12px] mb-1.5">
        <span className="text-gym-dark">{label}</span>
        <span className="font-bold text-gym-dark">{value}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, opacity }} className="h-full bg-gym-lime rounded-full" />
      </div>
    </div>
  );
}

function MiniChart({ data, height = 90, dataKey, formatVal }: {
  data: { label: string; val: number }[];
  height?: number;
  dataKey?: string;
  formatVal?: (v: number) => string;
}) {
  const chartData = data.map((d) => ({ label: d.label, val: d.val }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} barCategoryGap="35%">
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af", fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 8, fontSize: 12, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          itemStyle={{ color: "#111" }}
          formatter={(v) => [formatVal ? formatVal(v as number) : v, dataKey ?? "value"]}
          cursor={{ fill: "#f5ffe0" }}
        />
        <Bar dataKey="val" fill="#C8FF00" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Tabs ── */
function OverviewTab() {
  const [period, setPeriod] = useState<Period3>("Today");
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Overview</h3>
        <PeriodToggle value={period} onChange={setPeriod} options={["Today", "Week", "Month"]} />
      </div>
      <p className="text-[12px] text-gray-400 mt-0.5 mb-4.5 font-inter">Friday, 12 June 2026</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3.5">
        <KpiCard label="Today's visitors" value="24"  sub="▲ 12% vs yest." subColor="text-green-600" />
        <KpiCard label="Today's revenue"  value="₱1,860" sub="▲ 8% vs yest." subColor="text-green-600" />
        <KpiCard label="Active members"   value="231" sub="of 248 total" />
        <KpiCard label="Active plans"     value="142" sub="subscriptions" />
        <KpiCard label="Expiring (7d)"    value="9"   valueColor="text-amber-500" sub="need renewal" />
        <KpiCard label="New this month"   value="18"  sub="joined" subColor="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between mb-3">
            <span className="text-[12px] font-semibold text-gym-dark">Revenue · last 7 days</span>
            <span className="text-[11px] text-gray-400">₱12,440</span>
          </div>
          <MiniChart data={revenueWeekData} height={90} dataKey="revenue" formatVal={(v) => `₱${v.toLocaleString()}`} />
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-3">Needs attention</div>
          {[
            { color: "text-amber-500", label: "9 expiring soon" },
            { color: "text-red-500",   label: "8 expired" },
            { color: "text-gray-400",  label: "3 unassigned" },
          ].map((row, i, arr) => (
            <div key={row.label} className={`flex items-center gap-2 text-[12px] py-2 font-inter ${i < arr.length - 1 ? "border-b border-black/8" : ""}`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${row.color} shrink-0`} />
              <span className={row.color}>{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RevenueTab() {
  const [period, setPeriod] = useState<PeriodRev>("Month");
  return (
    <div>
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Revenue</h3>
        <PeriodToggle value={period} onChange={setPeriod} options={["Week", "Month", "Year"]} />
      </div>
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <KpiCard label="This month"    value="₱48,900" sub="▲ 14% vs last" subColor="text-green-600" />
        <KpiCard label="Avg / day"     value="₱1,630"  sub="30-day avg" />
        <KpiCard label="Transactions"  value="612"      sub="this month" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-3">Revenue by type</div>
          <RevBar label="Monthly plans"    value="₱28,400" pct={58} />
          <RevBar label="Daily visits"     value="₱14,900" pct={30} opacity={0.5} />
          <RevBar label="Membership fees"  value="₱5,600"  pct={12} opacity={0.28} />
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-2">Last 6 months</div>
          <MiniChart data={revenueMonthData} height={100} dataKey="revenue" formatVal={(v) => `₱${v.toLocaleString()}`} />
        </div>
      </div>
      <div className="flex justify-end mt-3.5">
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium font-inter border border-black/14 rounded-full bg-white text-gym-dark cursor-pointer hover:bg-gray-50 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export report
        </button>
      </div>
    </div>
  );
}

function AttendanceTab() {
  const [period, setPeriod] = useState<PeriodAtt>("Month");
  return (
    <div>
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Attendance</h3>
        <PeriodToggle value={period} onChange={setPeriod} options={["Week", "Month"]} />
      </div>
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <KpiCard label="Total check-ins" value="742" sub="this month" />
        <KpiCard label="Avg / day"       value="25"  sub="visitors" />
        <KpiCard label="Busiest day"     value="Mon" sub="avg 34" />
        <KpiCard label="Peak hour"       value="6–7 PM" sub="evening" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3 mb-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-2">By day of week</div>
          <MiniChart data={attendanceDayData} height={100} dataKey="check-ins" />
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-2">By hour</div>
          <MiniChart data={attendanceHourData} height={100} dataKey="check-ins" />
        </div>
      </div>
      <div className="bg-white border border-black/8 rounded-xl px-4.5 py-3.5 flex items-center gap-5 flex-wrap shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <span className="text-[12px] font-semibold text-gym-dark">Visit mix</span>
        {[
          { label: "Monthly · 61%",       opacity: 1 },
          { label: "Daily member · 27%",  opacity: 0.55 },
          { label: "Daily guest · 12%",   opacity: 0.28 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[12px] text-gym-dark">
            <span className="w-2.5 h-2.5 rounded-sm bg-gym-lime shrink-0" style={{ opacity: item.opacity }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MembershipTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Membership</h3>
        <span className="text-[11px] text-gray-400 font-inter">as of 12 Jun 2026</span>
      </div>
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <KpiCard label="Active members"  value="231"  sub="of 248" />
        <KpiCard label="New this month"  value="+18"  valueColor="text-green-600" sub="joined" />
        <KpiCard label="Expired (30d)"   value="8"    valueColor="text-red-500" sub="not renewed" />
        <KpiCard label="Renewal rate"    value="86%"  sub="healthy" subColor="text-green-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between mb-2.5">
            <span className="text-[12px] font-semibold text-gym-dark">Member growth · 6 months</span>
            <span className="text-[11px] text-green-600">+12% net</span>
          </div>
          <MiniChart data={memberGrowthData} height={100} dataKey="members" />
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-3">Active plans by type</div>
          <RevBar label="1 month"  value="98" pct={69} />
          <RevBar label="3 months" value="31" pct={22} opacity={0.55} />
          <RevBar label="6 months" value="13" pct={9}  opacity={0.28} />
          <div className="mt-3 pt-2.5 border-t border-black/8 text-[11px] text-gray-400 font-inter">89 on daily-visit only</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export function DashboardView() {
  const [tab, setTab] = useState<DashTab>("overview");

  return (
    <div>
      {/* Tab pills */}
      <div className="inline-flex bg-gray-100 rounded-full p-1 border border-black/8 mb-5.5">
        {(["overview", "revenue", "attendance", "membership"] as DashTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4.5 py-1.5 rounded-full text-[13px] cursor-pointer font-inter border-none transition-all duration-100 capitalize ${
              tab === t
                ? "bg-gym-lime text-gym-dark font-bold"
                : "bg-transparent text-gray-400 font-medium hover:text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview"    && <OverviewTab />}
      {tab === "revenue"     && <RevenueTab />}
      {tab === "attendance"  && <AttendanceTab />}
      {tab === "membership"  && <MembershipTab />}
    </div>
  );
}
