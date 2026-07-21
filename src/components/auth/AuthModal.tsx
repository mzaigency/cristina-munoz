import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/useHaptic";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
}

type AuthMode = "login" | "signup";

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Iniciar sesión",
  subtitle = "Accede para continuar con tu reserva",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const haptic = useHaptic();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
  };

  const handleClose = () => {
    haptic.selection();
    resetForm();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    haptic.selection();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        haptic.error();
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Error de acceso",
            description: "Email o contraseña incorrectos",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      haptic.success();
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Login error:", error);
      haptic.error();
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    haptic.selection();

    if (!fullName.trim()) {
      haptic.warning();
      toast({
        title: "Nombre requerido",
        description: "Por favor, introduce tu nombre completo",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      haptic.warning();
      toast({
        title: "Teléfono requerido",
        description: "Necesitamos tu teléfono para confirmar las citas",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        haptic.error();
        if (error.message.includes("already registered")) {
          toast({
            title: "Email ya registrado",
            description: "Este email ya tiene una cuenta. ¿Quieres iniciar sesión?",
            variant: "destructive",
          });
          setMode("login");
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      haptic.success();
      toast({
        title: "¡Cuenta creada!",
        description: "Tu cuenta ha sido creada correctamente",
      });
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Signup error:", error);
      haptic.error();
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-card/70 backdrop-blur-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-border/30"
        >
          {/* Handle bar for mobile */}
          <div className="sm:hidden flex justify-center pt-3">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="p-6 pt-4 sm:pt-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {mode === "login" ? title : "Crear cuenta"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login" ? subtitle : "Regístrate para reservar tu cita"}
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl mb-4 gap-2 font-medium"
              disabled={loading}
              onClick={async () => {
                haptic.selection();
                setLoading(true);
                try {
                  const result = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin + window.location.pathname,
                  });
                  if (result.error) {
                    haptic.error();
                    toast({
                      title: "Error con Google",
                      description: (result.error as any)?.message || "No se pudo iniciar sesión con Google",
                      variant: "destructive",
                    });
                    setLoading(false);
                    return;
                  }
                  if (result.redirected) return;
                  haptic.success();
                  onSuccess();
                } catch (err: any) {
                  haptic.error();
                  toast({ title: "Error", description: err?.message || "Error con Google", variant: "destructive" });
                  setLoading(false);
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuar con Google
            </Button>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">o con email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={mode === "login" ? handleLogin : handleSignup}>

              <div className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Tu nombre"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">📱</span>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="600 123 456"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {mode === "login" ? "Entrando..." : "Creando cuenta..."}
                    </>
                  ) : mode === "login" ? (
                    "Iniciar sesión"
                  ) : (
                    "Crear cuenta"
                  )}
                </Button>
              </div>
            </form>
            {/* Toggle mode */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setMode("signup");
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Regístrate
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setMode("login");
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Inicia sesión
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
