import { useState, useRef } from "react";
import { Search, Mic, X, MapPin, Clock, Sparkles, Building2, Shield, Wand2, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { AISearchAssistant } from "./AISearchAssistant";

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
      {/* Glassmorphism Header */}
      <div className="relative bg-gradient-to-b from-background via-background/95 to-background/80 backdrop-blur-2xl border-b border-border/30">
        <div className="px-4 py-4 safe-area-top">
          {/* Logo/Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="GlowApp" className="h-8 w-8" />
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                GlowApp
              </h1>
            </div>
            <div className="flex items-center gap-1">
              {/* Admin buttons - subtle in header */}
              {userTenant && (
                <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10 h-8 px-2">
                  <Link to={`/admin/${userTenant.slug}`}>
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1.5 text-xs">Admin</span>
                  </Link>
                </Button>
              )}
              {isSuperadmin && (
                <>
                  <Button asChild variant="ghost" size="sm" className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-600 dark:text-amber-400 h-8 px-2 border border-amber-500/20">
                    <Link to="/superadmin">
                      <Crown className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1.5 text-xs font-semibold">SuperAdmin</span>
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="text-accent hover:bg-accent/10 h-8 px-2">
                    <Link to="/onboarding/setup?demo=true">
                      <Wand2 className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1.5 text-xs">Wizard</span>
                    </Link>
                  </Button>
                </>
              )}
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 px-2">
                <Link to="/para-negocios">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Negocios</span>
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Search Container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div
              className={cn(
                "relative flex items-center gap-2 rounded-2xl border-2 transition-all duration-300",
                isFocused
                  ? "border-primary bg-background shadow-lg shadow-primary/10"
                  : "border-transparent bg-secondary/60",
              )}
            >
              <Search
                className={cn(
                  "absolute left-4 h-5 w-5 transition-colors duration-300",
                  isFocused ? "text-primary" : "text-muted-foreground",
                )}
              />

              <Input
                ref={inputRef}
                type="text"
                placeholder="Buscar salones, servicios..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                className="h-14 pl-12 pr-24 text-base border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
              />

              <div className="absolute right-3 flex items-center gap-1">
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
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
                        "h-10 w-10 rounded-full transition-all duration-300",
                        isListening
                          ? "bg-primary text-primary-foreground animate-pulse"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                      )}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Dropdown Suggestions */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl bg-card border border-border/50 shadow-xl shadow-foreground/5 z-50"
                >
                  <div className="p-3">
                    {/* Quick Suggestions */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      Sugerencias
                    </p>
                    <div className="space-y-1">
                      {suggestions.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => onSearchChange(suggestion.text)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                        >
                          <div className={cn("p-2 rounded-lg bg-secondary", suggestion.color)}>
                            <suggestion.icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{suggestion.text}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Recientes
                          </p>
                          {onClearRecents && (
                            <button
                              onClick={onClearRecents}
                              className="text-xs text-primary font-medium hover:underline"
                            >
                              Borrar
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {recentSearches.slice(0, 3).map((search, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 + 0.15 }}
                              onClick={() => onRecentSearchClick?.(search)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                            >
                              <Clock className="h-4 w-4 text-muted-foreground" />
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
      </div>
    </div>
  );
}
