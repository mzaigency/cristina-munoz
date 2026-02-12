import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
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
        .rpc("get_tenant_reviews", { p_tenant_id: tenantId, p_limit: 6 });

      if (error) throw error;
      setReviews((data as Review[]) || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewer_avatar || undefined} alt={review.reviewer_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getInitials(review.reviewer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{review.reviewer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

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
                  <p className="text-foreground line-clamp-4">
                    "{review.comment}"
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TenantReviews;
