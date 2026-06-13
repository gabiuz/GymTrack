import { Navbar, Footer } from "@/components/shared";
import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <div className="w-full flex-grow flex flex-col items-center justify-start bg-gym-gray-bg">
      <div className="w-full max-w-[768px] min-h-screen flex flex-col bg-white shadow-xl border-x border-[#e2e7f0]">
        <Navbar />
        <main className="flex flex-col flex-grow">
          <LoginForm />
        </main>
        <Footer />
      </div>
    </div>
  );
}
