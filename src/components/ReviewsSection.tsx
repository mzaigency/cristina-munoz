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
import ScrollFloat from "@/components/animations/ScrollFloat";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
export const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una valoración",
        variant: "destructive"
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('submit-review', {
        body: { rating, comment }
      });
      if (error) throw error;
      
      toast({
        title: "¡Gracias por tu valoración!",
        description: "Tu opinión nos ayuda a mejorar"
      });

      // Reset form and refresh reviews
      setRating(0);
      setComment("");
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar tu valoración. Inténtalo de nuevo.",
        variant: "destructive"
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

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-up">
          <ScrollFloat containerClassName="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Lo Que Dicen Nuestras Clientas
          </ScrollFloat>
          {reviews.length > 0 && (
            <>
              <div className="flex items-center justify-center gap-3 mb-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-2xl font-bold text-foreground">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-muted-foreground">
                Basado en {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
              </p>
            </>
          )}
        </div>

        {reviews.length > 0 && (
          <Carousel 
            opts={{
              align: "start",
              loop: true
            }} 
            className="w-full max-w-5xl mx-auto mb-16"
          >
            <CarouselContent>
              {reviews.map((review) => (
                <CarouselItem key={review.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="hover:shadow-lg transition-all duration-300 border-primary/10 h-full">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-4">
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="text-muted-foreground leading-relaxed line-clamp-6 flex-1 mb-4">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-auto">
                        {new Date(review.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
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
                Tu opinión es muy importante para nosotros. La reseña es totalmente anónima
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
                    onChange={e => setComment(e.target.value)} 
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