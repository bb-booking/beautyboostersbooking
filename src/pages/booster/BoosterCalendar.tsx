import { useEffect, useMemo, useState, useRef, TouchEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isEqual, startOfDay, startOfWeek, isToday, isSameDay } from "date-fns";
import { da } from "date-fns/locale";
import { 
  Plus, User, Building2, Image, MapPin, Phone, Mail, Clock, 
  Trash2, X, Ban, CalendarX, Users, Edit, Calendar, 
  ChevronLeft, ChevronRight, RefreshCw, Settings, MessageCircle,
  Navigation, Copy, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface BoosterEvent {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  notes: string | null;
}

interface EventMeta {
  service?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  client_type?: string;
  company_name?: string;
  people_count?: number;
  price?: number;
  blocked?: boolean;
  reason?: string;
}

type View = "day" | "week";

const parseNotes = (e: BoosterEvent): EventMeta => { 
  try { return e.notes ? JSON.parse(e.notes) : {}; } 
  catch { return {}; } 
};

const MOCK_EVENTS: Omit<BoosterEvent, 'id'>[] = [
  { date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00:00', end_time: '11:00:00', status: 'booked', notes: JSON.stringify({ service: 'Bryllup makeup', customer_name: 'Sarah Jensen', customer_phone: '+45 12345678', customer_email: 'sarah@email.dk', address: 'Vesterbrogade 45, København', client_type: 'privat', people_count: 3, price: 2499 }) },
  { date: format(new Date(), 'yyyy-MM-dd'), start_time: '14:00:00', end_time: '16:00:00', status: 'booked', notes: JSON.stringify({ service: 'Event makeup', customer_name: 'Copenhagen Events', customer_phone: '+45 33221100', customer_email: 'kontakt@cphevents.dk', address: 'Bella Center, København', client_type: 'virksomhed', company_name: 'Copenhagen Events ApS', people_count: 8, price: 12500 }) },
  { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), start_time: '10:00:00', end_time: '12:00:00', status: 'booked', notes: JSON.stringify({ service: 'Makeup styling', customer_name: 'Marie Andersen', customer_phone: '+45 87654321', customer_email: 'marie@email.dk', address: 'Nørrebrogade 100, København', client_type: 'privat', people_count: 1, price: 899 }) },
  { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), start_time: '08:00:00', end_time: '12:00:00', status: 'booked', notes: JSON.stringify({ service: 'TV-produktion', customer_name: 'DR Studios', customer_phone: '+45 11223344', customer_email: 'booking@dr.dk', address: 'DR Byen, Emil Holms Kanal 20', client_type: 'virksomhed', company_name: 'Danmarks Radio', people_count: 5, price: 8500 }) },
  { date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), start_time: '07:00:00', end_time: '21:00:00', status: 'blocked', notes: JSON.stringify({ blocked: true, reason: 'Ferie' }) },
];

