import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
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
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => { if (!token) setInvalidToken(true); }, [token]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) { setInvalidToken(true); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { token, newPassword: values.password }
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error.includes('expirado') || data.error.includes('válido')) setInvalidToken(true);
        else toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      setSuccess(true);
      toast({ title: "¡Contraseña actualizada!", description: "Ya puedes iniciar sesión con tu nueva contraseña." });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({ title: "Error", description: "Ha ocurrido un error. Inténtalo de nuevo más tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout hideNavigation>
      <SEO title="Nueva Contraseña" description="Establece tu nueva contraseña" canonicalUrl="/nueva-contrasena" noindex />

      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Nueva contraseña</h1>
        </div>
      </div>

      <div className="px-5 py-8">
        <div className="max-w-md mx-auto">
          {success ? (
            <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-6 shadow-sm text-center space-y-5">
              <div className="mx-auto w-14 h-14 rounded-full bg-[hsl(142,76%,36%)]/10 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-[hsl(142,76%,36%)]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">¡Contraseña actualizada!</h2>
                <p className="text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              </div>
              <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium" onClick={() => navigate("/auth")}>
                Ir a iniciar sesión
              </Button>
            </div>
          ) : invalidToken ? (
            <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-6 shadow-sm text-center space-y-5">
              <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-7 w-7 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Enlace inválido</h2>
                <p className="text-sm text-muted-foreground">Este enlace ha expirado o no es válido.</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium" onClick={() => navigate("/recuperar-contrasena")}>
                  Solicitar nuevo enlace
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => navigate("/auth")}>
                  Volver a iniciar sesión
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Crea tu nueva contraseña</h2>
                <p className="text-sm text-muted-foreground mt-1">Mínimo 8 caracteres para mayor seguridad.</p>
              </div>

              <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-5 shadow-sm">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={loading} className="h-12 rounded-xl pr-10" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={loading} className="h-12 rounded-xl pr-10" autoComplete="new-password" />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium" disabled={loading}>
                      {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Actualizando...</>) : "Cambiar contraseña"}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
