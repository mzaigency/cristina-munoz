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
      const { error } = await supabase.functions.invoke("submit-review", {
        body: { rating, comment },
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
      console.error("Error submitting review:", error);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={() => {}} activeSection="valoracion" />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Déjanos tu Valoración</h1>
            <p className="text-muted-foreground">Tu opinión nos ayuda a mejorar nuestros servicios</p>
          </div>

          <div className="bg-card rounded-lg shadow-lg border border-border p-8">
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <Label className="text-lg">Valoración *</Label>
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
                <Label htmlFor="comment">Tu opinión</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Qué te han parecido nuestros servicios? (Servicio de pelquería, Página web, Asistente de Whatsapp...)"
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
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
