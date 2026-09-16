import Link from "next/link";
import { eq } from "drizzle-orm";
import { HeartHandshake } from "lucide-react";
import { db } from "@/db";
import { charities as charitiesTable } from "@/db/schema";
import { getSettings } from "@/lib/core";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "@/components/public-forms";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign up", description: "Create your Digital Heroes account. Pick a charity, choose a plan, log five Stableford scores and enter the monthly prize draw." };
export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const s = await getSettings();
  const charities = await db
    .select({ id: charitiesTable.id, name: charitiesTable.name })
    .from(charitiesTable)
    .where(eq(charitiesTable.isActive, true));

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      {/* Art side */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/images/hero-aurora.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/30 to-bg" />
        <div className="absolute bottom-16 left-12 max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">
            Your handicap could
            <br />
            fund a miracle.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-mute">
            Choose a charity, pledge at least {s.minCharityPercent}%, log five scores.
            That&apos;s all it takes to play with purpose.
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

          <h1 className="font-display text-3xl font-semibold tracking-tight">Become a Hero</h1>
          <p className="mt-2 text-sm text-mute">
            Create your account — then activate your membership to enter the draw.
          </p>

          <div className="mt-8">
            <SignupForm
              charities={charities}
              minPercent={s.minCharityPercent}
              plan={plan === "yearly" ? "yearly" : plan === "monthly" ? "monthly" : undefined}
            />
          </div>

          <p className="mt-8 text-center text-sm text-mute">
            Already a member?{" "}
            <Link href="/login" className="font-semibold text-volt hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
