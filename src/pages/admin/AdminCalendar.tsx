import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { da } from "date-fns/locale";
import { 
  Calendar as CalendarIcon,
  Search, 
  Filter,
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  Plus,
  GripVertical
} from "lucide-react";
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
  location: string;
  date_needed: string;
  time_needed?: string;
  client_type?: string;
  service_type?: string;
}

// Mock bookings data
const MOCK_BOOKINGS: Omit<BoosterAvailability, 'id'>[] = [
  { booster_id: 'mock-1', date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '11:00', status: 'busy', job_id: 'job-1', notes: '' },
  { booster_id: 'mock-2', date: new Date().toISOString().split('T')[0], start_time: '10:30', end_time: '12:30', status: 'busy', job_id: 'job-2', notes: '' },
  { booster_id: 'mock-3', date: new Date().toISOString().split('T')[0], start_time: '14:00', end_time: '16:00', status: 'busy', job_id: 'job-3', notes: '' },
  { booster_id: 'mock-4', date: new Date().toISOString().split('T')[0], start_time: '08:30', end_time: '10:00', status: 'busy', job_id: 'job-4', notes: '' },
];

const MOCK_JOBS: Job[] = [
  { id: 'job-1', title: 'Bryllup makeup', client_name: 'Maria Jensen', location: 'København', date_needed: new Date().toISOString().split('T')[0], time_needed: '09:00', client_type: 'privat', service_type: 'Bryllup' },
  { id: 'job-2', title: 'Firmaevent', client_name: 'Novo Nordisk', location: 'København', date_needed: new Date().toISOString().split('T')[0], time_needed: '10:30', client_type: 'virksomhed', service_type: 'Event' },
  { id: 'job-3', title: 'Hår styling', client_name: 'Louise Nielsen', location: 'Aarhus', date_needed: new Date().toISOString().split('T')[0], time_needed: '14:00', client_type: 'privat', service_type: 'Hår' },
  { id: 'job-4', title: 'TV-produktion', client_name: 'DR', location: 'København', date_needed: new Date().toISOString().split('T')[0], time_needed: '08:30', client_type: 'virksomhed', service_type: 'Film/TV' },
];

