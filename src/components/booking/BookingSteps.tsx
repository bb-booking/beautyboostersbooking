import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  name: string;
  description?: string;
}

interface BookingStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const BookingSteps = ({ steps, currentStep, onStepClick }: BookingStepsProps) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      {/* Mobile: Simple progress bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-foreground">
            Trin {currentStep} af {steps.length}
          </span>
          <span className="text-muted-foreground">
            {steps[currentStep - 1]?.name}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Step indicators */}
      <ol className="hidden md:flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-3 group",
                  isClickable && "cursor-pointer"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </span>
                <div className="hidden lg:block">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent && "text-primary",
                    isCompleted && "text-foreground",
                    !isCurrent && !isCompleted && "text-muted-foreground"
                  )}>
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      "h-0.5 transition-colors duration-300",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
