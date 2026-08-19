import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ImagePlus,
  Percent,
  Star,
  QrCode,
  Plus,
  Lock,
  Megaphone,
  Filter,
} from "lucide-react";
import { QRCardGenerator } from "@/components/admin/content/QRCardGenerator";
import { PostCreator } from "@/components/social/PostCreator";
import { PostGrid } from "@/components/social/PostGrid";
import { PromotionsManager } from "../PromotionsManager";
import { ReviewsManager } from "../ReviewsManager";
import { LockedFeature } from "../LockedFeature";
import { MarketingOverview } from "../marketing/MarketingOverview";
import { MarketingBroadcast } from "../marketing/MarketingBroadcast";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits, type PlanFeature } from "@/hooks/usePlanLimits";

interface MarketingSectionProps {
  tenantId: string;
  tenantSlug: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

type MarketingTab = "resumen" | "posts" | "promos" | "resenas" | "difusion" | "qr";

const POST_CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "corte", label: "Corte" },
  { id: "color", label: "Color" },
  { id: "peinado", label: "Peinado" },
  { id: "tratamiento", label: "Tratamiento" },
  { id: "uñas", label: "Uñas" },
  { id: "maquillaje", label: "Maquillaje" },
  { id: "otro", label: "Otro" },
];

const MarketingSection = ({
  tenantId,
  tenantSlug,
  subTab,
  onSubTabChange,
}: MarketingSectionProps) => {
  const validTabs: MarketingTab[] = ["resumen", "posts", "promos", "resenas", "difusion", "qr"];
  const [internalTab, setInternalTab] = useState<MarketingTab>("resumen");
  const activeTab: MarketingTab = validTabs.includes(subTab as MarketingTab)
    ? (subTab as MarketingTab)
    : internalTab;

  const setActiveTab = (t: MarketingTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };

  const [postCreatorOpen, setPostCreatorOpen] = useState(false);
  const [tenantName, setTenantName] = useState<string>("");
  const [postFilter, setPostFilter] = useState<string>("all");
  const [postSort, setPostSort] = useState<"recent" | "popular">("recent");

  const { tenantPosts, deletePost, refetchTenantPosts } = usePosts(tenantId);
  const { hasFeature, planSlug } = usePlanLimits(tenantId);
  const promosLocked = !hasFeature("promotions");

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openMarketingSubTab");
    if (legacy && validTabs.includes(legacy as MarketingTab)) {
      setInternalTab(legacy as MarketingTab);
      sessionStorage.removeItem("openMarketingSubTab");
    }
  }, [subTab]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setTenantName(data?.name ?? "");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  /** Qué pestaña exige plan. AdminSubNav ya las bloquea en la fila; esto
      cubre la navegación que llega desde el Resumen. */
  const LOCKED: Partial<Record<MarketingTab, PlanFeature>> = { promos: "promotions" };

  const handleTabChange = (id: MarketingTab) => {
    const needs = LOCKED[id];
    if (needs && !hasFeature(needs)) return;
    setActiveTab(id);
  };

  const sortedPosts = useMemo(() => {
    const arr = [...(tenantPosts || [])];
    if (postFilter !== "all") {
      const f = postFilter;
      const filtered = arr.filter((p) => (p.category ?? "otro") === f);
      return postSort === "popular"
        ? filtered.sort((a, b) => b.likes_count - a.likes_count)
        : filtered;
    }
    return postSort === "popular"
      ? arr.sort((a, b) => b.likes_count - a.likes_count)
      : arr;
  }, [tenantPosts, postFilter, postSort]);

  const postStats = useMemo(() => {
    const total = tenantPosts?.length ?? 0;
    const likes = (tenantPosts ?? []).reduce((acc, p) => acc + p.likes_count, 0);
    return { total, likes };
  }, [tenantPosts]);

  return (
    <div className="glow-mkt">
      <div className="glow-mkt-body">
        {activeTab === "resumen" && (
          <MarketingOverview tenantId={tenantId} onNavigate={(t) => handleTabChange(t as MarketingTab)} />
        )}

        {activeTab === "posts" && (
          <div className="glow-fade glow-mkt-posts">
            <div className="glow-page-h">
              <div>
                <h2>Posts</h2>
                <p>{postStats.total} publicaciones · {postStats.likes} likes</p>
              </div>
              <div className="glow-page-actions">
                <button className="glow-btn glow-btn--primary glow-btn--sm" onClick={() => setPostCreatorOpen(true)}>
                  <Plus style={{ width: 13, height: 13 }} /> Nuevo Post
                </button>
              </div>
            </div>

            <div className="glow-mkt-posts-toolbar">
              <div className="glow-mkt-chip-row">
                {POST_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`glow-mkt-chip${postFilter === c.id ? " on" : ""}`}
                    onClick={() => setPostFilter(c.id)}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="glow-mkt-chip-row">
                <Filter style={{ width: 13, height: 13, color: "var(--glow-ink-3)" }} />
                <button
                  className={`glow-mkt-chip${postSort === "recent" ? " on" : ""}`}
                  onClick={() => setPostSort("recent")}
                  type="button"
                >
                  Recientes
                </button>
                <button
                  className={`glow-mkt-chip${postSort === "popular" ? " on" : ""}`}
                  onClick={() => setPostSort("popular")}
                  type="button"
                >
                  Más likes
                </button>
              </div>
            </div>

            <PostGrid posts={sortedPosts} isAdmin onDelete={(postId) => deletePost(postId)} />
            <PostCreator
              isOpen={postCreatorOpen}
              onClose={() => {
                setPostCreatorOpen(false);
                refetchTenantPosts();
              }}
            />
          </div>
        )}

        {activeTab === "promos" &&
          (promosLocked ? (
            <LockedFeature
              featureName="Promociones"
              currentPlan={planSlug}
              requiredPlan="pro"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <PromotionsManager tenantId={tenantId} />
          ))}

        {activeTab === "resenas" && <ReviewsManager tenantId={tenantId} />}

        {activeTab === "difusion" && (
          <MarketingBroadcast tenantId={tenantId} tenantSlug={tenantSlug} tenantName={tenantName} />
        )}

        {activeTab === "qr" && (
          <div data-tour-target="marketing-qr">
            <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingSection;
