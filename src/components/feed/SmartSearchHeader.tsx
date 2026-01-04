import { useState, useRef } from "react";
import { Search, Mic, X, MapPin, Clock, Sparkles, Building2, Shield, Wand2, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface SmartSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecents?: () => void;
  userTenant?: { slug: string; name: string; primary_color?: string | null } | null;
  isSuperadmin?: boolean;
}

export function SmartSearchHeader({
  searchQuery,
  onSearchChange,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecents,
  userTenant,
  isSuperadmin,
}: SmartSearchHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
    };

    recognition.start();
  };

  const handleClear = () => {
    onSearchChange("");
    inputRef.current?.focus();
  };

  const suggestions = [
    { icon: Sparkles, text: "Peluquerías cerca de ti", color: "text-amber-500" },
    { icon: Clock, text: "Con disponibilidad hoy", color: "text-emerald-500" },
    { icon: MapPin, text: "En Barcelona", color: "text-primary" },
  ];

  const showDropdown = isFocused && !searchQuery && (recentSearches.length > 0 || true);

  return (
    <div className="sticky top-0 z-50">
      {/* Premium Glassmorphism Header */}
      <div className="relative bg-gradient-to-b from-background via-background/98 to-background/90 backdrop-blur-3xl">
        {/* Subtle gradient accent at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="px-4 pt-3 pb-4 safe-area-top">
          {/* Logo/Title Row - Mobile optimized */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2.5">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <img src="/favicon.png" alt="GlowApp" className="h-9 w-9 drop-shadow-lg" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-none">
                  GlowApp
                </h1>
                <p className="text-[10px] text-muted-foreground/70 font-medium tracking-wide mt-0.5 hidden xs:block">
                  Tu belleza, conectada
                </p>
              </div>
            </div>
            
            {/* Admin buttons - compact for mobile */}
            <div className="flex items-center gap-0.5">
              {userTenant && (
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <Link to={`/admin/${userTenant.slug}`}>
                    <Shield className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {isSuperadmin && (
                <>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-amber-500 hover:bg-amber-500/10">
                    <Link to="/superadmin">
                      <Crown className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-accent hover:bg-accent/10">
                    <Link to="/onboarding/setup?demo=true">
                      <Wand2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
              <Button 
                asChild 
                size="sm" 
                className="h-8 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] border border-primary/20"
              >
                <Link to="/para-negocios" className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Para negocios</span>
                  <span className="sm:hidden">Negocios</span>
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Search Container - Refined */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div
              className={cn(
                "relative flex items-center rounded-2xl transition-all duration-400",
                isFocused
                  ? "bg-background shadow-xl shadow-primary/10 ring-2 ring-primary/30"
                  : "bg-secondary/50 shadow-sm"
              )}
            >
              <motion.div
                animate={{ 
                  scale: isFocused ? 1.1 : 1,
                  x: isFocused ? 2 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <Search
                  className={cn(
                    "absolute left-4 h-5 w-5 transition-all duration-400",
                    isFocused ? "text-primary" : "text-muted-foreground/60"
                  )}
                />
              </motion.div>

              <Input
                ref={inputRef}
                type="text"
                placeholder="Buscar salones, servicios..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="h-12 pl-12 pr-24 text-[15px] border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50 font-medium"
              />

              <div className="absolute right-2 flex items-center gap-1">
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {("webkitSpeechRecognition" in window || "SpeechRecognition" in window) && (
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleVoiceSearch}
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all duration-300",
                        isListening
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 animate-pulse"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      )}
                    >
                      <Mic className="h-[18px] w-[18px]" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Dropdown Suggestions - More elegant */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 right-0 top-full mt-3 overflow-hidden rounded-2xl bg-card/95 backdrop-blur-xl border border-border/40 shadow-2xl shadow-foreground/10 z-50"
                >
                  <div className="p-4">
                    {/* Quick Suggestions */}
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3 px-1">
                      Sugerencias
                    </p>
                    <div className="space-y-1">
                      {suggestions.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                          onClick={() => onSearchChange(suggestion.text)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 active:scale-[0.98] transition-all text-left"
                        >
                          <div className={cn("p-2.5 rounded-xl bg-secondary/80", suggestion.color)}>
                            <suggestion.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{suggestion.text}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border/30">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em]">
                            Recientes
                          </p>
                          {onClearRecents && (
                            <button
                              onClick={onClearRecents}
                              className="text-[11px] text-primary font-semibold hover:underline"
                            >
                              Borrar
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {recentSearches.slice(0, 3).map((search, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                              onClick={() => onRecentSearchClick?.(search)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 active:scale-[0.98] transition-all text-left"
                            >
                              <Clock className="h-4 w-4 text-muted-foreground/60" />
                              <span className="text-sm text-foreground">{search}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* Bottom border gradient */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </div>
    </div>
  );
}
