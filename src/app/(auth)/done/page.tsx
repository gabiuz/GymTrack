import { Navbar, Footer } from "@/components/shared";
import { DoneForm } from "@/features/auth";

export default function DonePage() {
  return (
    <div className="w-full grow flex flex-col items-center justify-start bg-gym-gray-bg">
      <div className="w-full max-w-3xl min-h-screen flex flex-col bg-white shadow-xl border-x border-[#e2e7f0]">
        <Navbar />
        <main className="flex flex-col grow">
          <DoneForm />
        </main>
        <Footer />
      </div>
    </div>
  );
}
