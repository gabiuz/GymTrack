import { OwnerShell } from "@/features/owner/_shell/OwnerShell";

export default function OwnerShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OwnerShell>{children}</OwnerShell>;
}
