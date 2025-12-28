import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Repeat } from "lucide-react";

export interface RecurrenceConfig {
  enabled: boolean;
  intervalValue: number;
  intervalUnit: 'days' | 'weeks' | 'months';
  occurrences: number;
}

interface RecurrenceSelectorProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
}

export const RecurrenceSelector = ({ value, onChange }: RecurrenceSelectorProps) => {
  const handleToggle = (enabled: boolean) => {
    onChange({ ...value, enabled });
  };

  const handleIntervalValueChange = (val: string) => {
    const num = parseInt(val) || 1;
    onChange({ ...value, intervalValue: Math.max(1, Math.min(52, num)) });
  };

  const handleIntervalUnitChange = (unit: 'days' | 'weeks' | 'months') => {
    onChange({ ...value, intervalUnit: unit });
  };

  const handleOccurrencesChange = (val: string) => {
    const num = parseInt(val) || 1;
    // Max 52 weeks worth of occurrences
    const maxOccurrences = value.intervalUnit === 'days' ? 365 : value.intervalUnit === 'weeks' ? 52 : 12;
    onChange({ ...value, occurrences: Math.max(1, Math.min(maxOccurrences, num)) });
  };

  // Calculate estimated end date
  const calculateEndDate = () => {
    const today = new Date();
    let daysToAdd = 0;

    switch (value.intervalUnit) {
      case 'days':
        daysToAdd = value.intervalValue * value.occurrences;
        break;
      case 'weeks':
        daysToAdd = value.intervalValue * 7 * value.occurrences;
        break;
      case 'months':
        daysToAdd = value.intervalValue * 30 * value.occurrences;
        break;
    }

    const endDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-primary" />
          <Label htmlFor="recurrence-toggle" className="font-medium">
            Cita recurrente
          </Label>
        </div>
        <Switch
          id="recurrence-toggle"
          checked={value.enabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {value.enabled && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Repetir cada</span>
            <Input
              type="number"
              min={1}
              max={52}
              value={value.intervalValue}
              onChange={(e) => handleIntervalValueChange(e.target.value)}
              className="w-16 h-8 text-center"
            />
            <Select value={value.intervalUnit} onValueChange={handleIntervalUnitChange}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">días</SelectItem>
                <SelectItem value="weeks">semanas</SelectItem>
                <SelectItem value="months">meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Crear</span>
            <Input
              type="number"
              min={1}
              max={value.intervalUnit === 'days' ? 365 : value.intervalUnit === 'weeks' ? 52 : 12}
              value={value.occurrences}
              onChange={(e) => handleOccurrencesChange(e.target.value)}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-muted-foreground">citas en total</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 p-2 rounded">
            <Calendar className="h-4 w-4" />
            <span>
              Última cita aproximada: <strong className="text-foreground">{calculateEndDate()}</strong>
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Se crearán {value.occurrences} citas. Cada una podrá editarse o cancelarse individualmente, 
            o podrás cancelar todas las futuras a la vez.
          </p>
        </div>
      )}
    </div>
  );
};
