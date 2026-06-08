import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

type FilterType = "all" | "month" | "stars";

interface ReviewsManagerProps {
  tenantId: string;
}

export function ReviewsManager({ tenantId }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [tenantId]);

  useEffect(() => {
    applyFilters();
  }, [reviews, filterType, selectedMonth, selectedStars]);

  const fetchReviews = async () => {
    try {
      // Fetch ALL reviews (both approved and pending) for the tenant
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

  const applyFilters = () => {
    let filtered = [...reviews];

    if (filterType === "month" && selectedMonth) {
      filtered = filtered.filter((review) => {
        const reviewMonth = format(new Date(review.created_at), "yyyy-MM");
        return reviewMonth === selectedMonth;
      });
    } else if (filterType === "stars" && selectedStars > 0) {
      filtered = filtered.filter((review) => review.rating === selectedStars);
    }

    setFilteredReviews(filtered);
  };

  const handleDeleteReview = async (id: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Reseña eliminada",
        description: "La reseña se ha eliminado correctamente",
      });

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

  const renderStars = (rating: number) => (
    <span style={{ display: "inline-flex", gap: 2, color: "var(--gp-warn)" }}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} style={{ width: 14, height: 14, opacity: i < rating ? 1 : 0.22, fill: "currentColor" }} />
      ))}
    </span>
  );

  const getAvailableMonths = () => {
    const months = new Set<string>();
    reviews.forEach((review) => {
      const month = format(new Date(review.created_at), "yyyy-MM");
      months.add(month);
    });
    return Array.from(months).sort().reverse();
  };

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy", { locale: es });
  };

  return (
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div className="gp-page-h">
        <div>
          <h2>Reseñas</h2>
          <p>Lo que opinan tus clientas · {filteredReviews.length} reseñas</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <div className="gp-subtabs" style={{ margin: 0 }}>
          {(["all", "month", "stars"] as FilterType[]).map((f) => (
            <button key={f} className={`gp-subtab${filterType === f ? " on" : ""}`} onClick={() => setFilterType(f)}>
              {f === "all" ? "Todas" : f === "month" ? "Por mes" : "Por estrellas"}
            </button>
          ))}
        </div>
        {filterType === "month" && (
          <div className="gp-subtabs" style={{ margin: 0 }}>
            {getAvailableMonths().map((month) => (
              <button key={month} className={`gp-subtab${selectedMonth === month ? " on" : ""}`} onClick={() => setSelectedMonth(month)}>
                {getMonthLabel(month)}
              </button>
            ))}
          </div>
        )}
        {filterType === "stars" && (
          <div className="gp-subtabs" style={{ margin: 0 }}>
            {[5, 4, 3, 2, 1].map((stars) => (
              <button key={stars} className={`gp-subtab${selectedStars === stars ? " on" : ""}`} onClick={() => setSelectedStars(stars)}>
                {stars} <Star style={{ width: 11, height: 11, fill: "currentColor", color: "var(--gp-warn)" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--gp-muted-c)" }}>Cargando...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="gp-card">
          <div className="gp-empty">
            <div className="gp-empty-ic"><Star style={{ width: 24, height: 24 }} /></div>
            <h4>Sin reseñas</h4>
            <p>No hay reseñas para este filtro</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredReviews.map((review) => (
            <div key={review.id} className="gp-card pad" style={!review.approved ? { borderColor: "color-mix(in oklab, var(--gp-warn), white 55%)", background: "var(--gp-warn-soft)" } : {}}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {renderStars(review.rating)}
                  <span style={{ fontSize: 12.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>
                    {format(new Date(review.created_at), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`gp-badge ${review.approved ? "ok" : "warn"}`}>
                    <span className="pip" style={{ background: "currentColor" }} />
                    {review.approved ? "Publicada" : "Pendiente"}
                  </span>
                  <button className="gp-btn sm danger" onClick={() => setReviewToDelete(review.id)}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: review.comment ? "var(--gp-ink2)" : "var(--gp-muted-c)", fontStyle: review.comment ? "normal" : "italic" }}>
                {review.comment || "Sin comentario"}
              </p>
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
              Esta acción no se puede deshacer. La reseña será eliminada
              permanentemente.
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
