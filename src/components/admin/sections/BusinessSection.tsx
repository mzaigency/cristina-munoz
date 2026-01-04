import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  Percent, 
  Package, 
  ShoppingBag, 
  Target,
  BarChart3
} from "lucide-react";
import { CashRegisterManager } from "../CashRegisterManager";
import { PromotionsManager } from "../PromotionsManager";
import { ServicePackagesManager } from "../ServicePackagesManager";
import { ProductsManager } from "../ProductsManager";
import { MonthlyGoals } from "../MonthlyGoals";
import { AdvancedCashStats } from "../AdvancedCashStats";
import { PDFReportsGenerator } from "../PDFReportsGenerator";

interface BusinessSectionProps {
  tenantId: string;
}

type BusinessTab = "cash" | "promos" | "packages" | "products" | "goals" | "stats";

const BusinessSection = ({ tenantId }: BusinessSectionProps) => {
  const [activeTab, setActiveTab] = useState<BusinessTab>("cash");

  const tabs = [
    { id: "cash" as BusinessTab, label: "Caja", icon: Wallet },
    { id: "promos" as BusinessTab, label: "Promos", icon: Percent },
    { id: "packages" as BusinessTab, label: "Paquetes", icon: Package },
    { id: "products" as BusinessTab, label: "Productos", icon: ShoppingBag },
    { id: "goals" as BusinessTab, label: "Objetivos", icon: Target },
    { id: "stats" as BusinessTab, label: "Stats", icon: BarChart3 },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BusinessTab)}>
        <TabsList className="w-full flex overflow-x-auto no-scrollbar bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 min-w-fit flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="cash" className="mt-4 space-y-4">
          <CashRegisterManager tenantId={tenantId} />
          <AdvancedCashStats tenantId={tenantId} />
          <PDFReportsGenerator tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="promos" className="mt-4">
          <PromotionsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <ServicePackagesManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <ProductsManager tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <MonthlyGoals tenantId={tenantId} />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <AdvancedCashStats tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessSection;
