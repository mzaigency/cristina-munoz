import { useMemo } from "react";
import { Navigation, Zap, Sparkles } from "lucide-react";
import { PremiumSalonCard } from "@/components/feed/PremiumSalonCard";
import { FeedSection, FeedCarouselItem } from "./FeedSection";
import { rememberSectionClick, trackEvent, type FeedSectionId } from "@/lib/telemetry";

type SectionId = "near" | "today" | "foryou";

interface SalonItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  tagline: string | null;
  average_price: number | null;
  avgRating: number | null;
  reviewCount: number;
  features: { business_type?: string; [k: string]: unknown } | null;
  distance?: number | null;
  formattedDistance?: string | null;
  created_at?: string | null;
}

interface DiscoverSectionsProps {
  salons: SalonItem[];
  hasLocation: boolean;
  tenantsWithAvailability: string[];
  scoresMap: Map<string, { score: number; matchReasons?: string[] }>;
  hasRecommendations: boolean;
  onRequestLocation: () => void;
  geoLoading: boolean;
}

const CAROUSEL_LIMIT = 8;

export function DiscoverSections({
  salons,
  hasLocation,
  tenantsWithAvailability,
  scoresMap,
  hasRecommendations,
  onRequestLocation,
  geoLoading,
}: DiscoverSectionsProps) {
  // 1. HUECOS HOY (carrusel)
  const today = useMemo(
    () => salons.filter((s) => tenantsWithAvailability.includes(s.id)).slice(0, CAROUSEL_LIMIT),
    [salons, tenantsWithAvailability],
  );

  // 2. CERCA DE TI (carrusel)
  const nearby = useMemo(() => {
    if (!hasLocation) return [];
    return [...salons]
      .filter((s) => s.distance !== null && s.distance !== undefined)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, CAROUSEL_LIMIT);
  }, [salons, hasLocation]);

  // 3. PARA TI (grid vertical principal, dedup contra los carruseles)
  const dedupSet = useMemo(() => {
    const ids = new Set<string>();
    today.forEach((s) => ids.add(s.id));
    nearby.forEach((s) => ids.add(s.id));
    return ids;
  }, [today, nearby]);

  const forYou = useMemo(() => {
    const remaining = salons.filter((s) => !dedupSet.has(s.id));
    if (hasRecommendations && scoresMap.size > 0) {
      return [...remaining].sort((a, b) => {
        const sa = scoresMap.get(a.id)?.score ?? 0;
        const sb = scoresMap.get(b.id)?.score ?? 0;
        if (sb !== sa) return sb - sa;
        // tiebreak: rating + reviews
        const ra = a.avgRating ?? 0;
        const rb = b.avgRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.reviewCount - a.reviewCount;
      });
    }
    // Sin recomendaciones: mejor valoración primero, luego nº reseñas
    return [...remaining].sort((a, b) => {
      const ra = a.avgRating ?? 0;
      const rb = b.avgRating ?? 0;
      if (rb !== ra) return rb - ra;
      return b.reviewCount - a.reviewCount;
    });
  }, [salons, dedupSet, hasRecommendations, scoresMap]);

  const renderCarousel = (list: SalonItem[], sectionId: SectionId) =>
    list.map((salon, index) => {
      const rec = scoresMap.get(salon.id);
      return (
        <FeedCarouselItem
          key={`${sectionId}-${salon.id}`}
          sectionId={sectionId as FeedSectionId}
          tenantId={salon.id}
          position={index}
          score={rec?.score}
        >
          <PremiumSalonCard
            salon={salon}
            index={index}
            distance={salon.formattedDistance}
            hasAvailabilityToday={tenantsWithAvailability.includes(salon.id)}
            recommendationScore={rec?.score}
            matchReasons={rec?.matchReasons}
          />
        </FeedCarouselItem>
      );
    });

  const renderFeaturedGrid = (list: SalonItem[]) =>
    list.map((salon, index) => {
      const rec = scoresMap.get(salon.id);
      const handleClickCapture = () => {
        rememberSectionClick("foryou", salon.id, index, rec?.score);
        void trackEvent({
          event_type: "click",
          section_id: "foryou",
          tenant_id: salon.id,
          position: index,
          score: rec?.score ?? null,
          metadata: { kind: "card", layout: "featured-grid" },
        });
      };
      return (
        <div key={`foryou-${salon.id}`} onClickCapture={handleClickCapture}>
          <PremiumSalonCard
            salon={salon}
            index={index}
            distance={salon.formattedDistance}
            hasAvailabilityToday={tenantsWithAvailability.includes(salon.id)}
            recommendationScore={rec?.score}
            matchReasons={rec?.matchReasons}
            variant="featured"
          />
        </div>
      );
    });

  return (
    <div className="space-y-1">
      {/* HUECOS HOY */}
      {today.length > 0 && (
        <FeedSection
          icon={Zap}
          title="Disponibles hoy"
          subtitle="Reserva ahora, atiende hoy mismo"
          count={today.length}
          iconTint="emerald"
          sectionId="today"
        >
          {renderCarousel(today, "today")}
        </FeedSection>
      )}

      {/* CERCA DE TI */}
      {hasLocation && nearby.length > 0 && (
        <FeedSection
          icon={Navigation}
          title="Cerca de ti"
          subtitle="Lo más próximo a tu ubicación"
          count={nearby.length}
          iconTint="primary"
          sectionId="near"
        >
          {renderCarousel(nearby, "near")}
        </FeedSection>
      )}

      {!hasLocation && (
        <FeedSection
          icon={Navigation}
          title="Cerca de ti"
          subtitle="Activa tu ubicación para ver salones cercanos"
          iconTint="primary"
          sectionId="near"
        >
          <FeedCarouselItem>
            <button
              onClick={onRequestLocation}
              disabled={geoLoading}
              className="w-full h-full min-h-[260px] liquid-glass-card flex flex-col items-center justify-center gap-3 p-6 text-center hover:scale-[1.02] transition-transform"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-[#99329a] flex items-center justify-center shadow-lg">
                <Navigation className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base mb-1">
                  Activar ubicación
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Descubre salones cerca de ti
                </p>
              </div>
              <span className="mt-1 px-4 py-2 rounded-full gradient-primary text-primary-foreground text-xs font-semibold shadow-md">
                {geoLoading ? "Buscando…" : "Permitir"}
              </span>
            </button>
          </FeedCarouselItem>
        </FeedSection>
      )}

      {/* PARA TI — GRID VERTICAL PRINCIPAL */}
      {forYou.length > 0 && (
        <section className="mt-2">
          <div className="flex items-end justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-gradient-to-br from-primary to-[#99329a] text-white">
                <Sparkles className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold text-foreground leading-tight truncate">
                  {hasRecommendations && scoresMap.size > 0 ? "Recomendados para ti" : "Destacados"}
                  <span className="ml-2 text-xs font-semibold text-muted-foreground">{forYou.length}</span>
                </h2>
                <p className="text-[11px] text-muted-foreground leading-tight truncate">
                  Los mejores salones de la comunidad
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {renderFeaturedGrid(forYou)}
          </div>
        </section>
      )}
    </div>
  );
}
