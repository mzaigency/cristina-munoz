import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string | null;
  } | null;
}

interface TenantReviewsSectionProps {
  tenantId: string;
  tenantName?: string;
  primaryColor?: string;
}

// Random Spanish names to replace "xavi barea" reviews
const RANDOM_NAMES = [
  "María García", "Laura Martínez", "Carmen López", "Ana Fernández",
  "Paula Sánchez", "Lucía Romero", "Elena Torres", "Sara Ruiz",
  "Marta Díaz", "Claudia Moreno", "Patricia Gil", "Andrea Navarro",
  "Nuria Jiménez", "Cristina Vega", "Isabel Castro", "Silvia Ortega",
  "Raquel Molina", "Beatriz Ramos", "Alicia Serrano", "Inés Blanco",
  "Eva Hernández", "Mónica Suárez", "Rocío Muñoz", "Julia Álvarez",
  "Diana Prieto", "Sonia Delgado", "Verónica Santos", "Natalia Medina",
  "Irene Iglesias", "Miriam Rubio", "Teresa Vidal", "Yolanda Peña",
  "Pilar Domínguez", "Rosa Cortés", "Lourdes Guerrero", "Noelia Campos",
  "Vanessa Fuentes", "Esther Nieto", "Susana Cano", "Virginia Caballero"
];

// Seeded random to get consistent names per review id
const seededRandom = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const getDisplayName = (fullName: string | null | undefined, reviewId: string): string => {
  if (!fullName) return "Cliente";
  
  // Replace "xavi barea" with a random name based on reviewId for consistency
  if (fullName.toLowerCase().includes("xavi")) {
    const nameIndex = seededRandom(reviewId) % RANDOM_NAMES.length;
    const randomName = RANDOM_NAMES[nameIndex];
    return randomName.split(" ")[0];
  }
  
  const firstName = fullName.trim().split(" ")[0];
  return firstName.slice(0, 15);
};

const getFullDisplayName = (fullName: string | null | undefined, reviewId: string): string => {
  if (!fullName) return "Cliente";
  
  if (fullName.toLowerCase().includes("xavi")) {
    const nameIndex = seededRandom(reviewId) % RANDOM_NAMES.length;
    return RANDOM_NAMES[nameIndex];
  }
  
  return fullName;
};

const getInitials = (fullName: string | null | undefined, reviewId: string): string => {
  if (!fullName) return "C";
  
  // Get initials from the display name (which may be randomized)
  const displayName = getFullDisplayName(fullName, reviewId);
  const parts = displayName.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const TenantReviewsSection = ({ tenantId, tenantName }: TenantReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error, count } = await supabase
          .from("reviews")
          .select(`id, rating, comment, created_at, user_id`, { count: 'exact' })
          .eq("tenant_id", tenantId)
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(r => r.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          
          const reviewsWithProfiles = data.map(review => ({
            ...review,
            profile: profileMap.get(review.user_id) || null
          }));

          setReviews(reviewsWithProfiles);
          setTotalReviews(count || data.length);
          
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
        } else {
          setReviews([]);
          setTotalReviews(0);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchReviews();
    }
  }, [tenantId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <Skeleton className="h-8 w-56 mx-auto mb-4" />
            <Skeleton className="h-6 w-40 mx-auto" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-72 flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-6 md:mb-10 text-center">
            <SmoothTitle>
              <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
                Lo Que Dicen Nuestros Clientes
              </h2>
            </SmoothTitle>
            <div className="line-accent mx-auto mb-4" />
            
            {/* Rating summary */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5 text-primary"
                    fill={star <= Math.round(averageRating) ? "currentColor" : "transparent"}
                  />
                ))}
              </div>
              <span className="text-base font-semibold text-primary">
                {averageRating}
              </span>
              <span className="text-sm text-muted-foreground">
                ({totalReviews} reseñas)
              </span>
            </div>
          </div>

          {/* Carousel */}
          <Carousel
            opts={{
              align: "start",
              loop: reviews.length > 3,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-3 md:-ml-4">
              {reviews.map((review) => (
                <CarouselItem 
                  key={review.id} 
                  className="pl-3 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
                >
                  <button
                    onClick={() => setSelectedReview(review)}
                    className="w-full text-left bg-card rounded-2xl p-5 shadow-md h-full flex flex-col border border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                        {getInitials(review.profile?.full_name, review.id)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">
                          {getDisplayName(review.profile?.full_name, review.id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateShort(review.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-4 w-4 text-primary"
                          fill={star <= review.rating ? "currentColor" : "transparent"}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-muted-foreground flex-1 text-sm leading-relaxed line-clamp-3">
                        "{review.comment}"
                      </p>
                    )}
                    
                    {/* Tap hint */}
                    {review.comment && review.comment.length > 100 && (
                      <p className="text-xs text-primary/70 mt-2">Toca para leer más</p>
                    )}
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation - hidden on mobile, visible on desktop */}
            <CarouselPrevious className="hidden md:flex -left-4 h-10 w-10 bg-card border-border shadow-md" />
            <CarouselNext className="hidden md:flex -right-4 h-10 w-10 bg-card border-border shadow-md" />
          </Carousel>

          {/* Mobile swipe hint */}
          {reviews.length > 1 && (
            <div className="flex justify-center mt-4 md:hidden">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ChevronLeft className="h-3 w-3" />
                <span>Desliza para ver más</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Review Detail Modal */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="sm:max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Reseña completa</DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="pt-2">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {getInitials(selectedReview.profile?.full_name, selectedReview.id)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {getFullDisplayName(selectedReview.profile?.full_name, selectedReview.id)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedReview.created_at)}
                  </p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5 text-primary"
                    fill={star <= selectedReview.rating ? "currentColor" : "transparent"}
                  />
                ))}
              </div>

              {/* Full Comment */}
              {selectedReview.comment ? (
                <p className="text-foreground leading-relaxed">
                  "{selectedReview.comment}"
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  Sin comentario adicional
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TenantReviewsSection;
