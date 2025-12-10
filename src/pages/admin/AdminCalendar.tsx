import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { boosterImageOverrides } from "@/data/boosterImages";

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

const AdminCalendar = () => {
  const [boosters, setBoosters] = useState<BoosterProfile[]>([]);
  const [availability, setAvailability] = useState<BoosterAvailability[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");

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
      setAvailability((data || []).map(item => ({
        ...item,
        status: item.status as 'available' | 'busy' | 'vacation' | 'sick' | 'blocked'
      })));
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
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const filteredBoosters = useMemo(() => {
    return boosters.filter(booster => {
      const matchesSearch = booster.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === "all" || booster.location === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [boosters, searchTerm, locationFilter]);

  const getBoosterAvailabilityForDate = (boosterId: string, date: Date) => {
    return availability.filter(a => 
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

  const getDaysToShow = () => {
    if (viewMode === 'day') {
      return [selectedDate];
    }
    return eachDayOfInterval({
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
      end: endOfWeek(selectedDate, { weekStartsOn: 1 })
    });
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getBookingsStartingAtTime = (boosterId: string, date: Date, timeSlot: string) => {
    const dayAvailability = getBoosterAvailabilityForDate(boosterId, date);
    return dayAvailability.filter(avail => {
      const startHour = avail.start_time.slice(0, 5);
      return startHour === timeSlot && (avail.status === 'busy' || avail.job_id);
    });
  };

  const isSlotBlocked = (boosterId: string, date: Date, timeSlot: string) => {
    const dayAvailability = getBoosterAvailabilityForDate(boosterId, date);
    const slotMinutes = timeToMinutes(timeSlot);
    
    return dayAvailability.some(avail => {
      if (avail.status === 'vacation' || avail.status === 'sick' || avail.status === 'blocked') {
        const startMinutes = timeToMinutes(avail.start_time);
        const endMinutes = timeToMinutes(avail.end_time);
        return slotMinutes >= startMinutes && slotMinutes < endMinutes;
      }
      return false;
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

  const getBookingDuration = (avail: BoosterAvailability) => {
    const startMinutes = timeToMinutes(avail.start_time);
    const endMinutes = timeToMinutes(avail.end_time);
    return (endMinutes - startMinutes) / 60; // hours
  };

  const getBoosterImage = (booster: BoosterProfile) => {
    if (booster.portfolio_image_url) return booster.portfolio_image_url;
    const nameLower = booster.name.toLowerCase();
    return boosterImageOverrides[nameLower] || boosterImageOverrides[nameLower.split(' ')[0]] || null;
  };

  const daysToShow = getDaysToShow();
  const weekNumber = format(selectedDate, 'w', { locale: da });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between py-3 px-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Søg boosters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-40 h-9">
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
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 min-w-[180px]">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {viewMode === 'day' 
                  ? format(selectedDate, 'd. MMMM yyyy', { locale: da })
                  : `Uge ${weekNumber} · ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd. MMM', { locale: da })} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'd. MMM', { locale: da })}`
                }
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
              gridTemplateColumns: `60px repeat(${filteredBoosters.length}, minmax(140px, 1fr))` 
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
                <span className="text-xs font-medium truncate max-w-full">{booster.name.split(' ')[0]} {booster.name.split(' ')[1]?.[0]}.</span>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          {timeSlots.map(timeSlot => (
            <div 
              key={timeSlot}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `60px repeat(${filteredBoosters.length}, minmax(140px, 1fr))` 
              }}
              className="border-b border-border/50"
            >
              {/* Time Label */}
              <div className="p-1 text-xs text-muted-foreground border-r bg-muted/30 flex items-start justify-end pr-2 pt-1">
                {timeSlot}
              </div>
              
              {/* Booster Slots */}
              {filteredBoosters.map(booster => {
                const bookingsStarting = getBookingsStartingAtTime(booster.id, selectedDate, timeSlot);
                const isBlocked = isSlotBlocked(booster.id, selectedDate, timeSlot);
                const isOccupied = isSlotOccupied(booster.id, selectedDate, timeSlot);
                
                return (
                  <div 
                    key={`${booster.id}-${timeSlot}`}
                    className={cn(
                      "border-r min-h-[48px] relative",
                      isBlocked && "bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,hsl(var(--muted)/0.5)_4px,hsl(var(--muted)/0.5)_8px)]",
                      !isBlocked && !isOccupied && "bg-background hover:bg-muted/20 transition-colors"
                    )}
                  >
                    {bookingsStarting.map(avail => {
                      const job = getJobForAvailability(avail.job_id);
                      const duration = getBookingDuration(avail);
                      const isPrivate = job?.client_type !== 'virksomhed';
                      
                      return (
                        <div
                          key={avail.id}
                          className={cn(
                            "absolute left-1 right-1 rounded-md p-1.5 overflow-hidden cursor-pointer transition-shadow hover:shadow-md z-10",
                            "border-l-4",
                            isPrivate 
                              ? "bg-amber-50 border-l-amber-400" 
                              : "bg-blue-50 border-l-blue-400"
                          )}
                          style={{ 
                            height: `${Math.max(duration * 48 - 4, 44)}px`,
                            top: '2px'
                          }}
                        >
                          <div className="text-[10px] font-semibold text-muted-foreground">
                            {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 text-foreground/70" />
                            <span className="text-xs font-medium truncate">
                              {job?.client_name || 'Kunde'}
                            </span>
                            {isPrivate ? (
                              <Badge variant="outline" className="h-4 text-[9px] px-1 bg-amber-100 border-amber-300 text-amber-700">ny</Badge>
                            ) : (
                              <Badge variant="outline" className="h-4 text-[9px] px-1 bg-blue-100 border-blue-300 text-blue-700">B2B</Badge>
                            )}
                          </div>
                          {duration > 1 && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {job?.service_type || job?.title || 'Service'}
                            </div>
                          )}
                          {duration > 1.5 && job?.location && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground truncate">{job.location}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
          <div className="w-4 h-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,hsl(var(--muted))_2px,hsl(var(--muted))_4px)] rounded-sm border" />
          <span className="text-muted-foreground">Ikke tilgængelig</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-background border rounded-sm" />
          <span className="text-muted-foreground">Ledig</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;
