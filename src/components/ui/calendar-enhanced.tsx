import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, SelectSingleEventHandler } from "react-day-picker";
import { da } from "date-fns/locale";
import { format, setMonth, setYear } from "date-fns";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type CalendarEnhancedMode = "days" | "months" | "years";

export interface CalendarEnhancedProps {
  selected?: Date;
  onSelect?: SelectSingleEventHandler;
  className?: string;
  showOutsideDays?: boolean;
  initialFocus?: boolean;
}

function CalendarEnhanced({
  className,
  showOutsideDays = true,
  selected,
  onSelect,
  initialFocus,
}: CalendarEnhancedProps) {
  const [viewMode, setViewMode] = React.useState<CalendarEnhancedMode>("days");
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected || new Date()
  );

  const currentYear = currentMonth.getFullYear();
  const yearRangeStart = Math.floor(currentYear / 12) * 12;

  const months = [
    "Januar", "Februar", "Marts", "April",
    "Maj", "Juni", "Juli", "August",
    "September", "Oktober", "November", "December"
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentMonth, monthIndex);
    setCurrentMonth(newDate);
    setViewMode("days");
  };

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentMonth, year);
    setCurrentMonth(newDate);
    setViewMode("months");
  };

  const handlePrevYearRange = () => {
    const newYear = yearRangeStart - 12;
    if (newYear >= 2026) {
      setCurrentMonth(setYear(currentMonth, newYear));
    }
  };

  const handleNextYearRange = () => {
    setCurrentMonth(setYear(currentMonth, yearRangeStart + 12));
  };

  const handlePrevYear = () => {
    if (currentYear > 2026) {
      setCurrentMonth(setYear(currentMonth, currentYear - 1));
    }
  };

  const handleNextYear = () => {
    setCurrentMonth(setYear(currentMonth, currentYear + 1));
  };

  const minYear = 2026;

  if (viewMode === "years") {
    // Always start from 2026 minimum
    const startYear = Math.max(minYear, yearRangeStart);
    const years = Array.from({ length: 12 }, (_, i) => startYear + i);
    const canGoPrev = startYear > minYear;
    
    return (
      <div className={cn("p-3 pointer-events-auto", className)}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handlePrevYearRange}
            disabled={!canGoPrev}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0",
              canGoPrev ? "opacity-50 hover:opacity-100" : "opacity-20 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {startYear} - {startYear + 11}
          </span>
          <button
            type="button"
            onClick={handleNextYearRange}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearSelect(year)}
              className={cn(
                "h-9 w-full rounded-md text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                year === currentYear && "bg-primary text-primary-foreground"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === "months") {
    const canGoPrevYear = currentYear > minYear;
    
    return (
      <div className={cn("p-3 pointer-events-auto", className)}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handlePrevYear}
            disabled={!canGoPrevYear}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0",
              canGoPrevYear ? "opacity-50 hover:opacity-100" : "opacity-20 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("years")}
            className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
          >
            {currentYear}
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((monthName, index) => (
            <button
              key={monthName}
              type="button"
              onClick={() => handleMonthSelect(index)}
              className={cn(
                "h-9 w-full rounded-md text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                index === currentMonth.getMonth() && currentYear === currentMonth.getFullYear() && 
                  "bg-primary text-primary-foreground"
              )}
            >
              {monthName.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DayPicker
      locale={da}
      mode="single"
      showOutsideDays={showOutsideDays}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
          "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        Caption: ({ displayMonth }) => (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("months")}
              className="text-sm font-medium hover:text-primary transition-colors cursor-pointer capitalize"
            >
              {format(displayMonth, "MMMM", { locale: da })}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("years")}
              className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
            >
              {format(displayMonth, "yyyy")}
            </button>
          </div>
        ),
      }}
      selected={selected}
      onSelect={onSelect}
      initialFocus={initialFocus}
    />
  );
}

CalendarEnhanced.displayName = "CalendarEnhanced";

export { CalendarEnhanced };
