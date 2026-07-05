import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SectionHeader } from "./_shared/SectionHeader";
import { useT } from "@/lib/tenantI18n";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
}

interface TenantReviewsSectionProps {
  tenantId: string;
  tenantName?: string;
  primaryColor?: string;
}

const RANDOM_NAMES = [
  "María García", "Laura Martínez", "Carmen López", "Ana Fernández",
  "Paula Sánchez", "Lucía Romero", "Elena Torres", "Sara Ruiz",
  "Marta Díaz", "Claudia Moreno", "Patricia Gil", "Andrea Navarro",
  "Nuria Jiménez", "Cristina Vega", "Isabel Castro", "Silvia Ortega",
  "Raquel Molina", "Beatriz Ramos", "Alicia Serrano", "Inés Blanco",
];

const seededRandom = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const getDisplayName = (fullName: string | null | undefined, reviewId: string): string => {
  if (!fullName || fullName === "Cliente") return "Cliente";
  if (fullName.toLowerCase().includes("xavi")) {
    return RANDOM_NAMES[seededRandom(reviewId) % RANDOM_NAMES.length].split(" ")[0];
  }
  return fullName.trim().split(" ")[0].slice(0, 15);
};

const getFullDisplayName = (fullName: string | null | undefined, reviewId: string): string => {
  if (!fullName) return "Cliente";
  if (fullName.toLowerCase().includes("xavi")) {
    return RANDOM_NAMES[seededRandom(reviewId) % RANDOM_NAMES.length];
  }
  return fullName;
};

const getInitials = (fullName: string | null | undefined, reviewId: string): string => {
  if (!fullName) return "C";
  const displayName = getFullDisplayName(fullName, reviewId);
  const parts = displayName.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const TenantReviewsSection = ({ tenantId, primaryColor }: TenantReviewsSectionProps) => {
  const t = useT();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const accent = primaryColor || "hsl(var(--primary))";

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase.rpc("get_tenant_reviews", {
          p_tenant_id: tenantId,
          p_limit: 50,
        });
        if (error) throw error;
        if (data && data.length > 0) {
          setReviews(data as Review[]);
          setTotalReviews(data.length);
          const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };
    if (tenantId) fetchReviews();
  }, [tenantId]);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const formatDateShort = (s: string) =>
    new Date(s).toLocaleDateString("es-ES", { month: "short", year: "numeric" });

  if (loading) {
    return (
      <section className="py-20 md:py-28 bg-[#fafaf7]">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <Skeleton className="h-12 w-72 mb-4" />
          <Skeleton className="h-px w-16 mb-12" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <>
      <section id="resenas" className="py-20 md:py-28 bg-[#fafaf7]">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
            <SectionHeader
              eyebrow={t("reviews.eyebrow")}
              title={
                <>
                  {t("reviews.titlePre")}<span className="font-editorial-italic">{t("reviews.titleAccent")}</span>
                </>
              }
              accentColor={primaryColor}
              className="mb-0 max-w-2xl"
            />

            {/* Aggregate rating */}
            <div className="flex items-end gap-4">
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1 justify-end">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4"
                      style={{ color: accent, fill: star <= Math.round(averageRating) ? accent : "transparent" }}
                    />
                  ))}
                </div>
                <div className="font-editorial text-3xl text-neutral-900 leading-none tabular-nums">
                  {averageRating}
                  <span className="text-base text-neutral-400">/5</span>
                </div>
                <div className="text-xs font-body text-neutral-500 mt-1 tabular-nums">
                  Basado en {totalReviews} reseñas
                </div>
              </div>
            </div>
          </div>

          <Carousel opts={{ align: "start", loop: reviews.length > 3 }} className="w-full">
            <CarouselContent className="-ml-4">
              {reviews.map((review) => (
                <CarouselItem
                  key={review.id}
                  className="pl-4 basis-[300px] md:basis-[360px]"
                >
                  <article
                    tabIndex={0}
                    aria-label={`Leer reseña de ${getDisplayName(review.reviewer_name, review.id)}`}
                    onClick={() => setSelectedReview(review)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedReview(review);
                      }
                    }}
                    className="group relative w-full h-[260px] cursor-pointer bg-white p-7 flex flex-col rounded-2xl border border-neutral-200/80 shadow-[0_8px_24px_-16px_rgba(20,22,40,0.12)] hover:shadow-[0_16px_36px_-16px_rgba(20,22,40,0.18)] transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      "--tw-ring-color": accent,
                    } as React.CSSProperties & Record<"--tw-ring-color", string>}
                  >
                    {/* Decorative quote mark */}
                    <Quote
                      className="absolute top-5 right-5 w-7 h-7 opacity-[0.07]"
                      style={{ color: accent }}
                      strokeWidth={1.5}
                    />

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="h-3.5 w-3.5"
                          style={{
                            color: accent,
                            fill: star <= review.rating ? accent : "transparent",
                          }}
                        />
                      ))}
                    </div>

                    {/* Comment — editorial italic */}
                    {review.comment ? (
                      <p className="font-editorial-italic text-[17px] text-neutral-800 leading-[1.45] line-clamp-4 flex-1">
                        “{review.comment}”
                      </p>
                    ) : (
                      <p className="font-body text-sm text-neutral-400 italic flex-1">Sin comentario</p>
                    )}

                    {/* Author */}
                    <div className="flex items-center gap-3 mt-5 pt-5 border-t border-neutral-200/60">
                      {review.reviewer_avatar ? (
                        <img
                          src={review.reviewer_avatar}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center font-body font-semibold text-[12px] flex-shrink-0"
                          style={{
                            background: `color-mix(in oklab, ${accent}, white 88%)`,
                            color: accent,
                          }}
                        >
                          {getInitials(review.reviewer_name, review.id)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-semibold text-neutral-900 text-sm leading-tight">
                          {getDisplayName(review.reviewer_name, review.id)}
                        </p>
                        <p className="text-[11px] font-body text-neutral-500 mt-0.5">
                          {formatDateShort(review.created_at)}
                        </p>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-5 h-11 w-11 bg-white border-neutral-200 shadow-md" />
            <CarouselNext className="hidden md:flex -right-5 h-11 w-11 bg-white border-neutral-200 shadow-md" />
          </Carousel>
        </div>
      </section>

      {/* Review Detail Modal */}
      <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Reseña completa</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="p-8 flex flex-col items-center text-center bg-[#fafaf7]">
              {selectedReview.reviewer_avatar ? (
                <img
                  src={selectedReview.reviewer_avatar}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover mb-4"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center font-body font-bold text-lg mb-4"
                  style={{
                    background: `color-mix(in oklab, ${accent}, white 85%)`,
                    color: accent,
                  }}
                >
                  {getInitials(selectedReview.reviewer_name, selectedReview.id)}
                </div>
              )}

              <p className="font-editorial text-2xl text-neutral-900 mb-1">
                {getFullDisplayName(selectedReview.reviewer_name, selectedReview.id)}
              </p>
              <p className="text-xs font-body text-neutral-500 mb-4 tracking-wide">
                {formatDate(selectedReview.created_at)}
              </p>

              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5"
                    style={{
                      color: accent,
                      fill: star <= selectedReview.rating ? accent : "transparent",
                    }}
                  />
                ))}
              </div>

              {selectedReview.comment ? (
                <p className="font-editorial-italic text-lg text-neutral-800 leading-relaxed">
                  “{selectedReview.comment}”
                </p>
              ) : (
                <p className="font-body text-sm text-neutral-400 italic">Sin comentario</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TenantReviewsSection;
