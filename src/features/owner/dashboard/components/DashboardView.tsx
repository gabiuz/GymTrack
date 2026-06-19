"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

type DashTab = "overview" | "revenue" | "attendance" | "membership";
<<<<<<< HEAD
type Period3   = "Today" | "Week" | "Month";
=======
type Period3 = "Today" | "Week" | "Month";
>>>>>>> origin/dev
type PeriodRev = "Week" | "Month" | "Year";
type PeriodAtt = "Week" | "Month";

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
<<<<<<< HEAD
          className={`px-3.5 py-1.5 rounded-full text-[11px] cursor-pointer font-inter border-none transition-all duration-100 ${
            o === value ? "bg-gym-lime text-gym-dark font-bold" : "bg-transparent text-gray-400 font-medium hover:text-gray-600"
          }`}
=======
          className={`px-3.5 py-1.5 rounded-full text-[11px] cursor-pointer font-inter border-none transition-all duration-100 ${o === value ? "bg-gym-lime text-gym-dark font-bold" : "bg-transparent text-gray-400 font-medium hover:text-gray-600"
            }`}
>>>>>>> origin/dev
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
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="35%">
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

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

/* ── Overview Tab ── */
function OverviewTab() {
<<<<<<< HEAD
  const [period, setPeriod]   = useState<Period3>("Today");
  const [data, setData]       = useState<Record<string, number | object> | null>(null);
=======
  const [period, setPeriod] = useState<Period3>("Today");
  const [data, setData] = useState<Record<string, number | object> | null>(null);
>>>>>>> origin/dev
  const [loading, setLoading] = useState(true);

  const rangeMap: Record<Period3, string> = { Today: "today", Week: "week", Month: "month" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/dashboard/overview?range=${rangeMap[period]}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const d = data as {
    todayVisitors: number; todayRevenue: number; activeMembers: number; activePlans: number;
    expiringIn7Days: number; newThisMonth: number;
    needsAttention: { expiringSoon: number; expired: number; unassigned: number };
    revenueChart: { date: string; amount: number }[];
  } | null;

<<<<<<< HEAD
  const chartData = d?.revenueChart.map((r) => ({ label: r.date.slice(5), val: r.amount })) ?? [];
=======
  const chartData = d?.revenueChart.map((r) => {
    const dObj = new Date(r.date);
    return {
      label: isNaN(dObj.getTime()) ? r.date.slice(5) : dObj.toLocaleDateString("en-PH", { weekday: "short" }),
      val: r.amount
    };
  }) ?? [];
>>>>>>> origin/dev

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Overview</h3>
        <PeriodToggle value={period} onChange={setPeriod} options={["Today", "Week", "Month"]} />
      </div>
      <p className="text-[12px] text-gray-400 mt-0.5 mb-4.5 font-inter">{new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3.5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[82px] rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3.5">
          <KpiCard label="Today's visitors" value={String(d?.todayVisitors ?? 0)} sub="check-ins today" />
<<<<<<< HEAD
          <KpiCard label="Today's revenue"  value={`₱${(d?.todayRevenue ?? 0).toLocaleString()}`} />
          <KpiCard label="Active members"   value={String(d?.activeMembers ?? 0)} />
          <KpiCard label="Active plans"     value={String(d?.activePlans ?? 0)} sub="monthly subscriptions" />
          <KpiCard label="Expiring (7d)"    value={String(d?.expiringIn7Days ?? 0)} valueColor="text-amber-500" sub="need renewal" />
          <KpiCard label="New this month"   value={String(d?.newThisMonth ?? 0)} sub="joined" subColor="text-green-600" />
=======
          <KpiCard label="Today's revenue" value={`₱${(d?.todayRevenue ?? 0).toLocaleString()}`} />
          <KpiCard label="Active members" value={String(d?.activeMembers ?? 0)} />
          <KpiCard label="Active plans" value={String(d?.activePlans ?? 0)} sub="monthly subscriptions" />
          <KpiCard label="Expiring (7d)" value={String(d?.expiringIn7Days ?? 0)} valueColor="text-amber-500" sub="need renewal" />
          <KpiCard label="New this month" value={String(d?.newThisMonth ?? 0)} sub="joined" subColor="text-green-600" />
>>>>>>> origin/dev
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between mb-3">
            <span className="text-[12px] font-semibold text-gym-dark">Revenue · last 7 days</span>
            <span className="text-[11px] text-gray-400">₱{chartData.reduce((a, b) => a + b.val, 0).toLocaleString()}</span>
          </div>
          {loading ? <Skeleton className="h-[90px]" /> : <MiniChart data={chartData} height={90} dataKey="revenue" formatVal={(v) => `₱${v.toLocaleString()}`} />}
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-3">Needs attention</div>
          {loading ? <Skeleton className="h-[80px]" /> : (
            [
              { color: "text-amber-500", label: `${d?.needsAttention.expiringSoon ?? 0} expiring soon` },
<<<<<<< HEAD
              { color: "text-red-500",   label: `${d?.needsAttention.expired ?? 0} expired` },
              { color: "text-gray-400",  label: `${d?.needsAttention.unassigned ?? 0} unassigned` },
=======
              { color: "text-red-500", label: `${d?.needsAttention.expired ?? 0} expired` },
              { color: "text-gray-400", label: `${d?.needsAttention.unassigned ?? 0} unassigned` },
>>>>>>> origin/dev
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center gap-2 text-[12px] py-2 font-inter ${i < arr.length - 1 ? "border-b border-black/8" : ""}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-current ${row.color} shrink-0`} />
                <span className={row.color}>{row.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Revenue Tab ── */
function RevenueTab() {
<<<<<<< HEAD
  const [period, setPeriod]   = useState<PeriodRev>("Month");
  const [data, setData]       = useState<Record<string, unknown> | null>(null);
=======
  const [period, setPeriod] = useState<PeriodRev>("Month");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
>>>>>>> origin/dev
  const [loading, setLoading] = useState(true);

  const rangeMap: Record<PeriodRev, string> = { Week: "week", Month: "month", Year: "year" };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/owner/dashboard/revenue?range=${rangeMap[period]}`)
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [period]);

  type RevData = { totalRevenue: number; avgPerDay: number; totalTransactions: number; byType: { monthlyPlans: number; dailyVisits: number; membershipFees: number }; chart: { label: string; amount: number }[] };
  const d = data as RevData | null;
  const chartData = d?.chart.map((r) => ({ label: r.label, val: r.amount })) ?? [];
  const totalByType = (d?.byType.monthlyPlans ?? 0) + (d?.byType.dailyVisits ?? 0) + (d?.byType.membershipFees ?? 0) || 1;
  const pct = (n: number) => Math.round((n / totalByType) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Revenue</h3>
        <PeriodToggle value={period} onChange={setPeriod} options={["Week", "Month", "Year"]} />
      </div>
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="flex-1 h-[82px] rounded-xl" />) : (
          <>
<<<<<<< HEAD
            <KpiCard label="Total revenue"  value={`₱${(d?.totalRevenue ?? 0).toLocaleString()}`} />
            <KpiCard label="Avg / day"      value={`₱${(d?.avgPerDay ?? 0).toLocaleString()}`} />
            <KpiCard label="Transactions"   value={String(d?.totalTransactions ?? 0)} />
=======
            <KpiCard label="Total revenue" value={`₱${(d?.totalRevenue ?? 0).toLocaleString()}`} />
            <KpiCard label="Avg / day" value={`₱${(d?.avgPerDay ?? 0).toLocaleString()}`} />
            <KpiCard label="Transactions" value={String(d?.totalTransactions ?? 0)} />
>>>>>>> origin/dev
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-3">Revenue by type</div>
          {loading ? <Skeleton className="h-[90px]" /> : (
            <>
<<<<<<< HEAD
              <RevBar label="Monthly plans"   value={`₱${(d?.byType.monthlyPlans ?? 0).toLocaleString()}`}   pct={pct(d?.byType.monthlyPlans ?? 0)} />
              <RevBar label="Daily visits"    value={`₱${(d?.byType.dailyVisits ?? 0).toLocaleString()}`}    pct={pct(d?.byType.dailyVisits ?? 0)} opacity={0.5} />
=======
              <RevBar label="Monthly plans" value={`₱${(d?.byType.monthlyPlans ?? 0).toLocaleString()}`} pct={pct(d?.byType.monthlyPlans ?? 0)} />
              <RevBar label="Daily visits" value={`₱${(d?.byType.dailyVisits ?? 0).toLocaleString()}`} pct={pct(d?.byType.dailyVisits ?? 0)} opacity={0.5} />
>>>>>>> origin/dev
              <RevBar label="Membership fees" value={`₱${(d?.byType.membershipFees ?? 0).toLocaleString()}`} pct={pct(d?.byType.membershipFees ?? 0)} opacity={0.28} />
            </>
          )}
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-2">Last 6 months</div>
          {loading ? <Skeleton className="h-[100px]" /> : <MiniChart data={chartData} height={100} dataKey="revenue" formatVal={(v) => `₱${v.toLocaleString()}`} />}
        </div>
      </div>
    </div>
  );
}

/* ── Attendance Tab ── */
function AttendanceTab() {
<<<<<<< HEAD
  const [period, setPeriod]   = useState<PeriodAtt>("Month");
  const [data, setData]       = useState<Record<string, unknown> | null>(null);
=======
  const [period, setPeriod] = useState<PeriodAtt>("Month");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
>>>>>>> origin/dev
  const [loading, setLoading] = useState(true);

  const rangeMap: Record<PeriodAtt, string> = { Week: "week", Month: "month" };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/owner/dashboard/attendance?range=${rangeMap[period]}`)
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [period]);

  type AttData = { totalCheckIns: number; avgPerDay: number; busiestDay: string; peakHour: string; byDayOfWeek: { day: string; count: number }[]; byHour: { hour: string; count: number }[]; visitMix: { monthlyPlan: number; dailyMember: number; dailyGuest: number } };
  const d = data as AttData | null;
<<<<<<< HEAD
  const dayData  = d?.byDayOfWeek.map((r) => ({ label: r.day, val: r.count })) ?? [];
=======
  const dayData = d?.byDayOfWeek.map((r) => ({ label: r.day, val: r.count })) ?? [];
>>>>>>> origin/dev
  const hourData = d?.byHour.map((r) => ({ label: r.hour, val: r.count })) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Attendance</h3>
        <PeriodToggle value={period} onChange={setPeriod} options={["Week", "Month"]} />
      </div>
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="flex-1 h-[82px] rounded-xl" />) : (
          <>
            <KpiCard label="Total check-ins" value={String(d?.totalCheckIns ?? 0)} />
<<<<<<< HEAD
            <KpiCard label="Avg / day"       value={String(d?.avgPerDay ?? 0)} sub="visitors" />
            <KpiCard label="Busiest day"     value={d?.busiestDay ?? "—"} />
            <KpiCard label="Peak hour"       value={d?.peakHour ?? "—"} />
=======
            <KpiCard label="Avg / day" value={String(d?.avgPerDay ?? 0)} sub="visitors" />
            <KpiCard label="Busiest day" value={d?.busiestDay ?? "—"} />
            <KpiCard label="Peak hour" value={d?.peakHour ?? "—"} />
>>>>>>> origin/dev
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3 mb-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-2">By day of week</div>
          {loading ? <Skeleton className="h-[100px]" /> : <MiniChart data={dayData} height={100} dataKey="check-ins" />}
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-2">By hour</div>
          {loading ? <Skeleton className="h-[100px]" /> : <MiniChart data={hourData} height={100} dataKey="check-ins" />}
        </div>
      </div>
      <div className="bg-white border border-black/8 rounded-xl px-4.5 py-3.5 flex items-center gap-5 flex-wrap shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <span className="text-[12px] font-semibold text-gym-dark">Visit mix</span>
        {loading ? <Skeleton className="h-4 w-48" /> : (
          [
<<<<<<< HEAD
            { label: `Monthly · ${d?.visitMix.monthlyPlan ?? 0}%`,    opacity: 1 },
            { label: `Daily member · ${d?.visitMix.dailyMember ?? 0}%`, opacity: 0.55 },
            { label: `Daily guest · ${d?.visitMix.dailyGuest ?? 0}%`,  opacity: 0.28 },
=======
            { label: `Monthly · ${d?.visitMix.monthlyPlan ?? 0}%`, opacity: 1 },
            { label: `Daily member · ${d?.visitMix.dailyMember ?? 0}%`, opacity: 0.55 },
            { label: `Daily guest · ${d?.visitMix.dailyGuest ?? 0}%`, opacity: 0.28 },
>>>>>>> origin/dev
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[12px] text-gym-dark">
              <span className="w-2.5 h-2.5 rounded-sm bg-gym-lime shrink-0" style={{ opacity: item.opacity }} />
              {item.label}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Membership Tab ── */
function MembershipTab() {
<<<<<<< HEAD
  const [data, setData]       = useState<Record<string, unknown> | null>(null);
=======
  const [data, setData] = useState<Record<string, unknown> | null>(null);
>>>>>>> origin/dev
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/owner/dashboard/memberships")
      .then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

<<<<<<< HEAD
  type MemData = { activeMembers: number; newThisMonth: number; expiredLast30Days: number; renewalRate: number; memberGrowthChart: { month: string; count: number }[]; activePlansByType: { oneMonth: number; threeMonths: number; sixMonths: number; dailyVisitOnly: number } };
=======
  type MemData = { activeMembers: number; newThisMonth: number; expiredLast30Days: number; expiringThisMonth: number; renewalRate: number; memberGrowthChart: { month: string; count: number }[]; activePlansByType: { oneMonth: number; threeMonths: number; sixMonths: number; dailyVisitOnly: number } };
>>>>>>> origin/dev
  const d = data as MemData | null;
  const growthData = d?.memberGrowthChart.map((r) => ({ label: r.month, val: r.count })) ?? [];
  const totalPlans = (d?.activePlansByType.oneMonth ?? 0) + (d?.activePlansByType.threeMonths ?? 0) + (d?.activePlansByType.sixMonths ?? 0) || 1;
  const pct = (n: number) => Math.round((n / totalPlans) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4.5">
        <h3 className="font-space font-bold text-[17px] tracking-tight text-gym-dark m-0">Membership</h3>
<<<<<<< HEAD
        <span className="text-[11px] text-gray-400 font-inter">current snapshot</span>
=======

>>>>>>> origin/dev
      </div>
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="flex-1 h-[82px] rounded-xl" />) : (
          <>
<<<<<<< HEAD
            <KpiCard label="Active members"  value={String(d?.activeMembers ?? 0)} />
            <KpiCard label="New this month"  value={`+${d?.newThisMonth ?? 0}`} valueColor="text-green-600" sub="joined" />
            <KpiCard label="Expired (30d)"   value={String(d?.expiredLast30Days ?? 0)} valueColor="text-red-500" sub="not renewed" />
            <KpiCard label="Renewal rate"    value={`${d?.renewalRate ?? 0}%`} sub={d?.renewalRate && d.renewalRate >= 75 ? "healthy" : "needs attention"} subColor={d?.renewalRate && d.renewalRate >= 75 ? "text-green-600" : "text-amber-500"} />
=======
            <KpiCard label="Active members" value={String(d?.activeMembers ?? 0)} />
            <KpiCard label="New this month" value={`+${d?.newThisMonth ?? 0}`} valueColor="text-green-600" sub="joined" />
            <KpiCard label="Expiring this month" value={String(d?.expiringThisMonth ?? 0)} valueColor="text-amber-500" sub="needs renewal" />
            <KpiCard label="Renewal rate" value={`${d?.renewalRate ?? 0}%`} sub={d?.renewalRate && d.renewalRate >= 75 ? "healthy" : "needs attention"} subColor={d?.renewalRate && d.renewalRate >= 75 ? "text-green-600" : "text-amber-500"} />
>>>>>>> origin/dev
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between mb-2.5">
            <span className="text-[12px] font-semibold text-gym-dark">Member growth · 6 months</span>
          </div>
          {loading ? <Skeleton className="h-[100px]" /> : <MiniChart data={growthData} height={100} dataKey="members" />}
        </div>
        <div className="bg-white border border-black/8 rounded-xl px-4.5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold text-gym-dark mb-3">Active plans by type</div>
          {loading ? <Skeleton className="h-[90px]" /> : (
            <>
<<<<<<< HEAD
              <RevBar label="1 month"  value={String(d?.activePlansByType.oneMonth ?? 0)}    pct={pct(d?.activePlansByType.oneMonth ?? 0)} />
              <RevBar label="3 months" value={String(d?.activePlansByType.threeMonths ?? 0)} pct={pct(d?.activePlansByType.threeMonths ?? 0)} opacity={0.55} />
              <RevBar label="6 months" value={String(d?.activePlansByType.sixMonths ?? 0)}   pct={pct(d?.activePlansByType.sixMonths ?? 0)} opacity={0.28} />
=======
              <RevBar label="1 month" value={String(d?.activePlansByType.oneMonth ?? 0)} pct={pct(d?.activePlansByType.oneMonth ?? 0)} />
              <RevBar label="3 months" value={String(d?.activePlansByType.threeMonths ?? 0)} pct={pct(d?.activePlansByType.threeMonths ?? 0)} opacity={0.55} />
              <RevBar label="6 months" value={String(d?.activePlansByType.sixMonths ?? 0)} pct={pct(d?.activePlansByType.sixMonths ?? 0)} opacity={0.28} />
>>>>>>> origin/dev
              <div className="mt-3 pt-2.5 border-t border-black/8 text-[11px] text-gray-400 font-inter">{d?.activePlansByType.dailyVisitOnly ?? 0} on daily-visit only</div>
            </>
          )}
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
<<<<<<< HEAD
            className={`px-4.5 py-1.5 rounded-full text-[13px] cursor-pointer font-inter border-none transition-all duration-100 capitalize ${
              tab === t ? "bg-gym-lime text-gym-dark font-bold" : "bg-transparent text-gray-400 font-medium hover:text-gray-600"
            }`}
=======
            className={`px-4.5 py-1.5 rounded-full text-[13px] cursor-pointer font-inter border-none transition-all duration-100 capitalize ${tab === t ? "bg-gym-lime text-gym-dark font-bold" : "bg-transparent text-gray-400 font-medium hover:text-gray-600"
              }`}
>>>>>>> origin/dev
          >
            {t}
          </button>
        ))}
      </div>

<<<<<<< HEAD
      {tab === "overview"    && <OverviewTab />}
      {tab === "revenue"     && <RevenueTab />}
      {tab === "attendance"  && <AttendanceTab />}
      {tab === "membership"  && <MembershipTab />}
=======
      {tab === "overview" && <OverviewTab />}
      {tab === "revenue" && <RevenueTab />}
      {tab === "attendance" && <AttendanceTab />}
      {tab === "membership" && <MembershipTab />}
>>>>>>> origin/dev
    </div>
  );
}
