import React from "react";
import Image from "next/image";

interface StepCardProps {
  iconSrc: string;
  title: string;
  description: string;
  stepNumber: string;
}

function StepCard({ iconSrc, title, description, stepNumber }: StepCardProps) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-2xl p-4 flex flex-row items-center sm:flex-col sm:items-center sm:justify-center sm:text-center gap-4 w-full h-24 sm:h-38 shadow-xs hover:border-gym-lime/40 transition-colors duration-200">
      {/* Icon Container */}
      <div className="bg-gym-dark rounded-full w-9 h-9 flex items-center justify-center shrink-0">
        <Image
          src={iconSrc}
          alt={title}
          width={17}
          height={17}
          className="object-contain"
        />
      </div>

      {/* Text Content */}
      <div className="grow flex flex-col gap-0.5 pr-6 sm:pr-0 sm:items-center">
        <h4 className="font-space font-bold text-sm leading-5.25 text-gym-dark">
          {title}
        </h4>
        <p className="font-inter font-normal text-xs leading-4.875 text-gym-gray tracking-[-0.08px]">
          {description}
        </p>
      </div>

      {/* Step Number */}
      <span className="absolute top-4 right-4 font-inter font-bold text-[11px] leading-[16.5px] text-gray-200 tracking-[0.06px]">
        {stepNumber}
      </span>
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full max-w-3xl mx-auto bg-gym-gray-bg px-5 py-10 flex flex-col">
      {/* Category Label */}
      <span className="font-inter font-bold text-xs leading-[16.5px] text-gym-dark tracking-[1.6px] uppercase">
        How it works
      </span>

      {/* Heading */}
      <h2 className="mt-5 font-space font-bold text-2xl leading-[27.6px] tracking-[-0.5px] text-gym-dark">
        Check in fast,<br />
        every time.
      </h2>

      {/* Step Cards List */}
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 mt-7">
        <StepCard
          iconSrc="/icons/user.svg"
          title="Register online"
          description="Fill the form once — no paperwork at the counter."
          stepNumber="01"
        />
        <StepCard
          iconSrc="/icons/lightning.svg"
          title="Get your QR pass"
          description="Instantly saved to your account."
          stepNumber="02"
        />
        <StepCard
          iconSrc="/icons/calendar.svg"
          title="Scan at the counter"
          description="Staff checks you in in seconds."
          stepNumber="03"
        />
      </div>
      {/* Bottom Divider */}
      <div className="h-px bg-gray-200 w-full mt-10" />
    </section>
  );
}
