"use client";

import { useState } from "react";
import { MembersView } from "@/features/admin/members/components/MembersView";
import { AdminToast } from "@/features/admin/_ui";

export default function AdminMembersPage() {
  const [toast, setToast] = useState({ show: false, title: "", subtitle: "" });

  return (
    <>
      <MembersView onToast={(title, subtitle) => setToast({ show: true, title, subtitle })} />
      <AdminToast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </>
  );
}
