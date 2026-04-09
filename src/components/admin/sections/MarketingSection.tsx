import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePlus, QrCode, Plus } from "lucide-react";
import { QRCardGenerator } from "@/components/admin/content/QRCardGenerator";
import { PostCreator } from "@/components/social/PostCreator";
import { PostGrid } from "@/components/social/PostGrid";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";

interface MarketingSectionProps {
  tenantId: string;
  tenantSlug: string;
}

type MarketingTab = "posts" | "qr";

const MarketingSection = ({ tenantId, tenantSlug }: MarketingSectionProps) => {
  const [activeTab, setActiveTab] = useState<MarketingTab>("posts");
  const [postCreatorOpen, setPostCreatorOpen] = useState(false);
  const { tenantPosts, deletePost, refetchTenantPosts } = usePosts(tenantId);

  useEffect(() => {
    const subTab = sessionStorage.getItem("openMarketingSubTab");
    if (subTab && ["posts", "qr"].includes(subTab)) {
      setActiveTab(subTab as MarketingTab);
      sessionStorage.removeItem("openMarketingSubTab");
    }
  }, []);

  const tabs = [
    { id: "posts" as MarketingTab, label: "Posts", icon: ImagePlus },
    { id: "qr" as MarketingTab, label: "Tarjetas QR", icon: QrCode },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MarketingTab)}>
        <TabsList className="w-full flex bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

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

        <TabsContent value="qr" className="mt-4">
          <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingSection;
