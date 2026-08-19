import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Star,
  Heart,
  ImagePlus,
  Ticket,
  TrendingUp,
  Users,
  ArrowRight,
  Loader2,
  Eye,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QrAnalytics } from "./QrAnalytics";

interface MarketingOverviewProps {
  tenantId: string;
  onNavigate: (subTab: string) => void;
}

interface OverviewStats {
  postsCount: number;
  totalLikes: number;
  avgRating: number;
  reviewsCount: number;
  pendingReviews: number;
  activePromos: number;
  promosUses: number;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

interface TopPost {
  id: string;
  image_url: string;
  caption: string | null;
  likes_count: number;
  created_at: string;
}

interface TopReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name?: string;
}

const ZERO_DIST = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as const;

interface FeedMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

export function MarketingOverview({ tenantId, onNavigate }: MarketingOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    postsCount: 0,
    totalLikes: 0,
    avgRating: 0,
    reviewsCount: 0,
    pendingReviews: 0,
    activePromos: 0,
    promosUses: 0,
    ratingDistribution: { ...ZERO_DIST },
  });
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topReviews, setTopReviews] = useState<TopReview[]>([]);
  const [feed, setFeed] = useState<FeedMetrics>({
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const [
        postsRes,
        reviewsRes,
        pendingRes,
        promosRes,
        topPostsRes,
        topReviewsRes,
        feedRes,
      ] = await Promise.all([
        supabase
          .from("posts")
          .select("id, likes_count", { count: "exact" })
          .eq("tenant_id", tenantId)
          .eq("is_active", true),
        supabase
          .from("reviews")
          .select("rating", { count: "exact" })
          .eq("tenant_id", tenantId)
          .eq("approved", true),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("approved", false),
        supabase
          .from("promotions")
          .select("id, uses_count, is_active, valid_until"),
        supabase
          .from("posts")
          .select("id, image_url, caption, likes_count, created_at")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("likes_count", { ascending: false })
          .limit(6),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at")
          .eq("tenant_id", tenantId)
          .eq("approved", true)
          .gte("rating", 4)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.rpc("get_tenant_feed_section_metrics", {
          p_tenant_id: tenantId,
          days: 7,
        }),
      ]);

      if (cancelled) return;

      const posts = (postsRes.data ?? []) as Array<{ likes_count: number | null }>;
      const totalLikes = posts.reduce((acc, p) => acc + (p.likes_count ?? 0), 0);

      const reviews = (reviewsRes.data ?? []) as Array<{ rating: number }>;
      const ratingSum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const dist = { ...ZERO_DIST } as Record<1 | 2 | 3 | 4 | 5, number>;
      reviews.forEach((r) => {
        const key = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
        dist[key] += 1;
      });

      const promosRaw = (promosRes.data ?? []) as Array<{
        id: string;
        uses_count: number | null;
        is_active: boolean | null;
        valid_until: string | null;
      }>;
      const tenantPromos = promosRaw;
      const activePromos = tenantPromos.filter((p) => {
        if (!p.is_active) return false;
        if (p.valid_until && new Date(p.valid_until) < new Date()) return false;
        return true;
      }).length;
      const promosUses = tenantPromos.reduce((acc, p) => acc + (p.uses_count ?? 0), 0);

      setStats({
        postsCount: postsRes.count ?? posts.length,
        totalLikes,
        avgRating: reviews.length ? ratingSum / reviews.length : 0,
        reviewsCount: reviewsRes.count ?? reviews.length,
        pendingReviews: pendingRes.count ?? 0,
        activePromos,
        promosUses,
        ratingDistribution: dist,
      });
      setTopPosts(((topPostsRes.data as TopPost[] | null) ?? []).filter((p) => (p.likes_count ?? 0) > 0).slice(0, 6));
      setTopReviews((topReviewsRes.data as TopReview[] | null) ?? []);

      const feedRows = (feedRes.data ?? []) as Array<{
        impressions: number | string;
        clicks: number | string;
        conversions: number | string;
      }>;
      const feedTotals = feedRows.reduce<{ impressions: number; clicks: number; conversions: number }>(
        (acc, r) => ({
          impressions: acc.impressions + Number(r.impressions ?? 0),
          clicks: acc.clicks + Number(r.clicks ?? 0),
          conversions: acc.conversions + Number(r.conversions ?? 0),
        }),
        { impressions: 0, clicks: 0, conversions: 0 }
      );
      const ctr = feedTotals.impressions > 0 ? (feedTotals.clicks / feedTotals.impressions) * 100 : 0;
      setFeed({ ...feedTotals, ctr });

      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Loader2 className="glow-spinner" />
      </div>
    );
  }

  const maxDist = Math.max(1, ...Object.values(stats.ratingDistribution));

  return (
    <div className="glow-fade glow-mkt-overview">
      {/* Hero KPIs */}
      <div className="glow-mkt-kpis">
        <KpiTile
          label="Posts publicados"
          value={stats.postsCount}
          icon={<ImagePlus />}
          tone="brand"
          onClick={() => onNavigate("posts")}
        />
        <KpiTile
          label="Likes totales"
          value={stats.totalLikes}
          icon={<Heart />}
          tone="rose"
          onClick={() => onNavigate("posts")}
        />
        <KpiTile
          label="Valoración media"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
          sub={`${stats.reviewsCount} reseñas${stats.pendingReviews ? ` · ${stats.pendingReviews} pend.` : ""}`}
          icon={<Star />}
          tone="warn"
          onClick={() => onNavigate("resenas")}
        />
        <KpiTile
          label="Promos activas"
          value={stats.activePromos}
          sub={`${stats.promosUses} canjes`}
          icon={<Ticket />}
          tone="accent"
          onClick={() => onNavigate("promos")}
        />
      </div>

      {/* Two-col: rating dist + top posts */}
      <div className="glow-mkt-grid-2">
        <section className="glow-card glow-card--pad glow-mkt-card">
          <div className="glow-mkt-card-h">
            <div>
              <h3>Distribución de valoraciones</h3>
              <p>{stats.reviewsCount} reseñas aprobadas</p>
            </div>
            <button className="glow-btn glow-btn--sm" onClick={() => onNavigate("resenas")}>
              Ver todas <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
          <div className="glow-mkt-bars">
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const count = stats.ratingDistribution[n];
              const pct = Math.round((count / maxDist) * 100);
              return (
                <div key={n} className="glow-mkt-bar-row">
                  <div className="glow-mkt-bar-label">
                    <span>{n}</span>
                    <Star style={{ width: 12, height: 12, fill: "currentColor" }} />
                  </div>
                  <div className="glow-mkt-bar-track">
                    <div className="glow-mkt-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="glow-mkt-bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glow-card glow-card--pad glow-mkt-card">
          <div className="glow-mkt-card-h">
            <div>
              <h3>Posts más populares</h3>
              <p>Por likes</p>
            </div>
            <button className="glow-btn glow-btn--sm" onClick={() => onNavigate("posts")}>
              Ver todos <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
          {topPosts.length === 0 ? (
            <div className="glow-mkt-empty">
              <ImagePlus />
              <p>Aún no hay posts con likes</p>
            </div>
          ) : (
            <div className="glow-mkt-top-grid">
              {topPosts.map((p) => (
                <div key={p.id} className="glow-mkt-top-tile">
                  <img src={p.image_url} alt={p.caption ?? ""} loading="lazy" />
                  <div className="glow-mkt-top-overlay">
                    <Heart style={{ width: 12, height: 12, fill: "currentColor" }} />
                    <span>{p.likes_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Top reviews highlight */}
      {topReviews.length > 0 && (
        <section className="glow-card glow-card--pad glow-mkt-card">
          <div className="glow-mkt-card-h">
            <div>
              <h3>Reseñas destacadas</h3>
              <p>Lo último que han dicho de ti</p>
            </div>
            <button className="glow-btn glow-btn--sm" onClick={() => onNavigate("resenas")}>
              Ver todas <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
          <div className="glow-mkt-reviews">
            {topReviews.map((r) => (
              <div key={r.id} className="glow-mkt-review-tile">
                <div className="glow-mkt-review-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      style={{
                        width: 12,
                        height: 12,
                        fill: "currentColor",
                        opacity: i < r.rating ? 1 : 0.22,
                      }}
                    />
                  ))}
                </div>
                <p className="glow-mkt-review-text">
                  {r.comment || "Sin comentario"}
                </p>
                <span className="glow-mkt-review-meta">
                  {format(new Date(r.created_at), "d MMM yyyy", { locale: es })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feed analytics 7d */}
      {feed.impressions > 0 && (
        <section className="glow-card glow-card--pad glow-mkt-card">
          <div className="glow-mkt-card-h">
            <div>
              <h3>Tráfico del salón (7 días)</h3>
              <p>Métricas del feed público</p>
            </div>
            <Sparkles style={{ width: 16, height: 16, color: "var(--glow-ink-3)" }} />
          </div>
          <div className="glow-mkt-quick">
            <div className="glow-mkt-quick-btn" style={{ cursor: "default" }}>
              <div className="glow-mkt-quick-ic" style={{ background: "var(--glow-brand-soft)", color: "var(--glow-brand)" }}>
                <Eye />
              </div>
              <div>
                <strong>{feed.impressions.toLocaleString("es-ES")}</strong>
                <span>Impresiones</span>
              </div>
            </div>
            <div className="glow-mkt-quick-btn" style={{ cursor: "default" }}>
              <div className="glow-mkt-quick-ic" style={{ background: "var(--glow-ok-soft)", color: "var(--glow-ok-ink)" }}>
                <MousePointerClick />
              </div>
              <div>
                <strong>{feed.clicks.toLocaleString("es-ES")}</strong>
                <span>Clicks</span>
              </div>
            </div>
            <div className="glow-mkt-quick-btn" style={{ cursor: "default" }}>
              <div className="glow-mkt-quick-ic" style={{ background: "var(--glow-warn-soft)", color: "var(--glow-warn-ink)" }}>
                <TrendingUp />
              </div>
              <div>
                <strong>{feed.ctr.toFixed(1)}%</strong>
                <span>CTR</span>
              </div>
            </div>
            <div className="glow-mkt-quick-btn" style={{ cursor: "default" }}>
              <div className="glow-mkt-quick-ic" style={{ background: "color-mix(in oklab, var(--glow-accent), white 80%)", color: "var(--glow-accent)" }}>
                <Heart />
              </div>
              <div>
                <strong>{feed.conversions.toLocaleString("es-ES")}</strong>
                <span>Conversiones</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="glow-card glow-card--pad glow-mkt-card">
        <div className="glow-mkt-card-h">
          <div>
            <h3>Acciones rápidas</h3>
            <p>Empieza por aquí</p>
          </div>
        </div>
        <div className="glow-mkt-quick">
          <button className="glow-mkt-quick-btn" onClick={() => onNavigate("posts")}>
            <div className="glow-mkt-quick-ic" style={{ background: "color-mix(in oklab, var(--glow-brand), white 80%)", color: "var(--glow-brand)" }}>
              <ImagePlus />
            </div>
            <div>
              <strong>Nuevo post</strong>
              <span>Comparte tu trabajo</span>
            </div>
          </button>
          <button className="glow-mkt-quick-btn" onClick={() => onNavigate("promos")}>
            <div className="glow-mkt-quick-ic" style={{ background: "color-mix(in oklab, var(--glow-brand), white 80%)", color: "var(--glow-brand)" }}>
              <Ticket />
            </div>
            <div>
              <strong>Crear promo</strong>
              <span>Atrae más reservas</span>
            </div>
          </button>
          <button className="glow-mkt-quick-btn" onClick={() => onNavigate("difusion")}>
            <div className="glow-mkt-quick-ic" style={{ background: "color-mix(in oklab, var(--glow-ok-ink), white 80%)", color: "var(--glow-ok-ink)" }}>
              <Users />
            </div>
            <div>
              <strong>Difundir</strong>
              <span>Mensaje a tus clientes</span>
            </div>
          </button>
          <button className="glow-mkt-quick-btn" onClick={() => onNavigate("qr")}>
            <div className="glow-mkt-quick-ic" style={{ background: "color-mix(in oklab, var(--glow-warn-ink), white 80%)", color: "var(--glow-warn-ink)" }}>
              <TrendingUp />
            </div>
            <div>
              <strong>Tarjetas QR</strong>
              <span>Imprime y reparte</span>
            </div>
          </button>
        </div>
      </section>

      <QrAnalytics tenantId={tenantId} />
    </div>
  );
}

interface KpiTileProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  tone: "brand" | "accent" | "warn" | "rose";
  onClick?: () => void;
}

function KpiTile({ label, value, sub, icon, tone, onClick }: KpiTileProps) {
  return (
    <button className={`glow-mkt-kpi tone-${tone}`} onClick={onClick} type="button">
      <span className="glow-mkt-kpi-ic">{icon}</span>
      <span className="glow-mkt-kpi-value">{value}</span>
      <span className="glow-mkt-kpi-label">{label}</span>
      {sub && <span className="glow-mkt-kpi-sub">{sub}</span>}
    </button>
  );
}

export default MarketingOverview;
