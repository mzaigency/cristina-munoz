import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url: string;
}
interface PlaceData {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: Review[];
}
export const ReviewsSection = () => {
  const [placeData, setPlaceData] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const {
    toast
  } = useToast();
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('get-reviews');
        if (error) throw error;
        setPlaceData(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);
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
      const {
        error
      } = await supabase.functions.invoke('submit-review', {
        body: {
          rating,
          comment
        }
      });
      if (error) throw error;
      toast({
        title: "¡Gracias por tu valoración!",
        description: "Tu opinión nos ayuda a mejorar"
      });

      // Reset form
      setRating(0);
      setComment("");
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
    return <div className="flex gap-1">
        {[...Array(5)].map((_, i) => <Star key={i} className={`h-5 w-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`} />)}
      </div>;
  };
  const renderInteractiveStars = () => {
    return <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <Star key={i} className={`h-8 w-8 cursor-pointer transition-all ${i < (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400 scale-110" : "fill-muted text-muted hover:scale-110"}`} onMouseEnter={() => setHoveredRating(i + 1)} onMouseLeave={() => setHoveredRating(0)} onClick={() => setRating(i + 1)} />)}
      </div>;
  };
  if (loading) {
    return <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </section>;
  }
  if (!placeData) {
    return null;
  }
  return <section className="py-32 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Experiencias
          </h2>
          <div className="flex items-center justify-center gap-3">
            {renderStars(Math.round(placeData.rating))}
            <span className="text-3xl font-bold text-foreground">
              {placeData.rating}
            </span>
          </div>
          <p className="text-muted-foreground text-lg">
            {placeData.user_ratings_total} valoraciones en{" "}
            <a href="https://www.google.com/search?sca_esv=3bbeda8844e2ec09&rlz=1C1UEAD_esES1067ES1067&sxsrf=AE3TifO958sBtGFQk8RT_bpwUe61gwbe8Q:1760619626022&q=cristina+mu%C3%B1oz&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E2j-wl--e1cD3wnzS5P2IRXmXLSOpi1ouDxD8WLWQ-YW3pYIpVvd9pWjHx8BTIcXFHMztug%3D&uds=AOm0WdGjsAzsq6lJpU4jvHKoiUiI5mBD5PZpew4N8teFyZvdwWZjVaheiBeaOfZKaFkMkkNS4aUud5z5J0x0B4e8RPIPV1cPFs_i3V65b5EFB9sASp9Pm08&sa=X&ved=2ahUKEwj18JKb46iQAxWmZ0EAHaR8ESMQ3PALegQIKRAF&biw=1536&bih=695&dpr=1.25" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-all">
              Google
            </a>
          </p>
        </div>

        <Carousel opts={{
        align: "start",
        loop: true
      }} className="w-full max-w-6xl mx-auto mb-20">
          <CarouselContent className="-ml-4">
            {placeData.reviews?.map((review, index) => <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="h-full border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <img src={review.profile_photo_url} alt={review.author_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-border/50" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {review.author_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed line-clamp-6 flex-1 text-sm">
                      {review.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
                      {new Date(review.time * 1000).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>)}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>

        <div className="max-w-3xl mx-auto">
          <Card className="border border-border/50 shadow-lg overflow-hidden">
            <div className="bg-muted/30 px-8 py-6 border-b border-border/50">
              <h3 className="text-2xl font-bold text-center text-foreground">
                Comparte tu Experiencia
              </h3>
              <p className="text-muted-foreground text-center mt-2">
                Tu opinión nos ayuda a mejorar cada día · Valoración anónima
              </p>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Label className="text-base font-medium">Califica tu experiencia</Label>
                  {renderInteractiveStars()}
                  {rating > 0 && <p className="text-sm font-medium text-primary">
                      {rating === 5 && "¡Excelente!"}
                      {rating === 4 && "Muy bueno"}
                      {rating === 3 && "Bueno"}
                      {rating === 2 && "Regular"}
                      {rating === 1 && "Necesita mejorar"}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment" className="text-base">Tu opinión (opcional)</Label>
                  <Textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} placeholder="Cuéntanos qué te ha gustado o qué podríamos mejorar..." rows={4} className="resize-none" />
                </div>

                <Button type="submit" className="w-full text-base py-6" size="lg" disabled={submitting}>
                  {submitting ? "Enviando..." : "Enviar Valoración"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};