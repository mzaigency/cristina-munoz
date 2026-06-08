import { useState, useEffect } from "react";
import { ImagePlus, Percent, Star, QrCode, Plus, Lock } from "lucide-react";
import { QRCardGenerator } from "@/components/admin/content/QRCardGenerator";
import { PostCreator } from "@/components/social/PostCreator";
import { PostGrid } from "@/components/social/PostGrid";
import { PromotionsManager } from "../PromotionsManager";
import { ReviewsManager } from "../ReviewsManager";
import { LockedFeature } from "../LockedFeature";
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

type MarketingTab = "posts" | "promos" | "resenas" | "qr";

interface TabConfig {
  id: MarketingTab;
  label: string;
  icon: React.ElementType;
  badge: number;
  requiredFeature?: PlanFeature;
}

const MarketingSection = ({ tenantId, tenantSlug, subTab, onSubTabChange, hideTabs }: MarketingSectionProps) => {
  const [internalTab, setInternalTab] = useState<MarketingTab>("posts");
  const validTabs: MarketingTab[] = ["posts", "promos", "resenas", "qr"];
  const activeTab: MarketingTab = validTabs.includes(subTab as MarketingTab)
    ? (subTab as MarketingTab)
    : internalTab;
  const setActiveTab = (t: MarketingTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };
  const [postCreatorOpen, setPostCreatorOpen] = useState(false);
  const [pendingReviews, setPendingReviews] = useState(0);
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
    const fetchPendingReviews = async () => {
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("approved", false);
      setPendingReviews(count || 0);
    };
    fetchPendingReviews();
  }, [tenantId]);

  const tabs: TabConfig[] = [
    { id: "posts", label: "Posts", icon: ImagePlus, badge: 0 },
    { id: "promos", label: "Promos", icon: Percent, badge: 0, requiredFeature: "promotions" },
    { id: "resenas", label: "Reseñas", icon: Star, badge: pendingReviews },
    { id: "qr", label: "Tarjetas QR", icon: QrCode, badge: 0 },
  ];

  const isTabLocked = (tab: TabConfig) =>
    tab.requiredFeature ? !hasFeature(tab.requiredFeature) : false;

  const handleTabChange = (id: MarketingTab) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab && !isTabLocked(tab)) setActiveTab(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {!hideTabs && (
        <div className="gp-subtabs">
          {tabs.map((tab) => {
            const locked = isTabLocked(tab);
            return (
              <button
                key={tab.id}
                className={`gp-subtab${activeTab === tab.id ? " on" : ""}`}
                onClick={() => handleTabChange(tab.id)}
                style={locked ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                {locked ? <Lock style={{ width: 11, height: 11 }} /> : <tab.icon style={{ width: 12, height: 12 }} />}
                {tab.label}
                {locked && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: "var(--gp-warn)", background: "var(--gp-warn-soft)", padding: "1px 5px", borderRadius: 99 }}>
                    Pro
                  </span>
                )}
                {!locked && tab.badge > 0 && (
                  <span className="gp-subtab-count">{tab.badge > 99 ? "99+" : tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "posts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="gp-btn sm primary" onClick={() => setPostCreatorOpen(true)}>
              <Plus style={{ width: 13, height: 13 }} />
              Nuevo Post
            </button>
          </div>
          <PostGrid
            posts={tenantPosts || []}
            isAdmin
            onDelete={(postId) => deletePost(postId)}
          />
          <PostCreator
            isOpen={postCreatorOpen}
            onClose={() => { setPostCreatorOpen(false); refetchTenantPosts(); }}
          />
        </div>
      )}

      {activeTab === "promos" && (
        promosLocked ? (
          <LockedFeature featureName="Promociones" currentPlan={planSlug} requiredPlan="pro" tenantId={tenantId} variant="inline" />
        ) : (
          <PromotionsManager tenantId={tenantId} />
        )
      )}

      {activeTab === "resenas" && (
        <ReviewsManager tenantId={tenantId} />
      )}

      {activeTab === "qr" && (
        <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
      )}
    </div>
  );
};

export default MarketingSection;
