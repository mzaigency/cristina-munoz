import { SEO } from "@/components/SEO";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, TrendingUp, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SmartSearchHeader } from "@/components/feed/SmartSearchHeader";
import { AISearchBar } from "@/components/feed/AISearchBar";
import { CategoryPills } from "@/components/feed/CategoryPills";
import { PremiumSalonCard } from "@/components/feed/PremiumSalonCard";
import { PremiumSkeleton } from "@/components/feed/PremiumSkeleton";
import { EmptyState } from "@/components/feed/EmptyState";
import { StoriesCarousel } from "@/components/feed/StoriesCarousel";
import { AppLayout } from "@/components/navigation/AppLayout";
import { useFavorites } from "@/hooks/useFavorites";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { WelcomeCarousel, useWelcomeOnboarding } from "@/components/onboarding/WelcomeCarousel";
import { useGeolocation, CITY_COORDINATES } from "@/hooks/useGeolocation";
import { useHaptic } from "@/hooks/useHaptic";
import { useTodayAvailability } from "@/hooks/useTodayAvailability";
import { cn } from "@/lib/utils";

interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  tagline: string | null;
  average_price: number | null;
  avgRating: number | null;
  reviewCount: number;
  features: {
    business_type?: string;
    business_type_label?: string;
    [key: string]: unknown;
  } | null;
}