// Draggable booking component
function DraggableBookingCard({ 
  booking, 
  job, 
  isPrivate 
}: { 
  booking: BoosterAvailability; 
  job: Job | null; 
  isPrivate: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `booking-${booking.id}`,
    data: { booking, job },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const duration = (timeToMinutes(booking.end_time) - timeToMinutes(booking.start_time)) / 30; // number of 30-min slots

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, height: `${Math.max(duration * 24 - 4, 20)}px` }}
      className={cn(
        "absolute left-1 right-1 rounded-md p-1 overflow-hidden cursor-grab z-10 transition-shadow",
        "border-l-4",
        isPrivate 
          ? "bg-amber-50 border-l-amber-400 hover:shadow-md" 
          : "bg-blue-50 border-l-blue-400 hover:shadow-md",
        isDragging && "opacity-50 shadow-lg"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
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
            <div className="text-[9px] text-muted-foreground truncate">
              {job?.service_type || 'Service'}
            </div>
          )}
          {duration >= 3 && job?.location && (
            <div className="flex items-center gap-0.5">
              <MapPin className="h-2 w-2 text-muted-foreground shrink-0" />
              <span className="text-[8px] text-muted-foreground truncate">{job.location}</span>
            </div>
          )}
        </div>
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
}: { 
  boosterId: string; 
  timeSlot: string; 
  date: Date;
  children?: React.ReactNode;
  onAddJob: (boosterId: string, timeSlot: string, date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${boosterId}-${timeSlot}-${date.toISOString()}`,
    data: { boosterId, timeSlot, date },
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "border-r min-h-[24px] relative transition-colors",
        isOver && "bg-primary/10 ring-1 ring-primary ring-inset",
        !children && "hover:bg-muted/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !children && onAddJob(boosterId, timeSlot, date)}
    >
      {children}
      {!children && isHovered && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
          <Plus className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
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

  // Create job dialog
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [newJobBooster, setNewJobBooster] = useState<string>("");
  const [newJobTime, setNewJobTime] = useState<string>("");
  const [newJobDate, setNewJobDate] = useState<Date>(new Date());
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobClient, setNewJobClient] = useState("");
  const [newJobService, setNewJobService] = useState("");
  const [newJobLocation, setNewJobLocation] = useState("");
  const [newJobClientType, setNewJobClientType] = useState<'privat' | 'virksomhed'>('privat');
  const [newJobDuration, setNewJobDuration] = useState("60");

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
      
      // Combine real data with mock bookings for demo
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
        .select('id, title, client_name, location, date_needed, time_needed, client_type, service_type')
        .in('status', ['assigned', 'in_progress', 'open']);

      if (error) throw error;
      // Combine real jobs with mock jobs
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

  // Add mock bookings to first few filtered boosters
  const availabilityWithMocks = useMemo(() => {
    const mockAvail: BoosterAvailability[] = [];
    const today = format(selectedDate, 'yyyy-MM-dd');
    
    filteredBoosters.slice(0, 4).forEach((booster, idx) => {
      const mock = MOCK_BOOKINGS[idx];
      if (mock && mock.date === new Date().toISOString().split('T')[0] && isSameDay(selectedDate, new Date())) {
        mockAvail.push({
          ...mock,
          id: `mock-avail-${idx}`,
          booster_id: booster.id,
          date: today,
        });
      }
    });
    
    return [...availability, ...mockAvail];
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

    // Check if it's a mock booking (can't save to DB)
    if (bookingData.booking.id.startsWith('mock-')) {
      toast.success('Demo: Booking flyttet til ' + filteredBoosters.find(b => b.id === dropData.boosterId)?.name);
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

      toast.success('Booking flyttet');
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
    setNewJobTitle("");
    setNewJobClient("");
    setNewJobService("");
    setNewJobLocation("");
    setNewJobClientType('privat');
    setNewJobDuration("60");
    setJobDialogOpen(true);
  };

  const handleCreateJob = async () => {
    if (!newJobTitle || !newJobClient) {
      toast.error('Udfyld titel og kundenavn');
      return;
    }

    const endMinutes = timeToMinutes(newJobTime) + parseInt(newJobDuration);
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    try {
      // Create job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          title: newJobTitle,
          client_name: newJobClient,
          service_type: newJobService,
          location: newJobLocation,
          client_type: newJobClientType,
          date_needed: format(newJobDate, 'yyyy-MM-dd'),
          time_needed: newJobTime,
          hourly_rate: 500,
          status: 'assigned',
          assigned_booster_id: newJobBooster,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create availability entry
      const { error: availError } = await supabase
        .from('booster_availability')
        .insert({
          booster_id: newJobBooster,
          date: format(newJobDate, 'yyyy-MM-dd'),
          start_time: newJobTime,
          end_time: endTime,
          status: 'busy',
          job_id: jobData.id,
        });

      if (availError) throw availError;

      toast.success('Job oprettet');
      setJobDialogOpen(false);
      fetchAvailability();
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Kunne ikke oprette job');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between py-3 px-4 border-b bg-background shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Søg boosters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-36 h-9">
                <Filter className="h-3 w-3 mr-2" />
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
              <SelectTrigger className="w-40 h-9">
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

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                setNewJobBooster(filteredBoosters[0]?.id || "");
                setNewJobTime("09:00");
                setNewJobDate(selectedDate);
                setJobDialogOpen(true);
              }}
              size="sm"
              className="h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              Opret job
            </Button>

            <Button variant="outline" size="sm" className="h-9" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 min-w-[160px]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, 'd. MMM yyyy', { locale: da })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" className="h-9" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center border rounded-md overflow-hidden ml-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 rounded-none"
                onClick={() => setViewMode('day')}
              >
                Dag
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 rounded-none"
                onClick={() => setViewMode('week')}
              >
                Uge
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-max">
            {/* Sticky Header with Boosters */}
            <div 
              className="sticky top-0 z-20 bg-background border-b"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `60px repeat(${filteredBoosters.length}, minmax(120px, 1fr))` 
              }}
            >
              <div className="p-2 text-xs font-medium text-muted-foreground border-r flex items-center justify-center">
                Uge {weekNumber}
              </div>
              {filteredBoosters.map(booster => (
                <div key={booster.id} className="p-2 border-r flex flex-col items-center gap-1">
                  <Avatar className="h-8 w-8 ring-2 ring-green-500 ring-offset-1">
                    <AvatarImage src={getBoosterImage(booster) || undefined} alt={booster.name} />
                    <AvatarFallback className="text-xs bg-primary/10">
                      {booster.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium truncate max-w-full">
                    {booster.name.split(' ')[0]} {booster.name.split(' ')[1]?.[0]}.
                  </span>
                </div>
              ))}
            </div>

            {/* Time Slots Grid */}
            {timeSlots.map((timeSlot, idx) => (
              <div 
                key={timeSlot}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `60px repeat(${filteredBoosters.length}, minmax(120px, 1fr))` 
                }}
                className={cn(
                  "border-b border-border/30",
                  idx % 2 === 0 && "border-b-border/60"
                )}
              >
                {/* Time Label */}
                <div className={cn(
                  "text-[10px] text-muted-foreground border-r flex items-start justify-end pr-2 pt-0.5",
                  idx % 2 === 0 ? "bg-muted/20" : "bg-background"
                )}>
                  {idx % 2 === 0 ? timeSlot : ''}
                </div>
                
                {/* Booster Slots */}
                {filteredBoosters.map(booster => {
                  const bookingsStarting = getBookingsStartingAtTime(booster.id, selectedDate, timeSlot);
                  const isOccupied = isSlotOccupied(booster.id, selectedDate, timeSlot) && bookingsStarting.length === 0;
                  
                  return (
                    <DroppableSlot
                      key={`${booster.id}-${timeSlot}`}
                      boosterId={booster.id}
                      timeSlot={timeSlot}
                      date={selectedDate}
                      onAddJob={handleAddJob}
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
                          />
                        );
                      })}
                      {isOccupied && (
                        <div className="absolute inset-0 bg-muted/20" />
                      )}
                    </DroppableSlot>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="border-t bg-muted/30 py-2 px-4 flex items-center gap-6 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-50 border-l-4 border-l-amber-400 rounded-sm" />
            <span className="text-muted-foreground">Privat booking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border-l-4 border-l-blue-400 rounded-sm" />
            <span className="text-muted-foreground">Virksomhed (B2B)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-background border rounded-sm flex items-center justify-center">
              <Plus className="h-2 w-2 text-muted-foreground" />
            </div>
            <span className="text-muted-foreground">Klik for at oprette job</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Træk for at flytte</span>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeBooking && (
            <div className={cn(
              "w-28 rounded-md p-2 shadow-lg border-l-4",
              activeBooking.job?.client_type !== 'virksomhed'
                ? "bg-amber-50 border-l-amber-400"
                : "bg-blue-50 border-l-blue-400"
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

      {/* Create Job Dialog */}
      <Dialog open={jobDialogOpen} onOpenChange={setJobDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opret job</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Booster</Label>
                <Select value={newJobBooster} onValueChange={setNewJobBooster}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg booster" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBoosters.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Kundetype</Label>
                <Select value={newJobClientType} onValueChange={(v) => setNewJobClientType(v as 'privat' | 'virksomhed')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privat">Privat</SelectItem>
                    <SelectItem value="virksomhed">Virksomhed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Titel</Label>
              <Input
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="F.eks. Bryllup makeup"
              />
            </div>

            <div className="space-y-2">
              <Label>Kundenavn</Label>
              <Input
                value={newJobClient}
                onChange={(e) => setNewJobClient(e.target.value)}
                placeholder="Kunde eller virksomhedsnavn"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Input
                  value={newJobService}
                  onChange={(e) => setNewJobService(e.target.value)}
                  placeholder="F.eks. Makeup"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Lokation</Label>
                <Input
                  value={newJobLocation}
                  onChange={(e) => setNewJobLocation(e.target.value)}
                  placeholder="F.eks. København"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dato</Label>
                <Input
                  type="date"
                  value={format(newJobDate, 'yyyy-MM-dd')}
                  onChange={(e) => setNewJobDate(new Date(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Starttid</Label>
                <Input
                  type="time"
                  value={newJobTime}
                  onChange={(e) => setNewJobTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Varighed (min)</Label>
                <Select value={newJobDuration} onValueChange={setNewJobDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 time</SelectItem>
                    <SelectItem value="90">1,5 time</SelectItem>
                    <SelectItem value="120">2 timer</SelectItem>
                    <SelectItem value="180">3 timer</SelectItem>
                    <SelectItem value="240">4 timer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleCreateJob}>
              Opret job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};

export default AdminCalendar;
