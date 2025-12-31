import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

interface AISearchAssistantProps {
  onSuggestion: (query: string) => void;
  currentQuery: string;
}

interface AIResponse {
  suggestion: string;
  explanation: string;
}

export function AISearchAssistant({ onSuggestion, currentQuery }: AISearchAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [userInput, setUserInput] = useState("");

  const handleAskAI = async () => {
    if (!userInput.trim()) return;
    
    setLoading(true);
    setResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-search-assistant', {
        body: { query: userInput }
      });

      if (error) throw error;
      
      setResponse({
        suggestion: data?.suggestion || userInput,
        explanation: data?.explanation || "Búsqueda optimizada para encontrar los mejores resultados.",
      });
    } catch (error) {
      console.error('AI Search error:', error);
      // Fallback: use user input directly
      setResponse({
        suggestion: userInput,
        explanation: "Te ayudo a buscar lo que necesitas.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseSuggestion = () => {
    if (response?.suggestion) {
      onSuggestion(response.suggestion);
      setIsOpen(false);
      setResponse(null);
      setUserInput("");
    }
  };

  const quickPrompts = [
    "Quiero un corte de pelo moderno",
    "Busco un salón con buenos precios",
    "Necesito teñirme el pelo",
    "Tratamientos para el cabello dañado",
  ];

  return (
    <>
      {/* AI Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-sm font-medium hover:from-primary/20 hover:to-accent/20 transition-all"
      >
        <Sparkles className="h-4 w-4" />
        <span>Buscar con IA</span>
      </motion.button>

      {/* AI Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Asistente de búsqueda</h3>
                      <p className="text-xs text-muted-foreground">Cuéntame qué buscas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-secondary transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Quick prompts */}
                {!response && !loading && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Sugerencias
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setUserInput(prompt);
                          }}
                          className="px-3 py-1.5 rounded-full bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="relative">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Describe lo que buscas... ej: 'Quiero un cambio de look radical con mechas'"
                    className="w-full h-24 p-4 rounded-2xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={loading}
                  />
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-3 text-primary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Analizando tu búsqueda...</span>
                    </div>
                  </div>
                )}

                {/* Response */}
                {response && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-2">{response.explanation}</p>
                      <p className="font-semibold text-foreground">"{response.suggestion}"</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setResponse(null);
                          setUserInput("");
                        }}
                        className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
                      >
                        Probar otra
                      </button>
                      <button
                        onClick={handleUseSuggestion}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                      >
                        Usar búsqueda
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Submit button */}
                {!response && (
                  <button
                    onClick={handleAskAI}
                    disabled={!userInput.trim() || loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    {loading ? "Procesando..." : "Buscar con IA"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
