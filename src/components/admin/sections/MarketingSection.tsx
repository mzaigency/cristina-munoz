import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ImagePlus, Percent, Star, QrCode, Plus, Lock } from "lucide-react";
import { QRCardGenerator } from "@/components/admin/content/QRCardGenerator";
import { PostCreator } from "@/components/social/PostCreator";
import { PostGrid } from "@/components/social/PostGrid";
import { PromotionsManager } from "../PromotionsManager";
import { ReviewsManager } from "../ReviewsManager";
import { LockedFeature } from "../LockedFeature";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePlanLimits, type PlanFeature } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";

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

/**
 * Marketing section. Promos (from Catálogo) and Reseñas (from Clientes) now
 * live here as part of the new IA. Legacy URLs are transparently redirected
 * by TenantAdmin.
 */
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

  const handleTabChange = (value: string) => {
    const tab = tabs.find((t) => t.id === value);
    if (tab && isTabLocked(tab)) return;
    setActiveTab(value as MarketingTab);
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {!hideTabs && (
          <TabsList className="w-full flex overflow-x-auto no-scrollbar gp-tabs">
            {tabs.map((tab) => {
              const locked = isTabLocked(tab);
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={locked}
                  className={cn(
                    "flex-1 min-w-fit flex items-center justify-center gap-1.5 text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm relative",
                    locked && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {locked ? <Lock className="h-4 w-4" /> : <tab.icon className="h-4 w-4" />}
                  <span>{tab.label}</span>
                  {tab.badge > 0 && activeTab !== tab.id && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </Badge>
                  )}
                  {locked && (
                    <span className="hidden md:inline text-[10px] text-amber-600 ml-0.5">Pro</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        <TabsContent value="posts" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setPostCreatorOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Post
            </Button>
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
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          {promosLocked ? (
            <LockedFeature
              featureName="Promociones"
              currentPlan={planSlug}
              requiredPlan="pro"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <PromotionsManager tenantId={tenantId} />
          )}
        </TabsContent>

        <TabsContent value="resenas" className="mt-4">
          <ReviewsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="qr" className="mt-4">
          <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingSection;