const STORAGE_KEY = "glowapp_recent_searches";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const { favorites, isAuthenticated } = useFavorites();
  const { tenant: userTenant, loading: tenantLoading } = useCurrentUserTenant();
  const { showWelcome, handleComplete: handleOnboardingComplete } = useWelcomeOnboarding();
  const queryClient = useQueryClient();
  const { hasLocation, requestLocation, calculateDistance, formatDistance, loading: geoLoading } = useGeolocation();
  const haptic = useHaptic();
  const [sortByDistance, setSortByDistance] = useState(false);

  // Check if current user is superadmin
  useEffect(() => {
    const checkSuperadmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('is_superadmin');
        setIsSuperadmin(data === true);
      }
    };
    checkSuperadmin();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Save to recent searches when user submits (not on every keystroke)
    if (value.length > 2 && !recentSearches.includes(value)) {
      const updated = [value, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const { data: salons, isLoading } = useQuery({
    queryKey: ["salons-premium-hub"],
    queryFn: async () => {
      // Use security-safe RPC function that only exposes public fields
      const { data: tenants, error: tenantsError } = await supabase
        .rpc("get_public_tenants");

      if (tenantsError) throw tenantsError;

      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("tenant_id, rating")
        .eq("approved", true);

      if (reviewsError) throw reviewsError;

      const statsMap = new Map<string, { sum: number; count: number }>();
      reviews?.forEach((review) => {
        if (review.tenant_id) {
          const existing = statsMap.get(review.tenant_id) || { sum: 0, count: 0 };
          statsMap.set(review.tenant_id, {
            sum: existing.sum + review.rating,
            count: existing.count + 1,
          });
        }
      });

      const tenantsWithStats: TenantWithStats[] = (tenants || []).map((tenant) => {
        const stats = statsMap.get(tenant.id);
        return {
          ...tenant,
          features: tenant.features as TenantWithStats['features'],
          avgRating: stats ? stats.sum / stats.count : null,
          reviewCount: stats?.count || 0,
        };
      });

      return tenantsWithStats;
    },
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["salons-premium-hub"] });
  }, [queryClient]);

  // Get all tenant IDs for availability check
  const tenantIds = useMemo(() => salons?.map(s => s.id) || [], [salons]);
  
  // Check today's availability for "Huecos hoy" filter
  const { tenantsWithAvailability, loading: availabilityLoading } = useTodayAvailability(tenantIds);

  // Calculate distances for salons
  const salonsWithDistance = useMemo(() => {
    if (!salons) return [];
    
    return salons.map(salon => {
      let distance: number | null = null;
      
      if (hasLocation && salon.city) {
        const cityCoords = CITY_COORDINATES[salon.city];
        if (cityCoords) {
          distance = calculateDistance(cityCoords.lat, cityCoords.lon);
        }
      }
      
      return {
        ...salon,
        distance,
        formattedDistance: distance !== null ? formatDistance(distance) : null,
      };
    });
  }, [salons, hasLocation, calculateDistance, formatDistance]);

  const filteredSalons = useMemo(() => {
    let result = salonsWithDistance.filter((salon) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        salon.name.toLowerCase().includes(query) ||
        salon.city?.toLowerCase().includes(query) ||
        salon.address?.toLowerCase().includes(query) ||
        salon.tagline?.toLowerCase().includes(query) ||
        salon.description?.toLowerCase().includes(query);

      const matchesFavorites = !showFavoritesOnly || favorites.includes(salon.id);
      
      // Filter by business type category (excluding quick filters)
      const isQuickFilter = selectedCategory === "huecos" || selectedCategory === "popular";
      const matchesCategory = !selectedCategory || isQuickFilter || salon.features?.business_type === selectedCategory;

      // Filter by availability for "huecos hoy"
      const matchesAvailability = selectedCategory !== "huecos" || tenantsWithAvailability.includes(salon.id);

      return matchesSearch && matchesFavorites && matchesCategory && matchesAvailability;
    });

    // Apply quick filter sorting
    if (selectedCategory === "popular") {
      // Sort by rating (highest first)
      result = [...result].sort((a, b) => {
        const ratingA = a.avgRating ?? 0;
        const ratingB = b.avgRating ?? 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return b.reviewCount - a.reviewCount;
      });
    }

    // Sort by distance if enabled
    if (sortByDistance && hasLocation) {
      result = [...result].sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return result;
  }, [salonsWithDistance, searchQuery, showFavoritesOnly, favorites, selectedCategory, sortByDistance, hasLocation, tenantsWithAvailability]);

  const handleNearMeClick = () => {
    haptic.medium();
    if (!hasLocation) {
      requestLocation();
    }
    setSortByDistance(prev => !prev);
  };

  return (
    <>
      {/* Welcome Onboarding for new users */}
      {showWelcome && <WelcomeCarousel onComplete={handleOnboardingComplete} />}
      
      <AppLayout noTopSafeArea>
      <SEO
        title="GlowApp | Descubre y Reserva en los Mejores Salones de Belleza"
        description="La red social de belleza. Descubre los mejores salones cerca de ti, conecta con profesionales y reserva cita online."
        keywords="red social belleza, salones de belleza, peluquerías, reserva online, spa, estética, GlowApp"
        canonicalUrl="/"
      />

      {/* Header Bar - Fixed, compact */}
      <SmartSearchHeader />

      {/* AI Search Bar - Below header */}
      <div className="py-3">
        <AISearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          recentSearches={recentSearches}
          onRecentSearchClick={(search) => setSearchQuery(search)}
          onClearRecents={clearRecentSearches}
        />
      </div>

      {/* Stories Carousel */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="py-5"
      >
        <StoriesCarousel />
      </motion.div>

      {/* Main Content */}
      <div className="px-4 pt-1 pb-28">
        {/* Compact Section Header + Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-4"
        >
          {/* Top row: Title + Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                {searchQuery ? "Resultados" : "Destacados"}
              </h2>
              <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">
                {filteredSalons?.length || 0}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Near Me Button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleNearMeClick}
                disabled={geoLoading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                  sortByDistance && hasLocation
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                    : "bg-secondary/80 text-muted-foreground active:bg-secondary"
                )}
              >
                {geoLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5" />
                )}
                <span className="hidden xs:inline">Cerca</span>
              </motion.button>

              {isAuthenticated && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    showFavoritesOnly
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                      : "bg-secondary/80 text-muted-foreground active:bg-secondary"
                  )}
                >
                  <Heart className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
                  <span className="hidden xs:inline">Favoritos</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Category Pills - more compact */}
          <CategoryPills
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            tenantsWithAvailability={tenantsWithAvailability}
            loadingAvailability={availabilityLoading}
          />
        </motion.div>

        {/* Salons Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <PremiumSkeleton />
          ) : filteredSalons && filteredSalons.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredSalons.map((salon, index) => (
                <PremiumSalonCard 
                  key={salon.id} 
                  salon={salon} 
                  index={index} 
                  distance={salon.formattedDistance}
                />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              type={searchQuery ? "no-results" : "empty"}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
            />
          )}
        </AnimatePresence>

      </div>

    </AppLayout>
    </>
  );
};

export default Index;
