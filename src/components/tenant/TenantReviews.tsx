import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface TenantReviewsProps {
  tenantId: string;
}

export const TenantReviews = ({ tenantId }: TenantReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [tenantId]);

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
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
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
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Opiniones de Clientes</h2>
          <div className="flex items-center justify-center gap-2 text-lg">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{averageRating}</span>
            <span className="text-muted-foreground">
              ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                
                {review.comment && (
                  <p className="text-foreground mb-4 line-clamp-4">
                    "{review.comment}"
                  </p>
                )}

                <p className="text-sm text-muted-foreground">
                  {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TenantReviews;
