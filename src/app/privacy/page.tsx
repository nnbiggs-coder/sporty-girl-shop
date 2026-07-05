import { AppLayout } from "@/components/layout/AppLayout";
import { appConfig } from "@/lib/config";

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">Privacy Policy</h1>
        <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
          [PLACEHOLDER] This document must be replaced with lawyer-drafted Privacy Policy before launch.
        </p>
        <div className="mt-8 space-y-4 text-sm text-text-muted">
          <p>
            {appConfig.name} collects account information (name, email), listing data, transaction
            history, and usage analytics to operate the marketplace.
          </p>
          <p>
            Payment data is processed by Stripe and is not stored on our servers. Images are stored
            in Supabase Storage. Email notifications are sent via Resend.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