export default function BoosterCalendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("day");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [events, setEvents] = useState<BoosterEvent[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BoosterEvent | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDate, setBlockDate] = useState<Date | null>(null);
  const [blockReason, setBlockReason] = useState('');
  
  // Swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      await fetchEvents(session.user.id, date, view);
    };
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchEvents(userId, date, view);
  }, [userId, date, view]);

  const fetchEvents = async (uid: string, baseDate: Date, v: View) => {
    const start = v === "day" ? startOfDay(baseDate) : startOfWeek(baseDate, { weekStartsOn: 1 });
    const end = v === "day" ? addDays(start, 1) : addDays(start, 7);
    
    const { data, error } = await supabase
      .from("booster_availability")
      .select("id,date,start_time,end_time,status,notes")
      .eq("booster_id", uid)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lt("date", format(end, "yyyy-MM-dd"))
      .order("date")
      .order("start_time");
      
    if (!error && data) {
      const mockWithIds = MOCK_EVENTS.map((e, i) => ({ ...e, id: `mock-${i}` }));
      const allEvents = [...(data as BoosterEvent[]), ...mockWithIds.filter(me => 
        me.date >= format(start, "yyyy-MM-dd") && me.date < format(end, "yyyy-MM-dd")
      )];
      setEvents(allEvents);
    }
  };

  const getDayEvents = (d: Date) => 
    events
      .filter((e) => e.date === format(d, "yyyy-MM-dd"))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const days = useMemo(() => {
    if (view === "day") return [date];
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(monday, i));
  }, [date, view]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swipe left -> next day/week
        navigateDate(1);
      } else {
        // Swipe right -> previous day/week
        navigateDate(-1);
      }
    }
  };

  const navigateDate = (direction: number) => {
    const amount = view === "day" ? direction : direction * 7;
    setDate(addDays(date, amount));
  };

  const blockDay = async () => {
    if (!userId || !blockDate) return;
    const { error } = await supabase.from("booster_availability").insert({
      booster_id: userId,
      date: format(blockDate, "yyyy-MM-dd"),
      start_time: '07:00:00',
      end_time: '21:00:00',
      status: "blocked",
      notes: JSON.stringify({ blocked: true, reason: blockReason })
    });
    if (!error) {
      setBlockDialogOpen(false);
      setBlockReason('');
      await fetchEvents(userId, date, view);
      toast.success("Dag blokeret");
    }
  };

  const openGoogleMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopieret`);
  };

  return (
    <div className="h-full flex flex-col">
      <Helmet><title>Min kalender – Beauty Boosters</title></Helmet>
      
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Min kalender</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/booster/settings')}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Synk</span>
          </Button>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateDate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 text-center">
            <button 
              onClick={() => setDate(startOfDay(new Date()))}
              className="font-semibold text-lg hover:text-primary transition-colors"
            >
              {view === "day" 
                ? format(date, "EEE d. MMM", { locale: da })
                : `${format(days[0], "d. MMM", { locale: da })} - ${format(days[6], "d. MMM", { locale: da })}`
              }
            </button>
            {isToday(date) && view === "day" && (
              <Badge variant="secondary" className="ml-2 text-xs">I dag</Badge>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateDate(1)}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 mt-3">
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("day")}
            className="flex-1"
          >
            Dag
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("week")}
            className="flex-1"
          >
            Uge
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {view === "day" ? (
          <DayView 
            date={date}
            events={getDayEvents(date)}
            parseNotes={parseNotes}
            onSelectEvent={setSelectedEvent}
            onBlockDay={() => { setBlockDate(date); setBlockDialogOpen(true); }}
          />
        ) : (
          <WeekView
            days={days}
            events={events}
            parseNotes={parseNotes}
            onSelectDay={(d) => { setDate(d); setView("day"); }}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedEvent && <EventDetail 
            event={selectedEvent}
            parseNotes={parseNotes}
            onOpenMaps={openGoogleMaps}
            onCopy={copyToClipboard}
            onClose={() => setSelectedEvent(null)}
          />}
        </DialogContent>
      </Dialog>

      {/* Block Day Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bloker dag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {blockDate && format(blockDate, "EEEE d. MMMM", { locale: da })}
            </p>
            <div>
              <Label>Årsag (valgfrit)</Label>
              <Input 
                value={blockReason} 
                onChange={(e) => setBlockReason(e.target.value)} 
                placeholder="F.eks. Ferie, Syg..." 
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)} className="flex-1">
                Annuller
              </Button>
              <Button onClick={blockDay} className="flex-1">
                <Ban className="h-4 w-4 mr-1" /> Bloker
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Day View Component - Agenda Style
function DayView({ 
  date, 
  events, 
  parseNotes,
  onSelectEvent,
  onBlockDay
}: { 
  date: Date;
  events: BoosterEvent[];
  parseNotes: (e: BoosterEvent) => EventMeta;
  onSelectEvent: (e: BoosterEvent) => void;
  onBlockDay: () => void;
}) {
  const bookedEvents = events.filter(e => e.status === 'booked');
  const blockedEvents = events.filter(e => e.status === 'blocked');
  const isDayBlocked = blockedEvents.some(e => e.start_time === '07:00:00' && e.end_time === '21:00:00');

  if (isDayBlocked) {
    const blockMeta = parseNotes(blockedEvents[0]);
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <CalendarX className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Dag blokeret</h3>
        <p className="text-muted-foreground text-center">
          {blockMeta.reason || 'Ingen tilgængelige tider'}
        </p>
      </div>
    );
  }

  if (bookedEvents.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Ingen bookinger</h3>
        <p className="text-muted-foreground text-center mb-4">
          Du har ingen bookinger denne dag
        </p>
        <Button variant="outline" onClick={onBlockDay}>
          <Ban className="h-4 w-4 mr-2" />
          Bloker dag
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {bookedEvents.map((event) => {
        const meta = parseNotes(event);
        const isVirksomhed = meta.client_type === 'virksomhed';
        
        return (
          <Card 
            key={event.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
            onClick={() => onSelectEvent(event)}
          >
            <div className={`h-1.5 ${isVirksomhed ? 'bg-blue-500' : 'bg-amber-500'}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{event.start_time.slice(0, 5)}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-muted-foreground">{event.end_time.slice(0, 5)}</span>
                  </div>
                  <h3 className="font-medium text-lg truncate">{meta.service || 'Booking'}</h3>
                  <p className="text-muted-foreground truncate">{meta.customer_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={isVirksomhed ? "default" : "secondary"} className="mb-1">
                    {isVirksomhed ? 'B2B' : 'Privat'}
                  </Badge>
                  <p className="font-semibold text-primary">
                    {(meta.price || 0).toLocaleString('da-DK')} kr
                  </p>
                </div>
              </div>
              
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{meta.address || 'Ingen adresse'}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      <Button variant="outline" onClick={onBlockDay} className="w-full mt-4">
        <Ban className="h-4 w-4 mr-2" />
        Bloker resten af dagen
      </Button>
    </div>
  );
}

