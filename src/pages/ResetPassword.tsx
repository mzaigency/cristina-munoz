import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, KeyRound } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Contraseña demasiado larga"),
  confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
    }
  }, [token]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setInvalidToken(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { 
          token,
          newPassword: values.password 
        }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('expirado') || data.error.includes('válido')) {
          setInvalidToken(true);
        } else {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
        }
        return;
      }

      setSuccess(true);
      toast({
        title: "¡Contraseña actualizada!",
        description: "Ya puedes iniciar sesión con tu nueva contraseña.",
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const heroIcon = success ? (
    <CheckCircle className="h-8 w-8 text-white" />
  ) : invalidToken ? (
    <XCircle className="h-8 w-8 text-white" />
  ) : (
    <KeyRound className="h-8 w-8 text-white" />
  );

  const heroTitle = success ? "¡Listo!" : invalidToken ? "Enlace inválido" : "Nueva contraseña";
  const heroSubtitle = success 
    ? "Tu contraseña ha sido actualizada" 
    : invalidToken 
    ? "Este enlace ha expirado o no es válido" 
    : "Crea una contraseña segura para tu cuenta";

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Nueva Contraseña"
        description="Establece tu nueva contraseña en GlowApp"
        canonicalUrl="/nueva-contrasena"
        noindex
      />

      {/* Branded gradient hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-[hsl(290,70%,45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.18)_0%,_transparent_60%)]" />
        <div className="relative px-4">
          <div className="flex items-center gap-3 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")} className="text-white/90 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="text-center pb-10 pt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-4 shadow-lg border border-white/20">
              {heroIcon}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {heroTitle}
            </h1>
            <p className="text-white/70 text-sm mt-1.5">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-8 relative z-10">
        <div className="max-w-md mx-auto">
          <Card className="rounded-2xl border-0 shadow-xl bg-card/95 backdrop-blur-lg">
            <CardHeader className="text-center pb-2 pt-6">
              {success ? (
                <>
                  <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[hsl(142,76%,36%)]/20 to-[hsl(142,76%,36%)]/10 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="h-7 w-7 text-[hsl(142,76%,36%)]" />
                  </div>
                  <CardTitle className="text-lg">¡Contraseña actualizada!</CardTitle>
                  <CardDescription className="text-xs">
                    Ya puedes iniciar sesión con tu nueva contraseña.
                  </CardDescription>
                </>
              ) : invalidToken ? (
                <>
                  <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                    <XCircle className="h-7 w-7 text-destructive" />
                  </div>
                  <CardTitle className="text-lg">Enlace inválido</CardTitle>
                  <CardDescription className="text-xs">
                    Este enlace ha expirado o no es válido. Solicita uno nuevo.
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle className="text-lg">Crea tu nueva contraseña</CardTitle>
                  <CardDescription className="text-xs">
                    Mínimo 8 caracteres para mayor seguridad.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {success ? (
                <Button 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium shadow-lg shadow-primary/25"
                  onClick={() => navigate("/auth")}
                >
                  Ir a iniciar sesión
                </Button>
              ) : invalidToken ? (
                <div className="space-y-4">
                  <Button 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium shadow-lg shadow-primary/25"
                    onClick={() => navigate("/recuperar-contrasena")}
                  >
                    Solicitar nuevo enlace
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    onClick={() => navigate("/auth")}
                  >
                    Volver a iniciar sesión
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                disabled={loading}
                                className="h-12 rounded-xl pr-10"
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar contraseña</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                disabled={loading}
                                className="h-12 rounded-xl pr-10"
                                autoComplete="new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium shadow-lg shadow-primary/25" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        "Cambiar contraseña"
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
