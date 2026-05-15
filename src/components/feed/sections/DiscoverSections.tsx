import { useMemo, useState } from "react";
import { Navigation, Zap, Sparkles, Heart, History } from "lucide-react";
import { PremiumSalonCard } from "@/components/feed/PremiumSalonCard";
import { FeedSection, FeedCarouselItem } from "./FeedSection";
import { useFavorites } from "@/hooks/useFavorites";
import { useVisitedTenants } from "@/hooks/useVisitedTenants";
import { type FeedSectionId } from "@/lib/telemetry";

type SectionId = "today" | "near" | "favorites" | "visited" | "foryou";

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

const CAROUSEL_LIMIT = 10;

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
  const { tenantIds: visitedIds } = useVisitedTenants();

  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    today: false,
    near: false,
    favorites: false,
    visited: false,
    foryou: false,
  });
  const toggle = (id: SectionId) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const byId = useMemo(() => {
    const m = new Map<string, SalonItem>();
    salons.forEach((s) => m.set(s.id, s));
    return m;
  }, [salons]);

  // 1. DISPONIBLES HOY
  const today = useMemo(
    () => salons.filter((s) => tenantsWithAvailability.includes(s.id)),
    [salons, tenantsWithAvailability],
  );

  // 2. CERCA DE TI
  const nearby = useMemo(() => {
    if (!hasLocation) return [];
    return [...salons]
      .filter((s) => s.distance !== null && s.distance !== undefined)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [salons, hasLocation]);

  // 3. FAVORITOS
  const favs = useMemo(
    () =>
      favorites
        .map((id) => byId.get(id))
        .filter((s): s is SalonItem => Boolean(s)),
    [favorites, byId],
  );

  // 4. VOLVER A VISITAR (excluye favoritos para no duplicar emoción)
  const visited = useMemo(() => {
    const favSet = new Set(favorites);
    return visitedIds
      .filter((id) => !favSet.has(id))
      .map((id) => byId.get(id))
      .filter((s): s is SalonItem => Boolean(s));
  }, [visitedIds, favorites, byId]);

  // 5. RECOMENDADOS PARA TI (excluye lo ya mostrado en otras secciones)
  const dedupSet = useMemo(() => {
    const ids = new Set<string>();
    today.slice(0, CAROUSEL_LIMIT).forEach((s) => ids.add(s.id));
    nearby.slice(0, CAROUSEL_LIMIT).forEach((s) => ids.add(s.id));
    favs.slice(0, CAROUSEL_LIMIT).forEach((s) => ids.add(s.id));
    visited.slice(0, CAROUSEL_LIMIT).forEach((s) => ids.add(s.id));
    return ids;
  }, [today, nearby, favs, visited]);

  const forYou = useMemo(() => {
    const remaining = salons.filter((s) => !dedupSet.has(s.id));
    if (hasRecommendations && scoresMap.size > 0) {
      return [...remaining].sort((a, b) => {
        const sa = scoresMap.get(a.id)?.score ?? 0;
        const sb = scoresMap.get(b.id)?.score ?? 0;
        if (sb !== sa) return sb - sa;
        const ra = a.avgRating ?? 0;
        const rb = b.avgRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b.reviewCount - a.reviewCount;
      });
    }
    return [...remaining].sort((a, b) => {
      const ra = a.avgRating ?? 0;
      const rb = b.avgRating ?? 0;
      if (rb !== ra) return rb - ra;
      return b.reviewCount - a.reviewCount;
    });
  }, [salons, dedupSet, hasRecommendations, scoresMap]);

  const renderCards = (
    list: SalonItem[],
    sectionId: SectionId,
    sectionExpanded: boolean,
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
        return (
          <div key={`${sectionId}-${salon.id}`}>{card}</div>
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
      {/* 1. DISPONIBLES HOY (siempre visible si hay) */}
      {today.length > 0 && (
        <FeedSection
          icon={Zap}
          title="Disponibles hoy"
          subtitle="Reserva ahora, atiende hoy mismo"
          count={today.length}
          expanded={expanded.today}
          onToggleExpand={today.length > CAROUSEL_LIMIT ? () => toggle("today") : undefined}
          iconTint="emerald"
          sectionId="today"
        >
          {renderCards(today, "today", expanded.today)}
        </FeedSection>
      )}

      {/* 2. CERCA DE TI */}
      {hasLocation && nearby.length > 0 && (
        <FeedSection
          icon={Navigation}
          title="Cerca de ti"
          subtitle="Lo más próximo a tu ubicación"
          count={nearby.length}
          expanded={expanded.near}
          onToggleExpand={nearby.length > CAROUSEL_LIMIT ? () => toggle("near") : undefined}
          iconTint="primary"
          sectionId="near"
        >
          {renderCards(nearby, "near", expanded.near)}
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

      {/* 3. FAVORITOS */}
      {isAuthenticated && favs.length > 0 && (
        <FeedSection
          icon={Heart}
          title="Tus favoritos"
          subtitle="Vuelve a los que más te gustan"
          count={favs.length}
          expanded={expanded.favorites}
          onToggleExpand={favs.length > CAROUSEL_LIMIT ? () => toggle("favorites") : undefined}
          iconTint="rose"
          sectionId="favorites"
        >
          {renderCards(favs, "favorites", expanded.favorites)}
        </FeedSection>
      )}

      {/* 4. VOLVER A VISITAR */}
      {isAuthenticated && visited.length > 0 && (
        <FeedSection
          icon={History}
          title="Volver a visitar"
          subtitle="Salones donde ya has reservado"
          count={visited.length}
          expanded={expanded.visited}
          onToggleExpand={visited.length > CAROUSEL_LIMIT ? () => toggle("visited") : undefined}
          iconTint="amber"
          sectionId="favorites"
        >
          {renderCards(visited, "visited", expanded.visited)}
        </FeedSection>
      )}

      {/* 5. RECOMENDADOS PARA TI (carrusel también) */}
      {forYou.length > 0 && (
        <FeedSection
          icon={Sparkles}
          title={hasRecommendations && scoresMap.size > 0 ? "Recomendados para ti" : "Destacados"}
          subtitle="Los mejores de la comunidad"
          count={forYou.length}
          expanded={expanded.foryou}
          onToggleExpand={forYou.length > CAROUSEL_LIMIT ? () => toggle("foryou") : undefined}
          iconTint="primary"
          sectionId="foryou"
        >
          {renderCards(forYou, "foryou", expanded.foryou)}
        </FeedSection>
      )}
    </div>
  );
}
