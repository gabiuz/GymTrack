import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full h-196 max-w-3xl mx-auto overflow-hidden bg-gym-dark">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/landing-bg.jpg"
          alt="Gym Background"
          fill
          priority
          sizes="768px"
          className="object-cover object-center pointer-events-none"
        />
      </div>

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-gym-dark via-gym-dark/70 to-gym-dark/30" />

      {/* Hero Content Container */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-5 pb-10 pt-20">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
          <div className="bg-gym-lime rounded-full w-5 h-5 flex items-center justify-center shrink-0">
            <Image
              src="/icons/dumbbell-white.svg"
              alt="GymTrack Icon"
              width={11}
              height={11}
              className="object-contain"
            />
          </div>
          <span className="font-space font-bold text-xs tracking-[-0.2px] text-white">
            GymTrack
          </span>
        </div>

        {/* Headings */}
        <h1 className="mt-6 font-space font-bold text-5xl leading-[43.2px] tracking-[-1.5px] text-white">
          Be stronger.<br />
          <span className="text-gym-lime">Train smarter.</span>
        </h1>

        {/* Description */}
        <p className="mt-4 font-inter font-normal text-base leading-6 tracking-[-0.23px] text-white/70 max-w-[320px]">
          Register online, get your QR pass, and check in at the counter in seconds.
        </p>

        {/* Stats Grid */}
        <div className="flex items-center gap-5 sm:gap-10 mt-8">
          {/* Stat 1 */}
          <div className="flex flex-col">
            <span className="font-space font-bold text-xl leading-5.5 text-white">
              500+
            </span>
            <span className="font-inter font-normal text-xs leading-[16.5px] text-white/50 tracking-[0.06px] mt-0.5">
              Members
            </span>
          </div>

          {/* Stat 2 */}
          <div className="flex flex-col">
            <span className="font-space font-bold text-xl leading-5.5 text-white">
              ₱70
            </span>
            <span className="font-inter font-normal text-xs leading-[16.5px] text-white/50 tracking-[0.06px] mt-0.5">
              Daily rate
            </span>
          </div>

          {/* Stat 3 */}
          <div className="flex flex-col">
            <span className="font-space font-bold text-xl leading-5.5 text-white">
              ₱200
            </span>
            <span className="font-inter font-normal text-xs leading-[16.5px] text-white/50 tracking-[0.06px] mt-0.5">
              Annual fee
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2.5 mt-8 w-full sm:w-auto">
          <Link
            href="/register"
            className="grow sm:flex-initial sm:w-45 flex gap-2 items-center justify-center bg-gym-lime hover:opacity-90 active:scale-[0.98] transition-all rounded-full py-3.5 px-5 font-space font-medium text-[15px] text-gym-dark"
          >
            Register now
            <Image
              src="/icons/arrow-right.svg"
              alt="Arrow Right"
              width={16}
              height={16}
              className="object-contain"
            />
          </Link>

          <Link
            href="/login"
            className="w-21.25 sm:w-30 shrink-0 flex items-center justify-center border border-white/30 hover:border-white/50 hover:bg-white/10 active:scale-[0.98] transition-all rounded-full py-3.5 font-space font-medium text-[15px] text-white"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
