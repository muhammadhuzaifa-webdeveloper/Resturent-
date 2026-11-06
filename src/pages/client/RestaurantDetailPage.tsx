import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Clock,
  Phone,
  Bike,
  Plus,
  Minus,
  Check,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { restaurantsApi, categoriesApi, menuApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { isRestaurantOpen } from '@/lib/date';
import { useCartStore } from '@/features/cart/cartStore';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import type { MenuItem } from '@/api/types';

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [steppers, setSteppers] = useState<Record<string, number>>({});

  const { addItem, setOpen: openCartDrawer } = useCartStore();

  const { data: restData, isLoading: loadingRest } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantsApi.getById(id!),
    enabled: !!id,
  });

  const { data: catsData, isLoading: loadingCats } = useQuery({
    queryKey: ['categories', id],
    queryFn: () => categoriesApi.listByRestaurant(id!),
    enabled: !!id,
  });

  const { data: menuData, isLoading: loadingMenu } = useQuery({
    queryKey: ['menu-items', id],
    queryFn: () => menuApi.listByRestaurant(id!),
    enabled: !!id,
  });

  const restaurant = restData?.data;
  const categories = catsData?.data || [];
  const menuItems = menuData?.data || [];

  if (loadingRest) {
    return (
      <div className="container mx-auto px-4 max-w-6xl py-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 max-w-md py-16 text-center">
        <EmptyState
          title="Restaurant not found"
          description="The restaurant you requested could not be located."
          actionText="Back to Restaurants"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const { isOpen, nextTimeText } = isRestaurantOpen(
    restaurant.openingHours,
    restaurant.timeZone
  );

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.categoryId === selectedCategory;
  });

  const getQuantity = (itemId: string) => steppers[itemId] || 1;
  const setQuantity = (itemId: string, q: number) => {
    setSteppers((prev) => ({ ...prev, [itemId]: Math.max(1, Math.min(q, 99)) }));
  };

  const handleAddToCart = (item: MenuItem) => {
    const qty = getQuantity(item.id);
    addItem(item, restaurant, qty);
    setQuantity(item.id, 1);
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl py-6 space-y-8">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link to="/restaurants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Restaurants
          </Link>
        </Button>
      </div>

      {/* Restaurant Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border bg-card shadow-sm">
        <div className="h-56 sm:h-72 w-full relative bg-muted">
          <img
            src={
              restaurant.image?.url ||
              'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={isOpen ? 'default' : 'secondary'}
                className={
                  isOpen
                    ? 'bg-emerald-600 text-white border-0'
                    : 'bg-zinc-800 text-white border-0'
                }
              >
                {isOpen ? 'Open Now' : 'Closed'}
              </Badge>
              <Badge variant="outline" className="text-white border-white/40 bg-black/30 backdrop-blur">
                <Clock className="h-3 w-3 mr-1" />
                {nextTimeText}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-sm">
              {restaurant.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 max-w-2xl line-clamp-2">
              {restaurant.description}
            </p>
          </div>
        </div>

        {/* Info Strip */}
        <div className="p-4 sm:p-6 bg-card flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground border-t">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>
                {restaurant.address.line1}, {restaurant.address.city}
              </span>
            </div>
            {restaurant.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>{restaurant.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Bike className="h-4 w-4 text-primary shrink-0" />
              <span>Delivery Fee: {formatPKR(restaurant.deliveryFeePaisa)}</span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => openCartDrawer(true)}
            className="rounded-xl shadow-sm text-xs font-semibold"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            View Cart
          </Button>
        </div>
      </div>

      {/* Sticky Categories Navigation */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur py-3 border-b -mx-4 px-4 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="rounded-full text-xs shrink-0"
        >
          All Items ({menuItems.length})
        </Button>
        {categories.map((cat) => {
          const count = menuItems.filter((i) => i.categoryId === cat.id).length;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="rounded-full text-xs shrink-0"
            >
              {cat.name} ({count})
            </Button>
          );
        })}
      </div>

      {/* Menu Items List */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {selectedCategory === 'all'
              ? 'Complete Menu'
              : categories.find((c) => c.id === selectedCategory)?.name || 'Menu Section'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Freshly prepared per order with authentic ingredients
          </p>
        </div>

        {loadingMenu || loadingCats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No menu items in this category"
            description="Please choose another category above to view available food items."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {filteredItems.map((item) => {
              const qty = getQuantity(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-card p-4 sm:p-5 flex gap-4 transition-all hover:shadow-md hover:border-primary/40 relative overflow-hidden"
                >
                  {/* Left: Info */}
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-foreground">
                          {item.name}
                        </h3>
                        {!item.isAvailable && (
                          <Badge variant="destructive" className="text-[10px]">
                            Sold Out
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}

                      {/* Ingredients chips */}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.ingredients.slice(0, 4).map((ing, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price and Add Stepper */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        {item.discountPricePaisa ? (
                          <>
                            <span className="text-base font-extrabold text-primary">
                              {formatPKR(item.discountPricePaisa)}
                            </span>
                            <span className="text-xs line-through text-muted-foreground">
                              {formatPKR(item.pricePaisa)}
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-extrabold text-foreground">
                            {formatPKR(item.pricePaisa)}
                          </span>
                        )}
                        {item.preparationTimeMinutes && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            • <Clock className="h-3 w-3" /> {item.preparationTimeMinutes}m
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper & Add button */}
                      {item.isAvailable && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                            <button
                              type="button"
                              onClick={() => setQuantity(item.id, qty - 1)}
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-2 text-xs font-bold min-w-[20px] text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(item.id, qty + 1)}
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(item)}
                            className="h-8 px-3 text-xs font-semibold rounded-lg"
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Item Image */}
                  {item.image?.url && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={item.image.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
