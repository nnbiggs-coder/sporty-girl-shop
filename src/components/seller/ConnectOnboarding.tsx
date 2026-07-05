"use client";

import { Button } from "@/components/ui/Button";

interface ConnectOnboardingProps {
  onboarded: boolean;
}

export function ConnectOnboarding({ onboarded }: ConnectOnboardingProps) {
  async function startOnboarding() {
    const res = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Failed to start onboarding");
    }
  }

  if (onboarded) return null;

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
      <p className="font-medium text-brand-900">Set up payouts</p>
      <p className="mt-1 text-sm text-brand-700">
        Connect your bank account via Stripe to receive payouts when your items sell.
      </p>
      <Button className="mt-3" size="sm" onClick={startOnboarding}>
        Connect Stripe Account
      </Button>
    </div>
  );
}
