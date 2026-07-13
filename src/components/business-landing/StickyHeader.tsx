import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import glowappLogo from "@/assets/glowapp-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "El panel", href: "#producto" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precio", href: "#precio" },
  { label: "FAQ", href: "#faq" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export const StickyHeader = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div
          className={`flex w-full max-w-3xl items-center gap-3 rounded-full border py-2 pl-5 pr-2 transition-[background-color,box-shadow,border-color] duration-300 ${
            isScrolled
              ? "border-border bg-background/80 shadow-[0_8px_30px_-12px_rgba(20,22,48,0.25)] backdrop-blur-xl"
              : "border-transparent bg-background/40 backdrop-blur-md"
          }`}
        >
          <button onClick={() => navigate("/")} className="flex items-center" aria-label="Glowapp inicio">
            <img src={glowappLogo} alt="Glowapp" width={85} height={32} className="h-7 w-auto" />
          </button>

          <nav className="mx-auto hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            {!isAuthenticated && (
              <button
                onClick={() => navigate("/auth")}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Iniciar sesión
              </button>
            )}
            <button
              onClick={() => navigate("/onboarding")}
              className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-lg hover:shadow-accent/40 active:scale-[0.97]"
              style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            >
              Empieza gratis
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>

          <button
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menú"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="fixed inset-x-3 top-[4.75rem] z-40 rounded-3xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur-xl md:hidden"
          >
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-primary/5"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {!isAuthenticated && (
                <button
                  onClick={() => { navigate("/auth"); setIsMobileMenuOpen(false); }}
                  className="w-full rounded-full border border-border py-3 text-sm font-medium text-foreground"
                >
                  Iniciar sesión
                </button>
              )}
              <button
                onClick={() => { navigate("/onboarding"); setIsMobileMenuOpen(false); }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold text-white"
                style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                Empieza gratis
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
