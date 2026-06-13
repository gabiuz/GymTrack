"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

// Static QR Code placeholder (to be replaced by backend-generated QR code in production)
const QrCodePlaceholder = () => {
  return (
    <svg id="mypass-qrcode-svg" viewBox="0 0 100 100" className="w-full h-full text-gym-dark" fill="currentColor">
      <rect width="100" height="100" fill="#ffffff" />

      {/* Finder pattern Top-Left */}
      <rect x="0" y="0" width="28" height="28" rx="2" />
      <rect x="4" y="4" width="20" height="20" fill="#ffffff" rx="1" />
      <rect x="8" y="8" width="12" height="12" rx="0.5" />

      {/* Finder pattern Top-Right */}
      <rect x="72" y="0" width="28" height="28" rx="2" />
      <rect x="76" y="4" width="20" height="20" fill="#ffffff" rx="1" />
      <rect x="80" y="8" width="12" height="12" rx="0.5" />

      {/* Finder pattern Bottom-Left */}
      <rect x="0" y="72" width="28" height="28" rx="2" />
      <rect x="4" y="76" width="20" height="20" fill="#ffffff" rx="1" />
      <rect x="8" y="80" width="12" height="12" rx="0.5" />

      {/* Mock details / random pixel blocks */}
      <rect x="36" y="0" width="8" height="8" />
      <rect x="48" y="4" width="12" height="8" />
      <rect x="36" y="16" width="24" height="4" />
      <rect x="44" y="24" width="8" height="8" />
      <rect x="64" y="12" width="4" height="12" />

      <rect x="0" y="36" width="8" height="8" />
      <rect x="16" y="36" width="12" height="12" />
      <rect x="4" y="52" width="16" height="4" />
      <rect x="0" y="60" width="8" height="8" />

      <rect x="36" y="36" width="16" height="16" />
      <rect x="40" y="40" width="8" height="8" fill="#ffffff" />
      <rect x="56" y="36" width="8" height="8" />
      <rect x="68" y="36" width="12" height="4" />

      <rect x="36" y="56" width="8" height="12" />
      <rect x="48" y="60" width="16" height="8" />
      <rect x="68" y="48" width="8" height="16" />
      <rect x="80" y="36" width="8" height="16" />
      <rect x="92" y="44" width="8" height="8" />

      <rect x="36" y="76" width="12" height="8" />
      <rect x="36" y="88" width="20" height="12" />
      <rect x="60" y="76" width="8" height="16" />
      <rect x="52" y="80" width="4" height="4" />

      <rect x="76" y="72" width="8" height="8" />
      <rect x="88" y="72" width="12" height="12" />
      <rect x="84" y="88" width="16" height="8" />
      <rect x="72" y="92" width="8" height="8" />
    </svg>
  );
};

