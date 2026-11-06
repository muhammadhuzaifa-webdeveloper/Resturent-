import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  FileText,
  Banknote,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { checkoutFormSchema, type CheckoutFormValues } from '@/api/schemas';
import { useCartStore } from '@/features/cart/cartStore';
import { useAuthStore } from '@/features/auth/authStore';
import { ordersApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    cart,
    getSubtotalPaisa,
    getDeliveryFeePaisa,
    getTotalPaisa,
    clearCart,
  } = useCartStore();

  const [serverError, setServerError] = useState<string | null>(null);

  const subtotalPaisa = getSubtotalPaisa();
  const deliveryFeePaisa = getDeliveryFeePaisa();
  const totalPaisa = getTotalPaisa();
  const items = cart?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      line1: 'Plot 42, Block 4, Clifton',
      line2: '',
      city: 'Karachi',
      postalCode: '75600',
      country: 'Pakistan',
      phone: user?.phone || '+92 301 5551234',
      notes: '',
    },
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-md py-16 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-sm text-muted-foreground">
          Please select food items from a restaurant before heading to checkout.
        </p>
        <Button asChild>
          <Link to="/restaurants">Browse Restaurants</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!cart?.restaurantId) return;

    setServerError(null);
    try {
      const orderData = {
        restaurantId: cart.restaurantId,
        items: items.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
        })),
        deliveryAddress: {
          line1: values.line1,
          line2: values.line2 || undefined,
          city: values.city,
          postalCode: values.postalCode || undefined,
          country: values.country,
        },
        phone: values.phone,
        notes: values.notes || undefined,
      };

      const res = await ordersApi.create(orderData);
      const createdOrder = res.data;

      // Clear the cart
      await clearCart();

      toast.success('Order placed successfully!');
      navigate(`/orders/${createdOrder.id}/success`, { replace: true });
    } catch {
      setServerError('Failed to submit order. Please check your network and try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link to={`/restaurants/${cart?.restaurantId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Restaurant
          </Link>
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Complete Your Order
        </h1>
        <p className="text-sm text-muted-foreground">
          Ordering from{' '}
          <strong className="text-foreground">{cart?.restaurant?.name || 'Restaurant'}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Delivery Address & Details */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Address
              </CardTitle>
              <CardDescription>
                Provide the exact address where the rider should deliver your food
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2.5 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="line1">Street Address / House / Flat No.</Label>
                  <Input
                    id="line1"
                    placeholder="e.g. House 14, Street 7, Block 4"
                    {...register('line1')}
                    error={!!errors.line1}
                  />
                  {errors.line1 && (
                    <p className="text-xs text-destructive">{errors.line1.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="line2">Apartment, Suite, Landmark (Optional)</Label>
                  <Input
                    id="line2"
                    placeholder="e.g. Near Tooba Mosque"
                    {...register('line2')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Karachi"
                      {...register('city')}
                      error={!!errors.city}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="e.g. 75500"
                      {...register('postalCode')}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Contact Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+92 300 1234567"
                    {...register('phone')}
                    error={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    The rider will call this number upon arriving at your address.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Delivery / Kitchen Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g. Please ring bell twice, send extra chili sauce"
                    {...register('notes')}
                    rows={2}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Payment Method Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    COD
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Cash on Delivery (COD)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Pay the exact amount in PKR to the rider upon delivery.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Default
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="sticky top-24">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Order Summary</CardTitle>
              <CardDescription>
                {items.length} item(s) from {cart?.restaurant?.name}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Items List */}
              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1">
                {items.map((line) => {
                  const unitPrice =
                    line.menuItem?.discountPricePaisa || line.menuItem?.pricePaisa || 0;
                  const lineTotal = unitPrice * line.quantity;

                  return (
                    <div
                      key={line.menuItemId}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-semibold text-foreground truncate">
                          {line.quantity}x {line.menuItem?.name || 'Item'}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {formatPKR(unitPrice)} each
                        </p>
                      </div>
                      <span className="font-bold text-foreground">
                        {formatPKR(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-3 border-t text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPKR(subtotalPaisa)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{formatPKR(deliveryFeePaisa)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-foreground pt-2 border-t">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatPKR(totalPaisa)}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full h-11 font-bold text-base shadow-md"
              >
                {isSubmitting ? 'Placing Order...' : `Place Order (${formatPKR(totalPaisa)})`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
