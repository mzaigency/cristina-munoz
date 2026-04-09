import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCode, GraduationCap, TrendingUp } from "lucide-react";
import { QRCardGenerator } from "@/components/admin/content/QRCardGenerator";
import { TrainingChecklist } from "@/components/admin/content/TrainingChecklist";
import { ROICalculator } from "@/components/admin/content/ROICalculator";

interface ContentSectionProps {
  tenantId: string;
  tenantSlug: string;
  onNavigate?: (tab: string) => void;
}

export default function ContentSection({ tenantId, tenantSlug, onNavigate }: ContentSectionProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="marketing" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-10">
          <TabsTrigger value="marketing" className="text-xs gap-1.5">
            📱 Marketing
          </TabsTrigger>
          <TabsTrigger value="training" className="text-xs gap-1.5">
            🎓 Formación
          </TabsTrigger>
          <TabsTrigger value="roi" className="text-xs gap-1.5">
            📈 ROI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketing" className="mt-4">
          <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <TrainingChecklist tenantId={tenantId} onNavigate={onNavigate} />
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <ROICalculator tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
