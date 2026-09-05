import { SEO } from "@/components/SEO";
import { AppLayout } from "@/components/navigation/AppLayout";
import { UserNotificationSettings } from "@/components/notifications/UserNotificationSettings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationSettingsPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <SEO
        title="Notificaciones"
        description="Gestiona tus preferencias de notificaciones"
        canonicalUrl="/perfil/notificaciones"
        noindex
      />
      {/* Standard Consistent Sticky Header */}
      <div className="sticky top-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-line/60 pt-[env(safe-area-inset-top)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/perfil")}
            className="shrink-0 -ml-2 hover:bg-transparent"
            aria-label="Volver a perfil"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Ajustes de notificaciones
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">
        <UserNotificationSettings />
      </div>
    </AppLayout>
  );
}
