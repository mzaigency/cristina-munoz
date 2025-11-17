import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, X, Eye } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  approved: boolean;
}

export function ReviewsModerator() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    
    // Real-time subscription
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
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

  const handleApproveReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Reseña aprobada",
        description: "La reseña ahora es visible públicamente",
      });

      fetchReviews();
    } catch (error) {
      console.error("Error approving review:", error);
      toast({
        title: "Error",
        description: "No se pudo aprobar la reseña",
        variant: "destructive",
      });
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ approved: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Reseña rechazada",
        description: "La reseña ha sido ocultada del público",
      });

      fetchReviews();
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la reseña",
        variant: "destructive",
      });
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

  const pendingReviews = reviews.filter(r => !r.approved);
  const approvedReviews = reviews.filter(r => r.approved);

  const ReviewsTable = ({ reviewsList, showActions }: { reviewsList: Review[], showActions: boolean }) => (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Calificación</TableHead>
            <TableHead>Comentario</TableHead>
            <TableHead>Estado</TableHead>
            {showActions && <TableHead>Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviewsList.map((review) => (
            <TableRow key={review.id}>
              <TableCell className="text-xs">
                {format(new Date(review.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
              </TableCell>
              <TableCell>{renderStars(review.rating)}</TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm line-clamp-2">{review.comment || "Sin comentario"}</p>
              </TableCell>
              <TableCell>
                {review.approved ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Aprobada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Pendiente
                  </Badge>
                )}
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-2">
                    {!review.approved ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveReview(review.id)}
                          className="bg-green-50 hover:bg-green-100 border-green-300"
                        >
                          <Check className="h-4 w-4 text-green-700" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectReview(review.id)}
                          className="bg-red-50 hover:bg-red-100 border-red-300"
                        >
                          <X className="h-4 w-4 text-red-700" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectReview(review.id)}
                        className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                      >
                        <Eye className="h-4 w-4 text-yellow-700 mr-1" />
                        <span className="text-xs">Ocultar</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Moderación de Reseñas</span>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            {pendingReviews.length} pendientes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
            <TabsTrigger value="pending">
              Pendientes ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprobadas ({approvedReviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
                <p>No hay reseñas pendientes de moderación</p>
              </div>
            ) : (
              <ReviewsTable reviewsList={pendingReviews} showActions={true} />
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay reseñas aprobadas</p>
              </div>
            ) : (
              <ReviewsTable reviewsList={approvedReviews} showActions={true} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
