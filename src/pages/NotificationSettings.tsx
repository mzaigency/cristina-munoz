import { SEO } from "@/components/SEO";
import { AppLayout } from "@/components/navigation/AppLayout";
import { UserNotificationSettings } from "@/components/notifications/UserNotificationSettings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationSettingsPage() {
  const navigate = useNavigate();

  return (
    <AppLayout noTopSafeArea>
      <SEO
        title="Notificaciones"
        description="Gestiona tus preferencias de notificaciones"
        canonicalUrl="/perfil/notificaciones"
        noindex
      />
      <div className="pt-[calc(env(safe-area-inset-top)+1rem)] px-4 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Ajustes de notificaciones</h1>
        </div>
        <UserNotificationSettings />
      </div>
    </AppLayout>
  );
}
