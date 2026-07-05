"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { appConfig } from "@/lib/config";

export default function TosAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/sell";
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkTos() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/accept-tos?redirect=${redirect}`);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("tos_accepted_at, tos_version")
        .eq("id", user.id)
        .single();
      if (profile?.tos_accepted_at) {
        router.push(redirect);
      }
    }
    checkTos();
  }, [supabase, router, redirect]);

  async function handleAccept() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tosVersion = appConfig.tosVersion;

    await supabase.from("tos_acceptances").insert({
      user_id: user.id,
      tos_version: tosVersion,
    });

    await supabase.from("profiles").update({
      tos_accepted_at: new Date().toISOString(),
      tos_version: tosVersion,
    }).eq("id", user.id);

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "tos_accepted", userId: user.id }),
    });

    router.push(redirect);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-text">Seller Terms & Disclosures</h1>
      <p className="mt-2 text-sm text-text-muted">
        Before listing items on {appConfig.name}, you must review and accept our terms.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6 space-y-4 text-sm text-text-muted max-h-96 overflow-y-auto">
        <h2 className="font-semibold text-text">Terms of Service (Placeholder)</h2>
        <p>
          [PLACEHOLDER — This text must be replaced with lawyer-drafted Terms of Service
          before real transactions occur.]
        </p>
        <p>
          By listing items on this platform, you agree to sell items in the condition
          described, ship promptly upon sale, and comply with all applicable laws.
        </p>

        <h2 className="font-semibold text-text pt-4">Condition & Authenticity Disclaimer</h2>
        <p>
          [PLACEHOLDER — Lawyer-drafted disclaimer required before launch.]
        </p>
        <p>
          The AI condition scorecard is a cosmetic/visible-wear assessment only. It does
          NOT constitute a safety inspection, structural integrity certification, or
          authenticity verification. You, the seller, are solely responsible for
          accurately representing your item&apos;s condition and disclosing any safety-relevant
          history for applicable categories.
        </p>

        <h2 className="font-semibold text-text pt-4">Seller Responsibilities</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate photos following the required template</li>
          <li>Complete safety disclosure checklists for applicable categories</li>
          <li>Ship items within 3 business days of sale</li>
          <li>Respond to buyer inquiries promptly</li>
        </ul>
      </div>

      <label className="mt-6 flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-text">
          I have read and accept the Terms of Service, condition/authenticity disclaimer,
          and seller responsibilities. (Version {appConfig.tosVersion})
        </span>
      </label>

      <Button
        className="mt-6"
        disabled={!accepted || loading}
        onClick={handleAccept}
      >
        {loading ? "Accepting..." : "Accept & Continue"}
      </Button>
    </div>
  );
}
