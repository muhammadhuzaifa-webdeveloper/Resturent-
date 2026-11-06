import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  Receipt,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ordersApi } from '@/api/endpoints';
import { OrderStatusBadge } from '@/components/status-badge/StatusBadge';
import { formatPKR } from '@/lib/formatPKR';
import { formatDateTime } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import type { OrderStatus } from '@/lib/constants';

export default function MyOrdersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.listMyOrders(),
  });

  const orders = data?.data || [];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') {
      return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.orderStatus);
    }
    if (activeTab === 'completed') {
      return ['delivered', 'cancelled', 'rejected'].includes(o.orderStatus);
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track active food deliveries and review past order history
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'active'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'completed'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Could not load orders"
          description="We had trouble retrieving your orders. Please refresh the page."
          actionText="Retry"
          onAction={() => window.location.reload()}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No orders found"
          description={
            activeTab === 'all'
              ? 'You have not placed any orders yet. Discover fantastic local restaurants and start eating!'
              : 'There are no orders matching this filter.'
          }
          actionText="Browse Restaurants"
          onAction={() => window.location.assign('/restaurants')}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/40 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-base font-extrabold text-primary">
                    {formatPKR(order.totalPaisa)}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Cash on Delivery
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    {order.restaurantName || 'Restaurant'}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                </div>

                <Button size="sm" asChild variant="outline" className="rounded-xl shrink-0">
                  <Link to={`/orders/${order.id}`}>
                    Track & Details
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
