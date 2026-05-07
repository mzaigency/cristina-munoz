import { useMemo, useState } from "react";
import { Navigation, Zap, Sparkles, Flame, PartyPopper, Heart } from "lucide-react";
import { PremiumSalonCard } from "@/components/feed/PremiumSalonCard";
import { FeedSection, FeedCarouselItem } from "./FeedSection";
import { useFavorites } from "@/hooks/useFavorites";
import { differenceInDays } from "date-fns";
import { rememberSectionClick, trackEvent, type FeedSectionId } from "@/lib/telemetry";

type SectionId = "near" | "today" | "foryou" | "popular" | "new" | "favorites";

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
  const { favorites, isAuthenticated } = useFavorites();
  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    near: false,
    today: false,
    foryou: false,
    popular: false,
    new: false,
    favorites: false,
  });

  const toggle = (id: SectionId) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const nearby = useMemo(() => {
    if (!hasLocation) return [];
    return [...salons]
      .filter((s) => s.distance !== null && s.distance !== undefined)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [salons, hasLocation]);

  const today = useMemo(
    () => salons.filter((s) => tenantsWithAvailability.includes(s.id)),
    [salons, tenantsWithAvailability],
  );

  const forYou = useMemo(() => {
    if (!hasRecommendations || scoresMap.size === 0) return [];
    return [...salons]
      .filter((s) => (scoresMap.get(s.id)?.score ?? 0) > 0)
      .sort(
        (a, b) =>
          (scoresMap.get(b.id)?.score ?? 0) - (scoresMap.get(a.id)?.score ?? 0),
      );
  }, [salons, scoresMap, hasRecommendations]);

  const popular = useMemo(
    () =>
      [...salons]
        .filter(
          (s) =>
            (s.avgRating !== null && s.avgRating >= 4) || s.reviewCount >= 2,
        )
        .sort((a, b) => {
          const ra = a.avgRating ?? 0;
          const rb = b.avgRating ?? 0;
          if (rb !== ra) return rb - ra;
          return b.reviewCount - a.reviewCount;
        }),
    [salons],
  );

  const recent = useMemo(() => {
    const now = new Date();
    return [...salons]
      .filter((s) => {
        if (!s.created_at) return false;
        return differenceInDays(now, new Date(s.created_at)) <= 60;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
      );
  }, [salons]);

  const favs = useMemo(
    () => salons.filter((s) => favorites.includes(s.id)),
    [salons, favorites],
  );

  const renderCards = (
    list: SalonItem[],
    sectionExpanded: boolean,
    sectionId: SectionId,
  ) => {
    const items = sectionExpanded ? list : list.slice(0, CAROUSEL_LIMIT);
    return items.map((salon, index) => {
      const rec = scoresMap.get(salon.id);
      const card = (
        <PremiumSalonCard
          salon={salon}
          index={index}
          distance={salon.formattedDistance}
          hasAvailabilityToday={tenantsWithAvailability.includes(salon.id)}
          recommendationScore={rec?.score}
          matchReasons={rec?.matchReasons}
        />
      );
      if (sectionExpanded) {
        const handleClickCapture = () => {
          rememberSectionClick(sectionId, salon.id, index, rec?.score);
          void trackEvent({
            event_type: "click",
            section_id: sectionId,
            tenant_id: salon.id,
            position: index,
            score: rec?.score ?? null,
            metadata: { kind: "card", layout: "grid" },
          });
        };
        return (
          <div key={`${sectionId}-${salon.id}`} onClickCapture={handleClickCapture}>
            {card}
          </div>
        );
      }
      return (
        <FeedCarouselItem
          key={`${sectionId}-${salon.id}`}
          sectionId={sectionId as FeedSectionId}
          tenantId={salon.id}
          position={index}
          score={rec?.score}
        >
          {card}
        </FeedCarouselItem>
      );
    });
  };

  return (
    <div className="space-y-1">
      {/* 1. FAVORITOS (solo si tiene) */}
      {isAuthenticated && favs.length > 0 && (
        <FeedSection
          icon={Heart}
          title="Tus favoritos"
          subtitle="Vuelve siempre a los que más te gustan"
          count={favs.length}
          expanded={expanded.favorites}
          onToggleExpand={() => toggle("favorites")}
          iconTint="rose"
          sectionId="favorites"
        >
          {renderCards(favs, expanded.favorites, "favorites")}
        </FeedSection>
      )}

      {/* 2. PARA TI */}
      {forYou.length > 0 && (
        <FeedSection
          icon={Sparkles}
          title="Para ti"
          subtitle="Recomendaciones según tus gustos"
          count={forYou.length}
          expanded={expanded.foryou}
          onToggleExpand={() => toggle("foryou")}
          iconTint="primary"
        >
          {renderCards(forYou, expanded.foryou, "foryou")}
        </FeedSection>
      )}

      {/* 3. EN TENDENCIA */}
      {popular.length > 0 && (
        <FeedSection
          icon={Flame}
          title="En tendencia"
          subtitle="Los favoritos de la comunidad"
          count={popular.length}
          expanded={expanded.popular}
          onToggleExpand={() => toggle("popular")}
          iconTint="amber"
        >
          {renderCards(popular, expanded.popular, "popular")}
        </FeedSection>
      )}

      {/* CERCA DE TI */}
      {hasLocation && nearby.length > 0 && (
        <FeedSection
          icon={Navigation}
          title="Cerca de ti"
          subtitle="Lo más próximo a tu ubicación"
          count={nearby.length}
          expanded={expanded.near}
          onToggleExpand={() => toggle("near")}
          iconTint="primary"
        >
          {renderCards(nearby, expanded.near, "near")}
        </FeedSection>
      )}

      {!hasLocation && (
        <FeedSection
          icon={Navigation}
          title="Cerca de ti"
          subtitle="Activa tu ubicación para ver los salones más cercanos"
          iconTint="primary"
        >
          <FeedCarouselItem>
            <button
              onClick={onRequestLocation}
              disabled={geoLoading}
              className="w-full h-full min-h-[280px] liquid-glass-card flex flex-col items-center justify-center gap-3 p-6 text-center hover:scale-[1.02] transition-transform"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-[#99329a] flex items-center justify-center shadow-lg">
                <Navigation className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base mb-1">
                  Activar ubicación
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Descubre salones cerca de ti y ahorra tiempo
                </p>
              </div>
              <span className="mt-1 px-4 py-2 rounded-full gradient-primary text-primary-foreground text-xs font-semibold shadow-md">
                {geoLoading ? "Buscando…" : "Permitir"}
              </span>
            </button>
          </FeedCarouselItem>
        </FeedSection>
      )}

      {/* HUECOS HOY */}
      {today.length > 0 && (
        <FeedSection
          icon={Zap}
          title="Huecos hoy"
          subtitle="Reserva ahora, atiende hoy mismo"
          count={today.length}
          expanded={expanded.today}
          onToggleExpand={() => toggle("today")}
          iconTint="emerald"
        >
          {renderCards(today, expanded.today, "today")}
        </FeedSection>
      )}

      {/* RECIÉN LLEGADOS */}
      {recent.length > 0 && (
        <FeedSection
          icon={PartyPopper}
          title="Recién llegados"
          subtitle="Los nuevos salones de GlowApp"
          count={recent.length}
          expanded={expanded.new}
          onToggleExpand={() => toggle("new")}
          iconTint="primary"
        >
          {renderCards(recent, expanded.new, "new")}
        </FeedSection>
      )}
    </div>
  );
}
