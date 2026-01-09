import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";

type VerificationStatus = "verifying" | "success" | "error" | "expired";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [email, setEmail] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-email", {
          body: { token },
        });

        if (error) {
          console.error("Verification error:", error);
          setStatus("error");
          return;
        }

        if (data.success) {
          setEmail(data.email || "");
          setStatus("success");
        } else if (data.error === "invalid_or_expired") {
          setStatus("expired");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Verificar Email"
        description="Verifica tu dirección de correo electrónico"
        canonicalUrl="/verify-email"
        noindex
      />

      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="ios-card max-w-md w-full">
          <CardContent className="pt-8 pb-8">
            {status === "verifying" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Verificando...</h2>
                  <p className="text-muted-foreground text-sm">
                    Estamos verificando tu dirección de correo electrónico.
                  </p>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-green-700">¡Email verificado!</h2>
                  <p className="text-muted-foreground text-sm">
                    Tu cuenta ha sido activada correctamente.
                  </p>
                  {email && (
                    <p className="font-medium text-foreground text-sm">{email}</p>
                  )}
                </div>
                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
                    Iniciar sesión
                  </Button>
                </div>
              </div>
            )}

            {status === "expired" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-amber-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-amber-700">Enlace expirado</h2>
                  <p className="text-muted-foreground text-sm">
                    El enlace de verificación ha expirado o ya fue utilizado.
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Si aún no has verificado tu cuenta, intenta registrarte de nuevo.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
                    Ir a registro
                  </Button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-red-700">Error de verificación</h2>
                  <p className="text-muted-foreground text-sm">
                    No pudimos verificar tu email. Por favor, inténtalo de nuevo.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/auth")}
                  >
                    Volver al inicio
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
