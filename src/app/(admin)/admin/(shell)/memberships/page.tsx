"use client";

import { useState } from "react";
import { MembershipsView } from "@/features/admin/memberships/components/MembershipsView";
import { AdminToast } from "@/features/admin/_ui";

export default function AdminMembershipsPage() {
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });

  return (
    <>
      <MembershipsView onToast={(title, subtitle) => setToast({ show: true, title, subtitle })} />
      <AdminToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
