"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="mx-auto max-w-3xl w-full px-4 h-12.5 flex items-center justify-between relative">
        {/* Brand Logo & Name */}
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className="bg-gym-dark rounded-lg w-6 h-6 flex items-center justify-center shrink-0">
            <Image 
              src="/icons/dumbbell-white.svg" 
              alt="GymTrack Logo" 
              width={13} 
              height={13} 
              className="object-contain"
            />
          </div>
          <span className="font-space font-bold text-base tracking-tight text-gym-dark">
            GymTrack
          </span>
        </Link>

        {/* Tablet Navigation Menu */}
        <nav className="hidden sm:flex items-center gap-6">

          <Link 
            href="/login" 
            className="font-space text-sm font-bold text-gym-dark hover:opacity-80 transition-opacity ml-2"
          >
            Log in
          </Link>
          <Link 
            href="/register" 
            className="font-space text-xs font-bold bg-gym-lime text-gym-dark rounded-full py-2 px-4 hover:opacity-90 transition-opacity"
          >
            Register now
          </Link>
        </nav>

        {/* Hamburger Button (Mobile Only) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="p-1 hover:bg-gym-gray-bg rounded-md transition-colors focus:outline-none sm:hidden"
        >
          <Image 
            src="/icons/hamburger.svg" 
            alt="Menu Icon" 
            width={21} 
            height={21} 
            className={`object-contain transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        </button>

        {/* Interactive Dropdown Menu (Mobile Only) */}
        {isOpen && (
          <div className="absolute top-12.5 left-0 right-0 bg-white border-b border-gray-200 shadow-md flex flex-col p-4 gap-3 z-40 animate-in fade-in slide-in-from-top-2 duration-200 sm:hidden">

            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)}
              className="font-space text-sm font-bold text-center border border-gym-dark/30 rounded-full py-2.5 px-4 text-gym-dark hover:bg-gym-dark/5 transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              onClick={() => setIsOpen(false)}
              className="font-space text-sm font-bold text-center bg-gym-lime text-gym-dark rounded-full py-2.5 px-4 hover:opacity-90 transition-opacity"
            >
              Register now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
