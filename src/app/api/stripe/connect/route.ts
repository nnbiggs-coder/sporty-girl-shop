import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConnectAccount, createConnectOnboardingLink } from "@/lib/stripe";
import { appConfig } from "@/lib/config";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    let accountId = profile.stripe_connect_account_id;

    if (!accountId) {
      accountId = await createConnectAccount(profile.email);
      await supabase
        .from("profiles")
        .update({ stripe_connect_account_id: accountId })
        .eq("id", user.id);
    }

    const url = await createConnectOnboardingLink(
      accountId,
      `${appConfig.url}/dashboard?connect=success`,
      `${appConfig.url}/dashboard?connect=refresh`
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[stripe-connect]", err);
    return NextResponse.json(
      { error: "Stripe Connect not configured. See SETUP.md." },
      { status: 503 }
    );
  }
}