export default function MyPassForm() {
  const [fullName, setFullName] = useState("Jedia Nicole");
  const [memberId, setMemberId] = useState("MEM-000001");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Load registered user info
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedData = sessionStorage.getItem("register_data");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.photoPreview) setPhotoPreview(parsed.photoPreview);
        } catch (e) {
          console.error("Failed to parse register_data on my-pass page", e);
        }
      }

      const savedMemberId = sessionStorage.getItem("member_id");
      if (savedMemberId) {
        setMemberId(savedMemberId);
      }
    }
  }, []);

  // Client-side HTML5 Canvas QR download logic
  const handleDownloadQR = () => {
    const svgElement = document.getElementById("mypass-qrcode-svg");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const context = canvas.getContext("2d");
      if (context) {
        // Render background and dynamic SVG to canvas
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, 300, 300);
        context.drawImage(image, 15, 15, 270, 270);

        const pngURL = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngURL;
        downloadLink.download = `${memberId}-qr.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Show success modal
        setShowModal(true);
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  return (
    <div className="w-full bg-gym-gray-bg px-5 py-8 grow flex flex-col justify-start">
      <div className="max-w-120 sm:max-w-160 mx-auto w-full flex flex-col gap-6">

        {/* Page Heading */}
        <div>
          <h1 className="font-space font-bold text-2xl leading-9.75 tracking-[-0.5px] text-gym-dark">
            My pass
          </h1>
        </div>

        {/* Dark Pass Card Container */}
        <div className="bg-gym-dark rounded-2.5xl w-full flex flex-col overflow-clip shadow-md">
          {/* Header Row */}
          <div className="border-b border-white/10 px-5 pt-5 pb-4.25 flex items-center gap-3">
            {/* Avatar Circle */}
            <div className="bg-white/10 border border-white/10 rounded-full w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden relative">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Member profile avatar"
                  className="w-full h-full object-cover"
                  fill
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>

            {/* User Text Details */}
            <div className="grow min-w-0">
              <p className="font-space font-medium text-base leading-[22.5px] text-white truncate">
                {fullName}
              </p>
              <p className="font-mono text-xs leading-tight text-white/40">
                {memberId}
              </p>
            </div>

            {/* Unassigned Status Badge */}
            <div className="bg-white/10 border border-white/20 rounded-full px-2.5 py-1 flex items-center justify-center shrink-0">
              <span className="font-inter font-semibold text-xs leading-none text-white/50 tracking-wide">
                Unassigned
              </span>
            </div>
          </div>

          {/* QR Code Body Section */}
          <div className="px-5 py-7 flex flex-col items-center justify-center">
            {/* QR Card Container */}
            <div className="pb-4">
              <div className="bg-white p-3 rounded-2xl w-44 h-44 flex items-center justify-center shadow-inner">
                <QrCodePlaceholder />
              </div>
            </div>

            {/* Member ID Monospace */}
            <div className="pb-1">
              <span className="font-mono text-xs text-white/50">
                {memberId}
              </span>
            </div>

            {/* Instructions */}
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
              <p className="font-inter font-normal text-xs leading-[16.5px] text-white/30 tracking-wide">
                Show this at the counter
              </p>
            </div>
          </div>

          {/* Download QR Button Row */}
          <div className="px-5 pb-5 w-full">
            <button
              onClick={handleDownloadQR}
              className="w-full bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-3.5 flex items-center justify-center gap-2 text-gym-dark font-space font-bold text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download QR
            </button>
          </div>
        </div>

        {/* Unassigned Warning Hint Card */}
        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          {/* Dashboard Loading Alert Icon */}
          <div className="pb-3">
            <div className="bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center shrink-0">
              <svg
                className="animate-spin text-gym-lime"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="6 6" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h2 className="font-space font-medium text-sm leading-5 text-gym-dark">
            No plan assigned yet
          </h2>

          {/* Subtitle description */}
          <p className="font-inter font-normal text-xs leading-5 text-gym-gray pt-1.5 pb-4 max-w-78">
            Bring your QR to the counter. Staff will scan and assign your membership or daily visit.
          </p>

          {/* Available Plans button */}
          <Link
            href="/#pricing"
            className="bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-2.5 px-6 font-space font-bold text-xs text-gym-dark"
          >
            View available plans
          </Link>
        </div>

        {/* Privacy Note Info Box */}
        <div className="bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-3 flex gap-2.5 items-start">
          <div className="pt-0.5 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gym-gray"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p className="font-inter font-normal text-xs leading-normal text-gym-gray">
            QR carries only the Member ID. Status & info are pulled from the database on scan.
          </p>
        </div>

      </div>

      {/* QR Saved Success Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-gym-dark/60 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-85 w-full relative flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top-Right Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors focus:outline-none"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gym-dark"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Success Icon Badge */}
            <div className="bg-gym-lime w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mt-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gym-dark"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="font-space font-bold text-xl leading-tight text-gym-dark mb-2">
              QR saved!
            </h2>

            {/* Description */}
            <p className="font-inter font-normal text-sm leading-5 text-gym-gray">
              Your QR pass has been downloaded. Show it at the counter to check in.
            </p>

            {/* Primary Action Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gym-lime hover:opacity-90 active:scale-[0.99] transition-all rounded-full py-3.5 text-center text-gym-dark font-space font-bold text-base mt-6 focus:outline-none"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
