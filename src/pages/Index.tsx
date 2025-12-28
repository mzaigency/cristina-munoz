import { SEO } from "@/components/SEO";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Scissors } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchHeader } from "@/components/feed/SearchHeader";
import { FilterChips } from "@/components/feed/FilterChips";
import { SalonCard } from "@/components/feed/SalonCard";
import { AppLayout } from "@/components/navigation/AppLayout";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  tagline: string | null;
}

interface TenantWithStats extends Tenant {
  avgRating: number | null;
  reviewCount: number;
}

const CATEGORIES = ["Peluquería", "Barbería", "Spa", "Uñas", "Estética"];

const SalonCardSkeleton = () => (
  <div className="ios-card overflow-hidden">
    <Skeleton className="h-36 w-full rounded-none" />
    <div className="p-4">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: salons, isLoading } = useQuery({
    queryKey: ["salons-hub"],
    queryFn: async () => {
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, primary_color, city, address, description, tagline")
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
      salon.description?.toLowerCase().includes(query);

    // For now, category filter is a placeholder since tenants don't have categories yet
    return matchesSearch;
  });

  return (
    <AppLayout>
      <SEO
        title="Encuentra tu Salón de Belleza | Reserva Online"
        description="Descubre los mejores salones de belleza cerca de ti. Reserva cita online en peluquerías profesionales."
        keywords="salones de belleza, peluquerías, reserva online, corte de pelo"
        canonicalUrl="/"
      />

      {/* Header with Search */}
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Encuentra tu salón
          </h1>
          <p className="text-muted-foreground text-sm">
            Descubre los mejores profesionales cerca de ti
          </p>
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <FilterChips
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Results Count */}
        {filteredSalons && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              {searchQuery ? "Resultados" : "Destacados"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredSalons.length} {filteredSalons.length === 1 ? "salón" : "salones"}
            </span>
          </div>
        )}

        {/* Salons Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SalonCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSalons && filteredSalons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSalons.map((salon, index) => (
              <SalonCard key={salon.id} salon={salon} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No se encontraron salones" : "Aún no hay salones"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Prueba con otra búsqueda"
                : "Pronto aparecerán nuevos salones aquí"}
            </p>
          </div>
        )}
      </div>

      {/* FAB for Quick Booking */}
      <Link
        to="/buscar"
        className="ios-fab"
        aria-label="Nueva reserva"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </AppLayout>
  );
};

export default Index;
