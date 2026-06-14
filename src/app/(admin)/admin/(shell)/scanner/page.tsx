"use client";

import { useState } from "react";
import { ScannerView } from "@/features/admin/scanner/components/ScannerView";
import { AdminToast } from "@/features/admin/_ui";

export default function AdminScannerPage() {
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });

  return (
    <>
      <ScannerView onToast={(title, subtitle) => setToast({ show: true, title, subtitle })} />
      <AdminToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
