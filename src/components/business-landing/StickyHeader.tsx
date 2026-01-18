import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import glowappLogo from '@/assets/glowapp-logo.png';

const navItems = [
  { label: 'Funciones', href: '#features' },
  { label: 'Precios', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const StickyHeader = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
            : 'bg-transparent'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-full">
          <motion.div
            className="h-full bg-primary"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2"
            >
              <img src={glowappLogo} alt="GlowApp" className="h-8 w-auto" />
            </motion.button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth')}
              >
                Iniciar sesión
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => navigate('/auth?mode=register&business=true')}
              >
                Prueba gratis
                <ArrowRight className="ml-1 w-4 h-4" />
              </Button>
            </div>

            {/* Mobile menu button */}
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border md:hidden"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate('/auth');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Iniciar sesión
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate('/auth?mode=register&business=true');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Prueba gratis
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
