import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Parallax3D } from "@/components/animations/Parallax3D";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
export const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with-comment" | "no-comment">("all");
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch reviews in background without showing loading state
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50); // Limit to improve performance

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Autenticación requerida",
        description: "Por favor, inicia sesión para dejar una reseña",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una valoración",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-review", {
        body: { rating, comment },
      });
      
      if (error) {
        console.error("Edge function error:", error);
        
        // Extraer el mensaje de error del edge function
        let errorMessage = "No se pudo enviar tu valoración. Inténtalo de nuevo.";
        
        // El error puede venir en diferentes formatos
        if (error.message) {
          errorMessage = error.message;
        }
        
        // Si el edge function devolvió un response con error
        if (data && typeof data === 'object' && 'error' in data) {
          errorMessage = (data as { error: string }).error;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "¡Gracias por tu valoración!",
        description: "Tu opinión nos ayuda a mejorar",
      });

      // Reset form and refresh reviews
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar tu valoración. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
          />
        ))}
      </div>
    );
  };

  const renderInteractiveStars = () => {
    return (
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-8 w-8 cursor-pointer transition-all ${
              i < (hoveredRating || rating)
                ? "fill-yellow-400 text-yellow-400 scale-110"
                : "fill-muted text-muted hover:scale-110"
            }`}
            onMouseEnter={() => setHoveredRating(i + 1)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(i + 1)}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  // Filter reviews based on selected filters
  const filteredReviews = reviews.filter((review) => {
    // Filter by comment type
    if (filterType === "with-comment" && !review.comment) return false;
    if (filterType === "no-comment" && review.comment) return false;
    
    // Filter by stars
    if (filterStars !== null && review.rating !== filterStars) return false;
    
    return true;
  });

  return (
    <section className="pt-12 pb-24 bg-gradient-to-b from-background to-muted/20">
      {/* Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": import.meta.env.VITE_BUSINESS_FULL_NAME,
            name: import.meta.env.VITE_BUSINESS_FULL_NAME,
            image: `${window.location.origin}/logo.png`,
            telephone: import.meta.env.VITE_CONTACT_PHONE_DISPLAY,
            address: {
              "@type": "PostalAddress",
              streetAddress: import.meta.env.VITE_LOCATION_ADDRESS,
              addressLocality: import.meta.env.VITE_LOCATION_CITY,
              addressRegion: import.meta.env.VITE_LOCATION_PROVINCE,
              postalCode: import.meta.env.VITE_LOCATION_POSTAL_CODE,
              addressCountry: "ES",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "41.8045",
              longitude: "1.8234",
            },
            url: window.location.origin,
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"],
                opens: "09:00",
                closes: "19:00",
              },
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: "Saturday",
                opens: "08:00",
                closes: "13:00",
              },
            ],
            aggregateRating:
              reviews.length > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: averageRating.toFixed(1),
                    reviewCount: reviews.length,
                    bestRating: "5",
                    worstRating: "1",
                  }
                : undefined,
          }),
        }}
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <SmoothTitle>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Opiniones</h2>
          </SmoothTitle>
          {reviews.length > 0 && (
            <>
              <div className="flex items-center justify-center gap-3 mb-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-2xl font-bold text-foreground">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-muted-foreground">
                Basado en {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
              </p>
            </>
          )}
        </div>

        {reviews.length > 0 && (
          <>
            <div className="flex flex-col items-center justify-center gap-3 mb-8">
              {/* Filter by comment type */}
              <div className="flex gap-2 flex-wrap justify-center w-full max-w-md px-4">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className="rounded-full flex-1 min-w-[90px]"
                >
                  Todas
                </Button>
                <Button
                  variant={filterType === "with-comment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("with-comment")}
                  className="rounded-full flex-1 min-w-[90px]"
                >
                  Con texto
                </Button>
                <Button
                  variant={filterType === "no-comment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("no-comment")}
                  className="rounded-full flex-1 min-w-[90px]"
                >
                  Sin texto
                </Button>
              </div>

              {/* Filter by stars */}
              <div className="flex flex-col sm:flex-row gap-2 items-center w-full max-w-md px-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Estrellas:</span>
                <div className="flex gap-1.5 flex-wrap justify-center flex-1">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <Button
                      key={stars}
                      variant={filterStars === stars ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStars(filterStars === stars ? null : stars)}
                      className="rounded-full px-2.5 min-w-[45px]"
                    >
                      {stars} <Star className="h-3 w-3 ml-0.5 fill-current" />
                    </Button>
                  ))}
                  {filterStars !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterStars(null)}
                      className="rounded-full px-3"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {filteredReviews.length === 0 && (
              <p className="text-center text-muted-foreground mb-8">
                No hay reseñas que coincidan con los filtros seleccionados
              </p>
            )}
          </>
        )}

        {filteredReviews.length > 0 && (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto mb-16"
          >
            <CarouselContent className="perspective-3d">
              {filteredReviews.map((review, index) => (
                <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                  <ScrollReveal delay={index * 80}>
                    <Parallax3D intensity={6} enableShadow>
                      <Card className="hover:shadow-lg transition-all duration-300 border-primary/10 h-full smooth-3d">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex items-center gap-2 mb-4">{renderStars(review.rating)}</div>
                          {review.comment && (
                            <p className="text-muted-foreground leading-relaxed line-clamp-6 flex-1 mb-4">
                              {review.comment}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-auto">
                            {new Date(review.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    </Parallax3D>
                  </ScrollReveal>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        )}

        {/* Formulario de valoración */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2 text-center text-foreground">
                ¿Qué te ha parecido tu experiencia?
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                Tu opinión es muy importante para nosotros
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <Label className="text-lg">Tu valoración</Label>
                  {renderInteractiveStars()}
                  {rating > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {rating === 5 && "¡Excelente!"}
                      {rating === 4 && "Muy bueno"}
                      {rating === 3 && "Bueno"}
                      {rating === 2 && "Regular"}
                      {rating === 1 && "Necesita mejorar"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Tu opinión (opcional)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Cuéntanos qué te ha gustado, qué mejorarías, o cualquier sugerencia..."
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar Valoración"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
