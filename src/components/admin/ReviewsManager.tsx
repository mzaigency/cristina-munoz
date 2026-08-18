import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, TrendingUp, Share2, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  approved: boolean;
}

type FilterType = "all"|"pending"|"month"|"stars";

interface ReviewsManagerProps {
  tenantId: string;
}

export function ReviewsManager({ tenantId }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    fetchSlug();
  }, [tenantId]);

  const fetchSlug = async () => {
    const { data } = await supabase.from("tenants").select("slug").eq("id", tenantId).single();
    if (data?.slug) setTenantSlug(data.slug);
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reseñas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const approved = reviews.filter((r) => r.approved);
    const pending = reviews.filter((r) => !r.approved);
    const avg =
      approved.length > 0
        ? approved.reduce((acc, r) => acc + r.rating, 0) / approved.length
        : 0;
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    approved.forEach((r) => {
      const k = Math.max(1, Math.min(5, Math.round(r.rating)));
      dist[k] += 1;
    });
    return { avg, dist, total: approved.length, pending: pending.length };
  }, [reviews]);

  const monthlyEvolution = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; avg: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const monthStart = startOfMonth(m);
      const monthEnd = startOfMonth(subMonths(now, i - 1));
      const monthReviews = reviews.filter((r) => {
        if (!r.approved) return false;
        const d = new Date(r.created_at);
        return d >= monthStart && d < monthEnd;
      });
      const avg = monthReviews.length
        ? monthReviews.reduce((a, r) => a + r.rating, 0) / monthReviews.length
        : 0;
      months.push({
        key: format(m, "yyyy-MM"),
        label: format(m, "MMM", { locale: es }),
        avg,
        count: monthReviews.length,
      });
    }
    return months;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];
    if (filterType === "pending") {
      filtered = filtered.filter((r) => !r.approved);
    } else if (filterType === "month"&& selectedMonth) { filtered = filtered.filter( (review) => format(new Date(review.created_at),"yyyy-MM") === selectedMonth
      );
    } else if (filterType === "stars" && selectedStars > 0) {
      filtered = filtered.filter((review) => review.rating === selectedStars);
    }
    return filtered;
  }, [reviews, filterType, selectedMonth, selectedStars]);

  const handleDeleteReview = async (id: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Reseña eliminada" });
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la reseña",
        variant: "destructive",
      });
    } finally {
      setReviewToDelete(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved: true })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Reseña aprobada"}); fetchReviews(); } catch (error) { const err = error as Error; toast({ title:"Error", description: err.message, variant: "destructive"}); } }; const shareReview = (r: Review) => { const link = `https://glowapp.app/${tenantSlug}`; const stars ="⭐".repeat(r.rating);
    const text = r.comment
      ? `${stars}\n"${r.comment}"\n— Mira más reseñas y reserva: ${link}`
      : `${stars}\nMira las reseñas y reserva: ${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const copyReview = (r: Review) => {
    const stars = "⭐".repeat(r.rating);
    const text = r.comment ? `${stars}\n"${r.comment}"` : stars;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiada al portapapeles"}); }; const renderStars = (rating: number) => ( <span style={{ display:"inline-flex", gap: 2, color: "var(--gp-warn)"}}> {[...Array(5)].map((_, i) => ( <Star key={i} style={{ width: 14, height: 14, opacity: i < rating ? 1 : 0.22, fill:"currentColor",
          }}
        />
      ))}
    </span>
  );

  const getAvailableMonths = () => {
    const months = new Set<string>();
    reviews.forEach((review) => {
      months.add(format(new Date(review.created_at), "yyyy-MM"));
    });
    return Array.from(months).sort().reverse();
  };

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy", { locale: es });
  };

  const maxDist = Math.max(1, ...Object.values(stats.dist));
  const maxMonthlyCount = Math.max(1, ...monthlyEvolution.map((m) => m.count));

  return (
    <div className="gp-fade gp-mkt-reviews-page">
      <div className="gp-page-h">
        <div>
          <h2>Reseñas</h2>
          <p>
            {stats.total} aprobadas · {stats.pending} pendientes ·{" "}
            {stats.avg ? `${stats.avg.toFixed(1)}★ promedio` : "Sin valoración aún"}
          </p>
        </div>
      </div>

      {/* Stats grid: avg + distribution + evolution */}
      <div className="gp-mkt-reviews-stats">
        <div className="gp-card pad gp-mkt-card gp-mkt-rating-card">
          <span className="gp-mkt-rating-big">{stats.avg ? stats.avg.toFixed(1) : "—"}</span>
          <span className="gp-mkt-rating-stars">{renderStars(Math.round(stats.avg))}</span>
          <span className="gp-mkt-rating-meta">
            Sobre {stats.total} reseña{stats.total === 1 ? "":"s"}
          </span>
        </div>

        <div className="gp-card pad gp-mkt-card">
          <div className="gp-mkt-card-h">
            <div>
              <h3>Distribución</h3>
            </div>
          </div>
          <div className="gp-mkt-bars">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = stats.dist[n] ?? 0;
              const pct = Math.round((count / maxDist) * 100);
              return (
                <div key={n} className="gp-mkt-bar-row">
                  <div className="gp-mkt-bar-label">
                    <span>{n}</span>
                    <Star style={{ width: 12, height: 12, fill: "currentColor" }} />
                  </div>
                  <div className="gp-mkt-bar-track">
                    <div className="gp-mkt-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="gp-mkt-bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gp-card pad gp-mkt-card">
          <div className="gp-mkt-card-h">
            <div>
              <h3>Últimos 6 meses</h3>
              <p>Cantidad y media</p>
            </div>
            <TrendingUp style={{ width: 16, height: 16, color: "var(--gp-muted-c)" }} />
          </div>
          <div className="gp-mkt-spark">
            {monthlyEvolution.map((m) => {
              const h = Math.max(4, Math.round((m.count / maxMonthlyCount) * 100));
              return (
                <div key={m.key} className="gp-mkt-spark-col" title={`${m.count} reseñas · ${m.avg.toFixed(1)}★`}>
                  <div className="gp-mkt-spark-bar" style={{ height: `${h}%` }} />
                  <span className="gp-mkt-spark-label">{m.label}</span>
                  <span className="gp-mkt-spark-val">{m.avg ? m.avg.toFixed(1) : "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <div className="gp-subtabs" style={{ margin: 0 }}>
          {(["all", "pending", "month", "stars"] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`gp-subtab${filterType === f ? " on":""}`}
              onClick={() => setFilterType(f)}
            >
              {f === "all"?"Todas": f ==="pending"? `Pendientes${stats.pending > 0 ? ` (${stats.pending})` :""}`
                : f === "month"?"Por mes":"Por estrellas"}
            </button>
          ))}
        </div>
        {filterType === "month" && (
          <div className="gp-subtabs"style={{ margin: 0 }}> {getAvailableMonths().map((month) => ( <button key={month} className={`gp-subtab${selectedMonth === month ?" on":""}`}
                onClick={() => setSelectedMonth(month)}
              >
                {getMonthLabel(month)}
              </button>
            ))}
          </div>
        )}
        {filterType === "stars" && (
          <div className="gp-subtabs"style={{ margin: 0 }}> {[5, 4, 3, 2, 1].map((s) => ( <button key={s} className={`gp-subtab${selectedStars === s ?" on":""}`}
                onClick={() => setSelectedStars(s)}
              >
                {s}{" "}
                <Star
                  style={{ width: 11, height: 11, fill: "currentColor", color: "var(--gp-warn)"}} /> </button> ))} </div> )} </div> {/* Reviews list */} {loading ? ( <div style={{ textAlign:"center", padding: 48, color: "var(--gp-muted-c)" }}>
          Cargando...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic">
              <Star style={{ width: 24, height: 24 }} />
            </div>
            <h4>Sin reseñas</h4>
            <p>No hay reseñas para este filtro</p>
          </div>
        </div>
      ) : (
        <div className="gp-mkt-reviews-list">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className={`gp-card pad gp-mkt-review${!review.approved ? " is-pending":""}`}
            >
              <div className="gp-mkt-review-h">
                <div className="gp-mkt-review-stars-wrap">
                  {renderStars(review.rating)}
                  <span className="gp-mkt-review-date">
                    {format(new Date(review.created_at), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
                <span className={`gp-badge ${review.approved ? "ok":"warn"}`}>
                  <span className="pip"style={{ background:"currentColor"}} /> {review.approved ?"Publicada":"Pendiente"}
                </span>
              </div>
              <p className="gp-mkt-review-comment">
                {review.comment || <em>Sin comentario</em>}
              </p>
              <div className="gp-mkt-review-actions">
                {!review.approved && (
                  <button
                    className="gp-btn sm primary"
                    type="button"
                    onClick={() => handleApprove(review.id)}
                  >
                    <Check style={{ width: 13, height: 13 }} /> Aprobar
                  </button>
                )}
                {review.approved && review.rating >= 4 && (
                  <>
                    <button
                      className="gp-btn sm"
                      type="button"
                      onClick={() => shareReview(review)}
                    >
                      <Share2 style={{ width: 13, height: 13 }} /> Compartir
                    </button>
                    <button
                      className="gp-btn sm"
                      type="button"
                      onClick={() => copyReview(review)}
                    >
                      <Copy style={{ width: 13, height: 13 }} /> Copiar
                    </button>
                  </>
                )}
                <button
                  className="gp-btn sm danger"
                  type="button"
                  onClick={() => setReviewToDelete(review.id)}
                >
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={reviewToDelete !== null}
        onOpenChange={() => setReviewToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La reseña será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reviewToDelete && handleDeleteReview(reviewToDelete)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
