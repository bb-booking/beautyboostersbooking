import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { da } from "date-fns/locale";
import { 
  Calendar as CalendarIcon,
  Search, 
  Filter,
  Users,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Coffee,
  Grid,
  List,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BoosterProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  is_available: boolean;
}

interface BoosterAvailability {
  id: string;
  booster_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'busy' | 'vacation' | 'sick';
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
}

const AdminCalendar = () => {
  const [boosters, setBoosters] = useState<BoosterProfile[]>([]);
  const [availability, setAvailability] = useState<BoosterAvailability[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View controls
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const locations = ["København", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Horsens"];

  useEffect(() => {
    fetchBoosters();
    fetchAvailability();
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
      } else if (viewMode === 'week') {
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
        endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
      } else {
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      }

      const { data, error } = await supabase
        .from('booster_availability')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (error) throw error;
      setAvailability((data || []).map(item => ({
        ...item,
        status: item.status as 'available' | 'busy' | 'vacation' | 'sick'
      })));
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Fejl ved hentning af tilgængelighed');
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, client_name, location, date_needed, time_needed')
        .in('status', ['assigned', 'in_progress']);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const filteredBoosters = boosters.filter(booster => {
    const matchesSearch = booster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booster.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = locationFilter === "all" || booster.location === locationFilter;
    const matchesSpecialty = specialtyFilter === "all" || booster.specialties.includes(specialtyFilter);
    const matchesSelected = !showOnlySelected || selectedBoosters.includes(booster.id);
    
    return matchesSearch && matchesLocation && matchesSpecialty && matchesSelected;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-red-100 text-red-800 border-red-200';
      case 'vacation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sick': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-3 w-3" />;
      case 'busy': return <XCircle className="h-3 w-3" />;
      case 'vacation': return <Coffee className="h-3 w-3" />;
      case 'sick': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Tilgængelig';
      case 'busy': return 'Optaget';
      case 'vacation': return 'Ferie';
      case 'sick': return 'Syg';
      default: return status;
    }
  };

  const getBoosterAvailabilityForDate = (boosterId: string, date: Date) => {
    return availability.filter(a => 
      a.booster_id === boosterId && 
      isSameDay(new Date(a.date), date)
    );
  };

  const getJobForAvailability = (jobId?: string) => {
    return jobId ? jobs.find(j => j.id === jobId) : null;
  };

  const toggleBoosterSelection = (boosterId: string) => {
    setSelectedBoosters(prev => 
      prev.includes(boosterId) 
        ? prev.filter(id => id !== boosterId)
        : [...prev, boosterId]
    );
  };

  const selectAllVisible = () => {
    setSelectedBoosters(filteredBoosters.map(b => b.id));
  };

  const clearSelection = () => {
    setSelectedBoosters([]);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30;
    setSelectedDate(prev => addDays(prev, direction === 'next' ? days : -days));
  };

  const getDaysToShow = () => {
    if (viewMode === 'day') {
      return [selectedDate];
    } else if (viewMode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      });
    } else {
      // Show entire month
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      return eachDayOfInterval({
        start: startOfMonth,
        end: endOfMonth
      });
    }
  };

  const getUniqueSpecialties = () => {
    const allSpecialties = boosters.flatMap(b => b.specialties);
    return [...new Set(allSpecialties)];
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 21) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isTimeInSlot = (slotTime: string, startTime: string, endTime: string) => {
    const slotMinutes = timeToMinutes(slotTime);
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Kalender Oversigt</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const daysToShow = getDaysToShow();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kalender Oversigt</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {filteredBoosters.length} boosters
          </Badge>
          {selectedBoosters.length > 0 && (
            <Badge>
              {selectedBoosters.length} valgt
            </Badge>
          )}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/20 rounded-lg">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søg boosters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Navigation */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-56">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {viewMode === 'day' 
                  ? format(selectedDate, 'dd/MM/yyyy', { locale: da })
                  : viewMode === 'week' 
                  ? `Uge ${format(selectedDate, 'w', { locale: da })} - ${format(selectedDate, 'yyyy')}`
                  : format(selectedDate, 'MMMM yyyy', { locale: da })
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Dag
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Uge
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Måned
          </Button>
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={layoutMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLayoutMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={layoutMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLayoutMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Lokation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle lokationer</SelectItem>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Speciale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle specialer</SelectItem>
            {getUniqueSpecialties().map(specialty => (
              <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showOnlySelected"
            checked={showOnlySelected}
            onCheckedChange={(checked) => setShowOnlySelected(!!checked)}
          />
          <Label htmlFor="showOnlySelected" className="text-sm">
            Vis kun valgte
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={selectAllVisible}>
            Vælg alle synlige
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Ryd valg
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlySelected(!showOnlySelected)}
          >
            {showOnlySelected ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'day' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${filteredBoosters.length}, minmax(150px, 1fr))` }}>
                  {/* Header Row */}
                  <div className="p-3 font-medium border-b border-r bg-muted sticky left-0 z-20">
                    Tid
                  </div>
                  {filteredBoosters.map(booster => (
                    <div key={booster.id} className="p-3 border-b border-r bg-muted">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedBoosters.includes(booster.id)}
                          onCheckedChange={() => toggleBoosterSelection(booster.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{booster.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booster.location}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Time Rows */}
                  {getTimeSlots().map(timeSlot => (
                    <>
                      <div key={`time-${timeSlot}`} className="p-2 border-b border-r text-sm font-medium bg-muted/50 sticky left-0 z-10">
                        {timeSlot}
                      </div>
                      {filteredBoosters.map(booster => {
                        const dayAvailability = getBoosterAvailabilityForDate(booster.id, selectedDate);
                        const slotAvailability = dayAvailability.find(avail => 
                          isTimeInSlot(timeSlot, avail.start_time, avail.end_time)
                        );
                        
                        return (
                          <div key={`${booster.id}-${timeSlot}`} className="p-2 border-b border-r min-h-12">
                            {slotAvailability && isTimeInSlot(timeSlot, slotAvailability.start_time, slotAvailability.end_time) && (
                              timeSlot === slotAvailability.start_time.slice(0, 5) ? (
                                <div className="text-xs">
                                  <Badge 
                                    className={`w-full ${getStatusColor(slotAvailability.status)} flex items-center gap-1 mb-1`}
                                  >
                                    {getStatusIcon(slotAvailability.status)}
                                    <span className="truncate">
                                      {slotAvailability.start_time.slice(0, 5)}-{slotAvailability.end_time.slice(0, 5)}
                                    </span>
                                  </Badge>
                                  {slotAvailability.job_id && (
                                    (() => {
                                      const job = getJobForAvailability(slotAvailability.job_id);
                                      return job ? (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          <div className="font-medium truncate">{job.title}</div>
                                          {job.client_name && (
                                            <div className="truncate">{job.client_name}</div>
                                          )}
                                          <div className="flex items-center gap-1 truncate">
                                            <MapPin className="h-3 w-3" />
                                            {job.location}
                                          </div>
                                        </div>
                                      ) : null;
                                    })()
                                  )}
                                  {slotAvailability.notes && (
                                    <div className="text-xs text-muted-foreground mt-1 truncate">
                                      {slotAvailability.notes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className={`h-full ${getStatusColor(slotAvailability.status)} opacity-30`}></div>
                              )
                            )}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Date Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: `150px repeat(${daysToShow.length}, 1fr)` }} className="gap-2">
            <div className="p-3 font-medium bg-muted rounded">Booster</div>
            {daysToShow.map(day => (
              <div key={day.toISOString()} className="p-3 text-center bg-muted rounded">
                <div className="font-medium">{format(day, 'EEE', { locale: da })}</div>
                <div className="text-sm text-muted-foreground">{format(day, 'd/M')}</div>
              </div>
            ))}
          </div>

          {/* Booster Rows */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredBoosters.map(booster => (
              <Card key={booster.id} className={`${selectedBoosters.includes(booster.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                <CardContent className="p-0">
                  <div style={{ display: 'grid', gridTemplateColumns: `150px repeat(${daysToShow.length}, 1fr)` }} className="gap-2 p-2">
                    {/* Booster Info */}
                    <div className="p-3 border rounded bg-background">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedBoosters.includes(booster.id)}
                          onCheckedChange={() => toggleBoosterSelection(booster.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{booster.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booster.location}
                          </div>
                          <Badge 
                            className={`text-xs mt-1 ${booster.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {booster.is_available ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Daily Availability */}
                    {daysToShow.map(day => {
                      const dayAvailability = getBoosterAvailabilityForDate(booster.id, day);
                      
                      return (
                        <div key={day.toISOString()} className="p-2 min-h-20 border rounded bg-background">
                          {dayAvailability.length > 0 ? (
                            <div className="space-y-1">
                              {dayAvailability.map(avail => {
                                const job = getJobForAvailability(avail.job_id);
                                return (
                                  <div key={avail.id} className="text-xs">
                                    <Badge 
                                      className={`w-full text-xs ${getStatusColor(avail.status)} flex items-center gap-1`}
                                    >
                                      {getStatusIcon(avail.status)}
                                      <span className="truncate">
                                        {avail.start_time.slice(0, 5)}-{avail.end_time.slice(0, 5)}
                                      </span>
                                    </Badge>
                                    {job && (
                                      <div className="mt-1 text-muted-foreground">
                                        <div className="font-medium truncate">{job.title}</div>
                                        {job.client_name && (
                                          <div className="truncate">{job.client_name}</div>
                                        )}
                                      </div>
                                    )}
                                    {avail.notes && (
                                      <div className="text-muted-foreground truncate">{avail.notes}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-center py-3">
                              Ingen data
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status Forklaring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('available')}>
                {getStatusIcon('available')}
                Tilgængelig
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('busy')}>
                {getStatusIcon('busy')}
                Optaget
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('vacation')}>
                {getStatusIcon('vacation')}
                Ferie
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor('sick')}>
                {getStatusIcon('sick')}
                Syg
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredBoosters.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Ingen boosters fundet</h3>
            <p className="text-muted-foreground">
              Ingen boosters matcher dine søgekriterier
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminCalendar;