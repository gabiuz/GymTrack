import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-gym-footer text-white">
      <div className="mx-auto max-w-3xl w-full px-5 py-10 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-8">
          {/* Brand Logo & Tagline */}
          <div className="flex flex-col max-w-65">
            <div className="flex items-center gap-2">
              <div className="bg-gym-dark border border-white/10 rounded-[14px] w-7 h-7 flex items-center justify-center shrink-0">
                <Image
                  src="/icons/dumbbell.svg"
                  alt="GymTrack Logo"
                  width={14}
                  height={14}
                  className="object-contain"
                />
              </div>
              <span className="font-space font-bold text-base tracking-[-0.3px] text-white">
                GymTrack
              </span>
            </div>
            <p className="mt-4 font-inter text-[13px] leading-[20.8px] text-white/50">
              Fast check-in for Philippine gyms. Register once, scan every time.
            </p>
          </div>

          {/* Link Columns Grid */}
          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            {/* Account Column */}
            <div className="flex flex-col">
              <h4 className="font-inter font-bold text-[11px] leading-[16.5px] text-white/40 tracking-[1.38px] uppercase mb-3">
                Account
              </h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link href="/register" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link href="/my-pass" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    My Pass
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Info Column */}
            <div className="flex flex-col">
              <h4 className="font-inter font-bold text-[11px] leading-[16.5px] text-white/40 tracking-[1.38px] uppercase mb-3">
                Info
              </h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link href="#pricing" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="font-inter text-[13px] text-white/70 hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full mt-8 mb-6" />

        {/* Copyright & Social Row */}
        <div className="flex items-center justify-between w-full">
          <p className="font-inter text-[12px] text-white/30">
            © 2026 GymTrack. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/icons/social-media/instagram.svg"
                alt="Instagram"
                width={16}
                height={16}
                className="object-contain"
              />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/icons/social-media/facebook.svg"
                alt="Facebook"
                width={16}
                height={16}
                className="object-contain"
              />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/icons/social-media/twitter.svg"
                alt="Twitter"
                width={16}
                height={16}
                className="object-contain"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
