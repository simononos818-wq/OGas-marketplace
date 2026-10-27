export type SellerBadgeTier = 'VERIFIED' | 'TRUSTED' | 'ELITE';

export const BADGE_THRESHOLDS = {
  trusted: 25,
  elite: 100,
} as const;

export function sellerIsApproved(data: Record<string, any> | null | undefined): boolean {
  return Boolean(data?.isApproved || data?.verified || data?.isVerified || data?.status === 'approved');
}

export function getSellerBadge(
  data: Record<string, any> | null | undefined,
  completedOrders = 0,
): { tier: SellerBadgeTier; completedOrders: number; nextTier?: SellerBadgeTier; ordersToNext?: number } | null {
  if (!sellerIsApproved(data)) return null;

  const completed = Math.max(0, Math.floor(Number(completedOrders) || 0));
  if (completed >= BADGE_THRESHOLDS.elite) return { tier: 'ELITE', completedOrders: completed };
  if (completed >= BADGE_THRESHOLDS.trusted) {
    return {
      tier: 'TRUSTED',
      completedOrders: completed,
      nextTier: 'ELITE',
      ordersToNext: BADGE_THRESHOLDS.elite - completed,
    };
  }
  return {
    tier: 'VERIFIED',
    completedOrders: completed,
    nextTier: 'TRUSTED',
    ordersToNext: BADGE_THRESHOLDS.trusted - completed,
  };
}
