import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  CheckCheck,
  XCircle,
  Ban,
  ArrowLeft,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ordersApi } from '@/api/endpoints';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/status-badge/StatusBadge';
import { ConfirmDialog } from '@/components/confirm-dialog/ConfirmDialog';
import { formatPKR } from '@/lib/formatPKR';
import { formatDateTime } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { toast } from 'sonner';
import type { OrderStatus } from '@/lib/constants';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
    refetchInterval: 10000, // Poll every 10 seconds for live order status updates
  });

  const order = data?.data;

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => ordersApi.cancel(id!, reason),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setCancelModalOpen(false);
    },
    onError: () => {
      toast.error('Unable to cancel order. It might already be in kitchen preparation.');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 max-w-md py-16 text-center">
        <EmptyState
          title="Order not found"
          description="We could not find details for this order number."
          actionText="Back to My Orders"
          onAction={() => window.location.assign('/orders')}
        />
      </div>
    );
  }

  // Stepper milestones
  const steps: Array<{ status: OrderStatus; label: string; icon: React.ElementType }> = [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { status: 'preparing', label: 'Preparing', icon: ChefHat },
    { status: 'ready', label: 'Ready', icon: PackageCheck },
    { status: 'out_for_delivery', label: 'On the Way', icon: Bike },
    { status: 'delivered', label: 'Delivered', icon: CheckCheck },
  ];

  const currentStepIndex = steps.findIndex((s) => s.status === order.orderStatus);
  const isFailed = order.orderStatus === 'cancelled' || order.orderStatus === 'rejected';

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 space-y-8">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link to="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>

        {order.orderStatus === 'pending' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelModalOpen(true)}
          >
            Cancel Order
          </Button>
        )}
      </div>

      {/* Header Info Banner */}
      <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black font-mono tracking-tight text-foreground">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              Placed on {formatDateTime(order.createdAt)} • {order.restaurantName}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xl font-extrabold text-primary">
              {formatPKR(order.totalPaisa)}
            </span>
            <p className="text-[11px] text-muted-foreground">Payment: Cash on Delivery</p>
          </div>
        </div>

        {/* Live Status Stepper */}
        {!isFailed ? (
          <div className="pt-6 pb-2">
            <div className="relative flex items-center justify-between">
              {/* Background Connecting Line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-muted z-0" />
              {/* Active Connecting Line */}
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500"
                style={{
                  width: `${
                    currentStepIndex >= 0
                      ? (currentStepIndex / (steps.length - 1)) * 100
                      : 0
                  }%`,
                }}
              />

              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                          : isPassed
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                        isPassed ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
            {order.orderStatus === 'cancelled' ? (
              <XCircle className="h-6 w-6 shrink-0" />
            ) : (
              <Ban className="h-6 w-6 shrink-0" />
            )}
            <div className="text-xs">
              <p className="font-bold text-sm">
                Order {order.orderStatus === 'cancelled' ? 'Cancelled' : 'Rejected'}
              </p>
              <p className="mt-0.5">
                {order.statusHistory[order.statusHistory.length - 1]?.reason ||
                  'This order is closed and will not be prepared.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Items breakdown */}
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Ordered Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-border/60">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      {formatPKR(item.unitPricePaisa)} each
                    </p>
                  </div>
                  <span className="font-bold text-foreground">
                    {formatPKR(item.lineSubtotalPaisa)}
                  </span>
                </div>
              ))}

              <div className="pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPKR(order.subtotalPaisa)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{formatPKR(order.deliveryFeePaisa)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatPKR(order.totalPaisa)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground">Address:</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {order.deliveryAddress.line1}
                  {order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}
                </p>
                <p className="text-muted-foreground">
                  {order.deliveryAddress.city}, {order.deliveryAddress.country}
                </p>
              </div>

              <div className="pt-2 border-t flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>Contact Phone: {order.phone}</span>
              </div>

              {order.notes && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">Kitchen / Rider Notes:</span>
                  <p className="italic text-foreground mt-0.5">"{order.notes}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Status Timeline */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Status Timeline
              </CardTitle>
              <CardDescription className="text-xs">
                Live audit trail of order events
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                {order.statusHistory.map((hist, i) => (
                  <div key={i} className="relative text-xs space-y-1">
                    <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground uppercase tracking-wide">
                        {hist.to.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateTime(hist.at)}
                      </span>
                    </div>
                    {hist.reason && (
                      <p className="text-[11px] text-muted-foreground bg-muted/60 p-1.5 rounded">
                        "{hist.reason}"
                      </p>
                    )}
                    {hist.actorName && (
                      <p className="text-[10px] text-muted-foreground">
                        By {hist.actorName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Cancel this order?"
        description="Are you sure you want to cancel your order? This action cannot be reversed."
        confirmText="Confirm Cancellation"
        cancelText="Keep Order"
        variant="destructive"
        requireReason={true}
        reasonPlaceholder="e.g. Changed my mind, ordered by mistake"
        reasonLabel="Reason for cancellation (Required)"
        isLoading={cancelMutation.isPending}
        onConfirm={(reason) => cancelMutation.mutate(reason || 'Customer requested')}
      />
    </div>
  );
}
