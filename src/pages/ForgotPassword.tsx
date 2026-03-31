import { SEO } from "@/components/SEO";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: values.email.toLowerCase() }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Si el email existe, recibirás un enlace para recuperar tu contraseña.",
      });
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Recuperar Contraseña"
        description="Recupera el acceso a tu cuenta de GlowApp"
        canonicalUrl="/recuperar-contrasena"
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
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="text-white/70 text-sm mt-1.5">
              Te enviaremos un enlace para restablecerla
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 pb-8 relative z-10">
        <div className="max-w-md mx-auto">
          <Card className="rounded-2xl border-0 shadow-xl bg-card/95 backdrop-blur-lg">
            <CardHeader className="text-center pb-2 pt-6">
              {emailSent ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">¡Email enviado!</CardTitle>
                  <CardDescription className="text-xs">
                    Revisa tu bandeja de entrada (y spam) para encontrar el enlace de recuperación.
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle className="text-lg">¿Olvidaste tu contraseña?</CardTitle>
                  <CardDescription className="text-xs">
                    Introduce tu email y te enviaremos un enlace para restablecerla.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {emailSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    El enlace expira en 1 hora. Si no recibes el email, verifica que el email sea correcto.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 rounded-xl"
                    onClick={() => {
                      setEmailSent(false);
                      form.reset();
                    }}
                  >
                    Enviar de nuevo
                  </Button>
                  <Button 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium shadow-lg shadow-primary/25"
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="tu@email.com"
                              {...field}
                              disabled={loading}
                              className="h-12 rounded-xl"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium shadow-lg shadow-primary/25" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar enlace de recuperación"
                      )}
                    </Button>

                    <Button 
                      type="button"
                      variant="ghost" 
                      className="w-full"
                      onClick={() => navigate("/auth")}
                    >
                      Volver a iniciar sesión
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
