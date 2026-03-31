import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
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
                  className="w-full h-12 text-base font-medium rounded-xl"
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
