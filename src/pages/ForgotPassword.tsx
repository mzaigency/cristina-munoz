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

      {/* Header */}
      <div
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Recuperar contraseña</h1>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="ios-card">
            <CardHeader className="text-center pb-4">
              {emailSent ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">¡Email enviado!</CardTitle>
                  <CardDescription>
                    Revisa tu bandeja de entrada (y spam) para encontrar el enlace de recuperación.
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">¿Olvidaste tu contraseña?</CardTitle>
                  <CardDescription>
                    Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
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

                    <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
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
