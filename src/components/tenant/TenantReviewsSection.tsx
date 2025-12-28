import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote, User } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
import { Skeleton } from "@/components/ui/skeleton";

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

// Helper to get display name (first name only for privacy)
const getDisplayName = (fullName: string | null | undefined): string => {
  if (!fullName) return "Cliente";
  const firstName = fullName.trim().split(" ")[0];
  // Only show first name, max 15 chars
  return firstName.slice(0, 15);
};

// Helper to get initials for avatar
const getInitials = (fullName: string | null | undefined): string => {
  if (!fullName) return "C";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const TenantReviewsSection = ({ tenantId, tenantName }: TenantReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch reviews with user profiles
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            id, 
            rating, 
            comment, 
            created_at, 
            user_id
          `)
          .eq("tenant_id", tenantId)
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) throw error;

        // Fetch profiles for the reviews
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
          
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
        } else {
          setReviews([]);
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
    return date.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
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
    <section className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-8 md:mb-12 text-center">
          <SmoothTitle>
            <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
              Lo Que Dicen Nuestros Clientes
            </h2>
          </SmoothTitle>
          <div className="line-accent mx-auto mb-4" />
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                  fill={star <= Math.round(averageRating) ? "currentColor" : "transparent"}
                />
              ))}
            </div>
            <span className="text-base sm:text-lg font-semibold text-primary">
              {averageRating} / 5
            </span>
            <span className="text-sm sm:text-base text-muted-foreground">({reviews.length} reseñas)</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {reviews.map((review, idx) => (
            <ScrollReveal key={review.id} delay={idx * 80}>
              <div className="bg-card rounded-xl p-6 shadow-lg h-full flex flex-col">
                {/* Header with avatar and name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {getInitials(review.profile?.full_name)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {getDisplayName(review.profile?.full_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex mb-3">
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
                  <p className="text-muted-foreground flex-1 italic text-sm leading-relaxed">
                    "{review.comment}"
                  </p>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TenantReviewsSection;
