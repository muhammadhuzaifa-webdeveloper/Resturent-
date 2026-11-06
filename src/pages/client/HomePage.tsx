import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Bike,
  ShieldCheck,
  Star,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { restaurantsApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { isRestaurantOpen } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: restaurantsData, isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantsApi.list(),
  });

  const restaurants = restaurantsData?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/restaurants');
    }
  };

  const categories = [
    { label: 'All Cuisines', query: '' },
    { label: 'Biryani & Rice', query: 'biryani' },
    { label: 'Shinwari & Karahi', query: 'karahi' },
    { label: 'BBQ & Kebabs', query: 'bbq' },
    { label: 'Gourmet Burgers', query: 'burger' },
    { label: 'Fast Food', query: 'fries' },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pt-12 pb-16 md:pt-20 md:pb-24 border-b">
        <div className="container mx-auto px-4 max-w-5xl text-center space-y-6">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-semibold bg-background border-primary/30 text-primary gap-1.5 inline-flex shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Fastest Delivery in Karachi, Lahore & Islamabad
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
            Order Fresh Meals from Top{' '}
            <span className="text-primary underline decoration-primary/30 underline-offset-8">
              Local Restaurants
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore authentic Pakistani karahis, aromatic dum biryanis, charcoal kebabs, and juicy
            artisan burgers delivered warm to your doorstep.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-xl mx-auto flex items-center gap-2 p-1.5 bg-background rounded-2xl border shadow-lg ring-1 ring-border"
          >
            <div className="relative flex-1 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="Search for restaurants, biryani, burgers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 text-sm h-10"
              />
            </div>
            <Button type="submit" size="sm" className="h-10 px-6 font-semibold rounded-xl">
              Search Food
            </Button>
          </form>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map((cat, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    cat.query
                      ? `/restaurants?search=${encodeURIComponent(cat.query)}`
                      : '/restaurants'
                  )
                }
                className="rounded-full text-xs hover:border-primary hover:text-primary transition-colors bg-background"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured & Open Restaurants Section */}
      <section className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Featured Restaurants
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Hand-picked eateries offering exceptional taste and rapid delivery
            </p>
          </div>
          <Button variant="ghost" asChild className="text-primary hover:text-primary font-semibold">
            <Link to="/restaurants">
              View All Restaurants <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border p-4 space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.slice(0, 3).map((restaurant) => {
              const { isOpen, nextTimeText } = isRestaurantOpen(
                restaurant.openingHours,
                restaurant.timeZone
              );

              return (
                <Link
                  key={restaurant.id}
                  to={`/restaurants/${restaurant.id}`}
                  className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-primary/50 flex flex-col"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={
                        restaurant.image?.url ||
                        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={restaurant.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={isOpen ? 'default' : 'secondary'}
                        className={`text-xs font-semibold shadow-sm ${
                          isOpen
                            ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                            : 'bg-zinc-800/90 text-white'
                        }`}
                      >
                        {isOpen ? 'Open Now' : 'Closed'}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="bg-background/90 backdrop-blur text-xs font-medium border-0">
                        <MapPin className="h-3 w-3 mr-1 text-primary" />
                        {restaurant.address.city}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {restaurant.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Bike className="h-3.5 w-3.5 text-primary" />
                        <span>Delivery: {formatPKR(restaurant.deliveryFeePaisa)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3" />
                        <span>{nextTimeText}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust & Quality Badges */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 rounded-2xl bg-muted/40 border text-center">
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bike className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Hot & Rapid Delivery</h4>
            <p className="text-xs text-muted-foreground">
              Food delivered in thermal insulated carriers straight from kitchen to table.
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Authentic Hygiene Standards</h4>
            <p className="text-xs text-muted-foreground">
              Every partnered restaurant adheres to verified hygiene and safety protocols.
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Star className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">Cash on Delivery</h4>
            <p className="text-xs text-muted-foreground">
              Inspect your food at arrival and pay the delivery rider comfortably with cash in PKR.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
