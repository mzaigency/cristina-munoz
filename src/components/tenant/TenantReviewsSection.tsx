import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";
import { Skeleton } from "@/components/ui/skeleton";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface TenantReviewsSectionProps {
  tenantId: string;
  tenantName?: string;
  primaryColor?: string;
}

export const TenantReviewsSection = ({ tenantId, tenantName, primaryColor = "#8B5CF6" }: TenantReviewsSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at")
          .eq("tenant_id", tenantId)
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (error) throw error;
        
        setReviews(data || []);
        
        if (data && data.length > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <SmoothTitle>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Lo Que Dicen Nuestros Clientes
            </h2>
          </SmoothTitle>
          <div className="line-accent mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-6 w-6"
                  fill={star <= Math.round(averageRating) ? primaryColor : "transparent"}
                  stroke={primaryColor}
                />
              ))}
            </div>
            <span className="text-lg font-semibold" style={{ color: primaryColor }}>
              {averageRating} / 5
            </span>
            <span className="text-muted-foreground">({reviews.length} reseñas)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <ScrollReveal key={review.id} delay={idx * 100}>
              <div className="bg-card rounded-xl p-6 shadow-lg h-full flex flex-col">
                <Quote className="h-8 w-8 mb-4 opacity-20" style={{ color: primaryColor }} />
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4"
                      fill={star <= review.rating ? primaryColor : "transparent"}
                      stroke={primaryColor}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-muted-foreground flex-1 italic">"{review.comment}"</p>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  {formatDate(review.created_at)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TenantReviewsSection;