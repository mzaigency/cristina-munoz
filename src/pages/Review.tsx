import { SEO } from "@/components/SEO";
import { useState } from "react";
import { Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/navigation/AppLayout";

const Review = () => {
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Autenticación requerida",
        description: "Por favor, inicia sesión para dejar una reseña",
        variant: "destructive"
      });
      return;
    }

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
      const { data, error } = await supabase.functions.invoke("submit-review", {
        body: { rating, comment }
      });
      
      if (error) {
        let errorMessage = "No se pudo enviar tu valoración.";
        if (error.message) errorMessage = error.message;
        if (data && typeof data === 'object' && 'error' in data) {
          errorMessage = (data as { error: string }).error;
        }
        throw new Error(errorMessage);
      }
      
      toast({
        title: "¡Gracias!",
        description: "Tu valoración ha sido enviada"
      });

      setRating(0);
      setComment("");
      navigate("/perfil");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar tu valoración",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderInteractiveStars = () => (
    <div className="flex gap-3">
      {[...Array(5)].map((_, i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHoveredRating(i + 1)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => setRating(i + 1)}
          className="transition-transform active:scale-90"
        >
          <Star 
            className={`h-10 w-10 transition-all ${
              i < (hoveredRating || rating) 
                ? "fill-amber-400 text-amber-400 scale-110" 
                : "fill-muted text-muted-foreground hover:scale-105"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <AppLayout>
      <SEO 
        title="Deja tu Valoración"
        description="Comparte tu experiencia"
        canonicalUrl="/valoracion"
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Valoración</h1>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">¿Cómo fue tu experiencia?</h2>
            <p className="text-muted-foreground text-sm">Tu opinión nos ayuda a mejorar</p>
          </div>

          <div className="ios-card p-6">
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <Label className="text-base font-medium">Valoración</Label>
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
                  placeholder="Cuéntanos qué te pareció..." 
                  rows={4}
                  className="rounded-xl"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl" 
                disabled={submitting || rating === 0}
              >
                {submitting ? "Enviando..." : "Enviar Valoración"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Review;
