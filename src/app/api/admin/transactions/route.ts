import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/isAdmin";
import { trackEvent } from "@/lib/analytics/trackEvent";
import type { DisputeStatus } from "@/types";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin({ email: user.email ?? "" })) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { transactionId, dispute_status } = await request.json() as {
    transactionId: string;
    dispute_status: DisputeStatus;
  };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("transactions")
    .update({ dispute_status })
    .eq("id", transactionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (dispute_status === "flagged") {
    await trackEvent({
      eventType: "dispute_flagged",
      metadata: { transaction_id: transactionId },
    });
  }

  return NextResponse.json({ ok: true });
}
