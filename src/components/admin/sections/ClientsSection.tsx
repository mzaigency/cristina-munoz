import { useState, useEffect } from "react";
import { ClientsCRM } from "../ClientsCRM";
import { MessagesManager } from "../MessagesManager";

interface ClientsSectionProps {
  tenantId: string;
  initialClientId?: string;
  subTab?: string;
}

type ClientsTab = "directory" | "messages";

const SLUG_TO_ID: Record<string, ClientsTab> = { directorio: "directory", mensajes: "messages" };

/**
 * Clientes. Las pestañas las pinta AdminSubNav (fila única del shell), así que
 * aquí solo se despacha por subTab. Reseñas vive en Marketing › Reseñas; las
 * URLs antiguas las redirige TenantAdmin.
 */
const ClientsSection = ({ tenantId, initialClientId, subTab }: ClientsSectionProps) => {
  const [legacyTab, setLegacyTab] = useState<ClientsTab>("directory");
  const activeTab: ClientsTab = (subTab && SLUG_TO_ID[subTab]) || legacyTab;

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openClientsSubTab");
    if (legacy && (legacy === "directory" || legacy === "messages")) {
      setLegacyTab(legacy);
      sessionStorage.removeItem("openClientsSubTab");
    }
  }, [subTab]);

  if (activeTab === "messages") return <MessagesManager tenantId={tenantId} />;

  return (
    <div data-tour-target="clientes-directorio">
      <ClientsCRM tenantId={tenantId} initialClientId={initialClientId} />
    </div>
  );
};

export default ClientsSection;
