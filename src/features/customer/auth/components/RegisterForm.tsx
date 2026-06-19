"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RegisterForm() {
  const router = useRouter();

  // Form State
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from sessionStorage on mount (handling client-side safely)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedData = sessionStorage.getItem("register_data");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFullName(parsed.fullName || "");
          setContactNumber(parsed.contactNumber || "");
          setAddress(parsed.address || "");
          setGender(parsed.gender || "Male");
          setDob(parsed.dob || "");
          setEmergencyContact(parsed.emergencyContact || "");
<<<<<<< HEAD
          setPhotoPreview(parsed.photoPreview || null);
=======
          setPhotoUrl(parsed.photoUrl || null);
          setPhotoPreview(parsed.photoUrl || null);
>>>>>>> origin/dev
        } catch (e) {
          console.error("Failed to parse saved register data", e);
        }
      }
    }
  }, []);

  // Required validation check
  const isFormValid =
    fullName.trim() !== "" &&
    contactNumber.trim() !== "" &&
    address.trim() !== "";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary in the background
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok && json.url) {
        setPhotoUrl(json.url);
      } else {
        console.error("Photo upload failed:", json.error);
        setPhotoUrl(null);
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      setPhotoUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      if (typeof window !== "undefined") {
        const data = {
          fullName,
          contactNumber,
          address,
          gender,
          dob,
          emergencyContact,
<<<<<<< HEAD
          // Store Cloudinary URL (preferred) or local preview as fallback
          photoUrl,
          photoPreview,
=======
          photoUrl,
>>>>>>> origin/dev
        };
        sessionStorage.setItem("register_data", JSON.stringify(data));
      }
      router.push("/confirm");
    }
  };

  return (
    <div className="w-full bg-gym-gray-bg px-5 py-10 grow flex flex-col justify-start">
      <div className="max-w-120 sm:max-w-160 mx-auto w-full flex flex-col gap-6">
        {/* Stepper Header */}
        <div className="w-full flex items-center justify-center pt-2">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Step 1: Details (Active) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-lime text-gym-dark rounded-full w-7 h-7 flex items-center justify-center font-inter font-bold text-xs">
                1
              </div>
              <span className="font-inter font-semibold text-xs leading-tight text-gym-dark tracking-wider">
                Details
              </span>
            </div>

            {/* Divider */}
            <div className="h-[1.5px] bg-[#e2e7f0] w-10 sm:w-16 -mt-3.5" />

            {/* Step 2: Confirm (Inactive) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-gray-bg border border-[#e2e7f0] text-[#9aa2b1] rounded-full w-7 h-7 flex items-center justify-center font-inter font-bold text-xs">
                2
              </div>
              <span className="font-inter font-normal text-xs leading-tight text-[#6b7280] tracking-wider">
                Confirm
              </span>
            </div>

            {/* Divider */}
            <div className="h-[1.5px] bg-[#e2e7f0] w-10 sm:w-16 -mt-3.5" />

            {/* Step 3: Done (Inactive) */}
            <div className="flex flex-col items-center gap-1">
              <div className="bg-gym-gray-bg border border-[#e2e7f0] text-[#9aa2b1] rounded-full w-7 h-7 flex items-center justify-center font-inter font-bold text-xs">
                3
              </div>
              <span className="font-inter font-normal text-xs leading-tight text-[#6b7280] tracking-wider">
                Done
              </span>
            </div>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="flex flex-col gap-1 mt-2">
          <h1 className="font-space font-bold text-xl leading-8.25 tracking-[-0.3px] text-gym-dark">
            Member registration
          </h1>
          <p className="font-inter font-normal text-sm leading-5 tracking-tight text-[#6b7280]">
            Create your profile to get a QR code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          {/* REQUIRED FIELDS SECTION */}
          <div className="flex flex-col gap-4">
            <h3 className="font-inter font-bold text-xs tracking-[0.7px] text-gym-dark uppercase mt-2">
              Required
            </h3>

            {/* Field 1: Full Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="fullName" className="flex items-center gap-2">
                <div className="bg-gym-lime/15 rounded-full w-5.5 h-5.5 flex items-center justify-center font-inter font-semibold text-xs text-gym-dark">
                  1
                </div>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  Full name
                </span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan dela Cruz"
                className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-xl h-11.5 px-3.5 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 transition-all"
                required
              />
            </div>

            {/* Field 2: Contact Number */}
            <div className="flex flex-col gap-2">
              <label htmlFor="contactNumber" className="flex items-center gap-2">
                <div className="bg-gym-lime/15 rounded-full w-5.5 h-5.5 flex items-center justify-center font-inter font-semibold text-xs text-gym-dark">
                  2
                </div>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  Contact number
                </span>
              </label>
              <input
                id="contactNumber"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="09XX XXX XXXX"
                maxLength={11}
                className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-xl h-11.5 px-3.5 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 transition-all"
                required
              />
            </div>

            {/* Field 3: Address */}
            <div className="flex flex-col gap-2">
              <label htmlFor="address" className="flex items-center gap-2">
                <div className="bg-gym-lime/15 rounded-full w-5.5 h-5.5 flex items-center justify-center font-inter font-semibold text-xs text-gym-dark">
                  3
                </div>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  Address
                </span>
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no., street, barangay, city"
                rows={2}
                className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-xl min-h-17 px-3.5 py-3.5 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 resize-none transition-all"
                required
              />
            </div>

            {/* Field 4: Gender Segmented Control */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-gym-lime/15 rounded-full w-5.5 h-5.5 flex items-center justify-center font-inter font-semibold text-xs text-gym-dark">
                  4
                </div>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  Gender
                </span>
              </div>
              <div className="bg-[#f3f5fa] border border-[#e2e7f0] rounded-xl p-1.25 flex w-full">
                {["Male", "Female", "Other"].map((option) => {
                  const isActive = gender === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setGender(option)}
                      className={`flex-1 py-2 rounded-[9px] font-inter font-semibold text-xs text-center transition-all duration-200 focus:outline-none ${isActive
                        ? "bg-white text-gym-dark shadow-xs"
                        : "text-[#6b7280] hover:text-gym-dark"
                        }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* OPTIONAL FIELDS SECTION */}
          <div className="flex flex-col gap-4 mt-2">
            <h3 className="font-inter font-bold text-[11px] tracking-[0.7px] text-gym-dark uppercase">
              Optional
            </h3>

            {/* Field 5: Date of Birth */}
            <div className="flex flex-col gap-2">
              <label htmlFor="dob" className="flex items-center gap-2">
                <div className="bg-gym-lime/15 rounded-full w-5.5 h-5.5 flex items-center justify-center font-inter font-semibold text-xs text-gym-dark">
                  5
                </div>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  Date of birth
                </span>
              </label>
              <input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-xl h-11.5 px-3.5 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 transition-all"
              />
            </div>

            {/* Field 6: Emergency Contact */}
            <div className="flex flex-col gap-2">
              <label htmlFor="emergencyContact" className="flex items-center gap-2">
                <div className="bg-gym-lime/15 rounded-full w-5.5 h-5.5 flex items-center justify-center font-inter font-semibold text-xs text-gym-dark">
                  6
                </div>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  Emergency contact
                </span>
              </label>
              <input
                id="emergencyContact"
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name / number"
                className="bg-white border border-[#e2e7f0] focus:border-gym-lime focus:ring-1 focus:ring-gym-lime focus:outline-none rounded-xl h-11.5 px-3.5 py-3 font-inter font-normal text-sm text-gym-dark placeholder-gym-dark/50 transition-all"
              />
            </div>

            {/* Field 7: Profile Photo Upload */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-gym-lime/15 rounded-full w-5.5 h-5.5 flex items-center justify-center font-inter font-semibold text-xs text-gym-dark">
                  7
                </div>
                <span className="font-inter font-medium text-xs text-gym-dark">
                  Profile photo
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="w-full bg-white border border-[#e2e7f0] border-dashed rounded-xl min-h-13.5 p-4 flex gap-2.5 items-center justify-center hover:border-gym-lime/40 transition-colors focus:outline-none overflow-hidden disabled:opacity-60"
              >
                {photoPreview ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#e2e7f0] flex items-center justify-center animate-in fade-in duration-200">
                    <Image
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      fill
                    />
                  </div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9aa2b1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}

                <span className="font-inter font-medium text-sm text-[#9aa2b1] tracking-tight">
                  {isUploading ? "Uploading…" : photoPreview ? "Change photo" : "Tap to upload"}
                </span>
              </button>
            </div>
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full rounded-full py-4 px-6 font-space font-bold text-base text-center transition-all duration-200 mt-4 ${isFormValid
              ? "bg-gym-lime text-gym-dark cursor-pointer hover:opacity-90 active:scale-[0.99]"
              : "bg-[#f3f5fa] text-[#6b7280] cursor-not-allowed"
              }`}
          >
            Continue to confirm
          </button>
        </form>
      </div>
    </div>
  );
}
