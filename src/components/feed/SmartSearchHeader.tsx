import { useState, useRef } from "react";
import { Search, Mic, X, Sparkles, Building2, Shield, Crown, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      toast.error("Tu navegador no soporta búsqueda por voz");
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
      // Auto-trigger AI search for voice
      handleAISearch(transcript);
    };

    recognition.start();
  };

  const handleClear = () => {
    onSearchChange("");
    setAiMode(false);
    inputRef.current?.focus();
  };

  const handleAISearch = async (query?: string) => {
    const searchText = query || searchQuery;
    if (!searchText.trim()) return;

    setIsAISearching(true);
    setAiMode(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-search-assistant', {
        body: { query: searchText }
      });

      if (error) throw error;

      if (data?.suggestion) {
        onSearchChange(data.suggestion);
        toast.success(data.explanation || "Búsqueda optimizada con IA");
      }
    } catch (error) {
      console.error('AI Search error:', error);
      toast.error("Error al procesar. Usando búsqueda normal.");
    } finally {
      setIsAISearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleAISearch();
    }
  };

  const suggestions = [
    "Mejores balayage en Manresa",
    "Peluquerías cerca de mí",
    "Tratamientos keratina Barcelona",
  ];

  const showDropdown = isFocused && !searchQuery;

  return (
    <div className="sticky top-0 z-50">
      <div className="bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="px-3 pt-2 pb-3 safe-area-top">
          {/* Compact Top Row */}
          <div className="flex items-center justify-between mb-2.5">
            {/* Logo - ultra compact */}
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="GlowApp" className="h-8 w-8" />
              <span className="text-xl font-black text-foreground">
                Glow<span className="text-primary">App</span>
              </span>
            </div>
            
            {/* Action buttons - minimal */}
            <div className="flex items-center gap-1">
              {userTenant && (
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Link to={`/admin/${userTenant.slug}`}>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </Button>
              )}
              {isSuperadmin && (
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Link to="/superadmin">
                    <Crown className="h-4 w-4 text-amber-500" />
                  </Link>
                </Button>
              )}
              <Button 
                asChild 
                size="sm" 
                className="h-7 px-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold"
              >
                <Link to="/para-negocios">
                  <Building2 className="h-3 w-3 mr-1" />
                  Pro
                </Link>
              </Button>
            </div>
          </div>

          {/* AI Search Bar - Full width, prominent */}
          <div className="relative">
            <div
              className={cn(
                "relative flex items-center rounded-xl transition-all duration-300",
                isFocused
                  ? "bg-card ring-2 ring-primary/40 shadow-lg shadow-primary/10"
                  : "bg-secondary/60"
              )}
            >
              {/* AI/Search Icon */}
              <div className="absolute left-3 flex items-center">
                {isAISearching ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : aiMode ? (
                  <Sparkles className="h-4 w-4 text-primary" />
                ) : (
                  <Search className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <Input
                ref={inputRef}
                type="text"
                placeholder="Busca con IA: 'mejores balayage en Manresa'"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
                className="h-11 pl-10 pr-24 text-sm border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
              />

              {/* Right side actions */}
              <div className="absolute right-1.5 flex items-center gap-1">
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
                        className="h-7 w-7 rounded-full"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Voice button */}
                {("webkitSpeechRecognition" in window || "SpeechRecognition" in window) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleVoiceSearch}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      isListening && "bg-primary text-primary-foreground animate-pulse"
                    )}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}

                {/* AI Search button */}
                <Button
                  size="icon"
                  onClick={() => handleAISearch()}
                  disabled={!searchQuery.trim() || isAISearching}
                  className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {isAISearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Dropdown - AI Suggestions */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl bg-card border border-border/50 shadow-xl z-50"
                >
                  <div className="p-3">
                    {/* AI Badge */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <div className="h-5 w-5 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                        Búsqueda inteligente
                      </span>
                    </div>

                    {/* AI Suggestions */}
                    <div className="space-y-1">
                      {suggestions.map((text, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onSearchChange(text);
                            handleAISearch(text);
                          }}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-secondary/60 active:scale-[0.98] transition-all text-left"
                        >
                          <Search className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span className="text-sm text-foreground">{text}</span>
                        </button>
                      ))}
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wide">
                            Recientes
                          </span>
                          {onClearRecents && (
                            <button
                              onClick={onClearRecents}
                              className="text-[10px] text-primary font-semibold"
                            >
                              Borrar
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {recentSearches.slice(0, 2).map((search, i) => (
                            <button
                              key={i}
                              onClick={() => onRecentSearchClick?.(search)}
                              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/60 text-left"
                            >
                              <span className="text-sm text-muted-foreground">{search}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}