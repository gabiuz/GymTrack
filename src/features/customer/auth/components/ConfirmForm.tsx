"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ConfirmForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Details State (loaded from sessionStorage)
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Load from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedData = sessionStorage.getItem("register_data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.contactNumber) setContactNumber(parsed.contactNumber);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.gender) setGender(parsed.gender);
        // Prefer Cloudinary URL, fall back to local preview for display only
        if (parsed.photoUrl) setPhotoUrl(parsed.photoUrl);
        if (parsed.photoPreview) setPhotoPreview(parsed.photoPreview);
      } catch (e) {
        console.error("Failed to parse saved register data on confirm page", e);
      }
    }
  }, []);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const savedData =
        typeof window !== "undefined"
          ? sessionStorage.getItem("register_data")
          : null;
      const parsed = savedData ? JSON.parse(savedData) : {};

      // DOB from native date input is already YYYY-MM-DD — use directly
      const dateOfBirth = parsed.dob && parsed.dob.trim() !== "" ? parsed.dob : undefined;

      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: parsed.fullName,
          contactNumber: parsed.contactNumber,
          address: parsed.address,
          gender: parsed.gender,
          dateOfBirth,
          emergencyContact: parsed.emergencyContact || undefined,
          // Send the Cloudinary URL — the API now rejects base64 strings
          photoUrl: parsed.photoUrl || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Registration failed. Please try again.");
        return;
      }

      // Store display data for the Done page — cookie was set by the server
      if (typeof window !== "undefined") {
        sessionStorage.setItem("member_id", json.data.memberId);
        sessionStorage.setItem("qr_code", json.data.qrCode ?? "");
        sessionStorage.setItem(
          "member_data",
          JSON.stringify({
            memberId: json.data.memberId,
            fullName: json.data.fullName,
            photoUrl: photoUrl,
          })
        );
        sessionStorage.removeItem("register_data");
      }

      router.push("/done");
    } catch {
      setError("A network error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-gym-gray-bg px-5 py-10 grow flex flex-col justify-start">
      <div className="max-w-120 sm:max-w-160 mx-auto w-full flex flex-col gap-6">
        {/* Top Back Nav Label */}
        <Link
          href="/register"
          className="inline-flex gap-1 items-center hover:opacity-80 transition-opacity text-[#6b7280] font-inter font-medium text-[14px]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>

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

            {/* Step 2: Confirm (Active) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-lime text-gym-dark rounded-full w-7 h-7 flex items-center justify-center font-inter font-bold text-xs">
                2
              </div>
              <span className="font-inter font-semibold text-[11px] leading-tight text-gym-dark tracking-wider">
                Confirm
              </span>
            </div>

            {/* Connecting Line (Grey/Pending) */}
            <div className="h-[1.5px] bg-[#e2e7f0] w-10 sm:w-16 -mt-3.5" />

            {/* Step 3: Done (Inactive) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-gray-bg border border-[#e2e7f0] text-[#9aa2b1] rounded-full w-7 h-7 flex items-center justify-center font-inter font-bold text-xs">
                3
              </div>
              <span className="font-inter font-normal text-[11px] leading-tight text-[#6b7280] tracking-wider">
                Done
              </span>
            </div>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="flex flex-col gap-1 mt-2">
          <h1 className="font-space font-bold text-[22px] leading-8.25 tracking-[-0.3px] text-gym-dark">
            Review your details
          </h1>
          <p className="font-inter font-normal text-[14px] leading-5 tracking-tight text-[#6b7280]">
            Nothing is saved until you confirm
          </p>
        </div>

        {/* Avatar Review & Upload Section */}
        <div className="flex items-center gap-3.5 mt-2">
          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-[#f3f5fa] border border-[#e2e7f0] flex items-center justify-center shrink-0">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt="Profile photo preview"
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
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </div>
        </div>

        {/* Details Table Card */}
        <div className="bg-white border border-[#e2e7f0] rounded-[14px] px-4.25 py-1 flex flex-col w-full shadow-xs">
          {/* Row 1: Full name */}
          <div className="border-b border-[#e2e7f0] py-3 flex items-center justify-between">
            <span className="font-inter font-medium text-xs tracking-tight text-[#6b7280]">
              Full name
            </span>
            <span className="font-inter font-medium text-sm tracking-tight text-gym-dark text-right">
              {fullName}
            </span>
          </div>

          {/* Row 2: Contact number */}
          <div className="border-b border-[#e2e7f0] py-3 flex items-center justify-between">
            <span className="font-inter font-medium text-xs tracking-tight text-[#6b7280]">
              Contact number
            </span>
            <span className="font-inter font-medium text-sm tracking-tight text-gym-dark text-right">
              {contactNumber}
            </span>
          </div>

          {/* Row 3: Address */}
          <div className="border-b border-[#e2e7f0] py-3 flex items-center justify-between">
            <span className="font-inter font-medium text-xs tracking-tight text-[#6b7280]">
              Address
            </span>
            <span className="font-inter font-medium text-sm tracking-tight text-gym-dark text-right">
              {address}
            </span>
          </div>

          {/* Row 4: Gender */}
          <div className="py-3 flex items-center justify-between">
            <span className="font-inter font-medium text-xs tracking-tight text-[#6b7280]">
              Gender
            </span>
            <span className="font-inter font-medium text-sm tracking-tight text-gym-dark text-right">
              {gender}
            </span>
          </div>
        </div>

        {/* Informative Disclaimer Box */}
        <div className="bg-[#f3f5fa] border border-[#e2e7f0] rounded-xl p-3.75 flex gap-2.5 items-start w-full">
          <span className="text-[#6b7280] font-inter text-[16px] leading-4.5 shrink-0 pt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
          <p className="font-inter font-normal text-[12px] leading-4.5 text-[#6b7280]">
            On confirm, a Member ID + QR code are generated and status is set to{" "}
            <span className="font-bold text-gym-dark">Unassigned</span>.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="font-inter font-normal text-xs leading-5 text-red-700">{error}</p>
          </div>
        )}

        {/* Footer Navigation Row */}
        <div className="flex gap-2.5 items-center pt-6 w-full">
          {/* Back Button */}
          <Link
            href="/register"
            className="border border-[#e2e7f0] bg-white rounded-full px-5 py-3.5 inline-flex gap-1.5 items-center justify-center hover:bg-gym-dark/5 active:scale-[0.99] transition-all text-gym-dark font-space font-medium text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </Link>

          {/* Confirm & Register Button */}
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`grow rounded-full py-4 text-center text-gym-dark font-space font-bold text-[14px] transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? "bg-gym-lime/70 cursor-not-allowed"
                : "bg-gym-lime hover:opacity-90 active:scale-[0.99]"
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Registering…
              </>
            ) : (
              "Confirm & register"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
