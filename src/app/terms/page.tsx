import { AppLayout } from "@/components/layout/AppLayout";
import { appConfig } from "@/lib/config";

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 prose prose-sm">
        <h1 className="text-2xl font-semibold text-text">Terms of Service</h1>
        <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
          [PLACEHOLDER] This document must be replaced with lawyer-drafted Terms of Service before real transactions.
        </p>
        <div className="mt-8 space-y-4 text-sm text-text-muted">
          <p>
            These Terms of Service govern your use of {appConfig.name}. By using this platform,
            you agree to these terms.
          </p>
          <h2 className="text-lg font-semibold text-text">Seller Responsibilities</h2>
          <p>
            Sellers are responsible for accurately describing items, providing required photos,
            completing safety disclosures for applicable categories, and shipping sold items promptly.
          </p>
          <h2 className="text-lg font-semibold text-text">Condition & Authenticity Disclaimer</h2>
          <p>
            AI-generated condition scorecards are cosmetic/visible-wear assessments only. They do not
            constitute safety inspections, structural integrity certifications, or authenticity
            verification. {appConfig.name} makes no warranties regarding item safety or authenticity.
          </p>
          <h2 className="text-lg font-semibold text-text">Fees</h2>
          <p>
            Platform fees vary by category tier. Payment processing fees are passed through to buyers
            at checkout. See listing details for applicable fee rates.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
