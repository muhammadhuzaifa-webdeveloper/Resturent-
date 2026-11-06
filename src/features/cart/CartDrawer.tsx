import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCartStore } from './cartStore';
import { formatPKR } from '@/lib/formatPKR';
import { ConfirmDialog } from '@/components/confirm-dialog/ConfirmDialog';

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    isOpen,
    setOpen,
    fetchCart,
    updateQuantity,
    removeItem,
    pendingDifferentRestaurantItem,
    confirmResetAndAdd,
    cancelDifferentRestaurantModal,
    getSubtotalPaisa,
    getDeliveryFeePaisa,
    getTotalPaisa,
  } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const subtotalPaisa = getSubtotalPaisa();
  const deliveryFeePaisa = getDeliveryFeePaisa();
  const totalPaisa = getTotalPaisa();
  const items = cart?.items || [];

  const handleCheckout = () => {
    setOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b text-left">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Your Food Cart
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {cart?.restaurant?.name || 'Review your selected items'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h4 className="text-base font-semibold">Your cart is empty</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Browse through restaurants and add delicious meals to your basket.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    navigate('/restaurants');
                  }}
                >
                  Explore Restaurants
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {items.map((line) => {
                  const unitPrice =
                    line.menuItem?.discountPricePaisa || line.menuItem?.pricePaisa || 0;
                  const lineTotal = unitPrice * line.quantity;

                  return (
                    <div
                      key={line.menuItemId}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {line.menuItem?.name || 'Menu Item'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{formatPKR(unitPrice)} each</span>
                          {line.menuItem?.discountPricePaisa && (
                            <span className="line-through text-muted-foreground/60">
                              {formatPKR(line.menuItem.pricePaisa)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-primary mt-1">
                          {formatPKR(lineTotal)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                          <button
                            type="button"
                            onClick={() => {
                              if (line.quantity > 1) {
                                updateQuantity(line.menuItemId, line.quantity - 1);
                              } else {
                                removeItem(line.menuItemId);
                              }
                            }}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold min-w-[24px] text-center">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.menuItemId, Math.min(line.quantity + 1, 99))}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(line.menuItemId)}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-5 border-t bg-muted/20 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPKR(subtotalPaisa)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Estimated Delivery Fee</span>
                  <span>{formatPKR(deliveryFeePaisa)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t">
                  <span>Total Amount</span>
                  <span className="text-primary text-base font-extrabold">
                    {formatPKR(totalPaisa)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full font-semibold h-11"
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restaurant Mismatch Confirmation Dialog */}
      <ConfirmDialog
        open={!!pendingDifferentRestaurantItem}
        onOpenChange={(open) => !open && cancelDifferentRestaurantModal()}
        title="Start a new order?"
        description={`Your cart currently contains food from another restaurant. Adding this item from "${pendingDifferentRestaurantItem?.restaurant.name}" will clear your existing cart items.`}
        confirmText="Clear Cart & Add Item"
        cancelText="Keep Current Cart"
        variant="destructive"
        onConfirm={confirmResetAndAdd}
      />
    </>
  );
}
