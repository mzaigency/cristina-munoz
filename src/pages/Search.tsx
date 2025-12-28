import { SEO } from "@/components/SEO";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Sliders, X, Scissors } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/navigation/AppLayout";
import { SalonCard } from "@/components/feed/SalonCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips } from "@/components/feed/FilterChips";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  city: string | null;
  tagline: string | null;
  avgRating: number | null;
  reviewCount: number;
}

const CATEGORIES = ["Peluquería", "Barbería", "Spa", "Uñas", "Estética", "Maquillaje"];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { data: salons, isLoading } = useQuery({
    queryKey: ["salons-search"],
    queryFn: async () => {
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, primary_color, city, tagline")
        .eq("is_active", true)
        .order("name");

      if (tenantsError) throw tenantsError;

      const { data: reviews } = await supabase
        .from("reviews")
        .select("tenant_id, rating")
        .eq("approved", true);

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

      return (tenants || []).map((tenant) => {
        const stats = statsMap.get(tenant.id);
        return {
          ...tenant,
          avgRating: stats ? stats.sum / stats.count : null,
          reviewCount: stats?.count || 0,
        };
      }) as TenantWithStats[];
    },
  });

  const filteredSalons = salons?.filter((salon) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query ||
      salon.name.toLowerCase().includes(query) ||
      salon.city?.toLowerCase().includes(query);
    
    const matchesRating = !minRating || (salon.avgRating && salon.avgRating >= minRating);

    return matchesSearch && matchesRating;
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value && !recentSearches.includes(value)) {
      setRecentSearches(prev => [value, ...prev.slice(0, 4)]);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setMinRating(0);
  };

  const hasActiveFilters = searchQuery || selectedCategory || minRating > 0;

  return (
    <AppLayout>
      <SEO
        title="Buscar Salones"
        description="Encuentra el salón perfecto para ti"
        canonicalUrl="/buscar"
      />

      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o ciudad..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl bg-secondary/50 border-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Filters Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-11 w-11 rounded-xl shrink-0 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
                >
                  <Sliders className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Rating Filter */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Rating mínimo: {minRating > 0 ? `${minRating}+` : "Todos"}
                    </label>
                    <Slider
                      value={[minRating]}
                      onValueChange={([value]) => setMinRating(value)}
                      max={5}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Category Chips */}
        <div className="px-4 pb-3">
          <FilterChips
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {/* Recent Searches */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Búsquedas recientes</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => setSearchQuery(search)}
                  className="ios-chip bg-secondary text-secondary-foreground"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ios-card overflow-hidden">
                <Skeleton className="h-36 w-full rounded-none" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSalons && filteredSalons.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredSalons.length} resultados
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSalons.map((salon, index) => (
                <SalonCard key={salon.id} salon={salon} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No se encontraron salones
            </h3>
            <p className="text-sm text-muted-foreground">
              Prueba con otros términos de búsqueda
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
