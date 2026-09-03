import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-[15px] sm:text-base font-bold capitalize text-neutral-900",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 sm:h-9 sm:w-9 bg-white border-neutral-200 text-neutral-700 p-0 opacity-90 hover:opacity-100 hover:bg-neutral-50 rounded-full shadow-xs transition-opacity",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between",
        head_cell: "text-neutral-400 rounded-md w-9 sm:w-10 font-bold text-[0.78rem] uppercase tracking-wider text-center",
        row: "flex w-full mt-1.5 justify-between",
        cell: "h-9 w-9 sm:h-10 sm:w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 sm:h-10 sm:w-10 p-0 font-semibold text-neutral-800 text-[14px] sm:text-[15px] aria-selected:opacity-100 rounded-xl transition-all hover:bg-neutral-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-white font-bold shadow-md hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
        day_today: "border border-primary/40 font-bold text-primary bg-primary/5",
        day_outside:
          "day-outside text-neutral-300 opacity-40 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-neutral-300 opacity-30 cursor-not-allowed pointer-events-none",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4 text-neutral-700" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4 text-neutral-700" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
