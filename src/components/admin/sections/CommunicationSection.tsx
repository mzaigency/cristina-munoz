import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Camera, Star } from "lucide-react";
import { MessagesManager } from "../MessagesManager";
import { StoriesAnalytics } from "../StoriesAnalytics";
import { ReviewsManager } from "../ReviewsManager";

interface CommunicationSectionProps {
  tenantId: string;
}

type CommunicationTab = "messages" | "stories" | "reviews";

const CommunicationSection = ({ tenantId }: CommunicationSectionProps) => {
  const [activeTab, setActiveTab] = useState<CommunicationTab>("messages");

  const tabs = [
    { id: "messages" as CommunicationTab, label: "Mensajes", icon: MessageCircle },
    { id: "stories" as CommunicationTab, label: "Stories", icon: Camera },
    { id: "reviews" as CommunicationTab, label: "Reseñas", icon: Star },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CommunicationTab)}>
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

        <TabsContent value="messages" className="mt-4">
          <MessagesManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="stories" className="mt-4">
          <StoriesAnalytics tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <ReviewsManager tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunicationSection;
