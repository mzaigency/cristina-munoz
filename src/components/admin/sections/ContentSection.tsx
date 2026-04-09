import { QRCardGenerator } from "@/components/admin/content/QRCardGenerator";

interface ContentSectionProps {
  tenantId: string;
  tenantSlug: string;
  onNavigate?: (tab: string) => void;
}

export default function ContentSection({ tenantId, tenantSlug }: ContentSectionProps) {
  return (
    <div className="space-y-4">
      <QRCardGenerator tenantId={tenantId} tenantSlug={tenantSlug} />
    </div>
  );
}
