import { feeConfig } from "@/lib/config";
import type { FeeTier } from "@/types";

export interface FeeBreakdown {
  salePrice: number;
  platformFeePercent: number;
  platformFee: number;
  processingFee: number;
  taxAmount: number;
  buyerTotal: number;
  sellerPayout: number;
}

/**
 * Calculate fee breakdown for checkout.
 * Platform fee comes from category fee_tier lookup (commodity vs niche).
 * Processing fee is passed through to buyer per spec.
 */
export function calculateFees(
  salePrice: number,
  feeTier: FeeTier,
  taxAmount: number = 0
): FeeBreakdown {
  const platformFeePercent =
    feeTier === "niche"
      ? feeConfig.nicheFeePercent
      : feeConfig.commodityFeePercent;

  const platformFee = roundCurrency(salePrice * (platformFeePercent / 100));
  const processingFee = roundCurrency(
    salePrice * (feeConfig.processingFeePercent / 100) + feeConfig.processingFeeFlat
  );
  const buyerTotal = roundCurrency(salePrice + processingFee + taxAmount);
  const sellerPayout = roundCurrency(salePrice - platformFee);

  return {
    salePrice,
    platformFeePercent,
    platformFee,
    processingFee,
    taxAmount,
    buyerTotal,
    sellerPayout,
  };
}

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Look up platform fee percent from fee_tier.
 * Reads from env config — DB fee_config table is the source for category mapping.
 */
export function getPlatformFeePercent(feeTier: FeeTier): number {
  return feeTier === "niche"
    ? feeConfig.nicheFeePercent
    : feeConfig.commodityFeePercent;
}
