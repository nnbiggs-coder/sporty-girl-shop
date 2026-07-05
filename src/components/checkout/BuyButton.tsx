"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface BuyButtonProps {
  listingId: string;
  price: number;
}

export function BuyButton({ listingId, price }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Checkout failed");
        setLoading(false);
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      alert("Checkout failed");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleBuy} disabled={loading} size="lg">
      {loading ? "Processing..." : `Buy Now — $${price.toFixed(2)}`}
    </Button>
  );
}
