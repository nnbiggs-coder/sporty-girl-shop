import { AppLayout } from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/isAdmin";
import { getMetricsSummary } from "@/lib/analytics/trackEvent";
import { formatPrice } from "@/lib/utils";
import { AdminListingActions } from "@/components/admin/AdminListingActions";
import { AdminTransactionActions } from "@/components/admin/AdminTransactionActions";
import type { ConditionTier } from "@/lib/config";
import { ConditionBadge } from "@/components/ui/ConditionBadge";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin({ email: user.email ?? "" })) {
    redirect("/");
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("*, category:categories(*), seller:profiles(name, email)")
    .order("created_at", { ascending: false });

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, listing:listings(title), buyer:profiles!transactions_buyer_id_fkey(email), seller:profiles!transactions_seller_id_fkey(email)")
    .order("created_at", { ascending: false });

  const metrics = await getMetricsSummary();

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">Admin</h1>
        <p className="mt-1 text-sm text-text-muted">Founder view — all listings, transactions, and metrics</p>

        {metrics && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-text">Success Metrics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="Repeat Seller Rate" value={`${(metrics.repeatSellerRate * 100).toFixed(1)}%`} />
              <MetricCard label="Sell-Through Rate" value={`${(metrics.sellThroughRate * 100).toFixed(1)}%`} />
              <MetricCard label="Dispute Rate" value={`${(metrics.disputeRate * 100).toFixed(1)}%`} />
              <MetricCard label="Organic Growth" value={`${(metrics.organicGrowthRatio * 100).toFixed(1)}%`} />
              <MetricCard
                label="Published / Sold"
                value={`${metrics.rawCounts.published} / ${metrics.rawCounts.sold}`}
              />
            </div>
            {Object.keys(metrics.contributionMarginByTier).length > 0 && (
              <div className="mt-4 rounded-xl border border-border p-4">
                <p className="text-sm font-medium text-text">Contribution Margin by Fee Tier</p>
                <dl className="mt-2 space-y-1 text-sm">
                  {Object.entries(metrics.contributionMarginByTier).map(([tier, data]) => (
                    <div key={tier} className="flex justify-between">
                      <dt className="text-text-muted capitalize">{tier}</dt>
                      <dd className="text-text">{formatPrice(data.revenue)} ({data.count} sales)</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text">All Listings</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Seller</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Condition</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Price</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(listings ?? []).map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-4 py-3">{listing.title}</td>
                    <td className="px-4 py-3 text-text-muted">{(listing.seller as { email: string })?.email}</td>
                    <td className="px-4 py-3 capitalize">{listing.status}</td>
                    <td className="px-4 py-3">
                      {listing.condition_tier && (
                        <ConditionBadge tier={listing.condition_tier as ConditionTier} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{formatPrice(listing.price)}</td>
                    <td className="px-4 py-3">
                      <AdminListingActions listingId={listing.id} currentStatus={listing.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text">All Transactions</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Item</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Buyer</th>
                  <th className="px-4 py-3 text-right font-medium text-text-muted">Sale</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Dispute</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(transactions ?? []).map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3">{(tx.listing as { title: string })?.title}</td>
                    <td className="px-4 py-3 text-text-muted">{(tx.buyer as { email: string })?.email}</td>
                    <td className="px-4 py-3 text-right">{formatPrice(tx.sale_price)}</td>
                    <td className="px-4 py-3 capitalize">{tx.status}</td>
                    <td className="px-4 py-3 capitalize">{tx.dispute_status}</td>
                    <td className="px-4 py-3">
                      <AdminTransactionActions
                        transactionId={tx.id}
                        currentDisputeStatus={tx.dispute_status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-text">{value}</p>
    </div>
  );
}
