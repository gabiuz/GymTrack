import { AdminShell } from "@/features/admin/_shell/AdminShell";

export default function AdminShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
