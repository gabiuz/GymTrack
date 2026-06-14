"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DoneForm() {
  const [memberId, setMemberId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMemberId = sessionStorage.getItem("member_id");
      setMemberId(savedMemberId ?? "");
    }
  }, []);

  return (
    <div className="w-full bg-gym-gray-bg px-5 py-10 grow flex flex-col justify-start">
      <div className="max-w-120 sm:max-w-160 mx-auto w-full flex flex-col gap-6">
        {/* Stepper Header */}
        <div className="w-full flex items-center justify-center pt-2">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Step 1: Details (Completed) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-lime text-gym-dark rounded-full w-7 h-7 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="font-inter font-normal text-[11px] leading-tight text-[#6b7280] tracking-wider">
                Details
              </span>
            </div>

            {/* Connecting Line (Lime/Complete) */}
            <div className="h-[1.5px] bg-gym-lime w-10 sm:w-16 -mt-3.5" />

            {/* Step 2: Confirm (Completed) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-lime text-gym-dark rounded-full w-7 h-7 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0a0a0a"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="font-inter font-normal text-[11px] leading-tight text-[#6b7280] tracking-wider">
                Confirm
              </span>
            </div>

            {/* Connecting Line (Lime/Complete) */}
            <div className="h-[1.5px] bg-gym-lime w-10 sm:w-16 -mt-3.5" />

            {/* Step 3: Done (Active) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-lime text-gym-dark rounded-full w-7 h-7 flex items-center justify-center font-inter font-bold text-xs">
                3
              </div>
              <span className="font-inter font-semibold text-[11px] leading-tight text-gym-dark tracking-wider">
                Done
              </span>
            </div>
          </div>
        </div>

        {/* Main Success Content Card */}
        <div className="flex flex-col items-center text-center py-6 sm:py-8">
          {/* Green circular checkmark */}
          <div className="bg-[#e7f6ed] border-[#16a34a] border-[1.5px] rounded-full w-16 h-16 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="font-space font-bold text-xl leading-8.25 tracking-[-0.3px] text-gym-dark pt-5">
            You&apos;re registered!
          </h1>

          {/* Subtitle */}
          <p className="font-inter font-normal text-sm leading-5 text-[#6b7280] pt-2">
            Your member ID is
          </p>

          {/* Member ID */}
          <p className="font-inter font-semibold text-lg leading-7 tracking-[0.46px] text-gym-dark pt-2">
            {memberId}
          </p>

          {/* Information Instructions Box */}
          <div className="w-full pt-8 pb-6">
            <div className="bg-[#f3f5fa] border border-[#e2e7f0] rounded-[14px] p-4 text-left">
              <p className="font-inter text-xs leading-5.2 text-gym-dark">
                <span className="font-semibold">Next step:</span> Show your QR pass at the counter. Staff will assign your membership plan.
              </p>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="w-full flex flex-col gap-3">
            {/* View my QR pass */}
            <Link
              href="/my-pass"
              className="w-full bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-4 text-center text-gym-dark font-space font-bold text-[16px]"
            >
              View my QR pass
            </Link>

            {/* View membership status */}
            <Link
              href="/membership"
              className="w-full border border-[#e2e7f0] bg-white hover:bg-gym-dark/5 active:scale-[0.99] transition-all rounded-full py-4 text-center text-gym-dark font-space font-medium text-[16px]"
            >
              View membership status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
