import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Heart, TrendingUp, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { SmartSearchHeader } from "@/components/feed/SmartSearchHeader";
import { CategoryPills } from "@/components/feed/CategoryPills";
import { PremiumSalonCard } from "@/components/feed/PremiumSalonCard";
import { PremiumSkeleton } from "@/components/feed/PremiumSkeleton";
import { EmptyState } from "@/components/feed/EmptyState";
import { StoriesCarousel } from "@/components/feed/StoriesCarousel";
import { AppLayout } from "@/components/navigation/AppLayout";
import { useFavorites } from "@/hooks/useFavorites";
import { JoinNetworkSection } from "@/components/feed/JoinNetworkSection";
import { Button } from "@/components/ui/button";

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
}

const STORAGE_KEY = "glowup_recent_searches";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const { favorites, isAuthenticated } = useFavorites();

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
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, hero_image_url, primary_color, city, address, description, tagline, average_price")
        .eq("is_active", true)
        .order("name");

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
          avgRating: stats ? stats.sum / stats.count : null,
          reviewCount: stats?.count || 0,
        };
      });

      return tenantsWithStats;
    },
  });

  const filteredSalons = salons?.filter((salon) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      salon.name.toLowerCase().includes(query) ||
      salon.city?.toLowerCase().includes(query) ||
      salon.address?.toLowerCase().includes(query) ||
      salon.tagline?.toLowerCase().includes(query) ||
      salon.description?.toLowerCase().includes(query);

    const matchesFavorites = !showFavoritesOnly || favorites.includes(salon.id);

    return matchesSearch && matchesFavorites;
  });

  return (
    <AppLayout>
      <SEO
        title="GlowUp | Descubre y Reserva en los Mejores Salones de Belleza"
        description="La red social de belleza. Descubre los mejores salones cerca de ti, conecta con profesionales y reserva cita online."
        keywords="red social belleza, salones de belleza, peluquerías, reserva online, spa, estética, GlowUp"
        canonicalUrl="/"
      />

      {/* Smart Search Header */}
      <SmartSearchHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        recentSearches={recentSearches}
        onRecentSearchClick={(search) => setSearchQuery(search)}
        onClearRecents={clearRecentSearches}
      />

      {/* Stories Carousel */}
      <div className="py-4 border-b border-border/30">
        <StoriesCarousel />
      </div>

      {/* Superadmin Wizard Test Button */}
      {isSuperadmin && (
        <div className="px-4 pt-4">
          <Link to="/onboarding">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-dashed border-primary/50 text-primary hover:bg-primary/5"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Probar Wizard de Onboarding (Superadmin)
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 py-6 pb-24">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {searchQuery ? "Resultados" : "Destacados"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredSalons?.length || 0} salones disponibles
            </p>
          </div>

          {isAuthenticated && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                showFavoritesOnly
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
              Favoritos
            </motion.button>
          )}
        </motion.div>

        {/* Category Pills */}
        <div className="mb-6">
          <CategoryPills
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filteredSalons.map((salon, index) => (
                <PremiumSalonCard key={salon.id} salon={salon} index={index} />
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

        {/* Join Network Section */}
        <JoinNetworkSection />
      </div>

      {/* Premium FAB */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        <Link
          to="/buscar"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/40 flex items-center justify-center z-40 active:scale-95 transition-transform"
          aria-label="Nueva reserva"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </Link>
      </motion.div>
    </AppLayout>
  );
};

export default Index;
