import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  Bike,
  Filter,
  ArrowUpDown,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { restaurantsApi } from '@/api/endpoints';
import { formatPKR } from '@/lib/formatPKR';
import { isRestaurantOpen } from '@/lib/date';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';

export default function RestaurantsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialCity = searchParams.get('city') || 'all';

  const [search, setSearch] = useState(initialSearch);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'deliveryFeeAsc' | 'deliveryFeeDesc'>('name');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantsApi.list(),
  });

  const allRestaurants = data?.data || [];

  // Filter and sort restaurants
  const filteredRestaurants = useMemo(() => {
    return allRestaurants.filter((restaurant) => {
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = restaurant.name.toLowerCase().includes(query);
        const matchesDesc = restaurant.description?.toLowerCase().includes(query);
        const matchesCity = restaurant.address.city.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCity) return false;
      }

      // City filter
      if (selectedCity !== 'all') {
        if (restaurant.address.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // Open Now filter
      if (onlyOpenNow) {
        const { isOpen } = isRestaurantOpen(restaurant.openingHours, restaurant.timeZone);
        if (!isOpen) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'deliveryFeeAsc') {
        return a.deliveryFeePaisa - b.deliveryFeePaisa;
      }
      if (sortBy === 'deliveryFeeDesc') {
        return b.deliveryFeePaisa - a.deliveryFeePaisa;
      }
      return 0;
    });
  }, [allRestaurants, search, selectedCity, onlyOpenNow, sortBy]);

  const cities = ['all', 'Karachi', 'Lahore', 'Islamabad'];

  const clearFilters = () => {
    setSearch('');
    setSelectedCity('all');
    setOnlyOpenNow(false);
    setSortBy('name');
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8 space-y-8">
      {/* Page Title Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Explore Restaurants
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover places serving your favorite food, check operating hours and delivery rates
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by restaurant name or cuisine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* City Select */}
          <div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city} className="capitalize">
                    {city === 'all' ? 'All Cities' : city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By Select */}
          <div>
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger>
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="deliveryFeeAsc">Delivery Fee (Low to High)</SelectItem>
                <SelectItem value="deliveryFeeDesc">Delivery Fee (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs">
          <div className="flex items-center gap-2">
            <Button
              variant={onlyOpenNow ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOnlyOpenNow(!onlyOpenNow)}
              className="rounded-full text-xs h-8"
            >
              <Clock className="h-3 w-3 mr-1.5" />
              Open Now Only
            </Button>
            <span className="text-muted-foreground">
              Showing {filteredRestaurants.length} restaurant(s)
            </span>
          </div>

          {(search || selectedCity !== 'all' || onlyOpenNow || sortBy !== 'name') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-destructive h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Restaurants Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4 space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Could not load restaurants"
          description="We encountered an issue connecting to the restaurant service. Please try again."
          actionText="Retry"
          onAction={() => window.location.reload()}
        />
      ) : filteredRestaurants.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No restaurants found"
          description="Try broadening your search query or removing city filters to see more restaurants."
          actionText="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => {
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
                    <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {restaurant.address.line1}
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
    </div>
  );
}
