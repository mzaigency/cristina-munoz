import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              onClick={() => setFilterType("all")}
              size="sm"
            >
              Todas
            </Button>
            <Button
              variant={filterType === "month" ? "default" : "outline"}
              onClick={() => setFilterType("month")}
              size="sm"
            >
              Por Mes
            </Button>
            <Button
              variant={filterType === "stars" ? "default" : "outline"}
              onClick={() => setFilterType("stars")}
              size="sm"
            >
              Por Estrellas
            </Button>
          </div>

          {filterType === "month" && (
            <div className="mt-4 flex flex-wrap gap-2">
              {getAvailableMonths().map((month) => (
                <Button
                  key={month}
                  variant={selectedMonth === month ? "default" : "outline"}
                  onClick={() => setSelectedMonth(month)}
                  size="sm"
                >
                  {getMonthLabel(month)}
                </Button>
              ))}
            </div>
          )}

          {filterType === "stars" && (
            <div className="mt-4 flex gap-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <Button
                  key={stars}
                  variant={selectedStars === stars ? "default" : "outline"}
                  onClick={() => setSelectedStars(stars)}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {stars}
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Reseñas ({filteredReviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Cargando...</p>
          ) : filteredReviews.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay reseñas</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estrellas</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id} className={!review.approved ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                      <TableCell className="whitespace-nowrap">
                        {format(
                          new Date(review.created_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: es }
                        )}
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-md">
                        {review.comment || (
                          <span className="text-muted-foreground italic">
                            Sin comentario
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.approved ? "default" : "secondary"}>
                          {review.approved ? "Publicada" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReviewToDelete(review.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
