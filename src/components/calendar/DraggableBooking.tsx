import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { GripVertical, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  client_name?: string;
  location: string;
}

interface DraggableBookingProps {
  availabilityId: string;
  status: string;
  startTime: string;
  endTime: string;
  job?: Job | null;
  notes?: string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

export function DraggableBooking({
  availabilityId,
  status,
  startTime,
  endTime,
  job,
  notes,
  getStatusColor,
  getStatusIcon,
}: DraggableBookingProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `availability-${availabilityId}`,
    data: { availabilityId, job },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'text-xs cursor-move transition-opacity',
        isDragging && 'opacity-50'
      )}
      {...listeners}
      {...attributes}
    >
      <Badge 
        className={`w-full ${getStatusColor(status)} flex items-center gap-1 mb-1`}
      >
        <GripVertical className="h-3 w-3" />
        {getStatusIcon(status)}
        <span className="truncate flex-1">
          {startTime.slice(0, 5)}-{endTime.slice(0, 5)}
        </span>
      </Badge>
      {job && (
        <div className="text-xs text-muted-foreground mt-1 pl-5">
          <div className="font-medium truncate">{job.title}</div>
          {job.client_name && (
            <div className="truncate">{job.client_name}</div>
          )}
          <div className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3" />
            {job.location}
          </div>
        </div>
      )}
      {notes && (
        <div className="text-xs text-muted-foreground mt-1 truncate pl-5">
          {notes}
        </div>
      )}
    </div>
  );
}