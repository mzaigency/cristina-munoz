import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Plus, X } from "lucide-react";

interface PollWidgetProps {
  config: {
    question: string;
    options: string[];
  };
  onConfigChange: (config: { question: string; options: string[] }) => void;
  isEditing: boolean;
  responses?: Record<string, number>;
  onVote?: (optionIndex: number) => void;
  userVote?: number | null;
}

export function PollWidget({
  config,
  onConfigChange,
  isEditing,
  responses = {},
  onVote,
  userVote,
}: PollWidgetProps) {
  const [newOption, setNewOption] = useState("");

  const totalVotes = Object.values(responses).reduce((a, b) => a + b, 0);

  const addOption = () => {
    if (newOption.trim() && config.options.length < 4) {
      onConfigChange({
        ...config,
        options: [...config.options, newOption.trim()],
      });
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    onConfigChange({
      ...config,
      options: config.options.filter((_, i) => i !== index),
    });
  };

  if (isEditing) {
    return (
      <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 w-64 shadow-xl border border-border/50">
        <Input
          value={config.question}
          onChange={(e) => onConfigChange({ ...config, question: e.target.value })}
          placeholder="Haz una pregunta..."
          className="text-center font-semibold mb-3 border-none bg-muted/50"
        />
        
        <div className="space-y-2">
          {config.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...config.options];
                  newOptions[index] = e.target.value;
                  onConfigChange({ ...config, options: newOptions });
                }}
                className="flex-1 text-sm border-none bg-muted/50"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => removeOption(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {config.options.length < 4 && (
            <div className="flex items-center gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Añadir opción..."
                className="flex-1 text-sm border-none bg-muted/50"
                onKeyDown={(e) => e.key === "Enter" && addOption()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={addOption}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-4 w-64 shadow-xl border border-border/50">
      <p className="text-center font-semibold mb-3 text-foreground">
        {config.question || "Tu pregunta"}
      </p>
      
      <div className="space-y-2">
        {config.options.map((option, index) => {
          const votes = responses[index] || 0;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isSelected = userVote === index;

          return (
            <button
              key={index}
              onClick={() => onVote?.(index)}
              disabled={userVote !== null}
              className={cn(
                "w-full relative rounded-xl overflow-hidden transition-all",
                userVote === null && "hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 transition-all",
                  isSelected ? "bg-primary" : "bg-muted"
                )}
                style={{ width: userVote !== null ? `${percentage}%` : "100%" }}
              />
              <div className={cn(
                "relative px-4 py-3 flex items-center justify-between",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}>
                <span className="font-medium text-sm">{option}</span>
                {userVote !== null && (
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="h-4 w-4" />}
                    <span className="text-xs font-bold">{Math.round(percentage)}%</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {totalVotes > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
        </p>
      )}
    </div>
  );
}
