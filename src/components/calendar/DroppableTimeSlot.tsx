import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableTimeSlotProps {
  boosterId: string;
  timeSlot: string;
  date: Date;
  children: React.ReactNode;
}

export function DroppableTimeSlot({
  boosterId,
  timeSlot,
  date,
  children,
}: DroppableTimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `booster-${boosterId}-${timeSlot}-${date.toISOString()}`,
    data: { boosterId, timeSlot, date },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-2 border-b border-r min-h-12 transition-colors',
        isOver && 'bg-primary/10 border-primary'
      )}
    >
      {children}
    </div>
  );
}