"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import type { DisputeStatus } from "@/types";

interface AdminTransactionActionsProps {
  transactionId: string;
  currentDisputeStatus: DisputeStatus;
}

export function AdminTransactionActions({
  transactionId,
  currentDisputeStatus,
}: AdminTransactionActionsProps) {
  const router = useRouter();

  async function setDisputeStatus(dispute_status: DisputeStatus) {
    const res = await fetch("/api/admin/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, dispute_status }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex gap-1">
      {currentDisputeStatus === "none" && (
        <Button size="sm" variant="ghost" onClick={() => setDisputeStatus("flagged")}>
          Flag Dispute
        </Button>
      )}
      {currentDisputeStatus === "flagged" && (
        <Button size="sm" variant="ghost" onClick={() => setDisputeStatus("resolved")}>
          Resolve
        </Button>
      )}
    </div>
  );
}
