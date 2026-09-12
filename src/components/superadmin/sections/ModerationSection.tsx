import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Image as ImageIcon,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Building2,
  Loader2,
  Calendar,
  Heart,
  MessageSquare,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { logSuperAdminAction } from "@/services/adminAudit";

interface ModerationSectionProps {
  subtab: string;
}

export const ModerationSection: React.FC<ModerationSectionProps> = ({ subtab }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Posts & Stories
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  useEffect(() => {
    if (subtab === "reviews") {
      fetchReviews();
    } else {
      fetchFeedContent();
    }
  }, [subtab]);

  const fetchFeedContent = async () => {
    setLoading(true);
    try {
      const [postsRes, storiesRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id, image_url, caption, likes_count, created_at, tenants(name, slug)")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("salon_stories")
          .select("id, image_url, caption, is_active, views_count, created_at, expires_at, tenants(name, slug)")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      setPosts(postsRes.data || []);
      setStories(storiesRes.data || []);
    } catch (err: any) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, tenants(name, slug)")
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta publicación del feed público?")) return;
    setDeletingId(postId);
    try {
      const targetPost = posts.find((p) => p.id === postId);
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;

      await logSuperAdminAction({
        action: "DELETE_POST",
        target_type: "post",
        target_id: postId,
        target_name: targetPost?.tenants?.name || "Post",
        details: { caption: targetPost?.caption },
      });

      toast({ title: "Publicación eliminada", description: "El contenido ha sido retirado de GlowApp." });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta historia?")) return;
    setDeletingId(storyId);
    try {
      const targetStory = stories.find((s) => s.id === storyId);
      const { error } = await supabase.from("salon_stories").delete().eq("id", storyId);
      if (error) throw error;

      await logSuperAdminAction({
        action: "DELETE_STORY",
        target_type: "story",
        target_id: storyId,
        target_name: targetStory?.tenants?.name || "Historia",
      });

      toast({ title: "Historia eliminada", description: "La historia ha sido eliminada del feed." });
      setStories((prev) => prev.filter((s) => s.id !== storyId));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("¿Eliminar esta reseña permanentemente?")) return;
    try {
      const targetReview = reviews.find((r) => r.id === reviewId);
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw error;

      await logSuperAdminAction({
        action: "DELETE_REVIEW",
        target_type: "review",
        target_id: reviewId,
        target_name: targetReview?.tenants?.name || "Reseña",
        details: { rating: targetReview?.rating, comment: targetReview?.comment },
      });

      toast({ title: "Reseña eliminada", description: "La reseña ha sido retirada del salón." });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Subtab: reviews
  if (subtab === "reviews") {
    const filteredReviews = reviews.filter((r) => {
      if (ratingFilter === "all") return true;
      return r.rating === parseInt(ratingFilter, 10);
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Moderación de Reseñas y Calificaciones
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supervisa las valoraciones vertidas sobre salones y atiende reportes de reseñas falsas o abusivas.
            </p>
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-8.5 px-3 text-xs rounded-xl border border-[var(--glow-line)] bg-card text-foreground outline-none shrink-0"
          >
            <option value="all">Todas las puntuaciones</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 estrellas)</option>
            <option value="4">⭐⭐⭐⭐ (4 estrellas)</option>
            <option value="3">⭐⭐⭐ (3 estrellas)</option>
            <option value="2">⭐⭐ (2 estrellas)</option>
            <option value="1">⭐ (1 estrella - Alerta)</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--glow-brand)]" />
            Cargando reseñas...
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground rounded-2xl">
            No hay reseñas para mostrar con este filtro.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredReviews.map((rev) => (
              <Card
                key={rev.id}
                className="p-4 rounded-2xl border-[var(--glow-line)] bg-card hover:border-[var(--glow-brand-softer)] transition-all shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--glow-brand)]" />
                    <span className="text-xs font-bold text-foreground">
                      {rev.tenants?.name || "Salón"}
                    </span>
                  </div>
                  <div className="flex items-center text-amber-500 gap-0.5 text-xs font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{rev.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-2.5 rounded-xl border border-[var(--glow-line)]/50">
                  "{rev.comment || "Sin comentario escrito."}"
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-[var(--glow-line)]/50 text-[11px] text-muted-foreground">
                  <span>
                    {rev.created_at
                      ? format(new Date(rev.created_at), "dd MMM yyyy", { locale: es })
                      : ""}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="h-7 px-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 text-[11px] gap-1 rounded-lg"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Eliminar</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Subtab por defecto: feed_moderation
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Moderación de Feed e Historias
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Inspecciona las fotos, reels e historias publicadas por salones en el feed público de GlowApp.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--glow-brand)]" />
          Cargando contenido social...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sección Posts */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[var(--glow-brand)]" />
              <span>Publicaciones del Feed ({posts.length})</span>
            </h3>

            {posts.length === 0 ? (
              <div className="p-6 rounded-2xl border border-[var(--glow-line)] text-center text-xs text-muted-foreground">
                No hay publicaciones registradas aún.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="group relative rounded-2xl overflow-hidden border border-[var(--glow-line)] bg-card flex flex-col shadow-2xs"
                  >
                    <div className="relative aspect-square w-full bg-muted overflow-hidden">
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-6 w-6 opacity-40" />
                        </div>
                      )}

                      {/* Botón borrar flotante */}
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletingId === post.id}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="p-2 flex flex-col flex-1 justify-between gap-1 text-[10px]">
                      <span className="font-bold text-foreground truncate">
                        {post.tenants?.name || "Salón"}
                      </span>
                      {post.caption && (
                        <span className="text-muted-foreground line-clamp-1">
                          {post.caption}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground pt-1 border-t border-[var(--glow-line)]/50">
                        <Heart className="h-2.5 w-2.5 text-rose-500 fill-rose-500" />
                        <span>{post.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección Historias */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Historias de Salones ({stories.length})</span>
            </h3>

            {stories.length === 0 ? (
              <div className="p-6 rounded-2xl border border-[var(--glow-line)] text-center text-xs text-muted-foreground">
                No hay historias activas.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {stories.map((st) => (
                  <div
                    key={st.id}
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-[var(--glow-line)] bg-muted group shadow-2xs"
                  >
                    {st.image_url ? (
                      <img src={st.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2 flex flex-col justify-between text-white text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate max-w-[80%]">
                          {st.tenants?.name || "Salón"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteStory(st.id)}
                          className="p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 transition-colors"
                          title="Eliminar historia"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1 opacity-80">
                        <Eye className="h-3 w-3" />
                        <span>{st.views_count || 0} vistas</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
