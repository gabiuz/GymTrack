"use client";

import { useState } from "react";
import { MembersView } from "@/features/owner/members/components/MembersView";
import { OwnerToast } from "@/features/owner/_ui";

export default function OwnerMembersPage() {
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });
  return (
    <>
      <MembersView onToast={(title, subtitle) => setToast({ show: true, title, subtitle })} />
      <OwnerToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
