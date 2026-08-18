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
  hideTabs?: boolean;
}

type MarketingTab = "resumen"|"posts"|"promos"|"resenas"|"difusion"|"qr";

interface TabConfig {
  id: MarketingTab;
  label: string;
  icon: React.ElementType;
  badge: number;
  requiredFeature?: PlanFeature;
}

const POST_CATEGORIES = [
  { id: "all", label: "Todas"}, { id:"corte", label: "Corte"}, { id:"color", label: "Color"}, { id:"peinado", label: "Peinado"}, { id:"tratamiento", label: "Tratamiento"}, { id:"uñas", label: "Uñas"}, { id:"maquillaje", label: "Maquillaje"}, { id:"otro", label: "Otro" },
];

const MarketingSection = ({
  tenantId,
  tenantSlug,
  subTab,
  onSubTabChange,
  hideTabs,
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
  const [pendingReviews, setPendingReviews] = useState(0);
  const [activePromos, setActivePromos] = useState(0);
  const [tenantName, setTenantName] = useState<string>("");
  const [postFilter, setPostFilter] = useState<string>("all");
  const [postSort, setPostSort] = useState<"recent"|"popular">("recent");

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
    const fetchCounts = async () => {
      const [revRes, promoRes, tenantRes] = await Promise.all([
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("approved", false),
        supabase
          .from("promotions" as never)
          .select("id, is_active, valid_until")
          .eq("tenant_id", tenantId),
        supabase.from("tenants").select("name").eq("id", tenantId).single(),
      ]);
      if (cancelled) return;
      setPendingReviews(revRes.count ?? 0);
      const now = new Date();
      const promos = (promoRes.data ?? []) as Array<{ is_active: boolean | null; valid_until: string | null }>;
      const active = promos.filter((p) => {
        if (!p.is_active) return false;
        if (p.valid_until && new Date(p.valid_until) < now) return false;
        return true;
      }).length;
      setActivePromos(active);
      setTenantName(tenantRes.data?.name ?? "");
    };
    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const tabs: TabConfig[] = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard, badge: 0 },
    { id: "posts", label: "Posts", icon: ImagePlus, badge: 0 },
    { id: "promos", label: "Promos", icon: Percent, badge: activePromos, requiredFeature: "promotions"}, { id:"resenas", label: "Reseñas", icon: Star, badge: pendingReviews },
    { id: "difusion", label: "Difusión", icon: Megaphone, badge: 0 },
    { id: "qr", label: "Tarjetas QR", icon: QrCode, badge: 0 },
  ];

  const isTabLocked = (tab: TabConfig) =>
    tab.requiredFeature ? !hasFeature(tab.requiredFeature) : false;

  const handleTabChange = (id: MarketingTab) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab && !isTabLocked(tab)) setActiveTab(id);
  };

  const sortedPosts = useMemo(() => {
    const arr = [...(tenantPosts || [])];
    if (postFilter !== "all") {
      const f = postFilter;
      const filtered = arr.filter((p) => (p.category ?? "otro") === f);
      return postSort === "popular"? filtered.sort((a, b) => b.likes_count - a.likes_count) : filtered; } return postSort ==="popular"
      ? arr.sort((a, b) => b.likes_count - a.likes_count)
      : arr;
  }, [tenantPosts, postFilter, postSort]);

  const postStats = useMemo(() => {
    const total = tenantPosts?.length ?? 0;
    const likes = (tenantPosts ?? []).reduce((acc, p) => acc + p.likes_count, 0);
    return { total, likes };
  }, [tenantPosts]);

  return (
    <div className="gp-mkt">
      {!hideTabs && (
        <div className="gp-mkt-tabs">
          {tabs.map((tab) => {
            const locked = isTabLocked(tab);
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`gp-mkt-tab${activeTab === tab.id ? " on":""}${locked ? " locked":""}`}
                onClick={() => handleTabChange(tab.id)}
                type="button"
              >
                {locked ? <Lock /> : <Icon />}
                <span>{tab.label}</span>
                {locked && <span className="gp-mkt-tab-pro">Pro</span>}
                {!locked && tab.badge > 0 && (
                  <span className="gp-mkt-tab-badge">{tab.badge > 99 ? "99+" : tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="gp-mkt-body">
        {activeTab === "resumen"&& ( <MarketingOverview tenantId={tenantId} onNavigate={(t) => handleTabChange(t as MarketingTab)} /> )} {activeTab ==="posts" && (
          <div className="gp-fade gp-mkt-posts">
            <div className="gp-page-h">
              <div>
                <h2>Posts</h2>
                <p>{postStats.total} publicaciones · {postStats.likes} likes</p>
              </div>
              <div className="gp-page-actions">
                <button className="gp-btn primary sm" onClick={() => setPostCreatorOpen(true)}>
                  <Plus style={{ width: 13, height: 13 }} /> Nuevo Post
                </button>
              </div>
            </div>

            <div className="gp-mkt-posts-toolbar">
              <div className="gp-mkt-chip-row">
                {POST_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`gp-mkt-chip${postFilter === c.id ? " on":""}`}
                    onClick={() => setPostFilter(c.id)}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="gp-mkt-chip-row">
                <Filter style={{ width: 13, height: 13, color: "var(--gp-muted-c)"}} /> <button className={`gp-mkt-chip${postSort ==="recent"?" on":""}`}
                  onClick={() => setPostSort("recent")}
                  type="button"> Recientes </button> <button className={`gp-mkt-chip${postSort ==="popular"?" on":""}`}
                  onClick={() => setPostSort("popular")}
                  type="button"> Más likes </button> </div> </div> <PostGrid posts={sortedPosts} isAdmin onDelete={(postId) => deletePost(postId)} /> <PostCreator isOpen={postCreatorOpen} onClose={() => { setPostCreatorOpen(false); refetchTenantPosts(); }} /> </div> )} {activeTab ==="promos" &&
          (promosLocked ? (
            <LockedFeature
              featureName="Promociones"
              currentPlan={planSlug}
              requiredPlan="pro"
              tenantId={tenantId}
              variant="inline"/> ) : ( <PromotionsManager tenantId={tenantId} /> ))} {activeTab ==="resenas"&& <ReviewsManager tenantId={tenantId} />} {activeTab ==="difusion"&& ( <MarketingBroadcast tenantId={tenantId} tenantSlug={tenantSlug} tenantName={tenantName} /> )} {activeTab ==="qr" && (
          <div data-tour-target="marketing-qr">
            <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingSection;
