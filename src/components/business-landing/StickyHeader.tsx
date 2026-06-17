import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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

export const StickyHeader = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((window.scrollY / totalHeight) * 100);
    };
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
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "liquid-glass-solid !border-x-0 !border-t-0 shadow-sm"
            : "bg-transparent"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-primary/10 w-full">
          <motion.div className="h-full gradient-primary" style={{ width: `${scrollProgress}%` }} />
        </div>

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.button
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2"
            >
              <img src={glowappLogo} alt="GlowApp" width={85} height={32} className="h-8 w-auto" />
            </motion.button>

            <nav className="hidden md:flex items-center gap-8">
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

            <div className="hidden md:flex items-center gap-4">
              {!isAuthenticated && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Iniciar sesión
                </Button>
              )}
              <button
                onClick={() => navigate("/onboarding")}
                className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-lg hover:shadow-accent/40 active:scale-[0.97]"
                style={{ backgroundImage: "linear-gradient(100deg, hsl(var(--primary)), hsl(var(--accent)))" }}
              >
                Empieza gratis
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-background/98 backdrop-blur-xl border-b border-border md:hidden"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <nav className="container mx-auto px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="block w-full text-left py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-3 border-t border-border">
                {!isAuthenticated && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { navigate("/auth"); setIsMobileMenuOpen(false); }}
                  >
                    Iniciar sesión
                  </Button>
                )}
                <Button
                  className="w-full gradient-primary border-0"
                  onClick={() => { navigate("/onboarding"); setIsMobileMenuOpen(false); }}
                >
                  Empieza gratis
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
