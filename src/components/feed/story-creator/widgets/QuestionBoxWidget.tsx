import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionBoxWidgetProps {
  config: {
    prompt: string;
    placeholder: string;
  };
  onConfigChange: (config: { prompt: string; placeholder: string }) => void;
  isEditing: boolean;
  onSubmitResponse?: (response: string) => void;
  hasResponded?: boolean;
  responseCount?: number;
}

export function QuestionBoxWidget({
  config,
  onConfigChange,
  isEditing,
  onSubmitResponse,
  hasResponded = false,
  responseCount = 0,
}: QuestionBoxWidgetProps) {
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onSubmitResponse?.(response.trim());
    setResponse("");
    setIsSubmitting(false);
  };

  if (isEditing) {
    return (
      <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 w-72 shadow-xl border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Caja de preguntas</span>
        </div>
        
        <Input
          value={config.prompt}
          onChange={(e) => onConfigChange({ ...config, prompt: e.target.value })}
          placeholder="¿Qué quieres preguntar?"
          className="text-center font-semibold mb-2 border-none bg-muted/50"
        />
        
        <Input
          value={config.placeholder}
          onChange={(e) => onConfigChange({ ...config, placeholder: e.target.value })}
          placeholder="Texto del placeholder..."
          className="text-sm text-center border-none bg-muted/30 text-muted-foreground"
        />
      </div>
    );
  }

  // View mode
  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 w-72 shadow-xl border border-border/50">
      <div className="flex items-center justify-center gap-2 mb-3">
        <MessageCircle className="h-5 w-5 text-primary" />
      </div>
      
      <p className="text-center font-semibold mb-3 text-foreground">
        {config.prompt || "Hazme una pregunta"}
      </p>
      
      {hasResponded ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">¡Gracias por tu respuesta!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={config.placeholder || "Escribe tu respuesta..."}
            className="resize-none text-sm border-none bg-muted/50 min-h-[80px]"
            maxLength={200}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {response.length}/200
            </span>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!response.trim() || isSubmitting}
              className={cn(
                "gap-2",
                isSubmitting && "opacity-50"
              )}
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </div>
        </div>
      )}
      
      {responseCount > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          {responseCount} {responseCount === 1 ? "respuesta" : "respuestas"}
        </p>
      )}
    </div>
  );
}
