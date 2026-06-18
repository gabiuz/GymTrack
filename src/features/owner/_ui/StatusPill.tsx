import React from "react";

type PillVariant =
  | "active"
  | "expired"
  | "expiring"
  | "unassigned"
  | "guest"
  | "monthly"
  | "daily"
  | "membership";

interface StatusPillProps {
  children: React.ReactNode;
  variant: PillVariant;
  size?: "sm" | "md";
}

const variantClasses: Record<PillVariant, string> = {
  active:     "bg-green-50 text-green-700 border border-green-200",
  expired:    "bg-red-50 text-red-600 border border-red-200",
  expiring:   "bg-amber-50 text-amber-600 border border-amber-200",
  unassigned: "bg-gray-100 text-gray-500 border border-gray-200",
  guest:      "bg-gray-100 text-gray-500 border border-gray-200",
  monthly:    "bg-blue-50 text-blue-600 border border-blue-200",
  daily:      "bg-green-50 text-green-600 border border-green-200",
  membership: "bg-purple-50 text-purple-600 border border-purple-200",
};

export function StatusPill({ children, variant, size = "sm" }: StatusPillProps) {
  const sizeClass = size === "sm"
    ? "text-[11px] px-2.5 py-[3px]"
    : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-inter font-semibold tracking-wide whitespace-nowrap ${sizeClass} ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
