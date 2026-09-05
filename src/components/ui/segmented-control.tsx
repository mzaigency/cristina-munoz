import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("ios-segmented-control", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "ios-segmented-option px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-center truncate transition-all",
            value === option.value && "ios-segmented-option-active font-semibold shadow-xs"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
