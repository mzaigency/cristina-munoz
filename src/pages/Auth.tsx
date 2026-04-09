import { SEO } from "@/components/SEO";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { phoneSchema, cleanPhoneNumber } from "@/lib/phoneValidation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, ArrowLeft, ArrowRight, Mail, CheckCircle, MapPin, Check } from "lucide-react";
import { AppLayout } from "@/components/navigation/AppLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cities as getCitiesES, provinces as getProvincesES } from "all-spanish-cities";
import { motion, AnimatePresence } from "motion/react";
import { Progress } from "@/components/ui/progress";

const signInSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Contraseña demasiado larga"),
});

const signUpSchema = z.object({
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
  email: z.string().trim().email("Email inválido").max(255, "Email demasiado largo"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100, "Contraseña demasiado larga"),
  confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const STEP_LABELS = ["Quién eres", "Dónde estás", "Seguridad"];

function generateUsername(firstName: string, lastName: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const f = clean(firstName);
  const l = clean(lastName);
  if (!f) return "";
  return l ? `${f}_${l}` : f;
}

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signUpStep, setSignUpStep] = useState(1);

  const [emailSent, setEmailSent] = useState(() => Boolean(sessionStorage.getItem("pendingVerificationEmail")));
  const [sentEmail, setSentEmail] = useState(() => sessionStorage.getItem("pendingVerificationEmail") ?? "");

  const [citySearch, setCitySearch] = useState("");

  // Real-time validation states
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);

  // Geolocation
  const [geoLoading, setGeoLoading] = useState(false);

  const suppressSessionRedirectRef = useRef(emailSent);

  const navigate = useNavigate();
  const { toast } = useToast();

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      phone: "",
      province: "",
      city: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const selectedProvince = signUpForm.watch("province") || "";
  const watchedFirstName = signUpForm.watch("firstName");
  const watchedLastName = signUpForm.watch("lastName");

  // Auto-suggest username from name
  useEffect(() => {
    if (!isSignUp || usernameManuallyEdited) return;
    const suggested = generateUsername(watchedFirstName, watchedLastName);
    if (suggested && suggested.length >= 3) {
      signUpForm.setValue("username", suggested, { shouldValidate: false });
      // Reset availability before checking
      setUsernameAvailable(null);
      checkUsernameAvailability(suggested);
    } else {
      setUsernameAvailable(null);
    }
  }, [watchedFirstName, watchedLastName, isSignUp, usernameManuallyEdited]);

  const provincesList = useMemo(() => {
    return getProvincesES()
      .map((p) => ({ code: p.code, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const citiesList = useMemo(() => {
    if (!selectedProvince) return [];
    const province = getProvincesES().find((p) => p.name === selectedProvince);
    if (!province) return [];
    return getCitiesES({ code_province: province.code })
      .map((c) => c.name)
      .sort();
  }, [selectedProvince]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return citiesList.slice(0, 50);
    return citiesList.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 50);
  }, [citiesList, citySearch]);

  useEffect(() => {
    suppressSessionRedirectRef.current = emailSent || suppressSessionRedirectRef.current;
  }, [emailSent]);

  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    };
  }, []);

  const checkUsernameAvailability = useCallback((username: string) => {
    if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
    setUsernameAvailable(null);

    if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);

    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.toLowerCase())
          .maybeSingle();

        if (existing) {
          signUpForm.setError("username", { type: "manual", message: "Este nombre de usuario ya está en uso" });
          setUsernameAvailable(false);
        } else {
          const currentError = signUpForm.formState.errors.username;
          if (currentError?.message === "Este nombre de usuario ya está en uso") {
            signUpForm.clearErrors("username");
          }
          setUsernameAvailable(true);
        }
      } catch {
        // silent
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
  }, [signUpForm]);

  const checkEmailAvailability = useCallback((email: string) => {
    if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    setEmailAvailable(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);

    emailTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existing) {
          signUpForm.setError("email", { type: "manual", message: "Ya existe una cuenta con este email" });
          setEmailAvailable(false);
        } else {
          const currentError = signUpForm.formState.errors.email;
          if (currentError?.message === "Ya existe una cuenta con este email") {
            signUpForm.clearErrors("email");
          }
          setEmailAvailable(true);
        }
      } catch {
        // silent
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
  }, [signUpForm]);

  // Geolocation: detect city from coords
  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "No disponible", description: "Tu navegador no soporta geolocalización", variant: "destructive" });
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use reverse geocoding via Nominatim (free, no API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`
          );
          const data = await res.json();

          const city =
            data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || "";
          const state = data.address?.state || "";

          // Try to match province
          if (state) {
            const matchedProvince = provincesList.find(
              (p) => p.name.toLowerCase() === state.toLowerCase() || state.toLowerCase().includes(p.name.toLowerCase())
            );
            if (matchedProvince) {
              signUpForm.setValue("province", matchedProvince.name, { shouldValidate: true });

              // Wait a tick for cities to populate, then set city
              setTimeout(() => {
                if (city) {
                  const allCities = getCitiesES({ code_province: matchedProvince.code }).map((c) => c.name);
                  const matchedCity = allCities.find(
                    (c) => c.toLowerCase() === city.toLowerCase() || city.toLowerCase().includes(c.toLowerCase())
                  );
                  if (matchedCity) {
                    signUpForm.setValue("city", matchedCity, { shouldValidate: true });
                  }
                }
              }, 100);
            }
          }

          toast({ title: "📍 Ubicación detectada", description: city ? `${city}, ${state}` : state || "Ubicación encontrada" });
        } catch {
          toast({ title: "Error", description: "No se pudo detectar tu ciudad", variant: "destructive" });
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoLoading(false);
        toast({ title: "Permiso denegado", description: "Activa la ubicación o selecciona manualmente", variant: "destructive" });
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  useEffect(() => {
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
    const msg = error?.message?.toLowerCase() || "";
    const code = error?.code || "";

    if (msg.includes("user already registered") || code === "user_already_exists")
      return { title: "Email ya registrado", description: "Ya existe una cuenta con este email. Prueba a iniciar sesión." };
    if (msg.includes("invalid login credentials") || msg.includes("invalid credentials"))
      return { title: "Credenciales incorrectas", description: "El email o la contraseña no son correctos." };
    if (msg.includes("rate limit") || msg.includes("too many requests"))
      return { title: "Demasiados intentos", description: "Has realizado demasiados intentos. Espera unos minutos." };
    if (msg.includes("network") || msg.includes("fetch"))
      return { title: "Error de conexión", description: "Comprueba tu conexión a internet e inténtalo de nuevo." };
    return { title: "Error", description: error?.message || "Ha ocurrido un error. Inténtalo de nuevo." };
  };

  // Step validation before advancing
  const canAdvanceStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      const valid = await signUpForm.trigger(["firstName", "lastName", "username", "phone"]);
      if (!valid) return false;
      // Check username one more time
      const username = signUpForm.getValues("username");
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      if (existing) {
        signUpForm.setError("username", { type: "manual", message: "Este nombre de usuario ya está en uso" });
        return false;
      }
      return true;
    }
    if (step === 2) {
      return await signUpForm.trigger(["province", "city"]);
    }
    return true;
  };

  const handleNextStep = async () => {
    const canAdvance = await canAdvanceStep(signUpStep);
    if (canAdvance) setSignUpStep((s) => Math.min(s + 1, 3));
  };

  const handleSignIn = async (values: SignInFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;

      const emailVerified = data.user?.user_metadata?.email_verified;
      if (!emailVerified) {
        await supabase.auth.signOut();
        toast({
          title: "Email no verificado",
          description: "Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Bienvenido", description: "Has iniciado sesión correctamente" });
    } catch (error: any) {
      const { title, description } = getErrorMessage(error);
      toast({ title, description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (values: any) => {
    const v = values as { firstName: string; lastName: string; username: string; phone: string; province: string; city: string; email: string; password: string; confirmPassword: string; acceptTerms: boolean };
    setLoading(true);
    try {
      // Final checks
      const { data: existingUsername } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", v.username.toLowerCase())
        .maybeSingle();
      if (existingUsername) {
        signUpForm.setError("username", { type: "manual", message: "Este nombre de usuario ya está en uso" });
        setSignUpStep(1);
        setLoading(false);
        return;
      }

      const { data: existingEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", v.email.toLowerCase())
        .maybeSingle();
      if (existingEmail) {
        signUpForm.setError("email", { type: "manual", message: "Ya existe una cuenta con este email" });
        setLoading(false);
        return;
      }

      suppressSessionRedirectRef.current = true;

      const { data, error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          data: {
            full_name: `${v.firstName} ${v.lastName}`,
            username: v.username.toLowerCase(),
            phone: cleanPhoneNumber(v.phone),
            country: "España",
            province: v.province,
            city: v.city,
            email_verified: false,
          },
        },
      });

      if (error) throw error;

      if (data.user && data.user.identities?.length === 0) {
        signUpForm.setError("email", { type: "manual", message: "Ya existe una cuenta con este email" });
        setLoading(false);
        return;
      }

      if (data.user) {
        sessionStorage.setItem("pendingVerificationEmail", v.email);
        setSentEmail(v.email);
        setEmailSent(true);

        await supabase.auth.signOut();

        try {
          await supabase.functions.invoke("send-verification-email", {
            body: {
              userId: data.user.id,
              email: v.email,
              userName: v.firstName,
            },
          });
        } catch {
          // Still show confirmation
        }

        setLoading(false);
        return;
      }
    } catch (error: any) {
      suppressSessionRedirectRef.current = false;
      const { title, description } = getErrorMessage(error);
      toast({ title, description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const progressValue = (signUpStep / 3) * 100;

  return (
    <AppLayout hideNavigation>
      <SEO
        title={isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
        description="Accede a tu cuenta para gestionar tus reservas"
        canonicalUrl="/auth"
        noindex
      />

      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSignUp && signUpStep > 1) {
                setSignUpStep((s) => s - 1);
              } else {
                navigate("/");
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-foreground">
            {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </h1>
          {isSignUp && !emailSent && (
            <span className="ml-auto text-xs text-muted-foreground font-medium">
              Paso {signUpStep}/3
            </span>
          )}
        </div>
        {isSignUp && !emailSent && (
          <div className="px-4 pb-3">
            <Progress value={progressValue} className="h-1.5" />
            <div className="flex justify-between mt-2">
              {STEP_LABELS.map((label, i) => (
                <span
                  key={label}
                  className={`text-[11px] font-medium transition-colors ${
                    i + 1 <= signUpStep ? "text-primary" : "text-muted-foreground/50"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-8">
        <div className="max-w-md mx-auto">
          {/* Email Verification Screen */}
          {emailSent ? (
            <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-6 shadow-sm">
              <div className="text-center space-y-5">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">Verifica tu correo</h2>
                  <p className="text-muted-foreground text-sm">Hemos enviado un enlace de verificación a</p>
                  <p className="font-medium text-foreground text-sm">{sentEmail}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
                </p>
                <Button
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium"
                  onClick={() => {
                    sessionStorage.removeItem("pendingVerificationEmail");
                    suppressSessionRedirectRef.current = false;
                    setEmailSent(false);
                    setIsSignUp(false);
                    signInForm.reset();
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ya verifiqué, iniciar sesión
                </Button>
              </div>
            </div>
          ) : !isSignUp ? (
            /* ---------- LOGIN ---------- */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Bienvenido</h2>
                <p className="text-sm text-muted-foreground mt-1">Accede con tu email y contraseña</p>
              </div>
              <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-5 shadow-sm">
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="tu@email.com" {...field} disabled={loading} className="h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
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
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate("/recuperar-contrasena")}
                        className="text-sm text-primary hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Iniciando sesión...
                        </>
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
                      setIsSignUp(true);
                      setSignUpStep(1);
                      signUpForm.reset();
                      setUsernameManuallyEdited(false);
                      setUsernameAvailable(null);
                      setEmailAvailable(null);
                    }}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    ¿No tienes cuenta? Regístrate
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ---------- SIGNUP (STEPPED) ---------- */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Crea tu cuenta</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {signUpStep === 1 && "Cuéntanos sobre ti"}
                  {signUpStep === 2 && "¿Desde dónde nos visitas?"}
                  {signUpStep === 3 && "Protege tu cuenta"}
                </p>
              </div>
              <div className="rounded-2xl bg-card/60 backdrop-blur-lg border border-border/30 p-5 shadow-sm">
                <Form {...signUpForm}>
                  <form
                    onSubmit={signUpForm.handleSubmit(handleSignUp)}
                    className="space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      {/* STEP 1: Identity */}
                      {signUpStep === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={signUpForm.control}
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
                              control={signUpForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Apellido</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Apellido" {...field} disabled={loading} className="h-12 rounded-xl" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={signUpForm.control}
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
                                      onChange={(e) => {
                                        field.onChange(e);
                                        setUsernameManuallyEdited(true);
                                        checkUsernameAvailability(e.target.value);
                                      }}
                                      disabled={loading}
                                      className="h-12 rounded-xl pl-8 pr-10"
                                    />
                                    {checkingUsername && (
                                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                    {!checkingUsername && usernameAvailable === true && field.value.length >= 3 && (
                                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                </FormControl>
                                {!checkingUsername && usernameAvailable === true && field.value.length >= 3 && (
                                  <p className="text-xs text-green-500 mt-1">Disponible ✓</p>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={signUpForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                  <Input type="tel" placeholder="612345678" {...field} disabled={loading} className="h-12 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      )}

                      {/* STEP 2: Location */}
                      {signUpStep === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          {/* Geolocation button */}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
                            onClick={handleUseLocation}
                            disabled={geoLoading}
                          >
                            {geoLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <MapPin className="h-4 w-4 mr-2" />
                            )}
                            Usar mi ubicación actual
                          </Button>

                          <div className="relative flex items-center gap-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground">o selecciona manualmente</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={signUpForm.control}
                              name="province"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Provincia</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      signUpForm.setValue("city", "");
                                      setCitySearch("");
                                    }}
                                    disabled={loading}
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
                              control={signUpForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ciudad</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange} disabled={loading || citiesList.length === 0}>
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
                        </motion.div>
                      )}

                      {/* STEP 3: Security */}
                      {signUpStep === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -40 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4"
                        >
                          <FormField
                            control={signUpForm.control}
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
                                        checkEmailAvailability(e.target.value);
                                      }}
                                      disabled={loading}
                                      className="h-12 rounded-xl pr-10"
                                    />
                                    {checkingEmail && (
                                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                    {!checkingEmail && emailAvailable === true && (
                                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={signUpForm.control}
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

                          <FormField
                            control={signUpForm.control}
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
                            control={signUpForm.control}
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
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="flex gap-3 pt-2">
                      {signUpStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-12 rounded-xl"
                          onClick={() => setSignUpStep((s) => s - 1)}
                          disabled={loading}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Atrás
                        </Button>
                      )}

                      {signUpStep < 3 ? (
                        <Button
                          type="button"
                          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium"
                          onClick={handleNextStep}
                          disabled={loading}
                        >
                          Continuar
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creando cuenta...
                            </>
                          ) : (
                            "Crear cuenta"
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setSignUpStep(1);
                      signInForm.reset();
                    }}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    ¿Ya tienes cuenta? Inicia sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
