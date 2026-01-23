import { SEO } from "@/components/SEO";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { phoneSchema, cleanPhoneNumber } from "@/lib/phoneValidation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cities as getCitiesES, provinces as getProvincesES } from "all-spanish-cities";

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Contraseña demasiado larga"),
});

const signUpSchema = signInSchema
  .extend({
    firstName: z.string().trim().min(1, "El nombre es requerido").max(50, "Máximo 50 caracteres"),
    lastName: z.string().trim().min(1, "El apellido es requerido").max(50, "Máximo 50 caracteres"),
    username: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(30, "Máximo 30 caracteres")
      .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
    phone: phoneSchema,
    province: z.string().min(1, "Selecciona una provincia"),
    city: z.string().min(1, "Selecciona una ciudad"),
    confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
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

  // Persist "verify your email" screen across redirect/reload on mobile
  const [emailSent, setEmailSent] = useState(() => Boolean(sessionStorage.getItem("pendingVerificationEmail")));
  const [sentEmail, setSentEmail] = useState(() => sessionStorage.getItem("pendingVerificationEmail") ?? "");

  const [citySearch, setCitySearch] = useState("");

  // Real-time validation states
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent redirect race: signUp creates a session briefly before we signOut.
  // Initialize from emailSent so if user refreshes, we still don't redirect away.
  const suppressSessionRedirectRef = useRef(emailSent);

  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<SignInFormValues | SignUpFormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(isSignUp
        ? { firstName: "", lastName: "", username: "", phone: "", province: "", city: "", confirmPassword: "", acceptTerms: false }
        : {}),
    },
  });

  const selectedProvince = form.watch("province" as any) || "";

  // Get provinces list for Spain
  const provincesList = useMemo(() => {
    return getProvincesES().map(p => ({
      code: p.code,
      name: p.name
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Get cities based on province
  const citiesList = useMemo(() => {
    if (!selectedProvince) return [];
    
    const province = getProvincesES().find(p => p.name === selectedProvince);
    if (!province) return [];
    return getCitiesES({ code_province: province.code })
      .map(c => c.name)
      .sort();
  }, [selectedProvince]);

  useEffect(() => {
    // Keep redirect suppression in sync with persisted state
    suppressSessionRedirectRef.current = emailSent || suppressSessionRedirectRef.current;
  }, [emailSent]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    };
  }, []);

  // Real-time username validation with debounce
  const checkUsernameAvailability = (username: string) => {
    if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
    
    if (!username || username.length < 3) {
      setCheckingUsername(false);
      return;
    }

    // Validate format first
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    
    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: existingUsername } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.toLowerCase())
          .maybeSingle();

        if (existingUsername) {
          form.setError("username" as any, {
            type: "manual",
            message: "Este nombre de usuario ya está en uso",
          });
        } else {
          // Clear error if it was a "already in use" error
          const currentError = (form.formState.errors as any).username;
          if (currentError?.message === "Este nombre de usuario ya está en uso") {
            form.clearErrors("username" as any);
          }
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
  };

  // Real-time email validation with debounce
  const checkEmailAvailability = async (email: string) => {
    if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    
    // Basic email format check
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    
    emailTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: existingEmail } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingEmail) {
          form.setError("email", {
            type: "manual",
            message: "Ya existe una cuenta con este email",
          });
        } else {
          // Clear error if it was a "already in use" error
          const currentError = form.formState.errors.email;
          if (currentError?.message === "Ya existe una cuenta con este email") {
            form.clearErrors("email");
          }
        }
      } catch (error) {
        console.error("Error checking email:", error);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
  };

  const filteredCities = useMemo(() => {
    if (!citySearch) return citiesList.slice(0, 50);
    return citiesList
      .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
      .slice(0, 50);
  }, [citiesList, citySearch]);

  useEffect(() => {
    // Don't redirect if we're showing the email verification screen
    if (emailSent) return;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && !suppressSessionRedirectRef.current) {
        navigate("/mis-citas");
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !suppressSessionRedirectRef.current) {
        navigate("/mis-citas");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, emailSent]);

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
        description: "La contraseña debe tener al menos 8 caracteres.",
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

        // Block auto-redirect while signup is in progress (avoids race with auth listener)
        suppressSessionRedirectRef.current = true;

        const { data, error } = await supabase.auth.signUp({
          email: signUpValues.email,
          password: signUpValues.password,
          options: {
            data: {
              full_name: `${signUpValues.firstName} ${signUpValues.lastName}`,
              username: signUpValues.username.toLowerCase(),
              phone: cleanPhoneNumber(signUpValues.phone),
              country: "España",
              province: signUpValues.province,
              city: signUpValues.city,
              email_verified: false,
            },
          },
        });

        if (error) throw error;

        // Check if user was actually created (Supabase returns user even if email exists in some cases)
        if (data.user && data.user.identities?.length === 0) {
          form.setError("email", {
            type: "manual",
            message: "Ya existe una cuenta con este email",
          });
          setLoading(false);
          return;
        }

        // Send custom verification email via Resend
        if (data.user) {
          // Set email sent state FIRST to show verification screen
          // This prevents the auth listener from redirecting
          sessionStorage.setItem("pendingVerificationEmail", signUpValues.email);
          setSentEmail(signUpValues.email);
          setEmailSent(true);

          // Sign out immediately - user must verify email first
          await supabase.auth.signOut();

          try {
            await supabase.functions.invoke("send-verification-email", {
              body: {
                userId: data.user.id,
                email: signUpValues.email,
                userName: signUpValues.firstName,
              },
            });
          } catch (emailError) {
            console.error("Error sending verification email:", emailError);
            // Still show the confirmation screen, email might just be delayed
          }

          setLoading(false);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;

        // Check if email is verified
        const emailVerified = data.user?.user_metadata?.email_verified;
        if (!emailVerified) {
          // Sign out and show error
          await supabase.auth.signOut();
          toast({
            title: "Email no verificado",
            description: "Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        });
      }
    } catch (error: any) {
      // If signup failed, re-enable redirects
      if (isSignUp) suppressSessionRedirectRef.current = false;

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
          <h1 className="font-semibold text-foreground">{isSignUp ? "Crear cuenta" : "Iniciar sesión"}</h1>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Email Verification Sent Screen */}
          {emailSent ? (
            <Card className="ios-card">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Verifica tu correo</h2>
                    <p className="text-muted-foreground text-sm">
                      Hemos enviado un enlace de verificación a:
                    </p>
                    <p className="font-medium text-foreground">{sentEmail}</p>
                  </div>
                  <div className="pt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        sessionStorage.removeItem("pendingVerificationEmail");
                        suppressSessionRedirectRef.current = false;
                        setEmailSent(false);
                        setIsSignUp(false);
                        form.reset();
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ya verifiqué, iniciar sesión
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card className="ios-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{isSignUp ? "Crea tu cuenta" : "Bienvenido"}</CardTitle>
              <CardDescription>
                {isSignUp ? "Regístrate para gestionar tus citas" : "Accede a tu cuenta"}
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
                                <Input placeholder="Nombre" {...field} disabled={loading} className="h-12 rounded-xl" />
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
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  @
                                </span>
                                <Input
                                  placeholder="tu_usuario"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (isSignUp) {
                                      checkUsernameAvailability(e.target.value);
                                    }
                                  }}
                                  disabled={loading}
                                  className="h-12 rounded-xl pl-8 pr-10"
                                />
                                {checkingUsername && (
                                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
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
                                placeholder="612345678"
                                {...field}
                                disabled={loading}
                                className="h-12 rounded-xl"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Location Fields - Spain only */}

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provincia</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("city" as any, "");
                                  setCitySearch("");
                                }}
                                disabled={loading || provincesList.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Provincia" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {provincesList.map((province) => (
                                    <SelectItem key={province.code} value={province.name}>
                                      {province.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={loading || citiesList.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Ciudad" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {citiesList.length > 50 && (
                                    <div className="px-2 pb-2">
                                      <Input
                                        placeholder="Buscar ciudad..."
                                        value={citySearch}
                                        onChange={(e) => setCitySearch(e.target.value)}
                                        className="h-9"
                                      />
                                    </div>
                                  )}
                                  {filteredCities.map((city) => (
                                    <SelectItem key={city} value={city}>
                                      {city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                          <div className="relative">
                            <Input
                              type="email"
                              placeholder="tu@email.com"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (isSignUp) {
                                  checkEmailAvailability(e.target.value);
                                }
                              }}
                              disabled={loading}
                              className="h-12 rounded-xl pr-10"
                            />
                            {checkingEmail && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
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

                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate('/recuperar-contrasena')}
                        className="text-sm text-primary hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

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
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">Acepto los términos y condiciones</FormLabel>
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
                    ) : isSignUp ? (
                      "Crear cuenta"
                    ) : (
                      "Iniciar sesión"
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
                  {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                </button>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
