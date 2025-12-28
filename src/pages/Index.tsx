import { SEO } from "@/components/SEO";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Scissors, Star, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";

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

const SalonCard = ({ salon }: { salon: TenantWithStats }) => {
  const primaryColor = salon.primary_color || "#8B5CF6";
  const initials = salon.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
        <div
          className="h-32 flex items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          }}
        >
          {salon.logo_url ? (
            <img
              src={salon.logo_url}
              alt={`Logo de ${salon.name}`}
              className="h-20 w-20 object-contain rounded-full bg-white p-2"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Rating Badge */}
          {salon.avgRating !== null && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-foreground">
                {salon.avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <CardContent className="pt-4 flex-1">
          <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1">
            {salon.name}
          </h3>
          
          {salon.tagline && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1 italic">
              {salon.tagline}
            </p>
          )}
          
          <div className="space-y-1.5">
            {salon.city && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="line-clamp-1">{salon.city}</span>
              </p>
            )}
            
            {salon.reviewCount > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{salon.reviewCount} {salon.reviewCount === 1 ? "reseña" : "reseñas"}</span>
              </p>
            )}
          </div>

          {salon.description && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
              {salon.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <Button asChild className="w-full" variant="outline">
            <Link to={`/salon/${salon.slug}`}>Ver Salón</Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const SalonCardSkeleton = () => (
  <Card className="overflow-hidden h-full">
    <Skeleton className="h-32 w-full rounded-none" />
    <CardContent className="pt-4">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-3" />
      <Skeleton className="h-4 w-2/3 mb-1.5" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
    <CardFooter className="pt-0">
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: salons, isLoading } = useQuery({
    queryKey: ["salons-hub"],
    queryFn: async () => {
      // Fetch tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, primary_color, city, address, description, tagline")
        .eq("is_active", true)
        .order("name");

      if (tenantsError) throw tenantsError;

      // Fetch review stats for each tenant
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("tenant_id, rating")
        .eq("approved", true);

      if (reviewsError) throw reviewsError;

      // Calculate stats per tenant
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

      // Merge tenants with stats
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
    return (
      salon.name.toLowerCase().includes(query) ||
      salon.city?.toLowerCase().includes(query) ||
      salon.address?.toLowerCase().includes(query) ||
      salon.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Encuentra tu Salón de Belleza | Reserva Online"
        description="Descubre los mejores salones de belleza cerca de ti. Reserva cita online en peluquerías profesionales con servicios de corte, coloración, tratamientos y más."
        keywords="salones de belleza, peluquerías, reserva online, corte de pelo, coloración, tratamientos capilares"
        canonicalUrl="/"
      />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">SalonHub</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Iniciar Sesión</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 font-playfair">
                Encuentra tu salón de belleza ideal
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10">
                Descubre los mejores salones cerca de ti y reserva tu cita online en segundos
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre o ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg rounded-full border-2 focus-visible:ring-primary"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Salons Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-foreground">
                {searchQuery ? "Resultados de búsqueda" : "Salones destacados"}
              </h2>
              {filteredSalons && (
                <span className="text-sm text-muted-foreground">
                  {filteredSalons.length} {filteredSalons.length === 1 ? "salón" : "salones"}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SalonCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredSalons && filteredSalons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredSalons.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Scissors className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">
                  {searchQuery ? "No se encontraron salones" : "Aún no hay salones"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Prueba con otra búsqueda"
                    : "Pronto aparecerán nuevos salones aquí"}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              <span className="font-medium">SalonHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} SalonHub. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidad
              </Link>
              <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Términos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
