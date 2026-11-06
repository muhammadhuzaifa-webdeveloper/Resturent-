import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  Home,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ordersApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  const order = data?.data;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 max-w-lg py-16 text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-lg py-12">
      <Card className="text-center shadow-lg border-emerald-500/30">
        <CardHeader className="space-y-3 pb-4">
          <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-in zoom-in-50">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-foreground">
            Order Confirmed!
          </CardTitle>
          <CardDescription className="text-sm">
            Thank you for ordering with DineFlow. The restaurant has received your order.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-left">
          <div className="p-4 rounded-xl bg-muted/50 border space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground">Order Reference:</span>
              <span className="font-mono font-bold text-foreground text-sm">
                {order?.orderNumber || 'DF-0000'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Restaurant:</span>
              <span className="font-semibold text-foreground">
                {order?.restaurantName || 'Restaurant'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount to Pay (COD):</span>
              <span className="font-bold text-primary text-sm">
                {formatPKR(order?.totalPaisa || 0)}
              </span>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                {order?.deliveryAddress.line1}, {order?.deliveryAddress.city}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 text-primary flex items-center gap-2.5 text-xs">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Estimated preparation & delivery time: 30–45 minutes</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="outline" asChild className="w-full sm:w-auto flex-1">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Homepage
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto flex-1 font-semibold">
            <Link to={`/orders/${order?.id || id}`}>
              <Receipt className="mr-2 h-4 w-4" />
              Track Order Live
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
