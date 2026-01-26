import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { da } from "date-fns/locale";
import { 
  Calendar as CalendarIcon,
  Search, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  Plus,
  GripVertical,
  Sparkles,
  Phone,
  Mail,
  Clock,
  Edit,
  Trash2,
  ArrowLeft,
  Building2,
  Users,
  MessageCircle,
  Navigation,
  Copy,
  HandHelping
} from "lucide-react";
import { MultiServiceJobDialog } from "@/components/admin/MultiServiceJobDialog";
import { AddServiceToBookingDialog } from "@/components/admin/AddServiceToBookingDialog";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { boosterImageOverrides } from "@/data/boosterImages";
import { Badge } from "@/components/ui/badge";
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  closestCenter, 
  DragEndEvent, 
  DragStartEvent 
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface BoosterProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  is_available: boolean;
  portfolio_image_url?: string;
}

interface BoosterAvailability {
  id: string;
  booster_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'busy' | 'vacation' | 'sick' | 'blocked';
  job_id?: string;
  notes?: string;
}

interface Job {
  id: string;
  title: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  location: string;
  date_needed: string;
  time_needed?: string;
  client_type?: string;
  service_type?: string;
}

// Mock jobs with full addresses
const MOCK_JOBS: Job[] = [
  { id: 'job-1', title: 'Bryllup makeup', client_name: 'Maria Jensen', client_email: 'maria@email.dk', client_phone: '+45 12 34 56 78', location: 'Vesterbrogade 42, 1620 København V', date_needed: new Date().toISOString().split('T')[0], time_needed: '09:00', client_type: 'privat', service_type: 'Bryllup' },
  { id: 'job-2', title: 'Firmaevent', client_name: 'Novo Nordisk', client_email: 'events@novo.dk', client_phone: '+45 87 65 43 21', location: 'Novo Allé 1, 2880 Bagsværd', date_needed: new Date().toISOString().split('T')[0], time_needed: '10:30', client_type: 'virksomhed', service_type: 'Event' },
  { id: 'job-3', title: 'Hår styling', client_name: 'Louise Nielsen', client_email: 'louise@gmail.com', client_phone: '+45 23 45 67 89', location: 'Strøget 15, 8000 Aarhus C', date_needed: new Date().toISOString().split('T')[0], time_needed: '14:00', client_type: 'privat', service_type: 'Hår' },
  { id: 'job-4', title: 'TV-produktion', client_name: 'DR', client_email: 'production@dr.dk', client_phone: '+45 35 20 30 40', location: 'Emil Holms Kanal 20, 0999 København C', date_needed: new Date().toISOString().split('T')[0], time_needed: '08:30', client_type: 'virksomhed', service_type: 'Film/TV' },
];

