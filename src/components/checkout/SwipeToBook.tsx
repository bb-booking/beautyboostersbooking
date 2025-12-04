import { useState, useRef } from 'react';
import { Check, ChevronRight, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonWidth = 64; // w-16 = 64px

  const handleStart = (clientX: number) => {
    if (isCompleted || isProcessing) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !trackRef.current || isCompleted) return;
    
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const maxPosition = trackRect.width - buttonWidth - 8; // 8px padding
    
    const newPosition = Math.max(0, Math.min(clientX - trackRect.left - buttonWidth / 2, maxPosition));
    setPosition(newPosition);
  };

  const handleEnd = () => {
    if (!isDragging || !trackRef.current || isCompleted) return;
    setIsDragging(false);
    
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const maxPosition = trackRect.width - buttonWidth - 8;
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
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleMouseUp = () => handleEnd();
  const handleMouseLeave = () => {
    if (isDragging) handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleEnd();

  const progress = trackRef.current 
    ? position / (trackRef.current.getBoundingClientRect().width - buttonWidth - 8) 
    : 0;

  return (
    <div className="space-y-3">
      {/* Saved card info */}
      {savedCard && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <CreditCard className="h-4 w-4" />
          <span>Betaler med {savedCard.brand} •••• {savedCard.last4}</span>
        </div>
      )}
      
      {/* Swipe track */}
      <div
        ref={trackRef}
        className={cn(
          "relative h-16 rounded-full overflow-hidden cursor-pointer select-none",
          "bg-gradient-to-r from-primary/20 to-primary/40",
          "border-2 border-primary/30",
          isCompleted && "bg-green-500/20 border-green-500/50"
        )}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Progress fill */}
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
        
        {/* Text label */}
        <div 
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "text-sm font-medium transition-opacity",
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
        
        {/* Draggable button */}
        <div
          className={cn(
            "absolute top-1 bottom-1 w-14 rounded-full",
            "flex items-center justify-center",
            "shadow-lg cursor-grab active:cursor-grabbing",
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
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isCompleted ? (
            <Check className="h-6 w-6" />
          ) : (
            <ChevronRight className="h-6 w-6" />
          )}
        </div>
      </div>
      
      {/* Helper text */}
      {!isCompleted && !isProcessing && (
        <p className="text-xs text-center text-muted-foreground">
          Swipe til højre for at bekræfte din booking
        </p>
      )}
    </div>
  );
};

export default SwipeToBook;
