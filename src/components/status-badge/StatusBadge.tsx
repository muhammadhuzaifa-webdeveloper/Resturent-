import React from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  CheckCheck,
  XCircle,
  Ban,
  HelpCircle,
} from 'lucide-react';
import {
  type OrderStatus,
  type PaymentStatus,
  type ApprovalStatus,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
  showIcon?: boolean;
}

export function OrderStatusBadge({
  status,
  className,
  showIcon = true,
}: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status,
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300',
    icon: 'HelpCircle',
  };

  const renderIcon = () => {
    const iconClass = 'w-3.5 h-3.5 mr-1.5 shrink-0';
    switch (status) {
      case 'pending':
        return <Clock className={iconClass} aria-hidden="true" />;
      case 'confirmed':
        return <CheckCircle2 className={iconClass} aria-hidden="true" />;
      case 'preparing':
        return <ChefHat className={iconClass} aria-hidden="true" />;
      case 'ready':
        return <PackageCheck className={iconClass} aria-hidden="true" />;
      case 'out_for_delivery':
        return <Bike className={iconClass} aria-hidden="true" />;
      case 'delivered':
        return <CheckCheck className={iconClass} aria-hidden="true" />;
      case 'cancelled':
        return <XCircle className={iconClass} aria-hidden="true" />;
      case 'rejected':
        return <Ban className={iconClass} aria-hidden="true" />;
      default:
        return <HelpCircle className={iconClass} aria-hidden="true" />;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none',
        config.badgeClass,
        className
      )}
      role="status"
      aria-label={`Order status: ${config.label}`}
    >
      {showIcon && renderIcon()}
      <span>{config.label}</span>
    </span>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const config = PAYMENT_STATUS_CONFIG[status] || {
    label: status,
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border select-none',
        config.badgeClass,
        className
      )}
      role="status"
      aria-label={`Payment status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  className?: string;
}

export function ApprovalStatusBadge({
  status,
  className,
}: ApprovalStatusBadgeProps) {
  const badges: Record<ApprovalStatus, { label: string; cls: string }> = {
    pending: {
      label: 'Pending Approval',
      cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    },
    approved: {
      label: 'Approved Admin',
      cls: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    rejected: {
      label: 'Rejected',
      cls: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    },
  };

  const item = badges[status] || { label: status, cls: 'bg-zinc-100 text-zinc-800 border-zinc-300' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none',
        item.cls,
        className
      )}
      role="status"
    >
      {item.label}
    </span>
  );
}