// Function to get mock bookings with actual booster IDs
const getMockBookings = (boosters: BoosterProfile[]): Omit<BoosterAvailability, 'id'>[] => {
  if (boosters.length === 0) return [];
  const today = new Date().toISOString().split('T')[0];
  return [
    { booster_id: boosters[0]?.id || '', date: today, start_time: '09:00', end_time: '11:00', status: 'busy' as const, job_id: 'job-1', notes: '' },
    { booster_id: boosters[1]?.id || boosters[0]?.id || '', date: today, start_time: '10:30', end_time: '12:30', status: 'busy' as const, job_id: 'job-2', notes: '' },
    { booster_id: boosters[2]?.id || boosters[0]?.id || '', date: today, start_time: '14:00', end_time: '16:00', status: 'busy' as const, job_id: 'job-3', notes: '' },
    { booster_id: boosters[3]?.id || boosters[0]?.id || '', date: today, start_time: '08:30', end_time: '10:00', status: 'busy' as const, job_id: 'job-4', notes: '' },
  ].filter(b => b.booster_id);
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Draggable booking component
function DraggableBookingCard({ 
  booking, 
  job, 
  isPrivate,
  onClick
}: { 
  booking: BoosterAvailability; 
  job: Job | null; 
  isPrivate: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id,
    data: { booking, job },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 100,
  } : undefined;

  const duration = (timeToMinutes(booking.end_time) - timeToMinutes(booking.start_time)) / 30;
  
  // Get short address (first part before comma)
  const shortAddress = job?.location?.split(',')[0] || '';

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, height: `${Math.max(duration * 28 - 4, 24)}px` }}
      className={cn(
        "absolute left-1 right-1 top-0 rounded-md p-1 overflow-hidden z-10 transition-shadow",
        "border-l-4 group",
        isPrivate 
          ? "bg-pink-50 border-l-pink-400 hover:shadow-md" 
          : "bg-purple-50 border-l-purple-400 hover:shadow-md",
        isDragging && "opacity-50 shadow-lg cursor-grabbing"
      )}
    >
      <div 
        className="cursor-grab active:cursor-grabbing absolute top-1 left-1"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <div 
        className="pl-4 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <div className="text-[9px] font-medium text-muted-foreground">
          {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
        </div>
        <div className="flex items-center gap-1">
          <User className="h-2.5 w-2.5 text-foreground/70 shrink-0" />
          <span className="text-[10px] font-medium truncate">
            {job?.client_name || 'Kunde'}
          </span>
        </div>
        {duration >= 2 && (
          <>
            <div className="text-[9px] text-muted-foreground truncate">
              {job?.service_type || 'Service'}
            </div>
            {shortAddress && (
              <div className="flex items-center gap-0.5">
                <MapPin className="h-2 w-2 text-muted-foreground shrink-0" />
                <span className="text-[8px] text-muted-foreground truncate">{shortAddress}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Droppable time slot component
function DroppableSlot({ 
  boosterId, 
  timeSlot, 
  date,
  children,
  onAddJob,
  hasBooking
}: { 
  boosterId: string; 
  timeSlot: string; 
  date: Date;
  children?: React.ReactNode;
  onAddJob: (boosterId: string, timeSlot: string, date: Date) => void;
  hasBooking: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${boosterId}-${timeSlot}`,
    data: { boosterId, timeSlot, date },
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "h-7 relative transition-colors border-r border-b border-border/30",
        isOver && "bg-primary/20 ring-2 ring-primary ring-inset",
        !hasBooking && isHovered && "bg-primary/5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !hasBooking && onAddJob(boosterId, timeSlot, date)}
    >
      {children}
      {!hasBooking && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <Plus className="h-3 w-3 text-primary" />
          </div>
        </div>
      )}
    </div>
  );
}

const AdminCalendar = () => {
  const [boosters, setBoosters] = useState<BoosterProfile[]>([]);
  const [availability, setAvailability] = useState<BoosterAvailability[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  // Individual booster view
  const [selectedBooster, setSelectedBooster] = useState<BoosterProfile | null>(null);
  const [boosterViewMode, setBoosterViewMode] = useState<'day' | 'week' | 'month'>('day');

  // Scroll refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Create job dialog
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [newJobBooster, setNewJobBooster] = useState<string>("");
  const [newJobTime, setNewJobTime] = useState<string>("");
  const [newJobDate, setNewJobDate] = useState<Date>(new Date());

  // View/Edit booking dialog
  const [viewBookingOpen, setViewBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ booking: BoosterAvailability; job: Job | null; boosterName: string; boosterId: string } | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTime, setEditTime] = useState({ start: '', end: '' });
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  
  // Add service to booking dialog
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [existingServicesForBooking, setExistingServicesForBooking] = useState<{
    id: string;
    service_id: string;
    service_name: string;
    service_price: number;
    people_count: number;
    booster_id?: string;
    booster_name?: string;
  }[]>([]);

  // Drag state
  const [activeBooking, setActiveBooking] = useState<{ booking: BoosterAvailability; job: Job | null } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const locations = ["København", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens"];

  useEffect(() => {
    fetchBoosters();
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailability();
    }
  }, [selectedDate, viewMode]);

  const fetchBoosters = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setBoosters(data || []);
    } catch (error) {
      console.error('Error fetching boosters:', error);
      toast.error('Fejl ved hentning af boosters');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      let startDate = selectedDate;
      let endDate = selectedDate;

      if (viewMode === 'day') {
        startDate = selectedDate;
        endDate = addDays(selectedDate, 1);
      } else {
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
        endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
      }

      const { data, error } = await supabase
        .from('booster_availability')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;
      
      const realAvailability = (data || []).map(item => ({
        ...item,
        status: item.status as BoosterAvailability['status']
      }));
      
      setAvailability(realAvailability);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, client_name, client_email, client_phone, location, date_needed, time_needed, client_type, service_type')
        .in('status', ['assigned', 'in_progress', 'open']);

      if (error) throw error;
      setJobs([...(data || []), ...MOCK_JOBS]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs(MOCK_JOBS);
    }
  };
  // Get all unique specialties
  const allSpecialties = useMemo(() => {
    const specs = new Set<string>();
    boosters.forEach(b => b.specialties?.forEach(s => specs.add(s)));
    return Array.from(specs).sort();
  }, [boosters]);

  const filteredBoosters = useMemo(() => {
    return boosters.filter(booster => {
      const matchesSearch = booster.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === "all" || booster.location === locationFilter;
      const matchesSpecialty = specialtyFilter === "all" || booster.specialties?.includes(specialtyFilter);
      return matchesSearch && matchesLocation && matchesSpecialty;
    });
  }, [boosters, searchTerm, locationFilter, specialtyFilter]);

  // Add mock bookings using actual booster IDs - always show on today
  const availabilityWithMocks = useMemo(() => {
    // Always add mocks if viewing today (for demo purposes)
    if (!isSameDay(selectedDate, new Date())) {
      return availability;
    }
    
    const mockBookings = getMockBookings(filteredBoosters);
    const mockAvail: BoosterAvailability[] = mockBookings.map((mock, idx) => ({
      ...mock,
      id: `mock-avail-${idx}`,
    }));
    
    // Combine real and mock, avoiding duplicates by job_id
    const existingJobIds = new Set(availability.map(a => a.job_id).filter(Boolean));
    const filteredMocks = mockAvail.filter(m => !existingJobIds.has(m.job_id));
    
    return [...availability, ...filteredMocks];
  }, [availability, filteredBoosters, selectedDate]);

  const getBoosterAvailabilityForDate = (boosterId: string, date: Date) => {
    return availabilityWithMocks.filter(a => 
      a.booster_id === boosterId && 
      isSameDay(new Date(a.date), date)
    );
  };

  const getJobForAvailability = (jobId?: string) => {
    return jobId ? jobs.find(j => j.id === jobId) : null;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = viewMode === 'day' ? 1 : 7;
    setSelectedDate(prev => addDays(prev, direction === 'next' ? days : -days));
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const getBookingsStartingAtTime = (boosterId: string, date: Date, timeSlot: string) => {
    const dayAvailability = getBoosterAvailabilityForDate(boosterId, date);
    return dayAvailability.filter(avail => {
      const startHour = avail.start_time.slice(0, 5);
      return startHour === timeSlot && (avail.status === 'busy' || avail.job_id);
    });
  };

  const isSlotOccupied = (boosterId: string, date: Date, timeSlot: string) => {
    const dayAvailability = getBoosterAvailabilityForDate(boosterId, date);
    const slotMinutes = timeToMinutes(timeSlot);
    
    return dayAvailability.some(avail => {
      if (avail.status === 'busy' || avail.job_id) {
        const startMinutes = timeToMinutes(avail.start_time);
        const endMinutes = timeToMinutes(avail.end_time);
        return slotMinutes >= startMinutes && slotMinutes < endMinutes;
      }
      return false;
    });
  };

  const getBoosterImage = (booster: BoosterProfile) => {
    if (booster.portfolio_image_url) return booster.portfolio_image_url;
    const nameLower = booster.name.toLowerCase();
    return boosterImageOverrides[nameLower] || boosterImageOverrides[nameLower.split(' ')[0]] || null;
  };

  const weekNumber = format(selectedDate, 'w', { locale: da });

  // Scroll handlers
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { booking: BoosterAvailability; job: Job | null };
    setActiveBooking(data);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBooking(null);

    if (!over) return;

    const bookingData = active.data.current as { booking: BoosterAvailability; job: Job | null };
    const dropData = over.data.current as { boosterId: string; timeSlot: string; date: Date };

    if (!bookingData || !dropData) return;

    // Check if dropped on same slot
    if (bookingData.booking.booster_id === dropData.boosterId && 
        bookingData.booking.start_time.slice(0, 5) === dropData.timeSlot) {
      return;
    }

    const newBooster = filteredBoosters.find(b => b.id === dropData.boosterId);

    // Check if it's a mock booking (can't save to DB)
    if (bookingData.booking.id.startsWith('mock-')) {
      toast.success(`Booking flyttet til ${newBooster?.name || 'booster'} kl. ${dropData.timeSlot}`);
      return;
    }

    try {
      const duration = timeToMinutes(bookingData.booking.end_time) - timeToMinutes(bookingData.booking.start_time);
      const newEndMinutes = timeToMinutes(dropData.timeSlot) + duration;
      const newEndTime = `${Math.floor(newEndMinutes / 60).toString().padStart(2, '0')}:${(newEndMinutes % 60).toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('booster_availability')
        .update({ 
          booster_id: dropData.boosterId,
          start_time: dropData.timeSlot,
          end_time: newEndTime,
          date: format(dropData.date, 'yyyy-MM-dd')
        })
        .eq('id', bookingData.booking.id);

      if (error) throw error;

      toast.success(`Booking flyttet til ${newBooster?.name || 'booster'}`);
      fetchAvailability();
    } catch (error) {
      console.error('Error moving booking:', error);
      toast.error('Kunne ikke flytte booking');
    }
  };

  // Open job dialog
  const handleAddJob = (boosterId: string, timeSlot: string, date: Date) => {
    setNewJobBooster(boosterId);
    setNewJobTime(timeSlot);
    setNewJobDate(date);
    setJobDialogOpen(true);
  };

  const handleBookingClick = (booking: BoosterAvailability, job: Job | null, boosterName: string, boosterId: string) => {
    setSelectedBooking({ booking, job, boosterName, boosterId });
    setViewBookingOpen(true);
  };

  const handleEditBooking = () => {
    if (!selectedBooking) return;
    
    // Pre-fill the job dialog with existing booking data
    const { booking, boosterId } = selectedBooking;
    setNewJobBooster(boosterId);
    setNewJobTime(booking.start_time.slice(0, 5));
    setNewJobDate(new Date(booking.date));
    
    setViewBookingOpen(false);
    setJobDialogOpen(true);
  };

  // Get booster's bookings for individual view
  const getBoosterMonthBookings = (boosterId: string, date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => ({
      date: day,
      bookings: availabilityWithMocks.filter(a => 
        a.booster_id === boosterId && isSameDay(new Date(a.date), day)
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Individual Booster Calendar View
  if (selectedBooster) {
    const boosterAvailability = availabilityWithMocks.filter(a => a.booster_id === selectedBooster.id);
    const monthData = getBoosterMonthBookings(selectedBooster.id, selectedDate);
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Individual Booster Header */}
        <div className="flex items-center gap-3 py-3 px-4 border-b bg-background shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedBooster(null)}
            className="h-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tilbage
          </Button>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-green-500 ring-offset-2">
              <AvatarImage src={getBoosterImage(selectedBooster) || undefined} alt={selectedBooster.name} />
              <AvatarFallback className="bg-primary/10">
                {selectedBooster.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{selectedBooster.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedBooster.location}</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 px-2">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {format(selectedDate, 'd. MMM yyyy', { locale: da })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Select value={boosterViewMode} onValueChange={(v) => setBoosterViewMode(v as 'day' | 'week' | 'month')}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dag</SelectItem>
                <SelectItem value="week">Uge</SelectItem>
                <SelectItem value="month">Måned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Individual Booster Calendar Content */}
        <div className="flex-1 overflow-auto p-4">
          {boosterViewMode === 'day' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-medium mb-4">
                {format(selectedDate, 'EEEE d. MMMM yyyy', { locale: da })}
              </h3>
              <div className="space-y-2">
                {timeSlots.map((timeSlot, idx) => {
                  const bookingsStarting = getBookingsStartingAtTime(selectedBooster.id, selectedDate, timeSlot);
                  const isOccupied = isSlotOccupied(selectedBooster.id, selectedDate, timeSlot);
                  
                  return (
                    <div 
                      key={timeSlot}
                      className={cn(
                        "flex gap-3 py-1 border-b border-border/30",
                        idx % 2 === 0 && "bg-muted/10"
                      )}
                    >
                      <div className="w-16 text-sm text-muted-foreground shrink-0">
                        {idx % 2 === 0 ? timeSlot : ''}
                      </div>
                      <div className="flex-1 relative min-h-[28px]">
                        {bookingsStarting.map(avail => {
                          const job = getJobForAvailability(avail.job_id);
                          const isPrivate = job?.client_type !== 'virksomhed';
                          const duration = (timeToMinutes(avail.end_time) - timeToMinutes(avail.start_time)) / 30;
                          
                          return (
                            <div 
                              key={avail.id}
                              style={{ height: `${Math.max(duration * 32 - 4, 28)}px` }}
                              className={cn(
                                "absolute left-0 right-0 rounded-md p-2 cursor-pointer border-l-4",
                                isPrivate 
                                  ? "bg-pink-50 border-l-pink-400 hover:bg-pink-100" 
                                  : "bg-purple-50 border-l-purple-400 hover:bg-purple-100"
                              )}
                              onClick={() => handleBookingClick(avail, job, selectedBooster.name, selectedBooster.id)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">
                                  {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                                </span>
                                <Badge variant={isPrivate ? 'secondary' : 'default'} className="text-[10px] h-5">
                                  {isPrivate ? 'Privat' : 'B2B'}
                                </Badge>
                              </div>
                              <div className="text-sm font-medium mt-1">{job?.client_name || 'Kunde'}</div>
                              {duration >= 2 && (
                                <>
                                  <div className="text-xs text-muted-foreground">{job?.service_type}</div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3" />
                                    {job?.location}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {boosterViewMode === 'week' && (
            <div>
              <h3 className="text-lg font-medium mb-4">
                Uge {weekNumber} - {format(weekStart, 'd. MMM', { locale: da })} - {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: da })}
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, dayIdx) => {
                  const dayBookings = boosterAvailability.filter(a => 
                    isSameDay(new Date(a.date), day) && (a.status === 'busy' || a.job_id)
                  );
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={dayIdx}
                      className={cn(
                        "border rounded-lg p-2 min-h-[200px]",
                        isToday && "ring-2 ring-primary"
                      )}
                    >
                      <div className={cn(
                        "text-center mb-2 pb-2 border-b",
                        isToday && "text-primary font-bold"
                      )}>
                        <div className="text-xs text-muted-foreground">
                          {format(day, 'EEEE', { locale: da })}
                        </div>
                        <div className="text-lg font-semibold">
                          {format(day, 'd', { locale: da })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {dayBookings.map(avail => {
                          const job = getJobForAvailability(avail.job_id);
                          const isPrivate = job?.client_type !== 'virksomhed';
                          
                          return (
                            <div 
                              key={avail.id}
                              className={cn(
                                "text-xs p-1.5 rounded border-l-2 cursor-pointer",
                                isPrivate 
                                  ? "bg-pink-50 border-l-pink-400 hover:bg-pink-100" 
                                  : "bg-purple-50 border-l-purple-400 hover:bg-purple-100"
                              )}
                              onClick={() => handleBookingClick(avail, job, selectedBooster.name, selectedBooster.id)}
                            >
                              <div className="font-medium">{avail.start_time.slice(0, 5)}</div>
                              <div className="truncate">{job?.client_name || 'Kunde'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {boosterViewMode === 'month' && (
            <div>
              <h3 className="text-lg font-medium mb-4">
                {format(selectedDate, 'MMMM yyyy', { locale: da })}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {/* Week day headers */}
                {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before month starts */}
                {Array.from({ length: (getDay(startOfMonth(selectedDate)) + 6) % 7 }, (_, i) => (
                  <div key={`empty-${i}`} className="h-24 bg-muted/20 rounded" />
                ))}
                
                {/* Month days */}
                {monthData.map(({ date: day, bookings }) => {
                  const dayBookings = bookings.filter(a => a.status === 'busy' || a.job_id);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={day.toISOString()}
                      className={cn(
                        "h-24 border rounded p-1 overflow-hidden",
                        isToday && "ring-2 ring-primary"
                      )}
                    >
                      <div className={cn(
                        "text-xs font-medium mb-1",
                        isToday && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 3).map(avail => {
                          const job = getJobForAvailability(avail.job_id);
                          const isPrivate = job?.client_type !== 'virksomhed';
                          
                          return (
                            <div 
                              key={avail.id}
                              className={cn(
                                "text-[9px] px-1 py-0.5 rounded truncate cursor-pointer",
                                isPrivate 
                                  ? "bg-pink-100 text-pink-800" 
                                  : "bg-purple-100 text-purple-800"
                              )}
                              onClick={() => handleBookingClick(avail, job, selectedBooster.name, selectedBooster.id)}
                            >
                              {avail.start_time.slice(0, 5)} {job?.client_name || 'Kunde'}
                            </div>
                          );
                        })}
                        {dayBookings.length > 3 && (
                          <div className="text-[9px] text-muted-foreground text-center">
                            +{dayBookings.length - 3} mere
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Compact Header - All on one row */}
        <div className="flex items-center gap-2 py-2 px-3 border-b bg-background shrink-0 overflow-x-auto">
          <Button 
            onClick={() => {
              setNewJobBooster(filteredBoosters[0]?.id || "");
              setNewJobTime("09:00");
              setNewJobDate(selectedDate);
              setJobDialogOpen(true);
            }}
            size="sm"
            className="h-8 shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Opret job
          </Button>

          <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 px-2 shrink-0">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {format(selectedDate, 'd. MMM yyyy', { locale: da })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center border rounded-md overflow-hidden shrink-0">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 rounded-none px-3"
              onClick={() => setViewMode('day')}
            >
              Dag
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 rounded-none px-3"
              onClick={() => setViewMode('week')}
            >
              Uge
            </Button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-40">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
              <Input
                placeholder="Søg boosters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-32 h-8">
                <MapPin className="h-3 w-3 mr-1 shrink-0" />
                <SelectValue placeholder="Lokation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle byer</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-36 h-8">
                <Sparkles className="h-3 w-3 mr-1 shrink-0" />
                <SelectValue placeholder="Kompetencer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kompetencer</SelectItem>
                {allSpecialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calendar Grid - Day or Week View */}
        {viewMode === 'day' ? (
          // DAY VIEW
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Booster Header with scroll arrows */}
            <div className="flex items-center border-b bg-muted/30 shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-14 w-8 rounded-none border-r shrink-0"
                onClick={scrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="w-12 shrink-0 flex items-center justify-center text-xs font-medium text-muted-foreground border-r h-14">
                Uge {weekNumber}
              </div>
              
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto scrollbar-hide"
                onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
              >
                <div className="flex">
                  {filteredBoosters.map(booster => (
                    <div 
                      key={booster.id} 
                      className="w-24 shrink-0 p-1.5 border-r flex flex-col items-center gap-0.5 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedBooster(booster);
                        setBoosterViewMode('day');
                      }}
                    >
                      <Avatar className="h-7 w-7 ring-2 ring-green-500 ring-offset-1">
                        <AvatarImage src={getBoosterImage(booster) || undefined} alt={booster.name} />
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {booster.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-medium truncate max-w-full text-center">
                        {booster.name.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-14 w-8 rounded-none border-l shrink-0"
                onClick={scrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Time Grid - scrollable vertically, synced horizontally */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              <div className="w-8 shrink-0" />
              
              <div className="w-12 shrink-0 overflow-y-auto scrollbar-hide border-r">
                {timeSlots.map((timeSlot, idx) => (
                  <div 
                    key={timeSlot}
                    className={cn(
                      "h-7 flex items-start justify-end pr-1 text-[10px] text-muted-foreground",
                      idx % 2 === 0 ? "bg-muted/20" : ""
                    )}
                  >
                    {idx % 2 === 0 ? timeSlot : ''}
                  </div>
                ))}
              </div>

              <div 
                className="flex-1 overflow-auto"
                onScroll={(e) => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
              >
                <div className="flex" style={{ minWidth: `${filteredBoosters.length * 96}px` }}>
                  {filteredBoosters.map(booster => (
                    <div key={booster.id} className="w-24 shrink-0">
                      {timeSlots.map((timeSlot, idx) => {
                        const bookingsStarting = getBookingsStartingAtTime(booster.id, selectedDate, timeSlot);
                        const isOccupied = isSlotOccupied(booster.id, selectedDate, timeSlot);
                        const hasBookingStarting = bookingsStarting.length > 0;
                        
                        return (
                          <DroppableSlot
                            key={`${booster.id}-${timeSlot}`}
                            boosterId={booster.id}
                            timeSlot={timeSlot}
                            date={selectedDate}
                            onAddJob={handleAddJob}
                            hasBooking={isOccupied}
                          >
                            {bookingsStarting.map(avail => {
                              const job = getJobForAvailability(avail.job_id);
                              const isPrivate = job?.client_type !== 'virksomhed';
                              
                              return (
                                <DraggableBookingCard
                                  key={avail.id}
                                  booking={avail}
                                  job={job}
                                  isPrivate={isPrivate}
                                  onClick={() => handleBookingClick(avail, job, booster.name, booster.id)}
                                />
                              );
                            })}
                            {isOccupied && !hasBookingStarting && (
                              <div className="absolute inset-0 bg-muted/30" />
                            )}
                          </DroppableSlot>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-8 shrink-0" />
            </div>
          </div>
        ) : (
          // WEEK VIEW - Boosters in rows, days in columns
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Week Days Header */}
            <div className="flex items-center border-b bg-muted/30 shrink-0">
              <div className="w-32 shrink-0 flex items-center justify-center text-xs font-medium text-muted-foreground border-r h-12 px-2">
                Uge {weekNumber}
              </div>
              {(() => {
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                return Array.from({ length: 7 }).map((_, i) => {
                  const day = addDays(weekStart, i);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 text-center py-2 border-r text-xs",
                        isToday && "bg-primary/10"
                      )}
                    >
                      <div className="font-medium">{format(day, 'EEE', { locale: da })}</div>
                      <div className={cn(
                        "text-muted-foreground",
                        isToday && "text-primary font-bold"
                      )}>
                        {format(day, 'd. MMM', { locale: da })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Boosters Grid */}
            <div className="flex-1 overflow-auto">
              {filteredBoosters.map(booster => {
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                
                return (
                  <div key={booster.id} className="flex border-b">
                    {/* Booster info column */}
                    <div 
                      className="w-32 shrink-0 p-2 border-r flex items-center gap-2 bg-muted/10 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => {
                        setSelectedBooster(booster);
                        setBoosterViewMode('week');
                      }}
                    >
                      <Avatar className="h-6 w-6 ring-2 ring-green-500 ring-offset-1">
                        <AvatarImage src={getBoosterImage(booster) || undefined} alt={booster.name} />
                        <AvatarFallback className="text-[8px] bg-primary/10">
                          {booster.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{booster.name.split(' ')[0]}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{booster.location}</div>
                      </div>
                    </div>
                    
                    {/* Days columns */}
                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                      const day = addDays(weekStart, dayIdx);
                      const isToday = isSameDay(day, new Date());
                      const dayAvailability = getBoosterAvailabilityForDate(booster.id, day);
                      const bookings = dayAvailability.filter(a => a.status === 'busy' || a.job_id);
                      
                      return (
                        <div 
                          key={dayIdx}
                          className={cn(
                            "flex-1 min-h-16 p-1 border-r relative",
                            isToday && "bg-primary/5"
                          )}
                          onClick={() => {
                            if (bookings.length === 0) {
                              handleAddJob(booster.id, '09:00', day);
                            }
                          }}
                        >
                          {bookings.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity">
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                <Plus className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          )}
                          {bookings.slice(0, 3).map((avail, idx) => {
                            const job = getJobForAvailability(avail.job_id);
                            const isPrivate = job?.client_type !== 'virksomhed';
                            
                            return (
                              <div 
                                key={avail.id}
                                className={cn(
                                  "text-[9px] p-1 rounded mb-1 cursor-pointer border-l-2",
                                  isPrivate 
                                    ? "bg-pink-50 border-l-pink-400 hover:bg-pink-100" 
                                    : "bg-purple-50 border-l-purple-400 hover:bg-purple-100"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookingClick(avail, job, booster.name, booster.id);
                                }}
                              >
                                <div className="font-medium">{avail.start_time.slice(0, 5)}</div>
                                <div className="truncate">{job?.client_name || 'Kunde'}</div>
                              </div>
                            );
                          })}
                          {bookings.length > 3 && (
                            <div className="text-[9px] text-muted-foreground text-center">
                              +{bookings.length - 3} mere
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="border-t bg-muted/30 py-1.5 px-3 flex items-center gap-4 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-pink-50 border-l-2 border-l-pink-400 rounded-sm" />
            <span className="text-muted-foreground">Privat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-purple-50 border-l-2 border-l-purple-400 rounded-sm" />
            <span className="text-muted-foreground">B2B</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plus className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Klik = opret</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Træk = flyt</span>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeBooking && (
            <div className={cn(
              "w-24 rounded-md p-2 shadow-lg border-l-4",
              activeBooking.job?.client_type !== 'virksomhed'
                ? "bg-pink-50 border-l-pink-400"
                : "bg-purple-50 border-l-purple-400"
            )}>
              <div className="text-[10px] font-medium">
                {activeBooking.booking.start_time.slice(0, 5)} - {activeBooking.booking.end_time.slice(0, 5)}
              </div>
              <div className="text-xs font-medium truncate">
                {activeBooking.job?.client_name || 'Kunde'}
              </div>
            </div>
          )}
        </DragOverlay>
      </div>

      {/* Create Job Dialog - Multi-service support */}
      <MultiServiceJobDialog
        open={jobDialogOpen}
        onOpenChange={setJobDialogOpen}
        boosters={filteredBoosters}
        initialBoosterId={newJobBooster}
        initialTime={newJobTime}
        initialDate={newJobDate}
        onJobCreated={() => {
          fetchAvailability();
          fetchJobs();
        }}
      />

      {/* Add Service to Existing Booking Dialog */}
      <AddServiceToBookingDialog
        open={addServiceDialogOpen}
        onOpenChange={setAddServiceDialogOpen}
        existingServices={existingServicesForBooking}
        boosters={filteredBoosters}
        onSave={(updatedServices) => {
          console.log('Updated services:', updatedServices);
          fetchAvailability();
        }}
        bookingId={selectedBooking?.booking.id}
        bookingDate={selectedBooking?.booking.date}
        bookingTime={selectedBooking?.booking.start_time}
        customerName={selectedBooking?.job?.client_name}
        customerEmail={selectedBooking?.job?.client_email}
        customerPhone={selectedBooking?.job?.client_phone}
        address={selectedBooking?.job?.location}
      />

      {/* View/Edit Booking Dialog - Booster Calendar Style */}
      <Dialog open={viewBookingOpen} onOpenChange={(open) => {
        setViewBookingOpen(open);
        if (!open) setIsEditMode(false);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedBooking && (() => {
            // Parse notes for team info
            let notesData: { 
              team_boosters?: string[]; 
              services?: Array<{
                service_id?: string;
                service_name: string;
                service_price: number;
                people_count: number;
                booster_id?: string;
                booster_name?: string;
              }>;
              service?: string; 
              people_count?: number;
              price?: number;
              total_price?: number;
              customer_name?: string;
              customer_email?: string;
              customer_phone?: string;
              address?: string;
              client_type?: string;
              company_name?: string;
            } = {};
            try {
              if (selectedBooking.booking.notes) {
                notesData = JSON.parse(selectedBooking.booking.notes);
              }
            } catch (e) {
              // Notes is not JSON, ignore
            }
            
            // Build all team members (current booster + team_boosters)
            const teamBoosters = notesData.team_boosters || [];
            const allTeamMembers = [selectedBooking.boosterName, ...teamBoosters];
            const hasTeam = allTeamMembers.length > 1;
            
            // Get data from notes or job
            const customerName = notesData.customer_name || selectedBooking.job?.client_name;
            const customerEmail = notesData.customer_email || selectedBooking.job?.client_email;
            const customerPhone = notesData.customer_phone || selectedBooking.job?.client_phone;
            const address = notesData.address || selectedBooking.job?.location;
            const clientType = notesData.client_type || selectedBooking.job?.client_type;
            const companyName = notesData.company_name;
            const service = notesData.service || selectedBooking.job?.service_type || 'Service';
            const peopleCount = notesData.people_count || 1;
            const price = notesData.price || 0;
            const isVirksomhed = clientType === 'virksomhed';

            // Create Google Maps URL
            const googleMapsUrl = address 
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
              : null;

            // Calculate duration
            const startParts = selectedBooking.booking.start_time.split(':').map(Number);
            const endParts = selectedBooking.booking.end_time.split(':').map(Number);
            const durationMins = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]);
            const hours = Math.floor(durationMins / 60);
            const mins = durationMins % 60;
            const durationStr = mins > 0 ? `${hours}t ${mins}m` : `${hours} timer`;

            const copyToClipboard = (text: string, label: string) => {
              navigator.clipboard.writeText(text);
              toast.success(`${label} kopieret`);
            };

            const openGoogleMaps = () => {
              if (googleMapsUrl) {
                window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
              }
            };

            const handleOpenChat = () => {
              toast.info("Åbner chat...");
              setViewBookingOpen(false);
            };

            const handleCreateGroupChat = () => {
              toast.info("Gruppechat oprettes...");
              setViewBookingOpen(false);
            };

            const handleReleaseJob = () => {
              toast.info("Frigiver job...");
              setViewBookingOpen(false);
            };

            return (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="text-xl text-foreground">{selectedBooking.job?.title || service}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isVirksomhed ? "default" : "secondary"}>
                          {isVirksomhed ? 'Virksomhed' : 'Privat'}
                        </Badge>
                      </div>
                    </div>
                    {price > 0 && (
                      <p className="text-2xl font-bold text-primary">
                        {price.toLocaleString('da-DK')} kr
                      </p>
                    )}
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Time & Date */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedBooking.booking.start_time.slice(0, 5)} - {selectedBooking.booking.end_time.slice(0, 5)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedBooking.booking.date), "EEEE d. MMMM", { locale: da })} • {durationStr}
                      </p>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Kunde</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{customerName || 'Ikke angivet'}</span>
                      </div>
                      
                      {companyName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{companyName}</span>
                        </div>
                      )}
                      
                      {customerEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${customerEmail}`} className="text-foreground hover:underline">
                            {customerEmail}
                          </a>
                        </div>
                      )}

                      {customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${customerPhone}`} className="text-foreground hover:underline">
                            {customerPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Boosters - Show with avatars */}
                  {hasTeam ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Team ({allTeamMembers.length} boosters)
                      </h4>
                      <div className="space-y-2">
                        {allTeamMembers.map((name, idx) => {
                          // Find booster profile to get image
                          const boosterProfile = boosters.find(b => b.name === name);
                          const imageUrl = boosterProfile 
                            ? (boosterImageOverrides[boosterProfile.name] || boosterProfile.portfolio_image_url)
                            : null;
                          const initials = name.split(' ').map(n => n[0]).join('');
                          
                          return (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                              <Avatar className="h-10 w-10">
                                {imageUrl ? (
                                  <AvatarImage src={imageUrl} alt={name} />
                                ) : null}
                                <AvatarFallback className="text-sm bg-primary/10">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium text-foreground">{name}</span>
                                {idx === 0 && (
                                  <span className="ml-2 text-xs text-muted-foreground">(primær)</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Tildelt</h4>
                      <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        {(() => {
                          const boosterProfile = boosters.find(b => b.name === selectedBooking.boosterName);
                          const imageUrl = boosterProfile 
                            ? (boosterImageOverrides[boosterProfile.name] || boosterProfile.portfolio_image_url)
                            : null;
                          return (
                            <Avatar className="h-10 w-10">
                              {imageUrl ? (
                                <AvatarImage src={imageUrl} alt={selectedBooking.boosterName} />
                              ) : null}
                              <AvatarFallback className="text-sm bg-primary/10">
                                {selectedBooking.boosterName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          );
                        })()}
                        <span className="font-medium text-foreground">{selectedBooking.boosterName}</span>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {address && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Lokation</h4>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="break-words text-foreground">{address}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => copyToClipboard(address, 'Adresse')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={openGoogleMaps}
                          >
                            <Navigation className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Service Details - Show all services */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Services</h4>
                    {notesData.services && notesData.services.length > 0 ? (
                      <div className="space-y-2">
                        {(notesData.services as Array<{service_name: string; service_price: number; people_count: number; booster_name?: string}>).map((svc, idx) => (
                          <div key={idx} className="p-3 bg-muted rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {svc.booster_name && (
                                <Avatar className="h-8 w-8">
                                  {(() => {
                                    const bp = boosters.find(b => b.name === svc.booster_name);
                                    const imgUrl = bp ? (boosterImageOverrides[bp.name] || bp.portfolio_image_url) : null;
                                    return imgUrl ? <AvatarImage src={imgUrl} alt={svc.booster_name} /> : null;
                                  })()}
                                  <AvatarFallback className="text-xs">
                                    {svc.booster_name?.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div>
                                <p className="font-medium text-foreground">{svc.service_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {svc.people_count} {svc.people_count === 1 ? 'person' : 'personer'}
                                  {svc.booster_name && ` • ${svc.booster_name}`}
                                </p>
                              </div>
                            </div>
                            <span className="font-medium text-foreground">{svc.service_price?.toLocaleString('da-DK')} kr</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Service</p>
                          <p className="font-medium text-foreground">{service}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Personer</p>
                          <p className="font-medium text-foreground">{peopleCount}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit Mode Form */}
                  {isEditMode && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                      <h4 className="font-medium text-foreground">Rediger tidspunkt</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-sm">Start tid</Label>
                          <Input 
                            type="time" 
                            value={editTime.start}
                            onChange={(e) => setEditTime({ ...editTime, start: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm">Slut tid</Label>
                          <Input 
                            type="time" 
                            value={editTime.end}
                            onChange={(e) => setEditTime({ ...editTime, end: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">Dato</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editDate ? format(editDate, "PPP", { locale: da }) : "Vælg dato"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={editDate}
                              onSelect={setEditDate}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          className="flex-1"
                          onClick={async () => {
                            if (!selectedBooking) return;
                            try {
                              const { error } = await supabase
                                .from('booster_availability')
                                .update({
                                  start_time: editTime.start,
                                  end_time: editTime.end,
                                  date: editDate ? format(editDate, 'yyyy-MM-dd') : selectedBooking.booking.date
                                })
                                .eq('id', selectedBooking.booking.id);

                              if (error) throw error;
                              toast.success("Booking opdateret");
                              setIsEditMode(false);
                              setViewBookingOpen(false);
                              fetchAvailability();
                            } catch (error) {
                              console.error('Error updating booking:', error);
                              toast.error("Kunne ikke opdatere booking");
                            }
                          }}
                        >
                          Gem ændringer
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditMode(false)}
                        >
                          Annuller
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Admin Action Buttons */}
                  {!isEditMode && (
                    <div className="space-y-3 pt-2 border-t">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Handlinger</h4>
                      
                      {/* Primary Admin Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => {
                          setEditTime({
                            start: selectedBooking.booking.start_time.slice(0, 5),
                            end: selectedBooking.booking.end_time.slice(0, 5)
                          });
                          setEditDate(new Date(selectedBooking.booking.date));
                          setIsEditMode(true);
                        }}>
                          <Edit className="h-4 w-4" />
                          Rediger
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => {
                          // Parse existing services from notes if available
                          let existingServices: typeof existingServicesForBooking = [];
                          
                          if (notesData.services && Array.isArray(notesData.services)) {
                            existingServices = (notesData.services as Array<any>).map((svc: any, idx: number) => ({
                              id: `service-${selectedBooking.booking.id}-${idx}`,
                              service_id: svc.service_id || '',
                              service_name: svc.service_name || service,
                              service_price: svc.service_price || 0,
                              people_count: svc.people_count || 1,
                              booster_id: svc.booster_id || selectedBooking.boosterId,
                              booster_name: svc.booster_name || selectedBooking.boosterName
                            }));
                          } else {
                            // Create initial service from current booking data
                            existingServices.push({
                              id: `service-${selectedBooking.booking.id}`,
                              service_id: '',
                              service_name: service,
                              service_price: price,
                              people_count: peopleCount,
                              booster_id: selectedBooking.boosterId,
                              booster_name: selectedBooking.boosterName
                            });
                          }
                          
                          setExistingServicesForBooking(existingServices);
                          setAddServiceDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4" />
                          Tilføj service
                        </Button>
                      </div>

                      {/* Communication Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="default" className="gap-2" onClick={handleOpenChat}>
                          <MessageCircle className="h-4 w-4" />
                          Chat
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={openGoogleMaps}>
                          <Navigation className="h-4 w-4" />
                          Navigation
                        </Button>
                      </div>

                      {hasTeam && (
                        <Button variant="secondary" className="w-full gap-2" onClick={handleCreateGroupChat}>
                          <Users className="h-4 w-4" />
                          Opret gruppechat
                        </Button>
                      )}

                      {/* Destructive Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={handleReleaseJob}
                        >
                          <HandHelping className="h-4 w-4" />
                          Frigiv job
                        </Button>
                        <Button 
                          variant="outline" 
                          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            if (!selectedBooking) return;
                            try {
                              const { error } = await supabase
                                .from('booster_availability')
                                .delete()
                                .eq('id', selectedBooking.booking.id);

                              if (error) throw error;
                              toast.success("Booking slettet");
                              setViewBookingOpen(false);
                              fetchAvailability();
                            } catch (error) {
                              console.error('Error deleting booking:', error);
                              toast.error("Kunne ikke slette booking");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Slet
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};

export default AdminCalendar;
