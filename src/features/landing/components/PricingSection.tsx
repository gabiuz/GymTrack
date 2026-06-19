import React from "react";
import Image from "next/image";
import Link from "next/link";

interface PriceRowProps {
  label: string;
  price: string;
  period: string;
  isLast?: boolean;
}

function PriceRow({ label, price, period, isLast = false }: PriceRowProps) {
  return (
    <div className={`flex items-center justify-between py-4 px-4 ${!isLast ? "border-b border-[#e2e7f0]" : ""}`}>
      <span className="font-inter font-medium text-sm tracking-[-0.15px] text-gym-dark">
        {label}
      </span>
      <div className="flex flex-col items-end">
        <span className="font-space font-bold text-base leading-tight text-gym-dark">
          {price}
        </span>
        <span className="font-inter font-normal text-xs leading-tight text-gym-gray tracking-[0.06px] mt-0.5">
          {period}
        </span>
      </div>
    </div>
  );
}

export default function PricingSection() {
  return (
    <section id="pricing" className="w-full max-w-3xl mx-auto bg-gym-gray-bg px-5 pb-10 flex flex-col">
      {/* Category Label */}
      <span className="font-inter font-bold text-xs leading-[16.5px] text-gym-dark tracking-[1.6px] uppercase">
        Pricing
      </span>

      {/* Heading */}
      <h2 className="mt-5 font-space font-bold text-2xl leading-[27.6px] tracking-[-0.5px] text-gym-dark">
        Simple,<br />
        no-surprises rates.
      </h2>

      {/* Price Grid Box */}
      <div className="bg-white border border-[#e2e7f0] rounded-2xl overflow-hidden w-full mt-6 shadow-xs">
        <PriceRow
          label="Annual membership"
          price="₱200"
          period="per year"
        />
        <PriceRow
          label="Daily visit — member"
          price="₱70"
          period="per visit"
        />
        <PriceRow
          label="Daily visit — guest"
          price="₱75"
          period="per visit"
        />
        <PriceRow
          label="Monthly plan"
          price="₱799"
          period="and up"
          isLast={true}
        />
      </div>

      {/* CTA Button */}
      <div className="mt-5 w-full sm:max-w-[320px] sm:mx-auto">
        <Link
          href="/register"
          className="w-full flex gap-2 items-center justify-center bg-gym-lime hover:opacity-90 active:scale-[0.98] transition-all rounded-full py-3.5 px-6 font-space font-medium text-[15px] text-gym-dark text-center"
        >
          Get started — it&apos;s free
          <Image
            src="/icons/arrow-right.svg"
            alt="Arrow Right"
            width={16}
            height={16}
            className="object-contain"
          />
        </Link>
      </div>
    </section>
  );
}
