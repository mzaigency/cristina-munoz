import { useState, useEffect } from "react";
import { Star, Send, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SmoothTitle } from "@/components/animations/SmoothTitle";

interface TenantReviewFormProps {
  tenantId: string;
  tenantName: string;
  onReviewSubmitted?: () => void;
}

export const TenantReviewForm = ({ tenantId, tenantName, onReviewSubmitted }: TenantReviewFormProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hasRecentBooking, setHasRecentBooking] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user has had a recent booking at this salon
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("tenant_id", tenantId)
          .gte("Fecha", thirtyDaysAgo.toISOString().split('T')[0])
          .limit(1);
        
        setHasRecentBooking(bookings && bookings.length > 0);
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate("/auth");
      return;
    }

    if (rating === 0) {
      toast({
        title: "Selecciona una valoración",
        description: "Por favor, indica cuántas estrellas le das a tu experiencia",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-review", {
        body: { rating, comment, tenant_id: tenantId }
      });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu reseña!",
        description: "Tu opinión nos ayuda a mejorar"
      });

      setRating(0);
      setComment("");
      onReviewSubmitted?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar tu reseña",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <section id="review-form" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <SmoothTitle>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
              ¿Cómo fue tu experiencia?
            </h2>
          </SmoothTitle>
          <p className="text-center text-muted-foreground mb-8">
            Tu opinión sobre {tenantName} nos ayuda a mejorar
          </p>

          <ScrollReveal>
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border">
              {!user ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Inicia sesión para dejar tu reseña
                  </p>
                  <Button onClick={() => navigate("/auth")} className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Iniciar sesión
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Star Rating */}
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Toca para valorar
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-transform active:scale-90 focus:outline-none"
                        >
                          <Star
                            className={`h-10 w-10 transition-all ${
                              star <= (hoveredRating || rating)
                                ? "fill-amber-400 text-amber-400 scale-110"
                                : "fill-muted text-muted-foreground/50 hover:scale-105"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-sm text-primary font-medium">
                        {rating === 5 && "¡Excelente!"}
                        {rating === 4 && "Muy bueno"}
                        {rating === 3 && "Bueno"}
                        {rating === 2 && "Regular"}
                        {rating === 1 && "Necesita mejorar"}
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Cuéntanos qué te pareció tu visita... (opcional)"
                      rows={4}
                      maxLength={1000}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {comment.length}/1000
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={submitting || rating === 0}
                  >
                    {submitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar reseña
                      </>
                    )}
                  </Button>

                  {!hasRecentBooking && (
                    <p className="text-xs text-center text-muted-foreground">
                      Nota: Las reseñas se publican tras verificación
                    </p>
                  )}
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default TenantReviewForm;