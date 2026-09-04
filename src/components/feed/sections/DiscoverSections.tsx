import { useMemo, useState } from "react";
import { Compass, Clock, Heart, History, Award } from "lucide-react";
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
  // Si tenemos ubicación pero ningún salón tiene distancia calculada
  // (ciudad fuera del mapa de coordenadas), mostramos todos como fallback
  // para que el carrusel nunca quede vacío.
  const nearby = useMemo(() => {
    if (!hasLocation) return [];
    const withDistance = salons.filter(
      (s) => s.distance !== null && s.distance !== undefined,
    );
    if (withDistance.length === 0) return salons;
    return [...withDistance].sort(
      (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
    );
  }, [salons, hasLocation]);

  // 3. FAVORITOS
  const favs = useMemo(
    () =>
      favorites
        .map((id) => byId.get(id))
        .filter((s): s is SalonItem => Boolean(s)),
    [favorites, byId],
  );

  // 4. VOLVER A VISITAR (puede solapar con favoritos, sin problema)
  const visited = useMemo(() => {
    return visitedIds
      .map((id) => byId.get(id))
      .filter((s): s is SalonItem => Boolean(s));
  }, [visitedIds, byId]);

  // 5. RECOMENDADOS PARA TI
  // Permitimos que un salón aparezca en varias secciones (máx 3 en total).
  // Contamos apariciones en las secciones previas; si ya está en 3, lo
  // excluimos de "Recomendados". Si está en menos, puede repetirse aquí.
  const MAX_APPEARANCES = 3;
  const appearanceCount = useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);
    today.slice(0, CAROUSEL_LIMIT).forEach((s) => bump(s.id));
    nearby.slice(0, CAROUSEL_LIMIT).forEach((s) => bump(s.id));
    favs.slice(0, CAROUSEL_LIMIT).forEach((s) => bump(s.id));
    visited.slice(0, CAROUSEL_LIMIT).forEach((s) => bump(s.id));
    return counts;
  }, [today, nearby, favs, visited]);

  const forYou = useMemo(() => {
    const remaining = salons.filter(
      (s) => (appearanceCount.get(s.id) ?? 0) < MAX_APPEARANCES,
    );
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
  }, [salons, appearanceCount, hasRecommendations, scoresMap]);

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
          icon={Clock}
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

      {/* 2. CERCA DE TI — siempre visible */}
      {hasLocation && nearby.length > 0 ? (
        <FeedSection
          icon={Compass}
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
      ) : (
        <FeedSection
          icon={Compass}
          title="Cerca de ti"
          subtitle={
            hasLocation
              ? "Aún no encontramos salones cerca de tu ubicación"
              : "Activa tu ubicación para ver salones cercanos"
          }
          iconTint="primary"
          sectionId="near"
        >
          <FeedCarouselItem>
            <button
              onClick={hasLocation ? undefined : onRequestLocation}
              disabled={geoLoading || hasLocation}
              className="w-full h-full min-h-[320px] rounded-[20px] bg-white dark:bg-surface border border-line shadow-sm flex flex-col items-center justify-center gap-3 p-6 text-center hover:shadow-md transition-all disabled:hover:shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-[var(--glow-brand-soft)] text-[var(--glow-brand)] border border-[var(--glow-brand)]/20 flex items-center justify-center shadow-xs">
                <Compass className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-foreground text-base mb-1">
                  {hasLocation ? "Sin salones cercanos" : "Activar ubicación"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {hasLocation
                    ? "Prueba ampliando tu búsqueda o explora otras secciones"
                    : "Descubre salones cerca de ti"}
                </p>
              </div>
              {!hasLocation && (
                <span className="mt-1 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--glow-brand)] to-[#98329A] text-white text-xs font-bold shadow-sm">
                  {geoLoading ? "Buscando…" : "Permitir"}
                </span>
              )}
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
          sectionId="visited"
        >
          {renderCards(visited, "visited", expanded.visited)}
        </FeedSection>
      )}

      {/* 5. RECOMENDADOS PARA TI (carrusel también) */}
      {forYou.length > 0 && (
        <FeedSection
          icon={Award}
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