// Week View Component - Mini Calendar with Events
function WeekView({
  days,
  events,
  parseNotes,
  onSelectDay,
  onSelectEvent
}: {
  days: Date[];
  events: BoosterEvent[];
  parseNotes: (e: BoosterEvent) => EventMeta;
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: BoosterEvent) => void;
}) {
  const getDayEvents = (d: Date) => 
    events
      .filter((e) => e.date === format(d, "yyyy-MM-dd"))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="p-4 space-y-2">
      {days.map((day) => {
        const dayEvents = getDayEvents(day);
        const bookedEvents = dayEvents.filter(e => e.status === 'booked');
        const isDayBlocked = dayEvents.some(e => e.status === 'blocked' && e.start_time === '07:00:00');
        const today = isToday(day);
        
        return (
          <Card 
            key={format(day, 'yyyy-MM-dd')}
            className={`overflow-hidden ${today ? 'ring-2 ring-primary' : ''}`}
          >
            {/* Day Header */}
            <button 
              className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
              onClick={() => onSelectDay(day)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  today ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="text-left">
                  <p className="font-medium">{format(day, 'EEEE', { locale: da })}</p>
                  <p className="text-sm text-muted-foreground">{format(day, 'd. MMMM', { locale: da })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDayBlocked ? (
                  <Badge variant="destructive">Blokeret</Badge>
                ) : bookedEvents.length > 0 ? (
                  <Badge>{bookedEvents.length} booking{bookedEvents.length > 1 ? 's' : ''}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Ledig</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            
            {/* Events Preview */}
            {bookedEvents.length > 0 && (
              <div className="px-3 pb-3 space-y-2">
                {bookedEvents.slice(0, 2).map((event) => {
                  const meta = parseNotes(event);
                  return (
                    <button
                      key={event.id}
                      className="w-full p-2 rounded-lg bg-muted/50 text-left hover:bg-muted transition-colors flex items-center gap-3"
                      onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                    >
                      <div className={`w-1 h-10 rounded-full ${meta.client_type === 'virksomhed' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3" />
                          <span>{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
                        </div>
                        <p className="font-medium truncate">{meta.service || 'Booking'}</p>
                      </div>
                    </button>
                  );
                })}
                {bookedEvents.length > 2 && (
                  <button 
                    className="text-sm text-primary hover:underline pl-4"
                    onClick={() => onSelectDay(day)}
                  >
                    +{bookedEvents.length - 2} flere bookinger
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// Event Detail Component
function EventDetail({
  event,
  parseNotes,
  onOpenMaps,
  onCopy,
  onClose
}: {
  event: BoosterEvent;
  parseNotes: (e: BoosterEvent) => EventMeta;
  onOpenMaps: (address: string) => void;
  onCopy: (text: string, label: string) => void;
  onClose: () => void;
}) {
  const meta = parseNotes(event);
  const isVirksomhed = meta.client_type === 'virksomhed';
  const durationMins = (() => {
    const [sh, sm] = (event.start_time || '00:00:00').split(':').map(Number);
    const [eh, em] = (event.end_time || '00:00:00').split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationStr = mins > 0 ? `${hours}t ${mins}m` : `${hours} timer`;

  if (event.status === 'blocked') {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-destructive" />
            Blokeret
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            {meta.reason || 'Ingen årsag angivet'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {format(new Date(event.date), "EEEE d. MMMM yyyy", { locale: da })}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle className="text-xl">{meta.service || 'Booking'}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isVirksomhed ? "default" : "secondary"}>
                {isVirksomhed ? 'Virksomhed' : 'Privat'}
              </Badge>
            </div>
          </div>
          <p className="text-2xl font-bold text-primary">
            {(meta.price || 0).toLocaleString('da-DK')} kr
          </p>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Time & Date */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(event.date), "EEEE d. MMMM", { locale: da })} • {durationStr}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Kunde</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{meta.customer_name || 'Ikke angivet'}</span>
              </div>
            </div>
            
            {meta.company_name && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{meta.company_name}</span>
              </div>
            )}
            
            {meta.customer_phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${meta.customer_phone}`} className="hover:underline">
                    {meta.customer_phone}
                  </a>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8"
                  onClick={() => onCopy(meta.customer_phone as string, 'Telefon')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            {meta.customer_email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${meta.customer_email}`} className="hover:underline truncate">
                    {meta.customer_email}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        {meta.address && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Lokation</h4>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="break-words">{meta.address}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8"
                  onClick={() => onCopy(meta.address as string, 'Adresse')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8"
                  onClick={() => onOpenMaps(meta.address as string)}
                >
                  <Navigation className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Service Details */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Detaljer</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium">{meta.service || 'Ikke angivet'}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Personer</p>
              <p className="font-medium">{meta.people_count || 1}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 gap-2">
            <MessageCircle className="h-4 w-4" />
            Besked
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={() => onOpenMaps(meta.address as string || '')}>
            <Navigation className="h-4 w-4" />
            Navigation
          </Button>
        </div>
      </div>
    </>
  );
}
