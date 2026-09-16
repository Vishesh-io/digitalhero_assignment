import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { LoginForm } from "@/components/public-forms";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Log in", description: "Sign in to your Digital Heroes account to manage scores, track winnings and support your chosen charity." };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next || "/dashboard");

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      {/* Art side */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/images/hero-aurora.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/30 to-bg" />
        <div className="absolute bottom-16 left-12 max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">
            Welcome back,
            <br />
            hero.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            Your scores, your charity and the next draw are waiting on your dashboard.
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="noise relative flex items-center justify-center px-4 py-16 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-volt text-bg">
              <HeartHandshake className="size-5" strokeWidth={2.4} />
            </span>
            <span className="font-display text-xl font-semibold">
              Digital<span className="text-volt">Heroes</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-2 text-sm text-mute">Access your dashboard, scores and winnings.</p>

          <div className="mt-8">
            <LoginForm next={next} />
          </div>

          <p className="mt-8 text-center text-sm text-mute">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-volt hover:underline">
              Become a Hero
            </Link>
          </p>

          <div className="card mt-8 p-4 text-xs leading-relaxed text-mute">
            <p className="font-semibold text-ink">Demo logins</p>
            <p className="mt-1">Admin — admin@digitalheroes.club / Admin1234!</p>
            <p>Member — james@example.com / Demo1234!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
