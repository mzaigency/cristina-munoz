import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Contraseña demasiado larga"),
});

const signUpSchema = signInSchema.extend({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(50),
  lastName: z.string().trim().min(1, "El apellido es requerido").max(50),
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(30, "Máximo 30 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  phone: z.string().trim().min(9, "Mínimo 9 dígitos").max(15),
  country: z.string().trim().min(1, "El país es requerido").max(100),
  province: z.string().trim().min(1, "La provincia es requerida").max(100),
  city: z.string().trim().min(1, "La ciudad es requerida").max(100),
  confirmPassword: z.string().min(6),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<SignInFormValues | SignUpFormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(isSignUp ? { firstName: "", lastName: "", username: "", phone: "", country: "España", province: "", city: "", confirmPassword: "", acceptTerms: false } : {}),
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/mis-citas");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/mis-citas");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const getErrorMessage = (error: any): { title: string; description: string } => {
    const errorMessage = error?.message?.toLowerCase() || "";
    const errorCode = error?.code || "";

    // Email errors
    if (errorMessage.includes("user already registered") || errorCode === "user_already_exists") {
      return {
        title: "Email ya registrado",
        description: "Ya existe una cuenta con este email. Prueba a iniciar sesión.",
      };
    }
    if (errorMessage.includes("invalid email") || errorMessage.includes("email")) {
      return {
        title: "Email inválido",
        description: "Por favor, introduce un email válido.",
      };
    }

    // Password errors
    if (errorMessage.includes("password") && errorMessage.includes("weak")) {
      return {
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 6 caracteres.",
      };
    }
    if (errorMessage.includes("invalid login credentials") || errorMessage.includes("invalid credentials")) {
      return {
        title: "Credenciales incorrectas",
        description: "El email o la contraseña no son correctos.",
      };
    }

    // Rate limiting
    if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
      return {
        title: "Demasiados intentos",
        description: "Has realizado demasiados intentos. Espera unos minutos.",
      };
    }

    // Network errors
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return {
        title: "Error de conexión",
        description: "Comprueba tu conexión a internet e inténtalo de nuevo.",
      };
    }

    // Generic error
    return {
      title: "Error",
      description: error?.message || "Ha ocurrido un error. Inténtalo de nuevo.",
    };
  };

  const handleAuth = async (values: SignInFormValues | SignUpFormValues) => {
    setLoading(true);
    try {
      if (isSignUp) {
        const signUpValues = values as SignUpFormValues;
        
        // Check if username is available
        const { data: existingUsername } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", signUpValues.username.toLowerCase())
          .maybeSingle();

        if (existingUsername) {
          form.setError("username" as any, {
            type: "manual",
            message: "Este nombre de usuario ya está en uso",
          });
          setLoading(false);
          return;
        }

        // Check if email is already registered
        const { data: existingEmail } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", signUpValues.email.toLowerCase())
          .maybeSingle();

        if (existingEmail) {
          form.setError("email", {
            type: "manual",
            message: "Ya existe una cuenta con este email",
          });
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase.auth.signUp({
          email: signUpValues.email,
          password: signUpValues.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: `${signUpValues.firstName} ${signUpValues.lastName}`,
              username: signUpValues.username.toLowerCase(),
              phone: signUpValues.phone,
              country: signUpValues.country,
              province: signUpValues.province,
              city: signUpValues.city,
            }
          }
        });

        if (error) throw error;

        // Check if user was actually created (Supabase returns user even if email exists in some cases)
        if (data.user && !data.session && data.user.identities?.length === 0) {
          form.setError("email", {
            type: "manual",
            message: "Ya existe una cuenta con este email",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "¡Cuenta creada!",
          description: "Redirigiendo...",
        });

        if (data.session) {
          navigate("/mis-citas");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;

        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        });
      }
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout hideNavigation>
      <SEO
        title={isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
        description="Accede a tu cuenta para gestionar tus reservas"
        canonicalUrl="/auth"
        noindex
      />

      {/* Header */}
      <div 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">
            {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </h1>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="ios-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">
                {isSignUp ? "Crea tu cuenta" : "Bienvenido"}
              </CardTitle>
              <CardDescription>
                {isSignUp 
                  ? "Regístrate para gestionar tus citas" 
                  : "Accede a tu cuenta"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAuth)} className="space-y-4">
                  {isSignUp && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Nombre" 
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
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Apellido</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Apellido" 
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de usuario</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                <Input 
                                  placeholder="tu_usuario" 
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl pl-8"
                                />
                              </div>
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
                            <FormLabel>Teléfono</FormLabel>
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

                      {/* Location fields */}
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="España" 
                                {...field}
                                disabled={loading}
                                className="h-12 rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provincia</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Barcelona" 
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
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ciudad</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Santpedor" 
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••" 
                              {...field}
                              disabled={loading}
                              className="h-12 rounded-xl pr-10"
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

                  {isSignUp && (
                    <>
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
                                  placeholder="••••••" 
                                  {...field}
                                  disabled={loading}
                                  className="h-12 rounded-xl pr-10"
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

                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={loading}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                Acepto los términos y condiciones
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isSignUp ? "Creando cuenta..." : "Iniciando sesión..."}
                      </>
                    ) : (
                      isSignUp ? "Crear cuenta" : "Iniciar sesión"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    form.reset();
                  }}
                  className="text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  {isSignUp 
                    ? "¿Ya tienes cuenta? Inicia sesión" 
                    : "¿No tienes cuenta? Regístrate"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
