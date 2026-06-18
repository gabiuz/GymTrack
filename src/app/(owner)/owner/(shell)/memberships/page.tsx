"use client";

import { useState } from "react";
import { MembershipsView } from "@/features/owner/memberships/components/MembershipsView";
import { OwnerToast } from "@/features/owner/_ui";

export default function OwnerMembershipsPage() {
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });
  return (
    <>
      <MembershipsView onToast={(title, subtitle) => setToast({ show: true, title, subtitle })} />
      <OwnerToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
