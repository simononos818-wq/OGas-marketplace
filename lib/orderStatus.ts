export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'disputed'],
  delivered: ['completed', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['completed', 'cancelled'],
};

export function canTransition(
  current: OrderStatus,
  next: OrderStatus,
  role: 'buyer' | 'seller' | 'admin'
): boolean {
  if (role === 'admin') return true;
  if (!ORDER_FLOW[current]?.includes(next)) return false;

  if (role === 'buyer') {
    return ['cancelled', 'completed', 'disputed'].includes(next);
  }
  if (role === 'seller') {
    return ['accepted', 'out_for_delivery', 'delivered'].includes(next);
  }
  return false;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};
