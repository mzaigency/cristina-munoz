import { SEO } from "@/components/SEO";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email demasiado largo"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email.toLowerCase(),
        { redirectTo: `${window.location.origin}/nueva-contrasena` }
      );
      if (error) throw error;
      setEmailSent(true);
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      toast({ title: "Error", description: "Ha ocurrido un error. Inténtalo de nuevo más tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout hideNavigation>
      <SEO title="Recuperar Contraseña" description="Recupera el acceso a tu cuenta" canonicalUrl="/recuperar-contrasena" noindex />

      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Recuperar contraseña</h1>
        </div>
      </div>

      <div className="px-5 py-8">
        <div className="max-w-md mx-auto">
          {emailSent ? (
            <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-6 shadow-sm text-center space-y-5">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Email enviado</h2>
                <p className="text-sm text-muted-foreground">
                  Revisa tu bandeja de entrada (y spam) para encontrar el enlace. Expira en 1 hora.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => { setEmailSent(false); form.reset(); }}>
                  Enviar de nuevo
                </Button>
                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium" onClick={() => navigate("/auth")}>
                  Volver a iniciar sesión
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">¿Olvidaste tu contraseña?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Introduce tu email y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-5 shadow-sm">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="tu@email.com" {...field} disabled={loading} className="h-12 rounded-xl" autoComplete="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium" disabled={loading}>
                      {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>) : "Enviar enlace de recuperación"}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/auth")}>
                      Volver a iniciar sesión
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
