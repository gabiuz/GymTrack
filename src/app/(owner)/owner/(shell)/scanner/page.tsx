"use client";

import { useState } from "react";
import { ScannerView } from "@/features/owner/scanner/components/ScannerView";
import { OwnerToast } from "@/features/owner/_ui";

export default function OwnerScannerPage() {
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });
  return (
    <>
      <ScannerView onToast={(title, subtitle) => setToast({ show: true, title, subtitle })} />
      <OwnerToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
