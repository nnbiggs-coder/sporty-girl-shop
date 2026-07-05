import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin/isAdmin";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin({ email: user.email ?? "" })) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { listingId, ...updates } = await request.json();

  const { error } = await supabase
    .from("listings")
    .update(updates)
    .eq("id", listingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
