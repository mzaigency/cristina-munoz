import { useState, useEffect } from "react";
import { ClientsCRM } from "../ClientsCRM";
import { MessagesManager } from "../MessagesManager";
import { ReviewsManager } from "../ReviewsManager";

interface ClientsSectionProps {
  tenantId: string;
  initialClientId?: string;
  subTab?: string;
}

type ClientsTab = "directory" | "messages" | "reviews";

const SLUG_TO_ID: Record<string, ClientsTab> = {
  directorio: "directory",
  mensajes: "messages",
  resenas: "reviews",
};

/**
 * Clientes: Directorio, Mensajes y Reseñas de clientes.
 */
const ClientsSection = ({ tenantId, initialClientId, subTab }: ClientsSectionProps) => {
  const [legacyTab, setLegacyTab] = useState<ClientsTab>("directory");
  const activeTab: ClientsTab = (subTab && SLUG_TO_ID[subTab]) || legacyTab;

  useEffect(() => {
    if (subTab) return;
    const legacy = sessionStorage.getItem("openClientsSubTab");
    if (legacy && (legacy === "directory" || legacy === "messages" || legacy === "reviews")) {
      setLegacyTab(legacy as ClientsTab);
      sessionStorage.removeItem("openClientsSubTab");
    }
  }, [subTab]);

  if (activeTab === "messages") return <MessagesManager tenantId={tenantId} />;
  if (activeTab === "reviews") return <ReviewsManager tenantId={tenantId} />;

  return (
    <div data-tour-target="clientes-directorio">
      <ClientsCRM tenantId={tenantId} initialClientId={initialClientId} />
    </div>
  );
};

export default ClientsSection;
