import { Navbar, Footer } from "@/components/shared";
import { MembershipStatusForm } from "@/features/membership";

export default function MembershipPage() {
  return (
    <div className="w-full flex-grow flex flex-col items-center justify-start bg-gym-gray-bg">
      <div className="w-full max-w-[768px] min-h-screen flex flex-col bg-white shadow-xl border-x border-[#e2e7f0]">
        <Navbar />
        <main className="flex flex-col flex-grow">
          <MembershipStatusForm />
        </main>
        <Footer />
      </div>
    </div>
  );
}
