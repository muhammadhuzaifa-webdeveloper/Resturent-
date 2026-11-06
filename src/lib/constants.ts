export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'client' | 'admin';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'rejected',
];

export const PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    icon: string;
  }
> = {
  pending: {
    label: 'Pending',
    description: 'Order placed, awaiting confirmation by restaurant staff',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    icon: 'Clock',
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Order confirmed by restaurant',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    icon: 'CheckCircle2',
  },
  preparing: {
    label: 'Preparing',
    description: 'Kitchen is preparing food items',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    icon: 'ChefHat',
  },
  ready: {
    label: 'Ready for Pickup',
    description: 'Food is packaged and ready for delivery agent',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    icon: 'PackageCheck',
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    description: 'Rider is on the way to the delivery address',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    icon: 'Bike',
  },
  delivered: {
    label: 'Delivered',
    description: 'Order successfully delivered to customer',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: 'CheckCheck',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order cancelled by customer or admin',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700',
    icon: 'XCircle',
  },
  rejected: {
    label: 'Rejected',
    description: 'Order rejected by restaurant',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    icon: 'Ban',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  {
    label: string;
    badgeClass: string;
  }
> = {
  pending: {
    label: 'Unpaid (COD)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  },
  paid: {
    label: 'Paid (Cash)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  },
  failed: {
    label: 'Payment Failed',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  },
  refunded: {
    label: 'Refunded',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  },
};

/**
 * Strict workflow transitions:
 * pending -> confirmed | rejected
 * confirmed -> preparing | cancelled
 * preparing -> ready
 * ready -> out_for_delivery
 * out_for_delivery -> delivered
 * Final states (delivered, cancelled, rejected) are locked.
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export const TRANSITION_DESCRIPTIONS: Record<string, string> = {
  'pending->confirmed': 'Confirm order and send to kitchen',
  'pending->rejected': 'Reject order (requires reason)',
  'confirmed->preparing': 'Start kitchen preparation',
  'confirmed->cancelled': 'Cancel order (requires reason)',
  'preparing->ready': 'Mark ready for rider pickup',
  'ready->out_for_delivery': 'Hand over to rider for delivery',
  'out_for_delivery->delivered': 'Mark order as delivered to customer',
};

export const DAYS_OF_WEEK = [
  { day: 0, label: 'Sunday' },
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
];
