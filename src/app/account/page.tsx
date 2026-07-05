import { AppLayout } from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">Account</h1>

        <dl className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-6 text-sm">
          <div>
            <dt className="text-text-muted">Name</dt>
            <dd className="mt-1 font-medium text-text">{profile?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Email</dt>
            <dd className="mt-1 font-medium text-text">{user.email}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Role</dt>
            <dd className="mt-1 capitalize text-text">{profile?.role ?? "both"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">ToS Accepted</dt>
            <dd className="mt-1 text-text">
              {profile?.tos_accepted_at
                ? `${new Date(profile.tos_accepted_at).toLocaleDateString()} (v${profile.tos_version})`
                : "Not yet accepted"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/dashboard"><Button variant="outline" className="w-full">Seller Dashboard</Button></Link>
          <Link href="/watchlist"><Button variant="outline" className="w-full">Watchlist</Button></Link>
          {!profile?.tos_accepted_at && (
            <Link href="/accept-tos"><Button className="w-full">Accept Seller Terms</Button></Link>
          )}
          <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full">Sign Out</Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
