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
import { Loader2, ArrowLeft, Building2, Zap, Crown, Check, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { motion } from "motion/react";

const businessSchema = z.object({
  businessName: z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
  businessSlug: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  email: z.string().trim().email("Email inválido"),
  phone: z.string().trim().min(9, "Mínimo 9 dígitos").max(15, "Máximo 15 dígitos").optional().or(z.literal("")),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

const features = [
  "Landing page profesional personalizable",
  "Sistema de reservas online 24/7",
  "Gestión de calendario inteligente",
  "Reseñas y valoraciones de clientes",
  "Stories para promocionar tu trabajo",
  "Panel de administración completo",
];

export default function BusinessOnboarding() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Admin mode: create tenant directly without Stripe
  const isAdminMode = searchParams.get("admin") === "true";

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: "",
      businessSlug: "",
      email: "",
      phone: "",
    },
  });

  // Generate slug from business name
  const watchBusinessName = form.watch("businessName");
  useEffect(() => {
    if (watchBusinessName) {
      const slug = watchBusinessName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      form.setValue("businessSlug", slug);
    }
  }, [watchBusinessName, form]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        form.setValue("email", session.user.email || "");
      }
      setCheckingAuth(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        form.setValue("email", session.user.email || "");
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast({
        title: "Pago cancelado",
        description: "No se ha realizado ningún cargo. Puedes intentarlo de nuevo cuando quieras.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (values: BusinessFormValues) => {
    // Admin mode: require auth but create directly
    if (isAdminMode) {
      if (!user) {
        navigate(`/auth?redirect=/onboarding?admin=true&mode=register`);
        return;
      }
      
      setLoading(true);
      try {
        // Create tenant directly
        const { data: tenant, error: tenantError } = await supabase
          .from("tenants")
          .insert({
            name: values.businessName,
            slug: values.businessSlug,
            email: values.email,
            phone: values.phone || null,
          })
          .select()
          .single();

        if (tenantError) {
          if (tenantError.code === "23505") {
            throw new Error(`El slug "${values.businessSlug}" ya existe`);
          }
          throw tenantError;
        }

        // Create tenant admin
        const { error: adminError } = await supabase
          .from("tenant_admins")
          .insert({
            tenant_id: tenant.id,
            user_id: user.id,
            is_owner: true,
          });

        if (adminError) throw adminError;

        toast({
          title: "¡Tenant creado!",
          description: `${values.businessName} ha sido creado correctamente`,
        });

        navigate("/superadmin");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error al crear el tenant";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal user flow: redirect to Stripe
    if (!user) {
      navigate(`/auth?redirect=/onboarding&mode=register`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-business-checkout", {
        body: {
          plan: selectedPlan,
          businessName: values.businessName,
          businessSlug: values.businessSlug,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al procesar la solicitud";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <AppLayout hideNavigation>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNavigation>
      <SEO
        title="Únete a GlowApp - Crea tu Perfil Profesional"
        description="Digitaliza tu negocio con GlowApp. Perfil profesional, sistema de reservas y conexión directa con clientes."
        canonicalUrl="/onboarding"
      />

      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(isAdminMode ? "/superadmin" : "/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">
            {isAdminMode ? "Crear Nuevo Tenant" : "Unirse a GlowApp"}
          </h1>
        </div>
      </div>

      <div className="px-4 py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            {isAdminMode ? (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Modo Administrador</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Crear Tenant Demo</h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Crea un nuevo salón sin necesidad de pago. Ideal para demos y pruebas.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">30 días gratis de prueba</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Haz crecer tu negocio con GlowApp</h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  Crea tu landing page profesional y empieza a recibir reservas online hoy mismo.
                </p>
              </>
            )}
          </motion.div>

          <div className={isAdminMode ? "" : "grid lg:grid-cols-2 gap-8"}>
            {/* Plan Selection - Only show for non-admin */}
            {!isAdminMode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-lg text-foreground mb-4">Elige tu plan</h3>

                {/* Monthly */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("monthly")}
                  className={`w-full text-left ios-card p-5 transition-all ${
                    selectedPlan === "monthly" ? "border-2 border-primary ring-2 ring-primary/20" : "hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        selectedPlan === "monthly" ? "bg-primary text-primary-foreground" : "bg-secondary"
                      }`}
                    >
                      <Zap className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">Plan Mensual</h4>
                        {selectedPlan === "monthly" && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Flexibilidad total</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">39,99€</span>
                        <span className="text-muted-foreground">/mes</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Annual */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan("annual")}
                  className={`w-full text-left ios-card p-5 transition-all relative ${
                    selectedPlan === "annual" ? "border-2 border-primary ring-2 ring-primary/20" : "hover:border-border"
                  }`}
                >
                  <div className="absolute -top-3 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
                      <Crown className="h-3 w-3" />
                      Más popular
                    </span>
                  </div>
                  <div className="flex items-start gap-4 mt-2">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        selectedPlan === "annual" ? "gradient-primary text-primary-foreground" : "bg-secondary"
                      }`}
                    >
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">Plan Anual</h4>
                        {selectedPlan === "annual" && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Ahorra 2 meses</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">399,99€</span>
                        <span className="text-muted-foreground">/año</span>
                      </div>
                      <p className="text-xs text-success font-medium mt-1">Ahorras 79,89€</p>
                    </div>
                  </div>
                </button>

                {/* Features */}
                <div className="ios-card p-5 mt-6">
                  <h4 className="font-semibold text-foreground mb-4">Incluido en todos los planes:</h4>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
              className={isAdminMode ? "max-w-md mx-auto" : ""}
            >
              <Card className="ios-card">
                <CardHeader>
                  <CardTitle className="text-xl">Datos de tu negocio</CardTitle>
                  <CardDescription>
                    {isAdminMode 
                      ? "Ingresa los datos básicos del nuevo tenant" 
                      : user 
                        ? "Completa la información de tu salón" 
                        : "Crea una cuenta para continuar"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!user && !isAdminMode ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Necesitas una cuenta para crear tu salón.</p>
                      <div className="flex flex-col gap-3">
                        <Button onClick={() => navigate("/auth?redirect=/onboarding&mode=register")} className="w-full">
                          Crear cuenta
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate("/auth?redirect=/onboarding")}
                          className="w-full"
                        >
                          Ya tengo cuenta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre del salón</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Mi Salón de Belleza"
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="businessSlug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL de tu salón</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <span className="text-sm text-muted-foreground mr-2">glowapp.app/</span>
                                  <Input
                                    placeholder="mi-salon"
                                    {...field}
                                    disabled={loading}
                                    className="h-12 rounded-xl flex-1"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email de contacto</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="contacto@misalon.com"
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teléfono (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="600 000 000"
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="pt-4">
                          <Button
                            type="submit"
                            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isAdminMode ? "Creando tenant..." : "Procesando..."}
                              </>
                            ) : isAdminMode ? (
                              "Crear Tenant"
                            ) : (
                              <>
                                Continuar al pago
                                <span className="ml-2 text-xs opacity-80">(30 días gratis)</span>
                              </>
                            )}
                          </Button>
                        </div>

                        {!isAdminMode && (
                          <p className="text-xs text-center text-muted-foreground">
                            No se te cobrará hasta que termine tu período de prueba. Puedes cancelar en cualquier momento.
                          </p>
                        )}
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
