import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Target,
  ImagePlus,
  QrCode,
  Plus,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GoalsReports } from "../negocio/GoalsReports";
import { BusinessStats } from "../BusinessStats";
import { LockedFeature } from "../LockedFeature";
import { PostCreator } from "@/components/social/PostCreator";
import { PostGrid } from "@/components/social/PostGrid";
import { QRCardGenerator } from "@/components/admin/content/QRCardGenerator";
import { usePosts } from "@/hooks/usePosts";
import { usePlanLimits, type PlanFeature } from "@/hooks/usePlanLimits";

interface NegocioSectionProps {
  tenantId: string;
  tenantSlug: string;
  subTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

type NegocioTab = "estadisticas" | "objetivos" | "posts" | "qr";

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

const NegocioSection = ({
  tenantId,
  tenantSlug,
  subTab,
  onSubTabChange,
}: NegocioSectionProps) => {
  const validTabs: NegocioTab[] = ["estadisticas", "objetivos", "posts", "qr"];
  const [internalTab, setInternalTab] = useState<NegocioTab>("estadisticas");
  const activeTab: NegocioTab = validTabs.includes(subTab as NegocioTab)
    ? (subTab as NegocioTab)
    : internalTab;

  const setActiveTab = (t: NegocioTab) => {
    if (onSubTabChange) onSubTabChange(t);
    else setInternalTab(t);
  };

  const [tenantName, setTenantName] = useState<string>("Salón");
  const [postCreatorOpen, setPostCreatorOpen] = useState(false);
  const [postFilter, setPostFilter] = useState<string>("all");
  const [postSort, setPostSort] = useState<"recent" | "popular">("recent");

  const { tenantPosts, deletePost, refetchTenantPosts } = usePosts(tenantId);
  const { hasFeature, planSlug } = usePlanLimits(tenantId);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.name) setTenantName(data.name);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const postStats = useMemo(() => {
    const total = tenantPosts.length;
    const likes = tenantPosts.reduce((acc, p) => acc + (p.likes_count ?? 0), 0);
    return { total, likes };
  }, [tenantPosts]);

  const filteredPosts = useMemo(() => {
    if (postFilter === "all") return tenantPosts;
    return tenantPosts.filter(
      (p) => (p as any).category?.toLowerCase() === postFilter.toLowerCase(),
    );
  }, [tenantPosts, postFilter]);

  const sortedPosts = useMemo(() => {
    const copy = [...filteredPosts];
    if (postSort === "popular") {
      copy.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
    } else {
      copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return copy;
  }, [filteredPosts, postSort]);

  const LOCKED: Partial<Record<NegocioTab, PlanFeature>> = {
    estadisticas: "advanced_analytics",
    objetivos: "monthly_goals",
  };

  const handleTabChange = (id: NegocioTab) => {
    const needs = LOCKED[id];
    if (needs && !hasFeature(needs)) return;
    setActiveTab(id);
  };

  return (
    <div className="glow-mkt">
      <div className="glow-mkt-body">
        {activeTab === "estadisticas" &&
          (!hasFeature("advanced_analytics") ? (
            <LockedFeature
              featureName="Estadísticas"
              currentPlan={planSlug}
              requiredPlan="pro"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <BusinessStats tenantId={tenantId} />
          ))}

        {activeTab === "objetivos" &&
          (!hasFeature("monthly_goals") ? (
            <LockedFeature
              featureName="Objetivos"
              currentPlan={planSlug}
              requiredPlan="business"
              tenantId={tenantId}
              variant="inline"
            />
          ) : (
            <GoalsReports tenantId={tenantId} tenantName={tenantName} />
          ))}

        {activeTab === "posts" && (
          <div className="glow-fade glow-mkt-posts">
            <div className="glow-page-h">
              <div>
                <h2>Posts Feed</h2>
                <p>{postStats.total} publicaciones · {postStats.likes} likes</p>
              </div>
              <div className="glow-page-actions">
                <button
                  className="glow-btn glow-btn--primary glow-btn--sm"
                  onClick={() => setPostCreatorOpen(true)}
                >
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

        {activeTab === "qr" && (
          <div data-tour-target="negocio-qr">
            <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NegocioSection;
