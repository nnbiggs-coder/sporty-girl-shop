import { AppLayout } from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { ConditionTier } from "@/lib/config";
import { ConnectOnboarding } from "@/components/seller/ConnectOnboarding";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: listings } = await supabase
    .from("listings")
    .select("*, category:categories(*)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const { data: sales } = await supabase
    .from("transactions")
    .select("*, listing:listings(title)")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const { data: purchases } = await supabase
    .from("transactions")
    .select("*, listing:listings(title)")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const totalPayout = (sales ?? [])
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.payout_amount), 0);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">Seller Dashboard</h1>

        {!profile?.stripe_connect_onboarded && (
          <div className="mt-6">
            <ConnectOnboarding onboarded={profile?.stripe_connect_onboarded ?? false} />
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-text-muted">Active Listings</p>
            <p className="mt-1 text-2xl font-bold text-text">
              {(listings ?? []).filter((l) => l.status === "live").length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-text-muted">Items Sold</p>
            <p className="mt-1 text-2xl font-bold text-text">
              {(sales ?? []).filter((t) => t.status === "completed").length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-text-muted">Total Payouts</p>
            <p className="mt-1 text-2xl font-bold text-text">{formatPrice(totalPayout)}</p>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Your Listings</h2>
            <Link href="/sell"><Button size="sm">New Listing</Button></Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Condition</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(listings ?? []).map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-4 py-3">
                      <Link href={`/listings/${listing.id}`} className="hover:text-brand-600">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-text-muted">{listing.status}</td>
                    <td className="px-4 py-3">
                      {listing.condition_tier && (
                        <ConditionBadge tier={listing.condition_tier as ConditionTier} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{formatPrice(listing.price)}</td>
                  </tr>
                ))}
                {(listings ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">No listings yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text">Sales & Payouts</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Item</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Sale</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Payout</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(sales ?? []).map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3">{(tx.listing as { title: string })?.title}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(tx.created_at)}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(tx.sale_price)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPrice(tx.payout_amount)}</td>
                    <td className="px-4 py-3 capitalize text-text-muted">{tx.status}</td>
                  </tr>
                ))}
                {(sales ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">No sales yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {(purchases ?? []).length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-text">Your Purchases</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Item</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-text-muted">Paid</th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(purchases ?? []).map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3">{(tx.listing as { title: string })?.title}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(tx.created_at)}</td>
                      <td className="px-4 py-3 text-right">{formatPrice(tx.sale_price)}</td>
                      <td className="px-4 py-3 capitalize text-text-muted">{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
