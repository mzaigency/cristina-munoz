import { SEO } from "@/components/SEO";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SmartSearchHeader } from "@/components/feed/SmartSearchHeader";
import { AISearchBar } from "@/components/feed/AISearchBar";
import { CategoryPills } from "@/components/feed/CategoryPills";
import { PremiumSalonCard } from "@/components/feed/PremiumSalonCard";
import { PremiumSkeleton } from "@/components/feed/PremiumSkeleton";
import { EmptyState } from "@/components/feed/EmptyState";
import { DiscoverSections } from "@/components/feed/sections/DiscoverSections";

import { AppLayout } from "@/components/navigation/AppLayout";
import { useFavorites } from "@/hooks/useFavorites";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { useGeolocation, CITY_COORDINATES } from "@/hooks/useGeolocation";
import { useHaptic } from "@/hooks/useHaptic";
import { useTodayAvailability } from "@/hooks/useTodayAvailability";
import { useFollows } from "@/hooks/useFollows";
import { FeedToggle, FeedMode } from "@/components/feed/FeedToggle";
import { FollowingFeed } from "@/components/feed/FollowingFeed";
import { useRecommendations } from "@/hooks/useRecommendations";
import { cn } from "@/lib/utils";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

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

const ITEMS_PER_PAGE = 6;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>("discover");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const { favorites, isAuthenticated } = useFavorites();
  const { followingCount } = useFollows();
  const { tenant: userTenant, loading: tenantLoading } = useCurrentUserTenant();
  const queryClient = useQueryClient();
  const { hasLocation, requestLocation, calculateDistance, formatDistance, loading: geoLoading } = useGeolocation();
  const haptic = useHaptic();
  const [sortByDistance, setSortByDistance] = useState(false);
  const { scoresMap, isAuthenticated: hasRecommendations } = useRecommendations();

  // Check if current user is superadmin — uses auth context, no extra getUser call
  const { user: authUser } = useAuth();
  useEffect(() => {
    if (!authUser) {
      setIsSuperadmin(false);
      return;
    }
    supabase.rpc("is_superadmin").then(({ data }) => {
      setIsSuperadmin(data === true);
    });
  }, [authUser?.id]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.length > 2 && !recentSearches.includes(searchQuery)) {
      const updated = [searchQuery, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [searchQuery, recentSearches]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const {
    data: salons,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["salons-premium-hub"],
    queryFn: async () => {
      // Use security-safe RPC function that only exposes public fields
      const { data: tenants, error: tenantsError } = await supabase.rpc("get_public_tenants");

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
          features: tenant.features as TenantWithStats["features"],
          avgRating: stats ? stats.sum / stats.count : null,
          reviewCount: stats?.count || 0,
        };
      });

      return tenantsWithStats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - datos frescos, no recarga innecesaria
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    refetchOnWindowFocus: false, // No recargar al volver a la ventana
  });

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["salons-premium-hub"] });
  }, [queryClient]);

  // Get all tenant IDs for availability check
  const tenantIds = useMemo(() => salons?.map((s) => s.id) || [], [salons]);

  // Check today's availability for "Disponibles hoy" — auto on mount once we have tenants
  const {
    tenantsWithAvailability,
    loading: availabilityLoading,
    hasChecked,
    checkAvailability,
  } = useTodayAvailability(tenantIds);

  useEffect(() => {
    if (tenantIds.length > 0 && !hasChecked && !availabilityLoading) {
      checkAvailability();
    }
  }, [tenantIds, hasChecked, availabilityLoading, checkAvailability]);

  // Calculate distances for salons
  const salonsWithDistance = useMemo(() => {
    if (!salons) return [];

    return salons.map((salon) => {
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

      // Filter for "popular" - only show salons with good ratings (>= 4 stars) or at least 2 reviews
      const matchesPopular =
        selectedCategory !== "popular" || (salon.avgRating !== null && salon.avgRating >= 4) || salon.reviewCount >= 2;

      return matchesSearch && matchesFavorites && matchesCategory && matchesAvailability && matchesPopular;
    });

    // Apply quick filter sorting
    if (selectedCategory === "popular") {
      // Sort by rating (highest first), then by review count
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

    // Apply recommendation scoring if user is authenticated and not sorting by other criteria
    if (hasRecommendations && scoresMap.size > 0 && !sortByDistance && selectedCategory !== "popular") {
      result = [...result].sort((a, b) => {
        const scoreA = scoresMap.get(a.id)?.score ?? 0;
        const scoreB = scoresMap.get(b.id)?.score ?? 0;
        return scoreB - scoreA;
      });
    }

    return result;
  }, [
    salonsWithDistance,
    searchQuery,
    showFavoritesOnly,
    favorites,
    selectedCategory,
    sortByDistance,
    hasLocation,
    tenantsWithAvailability,
    hasRecommendations,
    scoresMap,
  ]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, showFavoritesOnly, sortByDistance]);

  // Paginated salons
  const visibleSalons = useMemo(() => {
    return filteredSalons.slice(0, visibleCount);
  }, [filteredSalons, visibleCount]);

  const hasMoreSalons = filteredSalons.length > visibleCount;

  const handleLoadMore = () => {
    haptic.light();
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <>
      <AppLayout>
        <div className="font-poppins">
        <SEO
          title="GlowApp | Reserva Cita en Salones de Belleza Cerca de Ti"
          description="Descubre peluquerías, spas y centros de estética cerca de ti. Reserva cita online al instante. La app de belleza #1 en España con +500 salones."
          keywords="reservar peluquería, salones belleza cerca, cita online spa, estética cerca de mí, manicura, pedicura, barbería, tratamientos faciales, GlowApp"
          canonicalUrl="/"
        />

        {/* Fondo plano de la familia glow (mismo gris azulado del panel) */}
        <div className="fixed inset-0 -z-10" style={{ background: "var(--glow-bg)" }} />

        {/* Header Bar */}
        <SmartSearchHeader />

        {/* AI Search Bar */}
        <div className="py-3">
          <AISearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            recentSearches={recentSearches}
            onRecentSearchClick={(search) => setSearchQuery(search)}
            onClearRecents={clearRecentSearches}
          />
        </div>

        {/* Feed Toggle */}
        <FeedToggle mode={feedMode} onChange={setFeedMode} followingCount={followingCount} />

        {/* Main Content */}
        <div className="px-4 pt-1 pb-28">
          <AnimatePresence mode="wait">
            {feedMode === "following" ? (
              <motion.div
                key="following"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <FollowingFeed />
              </motion.div>
            ) : (
              <motion.div
                key="discover"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Compact Section Header + Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="mb-4"
                >
                  {/* Top row: Title (solo en modo grid filtrado) + Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {searchQuery || selectedCategory || showFavoritesOnly || sortByDistance ? (
                        <>
                          {hasRecommendations && scoresMap.size > 0 ? (
                            <Sparkles className="h-5 w-5 text-primary shrink-0" />
                          ) : (
                            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
                          )}
                          <h2 className="text-lg font-bold text-foreground truncate">
                            {searchQuery ? "Resultados" : "Filtrados"}
                          </h2>
                          <span className="text-xs text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full shrink-0">
                            {filteredSalons?.length || 0}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Filtros rápidos
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5" />
                  </div>

                  {/* Category Pills - more compact */}
                  <CategoryPills
                    selected={selectedCategory}
                    onSelect={setSelectedCategory}
                    tenantsWithAvailability={tenantsWithAvailability}
                    loadingAvailability={availabilityLoading}
                    hasCheckedAvailability={hasChecked}
                    onCheckAvailability={checkAvailability}
                  />
                </motion.div>

                {/* Modo SECCIONES (sin búsqueda ni filtro) o GRID (con filtros activos) */}
                {!searchQuery &&
                !selectedCategory &&
                !showFavoritesOnly &&
                !sortByDistance &&
                salonsWithDistance.length > 0 ? (
                  <DiscoverSections
                    salons={salonsWithDistance}
                    hasLocation={hasLocation}
                    tenantsWithAvailability={tenantsWithAvailability}
                    scoresMap={scoresMap}
                    hasRecommendations={hasRecommendations}
                    onRequestLocation={requestLocation}
                    geoLoading={geoLoading}
                  />
                ) : visibleSalons && visibleSalons.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {visibleSalons.map((salon, index) => {
                        const recScore = scoresMap.get(salon.id);
                        return (
                          <PremiumSalonCard
                            key={salon.id}
                            salon={salon}
                            index={index}
                            distance={salon.formattedDistance}
                            hasAvailabilityToday={tenantsWithAvailability.includes(salon.id)}
                            recommendationScore={recScore?.score}
                            matchReasons={recScore?.matchReasons}
                          />
                        );
                      })}
                    </div>

                    {/* Load More Button */}
                    {hasMoreSalons && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center pt-4"
                      >
                        <LiquidButton onClick={handleLoadMore} size="lg">
                          <span>Ver más</span>
                          <span className="text-muted-foreground text-xs">
                            ({filteredSalons.length - visibleCount} restantes)
                          </span>
                        </LiquidButton>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    type={
                      selectedCategory === "huecos" && hasChecked && tenantsWithAvailability.length === 0
                        ? "no-availability"
                        : searchQuery
                          ? "no-results"
                          : "empty"
                    }
                    searchQuery={searchQuery}
                    onClearSearch={() => setSearchQuery("")}
                    onClearFilter={() => setSelectedCategory(null)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppLayout>
    </>
  );
};

export default Index;
