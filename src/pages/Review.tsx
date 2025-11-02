import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Review = () => {
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const { error } = await supabase.functions.invoke('submit-review', {
        body: { rating, comment }
      });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu valoración!",
        description: "Tu opinión es muy importante para nosotros",
      });

      // Reset form
      setRating(0);
      setComment("");
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar tu valoración. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderInteractiveStars = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? "fill-primary text-primary"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={() => {}} activeSection="valoracion" />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Déjanos tu Valoración</h1>
            <p className="text-muted-foreground">
              Tu opinión nos ayuda a mejorar nuestros servicios
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg border border-border p-8">
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div className="space-y-2">
                <Label>Valoración *</Label>
                {renderInteractiveStars()}
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Has seleccionado {rating} estrella{rating !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Tu opinión</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Cuéntanos tu experiencia (opcional)"
                  rows={5}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar Valoración"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Review;
