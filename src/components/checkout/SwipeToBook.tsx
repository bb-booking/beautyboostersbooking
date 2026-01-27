import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronRight, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

interface SwipeToBookProps {
  onComplete: () => void;
  amount: number;
  isProcessing?: boolean;
  savedCard?: {
    last4: string;
    brand: string;
  };
}

const SwipeToBook = ({ onComplete, amount, isProcessing, savedCard }: SwipeToBookProps) => {
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonWidth = 64;

  const getMaxPosition = useCallback(() => {
    if (!trackRef.current) return 0;
    return trackRef.current.getBoundingClientRect().width - buttonWidth - 8;
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!trackRef.current || isCompleted) return;
    
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const maxPosition = getMaxPosition();
    
    const newPosition = Math.max(0, Math.min(clientX - trackRect.left - buttonWidth / 2, maxPosition));
    setPosition(newPosition);
  }, [isCompleted, getMaxPosition]);

  const handleEnd = useCallback(() => {
    if (isCompleted) return;
    
    const maxPosition = getMaxPosition();
    const threshold = maxPosition * 0.85;
    
    if (position >= threshold) {
      setPosition(maxPosition);
      setIsCompleted(true);
      setTimeout(() => {
        onComplete();
      }, 300);
    } else {
      setPosition(0);
    }
    setIsDragging(false);
  }, [isCompleted, position, getMaxPosition, onComplete]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted || isProcessing) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleButtonClick = () => {
    if (isCompleted || isProcessing) return;
    setIsCompleted(true);
    onComplete();
  };

  const progress = trackRef.current 
    ? position / (trackRef.current.getBoundingClientRect().width - buttonWidth - 8) 
    : 0;

  // Desktop: Show a simple button
  if (!isMobile) {
    return (
      <div className="space-y-3">
        {savedCard && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <CreditCard className="h-4 w-4" />
            <span>Betaler med {savedCard.brand} •••• {savedCard.last4}</span>
          </div>
        )}
        
        <Button
          onClick={handleButtonClick}
          disabled={isProcessing || isCompleted}
          size="lg"
          className="w-full h-14 text-lg font-medium"
        >
          {isCompleted ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Booking bekræftet!
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Behandler...
            </>
          ) : (
            <>Bekræft og betal {amount} DKK</>
          )}
        </Button>
      </div>
    );
  }

  // Mobile: Show swipe interface
  return (
    <div className="space-y-3">
      {savedCard && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <CreditCard className="h-4 w-4" />
          <span>Betaler med {savedCard.brand} •••• {savedCard.last4}</span>
        </div>
      )}
      
      <div
        ref={trackRef}
        className={cn(
          "relative h-16 rounded-full overflow-hidden select-none",
          "bg-gradient-to-r from-primary/20 to-primary/40",
          "border-2 border-primary/30",
          isCompleted && "bg-green-500/20 border-green-500/50"
        )}
      >
        <div 
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-colors",
            isCompleted ? "bg-green-500/30" : "bg-primary/30"
          )}
          style={{ 
            width: `${(position + buttonWidth)}px`,
            transition: isDragging ? 'none' : 'width 0.3s ease-out'
          }}
        />
        
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "text-sm font-medium transition-opacity pointer-events-none",
            isCompleted ? "text-green-700 dark:text-green-300" : "text-primary"
          )}
          style={{ 
            opacity: isCompleted ? 1 : Math.max(0, 1 - progress * 1.5)
          }}
        >
          {isCompleted ? (
            <span className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Booking bekræftet!
            </span>
          ) : isProcessing ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Behandler...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              Swipe for at betale {amount} DKK
              <ChevronRight className="h-4 w-4 animate-pulse" />
            </span>
          )}
        </div>
        
        <div
          className={cn(
            "absolute top-1 bottom-1 w-14 rounded-full",
            "flex items-center justify-center",
            "shadow-lg cursor-grab active:cursor-grabbing touch-none",
            "transition-all",
            isCompleted 
              ? "bg-green-500 text-white" 
              : "bg-primary text-primary-foreground",
            isDragging && "scale-105"
          )}
          style={{ 
            left: `${position + 4}px`,
            transition: isDragging ? 'none' : 'left 0.3s ease-out, transform 0.1s, background-color 0.3s'
          }}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          {isCompleted ? (
            <Check className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
        </div>
      </div>
      
      {!isCompleted && !isProcessing && (
        <p className="text-xs text-center text-muted-foreground">
          Swipe til højre for at bekræfte din booking
        </p>
      )}
    </div>
  );
};

export default SwipeToBook;
