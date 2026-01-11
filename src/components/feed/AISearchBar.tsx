import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mic, X, Sparkles, Loader2, Send, MapPin, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SalonResult {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  logo_url: string | null;
  primary_color: string | null;
  tagline: string | null;
  matchedServices: string[];
}

interface AISearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecents?: () => void;
}

export function AISearchBar({
  searchQuery,
  onSearchChange,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecents,
}: AISearchBarProps) {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [searchResults, setSearchResults] = useState<SalonResult[]>([]);
  const [resultMessage, setResultMessage] = useState("");
  const [showResults, setShowResults] = useState(false);
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
      handleAISearch(transcript);
    };

    recognition.start();
  };

  const handleClear = () => {
    onSearchChange("");
    setAiMode(false);
    setSearchResults([]);
    setResultMessage("");
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleAISearch = async (query?: string) => {
    const searchText = query || searchQuery;
    if (!searchText.trim()) return;

    setIsAISearching(true);
    setAiMode(true);
    setShowResults(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-search-assistant', {
        body: { query: searchText }
      });

      if (error) throw error;

      setSearchResults(data?.results || []);
      setResultMessage(data?.message || "");
      
      if (data?.results?.length > 0) {
        toast.success(data.message);
      }
    } catch (error) {
      console.error('AI Search error:', error);
      toast.error("Error al buscar. Inténtalo de nuevo.");
      setSearchResults([]);
      setResultMessage("Error al buscar");
    } finally {
      setIsAISearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleAISearch();
    }
  };

  const handleResultClick = (slug: string) => {
    setShowResults(false);
    setIsFocused(false);
    navigate(`/salon/${slug}`);
  };

  const suggestions = [
    "Mejores balayage en Manresa",
    "Peluquerías cerca de mí",
    "Tratamientos keratina Barcelona",
  ];

  const showDropdown = isFocused && !searchQuery && !showResults;
  const showResultsDropdown = showResults && (searchResults.length > 0 || resultMessage);

  return (
    <div className="relative px-4">
      <div
        className={cn(
          "relative flex items-center rounded-2xl transition-all duration-300",
          isFocused
            ? "bg-card ring-2 ring-primary/40 shadow-lg shadow-primary/10"
            : "bg-secondary/60"
        )}
      >
        {/* AI/Search Icon */}
        <div className="absolute left-3.5 flex items-center">
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
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (!e.target.value) {
              setShowResults(false);
              setSearchResults([]);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 300)}
          onKeyDown={handleKeyDown}
          className="h-12 pl-11 pr-28 text-sm border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
        />

        {/* Right side actions */}
        <div className="absolute right-2 flex items-center gap-1">
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
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
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
            className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            {isAISearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Dropdown - AI Suggestions (when empty) */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-2xl bg-card border border-border/50 shadow-xl z-50"
          >
            <div className="p-3">
              {/* AI Badge */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
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
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary/60 active:scale-[0.98] transition-all text-left"
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
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-secondary/60 text-left"
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

      {/* Dropdown - Search Results */}
      <AnimatePresence>
        {showResultsDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-2xl bg-card border border-border/50 shadow-xl z-50 max-h-[60vh] overflow-y-auto"
          >
            <div className="p-3">
              {/* Result message header */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {resultMessage}
                </span>
              </div>

              {/* No results */}
              {searchResults.length === 0 && !isAISearching && (
                <div className="py-6 text-center">
                  <Store className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No encontré salones con esos criterios
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Prueba con otra búsqueda
                  </p>
                </div>
              )}

              {/* Results list */}
              <div className="space-y-1.5">
                {searchResults.map((salon) => (
                  <button
                    key={salon.id}
                    onClick={() => handleResultClick(salon.slug)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/60 active:scale-[0.98] transition-all text-left group"
                  >
                    {/* Salon logo */}
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ 
                        backgroundColor: salon.primary_color || 'hsl(var(--primary))' 
                      }}
                    >
                      {salon.logo_url ? (
                        <img 
                          src={salon.logo_url} 
                          alt={salon.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {salon.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Salon info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {salon.name}
                      </h4>
                      
                      {/* City */}
                      {salon.city && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground">{salon.city}</span>
                        </div>
                      )}
                      
                      {/* Matched services */}
                      {salon.matchedServices.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {salon.matchedServices.map((service, i) => (
                            <span 
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arrow indicator */}
                    <div className="text-muted-foreground/40 group-hover:text-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
