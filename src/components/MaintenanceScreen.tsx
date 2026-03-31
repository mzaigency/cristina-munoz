import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wrench, Sparkles, Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const MaintenanceScreen = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: isSuperadmin, error: rpcError } = await supabase
        .rpc("check_superadmin_email", { _email: email.trim().toLowerCase() });

      if (rpcError || !isSuperadmin) {
        setError("No autorizado");
        setLoading(false);
        return;
      }

      setStep("password");
    } catch {
      setError("Error al verificar");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError("Contraseña incorrecta");
        return;
      }
      // Auth state change will trigger MaintenanceGate re-check automatically
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[hsl(230,85%,60%)] via-[hsl(250,80%,55%)] to-[hsl(270,80%,60%)] flex items-center justify-center p-6"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Decorative blurred circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[20%] right-[5%] w-80 h-80 rounded-full bg-purple-300/10 blur-3xl" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-200/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 text-center max-w-md mx-auto w-full"
      >
        {/* Logo / Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-xl border border-white/20 shadow-2xl">
            <Wrench className="h-11 w-11 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight"
        >
          Estamos mejorando
          <br />
          <span className="text-white/80">GlowApp</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-white/70 text-base sm:text-lg leading-relaxed mb-8"
        >
          Estamos realizando tareas de mantenimiento para ofrecerte una mejor experiencia. Volvemos enseguida.
        </motion.p>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 mb-10"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-white/60"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Admin Login Section */}
        <AnimatePresence mode="wait">
          {!showLogin ? (
            <motion.button
              key="toggle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.8 }}
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-2 text-white/40 text-xs hover:text-white/60 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Acceso administrador</span>
            </motion.button>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-left"
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-white/70" />
                <span className="text-sm font-medium text-white/80">Acceso autorizado</span>
              </div>

              {step === "email" ? (
                <form onSubmit={handleCheckEmail} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-red-300 text-xs">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                      required
                      autoFocus
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-300 text-xs">{error}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setStep("email"); setPassword(""); setError(""); }}
                      className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 text-sm transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom sparkle */}
        {!showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="inline-flex items-center gap-2 text-white/50 text-sm mt-4"
          >
            <Sparkles className="h-4 w-4" />
            <span>Preparando novedades para ti</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
