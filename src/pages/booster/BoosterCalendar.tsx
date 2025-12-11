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
  Navigation, Copy, ExternalLink, Send, ImagePlus, HandHelping
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  team_boosters?: string[];
}

type View = "day" | "week" | "month";

const parseNotes = (e: BoosterEvent): EventMeta => { 
  try { return e.notes ? JSON.parse(e.notes) : {}; } 
  catch { return {}; } 
};

const MOCK_EVENTS: Omit<BoosterEvent, 'id'>[] = [
  // Monday (start of week)
  { date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 0), 'yyyy-MM-dd'), start_time: '09:00:00', end_time: '11:00:00', status: 'booked', notes: JSON.stringify({ service: 'Bryllup makeup', customer_name: 'Emma Larsen', customer_phone: '+45 23456789', customer_email: 'emma@email.dk', address: 'Østerbrogade 55, København', client_type: 'privat', people_count: 2, price: 1899, team_boosters: [] }) },
  { date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 0), 'yyyy-MM-dd'), start_time: '13:00:00', end_time: '15:00:00', status: 'booked', notes: JSON.stringify({ service: 'Makeup styling', customer_name: 'Laura Nielsen', customer_phone: '+45 34567890', customer_email: 'laura@email.dk', address: 'Frederiksberg Allé 12', client_type: 'privat', people_count: 1, price: 799, team_boosters: [] }) },
  
  // Tuesday
  { date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), 'yyyy-MM-dd'), start_time: '08:00:00', end_time: '12:00:00', status: 'booked', notes: JSON.stringify({ service: 'Film-produktion', customer_name: 'Zentropa', customer_phone: '+45 44556677', customer_email: 'booking@zentropa.dk', address: 'Filmbyen, Hvidovre', client_type: 'virksomhed', company_name: 'Zentropa Productions', people_count: 6, price: 9500, team_boosters: ['Katrine J.', 'Fay'] }) },
  { date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 1), 'yyyy-MM-dd'), start_time: '14:00:00', end_time: '16:00:00', status: 'booked', notes: JSON.stringify({ service: 'Hårstyling', customer_name: 'Sofie Hansen', customer_phone: '+45 55667788', customer_email: 'sofie@email.dk', address: 'Amagerbrogade 200', client_type: 'privat', people_count: 1, price: 649, team_boosters: [] }) },
  
  // Wednesday
  { date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 2), 'yyyy-MM-dd'), start_time: '10:00:00', end_time: '13:00:00', status: 'booked', notes: JSON.stringify({ service: 'Event makeup', customer_name: 'Novo Nordisk', customer_phone: '+45 66778899', customer_email: 'events@novo.dk', address: 'Novo Nordisk Park, Bagsværd', client_type: 'virksomhed', company_name: 'Novo Nordisk A/S', people_count: 12, price: 15000, team_boosters: ['Josephine O.', 'Nanna', 'Tenna'] }) },
  
  // Thursday (today if it's Thursday, or upcoming)
  { date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00:00', end_time: '11:00:00', status: 'booked', notes: JSON.stringify({ service: 'Bryllup makeup', customer_name: 'Sarah Jensen', customer_phone: '+45 12345678', customer_email: 'sarah@email.dk', address: 'Vesterbrogade 45, København', client_type: 'privat', people_count: 3, price: 2499, team_boosters: [] }) },
  { date: format(new Date(), 'yyyy-MM-dd'), start_time: '14:00:00', end_time: '16:00:00', status: 'booked', notes: JSON.stringify({ service: 'Event makeup', customer_name: 'Copenhagen Events', customer_phone: '+45 33221100', customer_email: 'kontakt@cphevents.dk', address: 'Bella Center, København', client_type: 'virksomhed', company_name: 'Copenhagen Events ApS', people_count: 8, price: 12500, team_boosters: ['Josephine O.', 'Katrine J.'] }) },
  
  // Friday
  { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), start_time: '10:00:00', end_time: '12:00:00', status: 'booked', notes: JSON.stringify({ service: 'Makeup styling', customer_name: 'Marie Andersen', customer_phone: '+45 87654321', customer_email: 'marie@email.dk', address: 'Nørrebrogade 100, København', client_type: 'privat', people_count: 1, price: 899, team_boosters: [] }) },
  { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), start_time: '15:00:00', end_time: '17:00:00', status: 'booked', notes: JSON.stringify({ service: 'Teater makeup', customer_name: 'Det Kongelige Teater', customer_phone: '+45 77889900', customer_email: 'makeup@kglteater.dk', address: 'Kongens Nytorv 1', client_type: 'virksomhed', company_name: 'Det Kongelige Teater', people_count: 4, price: 5200, team_boosters: ['Fay'] }) },
  
  // Saturday
  { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), start_time: '08:00:00', end_time: '12:00:00', status: 'booked', notes: JSON.stringify({ service: 'TV-produktion', customer_name: 'DR Studios', customer_phone: '+45 11223344', customer_email: 'booking@dr.dk', address: 'DR Byen, Emil Holms Kanal 20', client_type: 'virksomhed', company_name: 'Danmarks Radio', people_count: 5, price: 8500, team_boosters: ['Fay', 'Nanna'] }) },
  { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), start_time: '14:00:00', end_time: '16:00:00', status: 'booked', notes: JSON.stringify({ service: 'Bryllup makeup', customer_name: 'Anna Christensen', customer_phone: '+45 99887766', customer_email: 'anna@email.dk', address: 'Dyrehaven, Klampenborg', client_type: 'privat', people_count: 4, price: 3299, team_boosters: ['Katrine J.'] }) },
  
  // Sunday - blocked
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEvent, setChatEvent] = useState<BoosterEvent | null>(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [releasing, setReleasing] = useState(false);
  
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
    let start: Date, end: Date;
    
    if (v === "day") {
      start = startOfDay(baseDate);
      end = addDays(start, 1);
    } else if (v === "week") {
      start = startOfWeek(baseDate, { weekStartsOn: 1 });
      end = addDays(start, 7);
    } else {
      // Month view
      start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    }
    
    const { data, error } = await supabase
      .from("booster_availability")
      .select("id,date,start_time,end_time,status,notes")
      .eq("booster_id", uid)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lte("date", format(end, "yyyy-MM-dd"))
      .order("date")
      .order("start_time");
      
    if (!error && data) {
      const mockWithIds = MOCK_EVENTS.map((e, i) => ({ ...e, id: `mock-${i}` }));
      const allEvents = [...(data as BoosterEvent[]), ...mockWithIds.filter(me => 
        me.date >= format(start, "yyyy-MM-dd") && me.date <= format(end, "yyyy-MM-dd")
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
    if (view === "week") {
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      return Array.from({ length: 7 }).map((_, i) => addDays(monday, i));
    }
    // Month view - return all days of the month
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return Array.from({ length: endOfMonth.getDate() }).map((_, i) => addDays(startOfMonth, i));
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
    if (view === "day") {
      setDate(addDays(date, direction));
    } else if (view === "week") {
      setDate(addDays(date, direction * 7));
    } else {
      // Month view
      setDate(new Date(date.getFullYear(), date.getMonth() + direction, 1));
    }
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

  const handleReleaseJob = async () => {
    if (!selectedEvent || !userId) return;
    
    setReleasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-job', {
        body: {
          bookingId: selectedEvent.id,
          boosterId: userId,
          reason: releaseReason
        }
      });

      if (error) throw error;

      toast.success('Job frigivet', {
        description: 'Jobbet er nu tilgængeligt for andre boosters'
      });
      
      setReleaseDialogOpen(false);
      setSelectedEvent(null);
      setReleaseReason('');
      await fetchEvents(userId, date, view);
    } catch (error: any) {
      console.error('Error releasing job:', error);
      toast.error(error.message || 'Kunne ikke frigive job');
    } finally {
      setReleasing(false);
    }
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
                : view === "week"
                ? `${format(days[0], "d. MMM", { locale: da })} - ${format(days[days.length - 1], "d. MMM", { locale: da })}`
                : format(date, "MMMM yyyy", { locale: da })
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
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("month")}
            className="flex-1"
          >
            Måned
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
        ) : view === "week" ? (
          <WeekView
            days={days}
            events={events}
            parseNotes={parseNotes}
            onSelectDay={(d) => { setDate(d); setView("day"); }}
            onSelectEvent={setSelectedEvent}
          />
        ) : (
          <MonthView
            date={date}
            events={events}
            parseNotes={parseNotes}
            onSelectDay={(d) => { setDate(d); setView("day"); }}
          />
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent && !chatOpen} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedEvent && <EventDetail 
            event={selectedEvent}
            parseNotes={parseNotes}
            onOpenMaps={openGoogleMaps}
            onCopy={copyToClipboard}
            onClose={() => setSelectedEvent(null)}
            onOpenChat={() => { 
              setChatEvent(selectedEvent);
              setChatOpen(true);
            }}
            onOpenGroupChat={() => {
              toast.info("Gruppechat oprettes...");
              setSelectedEvent(null);
              navigate('/booster/messages');
            }}
            onReleaseJob={() => setReleaseDialogOpen(true)}
          />}
        </DialogContent>
      </Dialog>

      {/* Customer Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={(o) => { setChatOpen(o); if (!o) setChatEvent(null); }}>
        <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
          {chatEvent && <CustomerChatDialog 
            event={chatEvent}
            parseNotes={parseNotes}
            onClose={() => { setChatOpen(false); setChatEvent(null); }}
          />}
        </DialogContent>
      </Dialog>

      {/* Release Job Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Frigiv job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Er du sikker på at du vil frigive dette job? Det vil blive tilbudt til andre boosters.
            </p>
            {selectedEvent && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{parseNotes(selectedEvent).service || 'Booking'}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedEvent.date), 'EEEE d. MMMM', { locale: da })} kl. {selectedEvent.start_time.slice(0, 5)}
                </p>
              </div>
            )}
            <div>
              <Label>Årsag til frigivelse</Label>
              <Textarea
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                placeholder="Beskriv hvorfor du frigiver jobbet..."
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setReleaseDialogOpen(false); setReleaseReason(''); }} className="flex-1">
                Annuller
              </Button>
              <Button onClick={handleReleaseJob} disabled={releasing} variant="destructive" className="flex-1">
                <HandHelping className="h-4 w-4 mr-2" />
                Frigiv
              </Button>
            </div>
          </div>
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

// Helper function to convert time to minutes
const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Generate time slots from 07:00 to 21:00 in 30-min intervals
const TIME_SLOTS = Array.from({ length: 29 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const mins = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${mins}`;
});

// Day View Component - iPhone-style Time Grid
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

  // Check if a time slot is occupied by an event (but not the starting slot)
  const isSlotOccupied = (timeSlot: string) => {
    const slotMinutes = timeToMinutes(timeSlot);
    return bookedEvents.some(event => {
      const startMinutes = timeToMinutes(event.start_time.slice(0, 5));
      const endMinutes = timeToMinutes(event.end_time.slice(0, 5));
      return slotMinutes > startMinutes && slotMinutes < endMinutes;
    });
  };

  // Get events that start at a specific time slot
  const getEventsStartingAt = (timeSlot: string) => {
    return bookedEvents.filter(event => event.start_time.slice(0, 5) === timeSlot);
  };

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

  return (
    <div className="flex-1 flex flex-col">
      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex bg-card rounded-lg border overflow-hidden">
          {/* Time Labels Column */}
          <div className="w-14 shrink-0 border-r bg-muted/20">
            {TIME_SLOTS.map((timeSlot, idx) => (
              <div 
                key={timeSlot}
                className={`h-12 flex items-start justify-end pr-2 text-xs text-muted-foreground pt-0.5 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}
              >
                {idx % 2 === 0 ? timeSlot : ''}
              </div>
            ))}
          </div>

          {/* Events Column */}
          <div className="flex-1 relative">
            {TIME_SLOTS.map((timeSlot, idx) => {
              const eventsStarting = getEventsStartingAt(timeSlot);
              const occupied = isSlotOccupied(timeSlot);

              return (
                <div 
                  key={timeSlot}
                  className={`h-12 relative border-b border-border/20 ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}
                >
                  {/* Occupied slot overlay */}
                  {occupied && eventsStarting.length === 0 && (
                    <div className="absolute inset-0 bg-muted/10" />
                  )}

                  {/* Events starting at this slot */}
                  {eventsStarting.map((event) => {
                    const meta = parseNotes(event);
                    const isVirksomhed = meta.client_type === 'virksomhed';
                    const startMinutes = timeToMinutes(event.start_time.slice(0, 5));
                    const endMinutes = timeToMinutes(event.end_time.slice(0, 5));
                    const durationSlots = (endMinutes - startMinutes) / 30;
                    const height = Math.max(durationSlots * 48 - 4, 44); // 48px per slot (h-12)

                    const isTeamTask = meta.team_boosters && meta.team_boosters.length > 0;

                    return (
                      <div
                        key={event.id}
                        className={`absolute left-2 right-2 top-0.5 rounded-lg overflow-hidden cursor-pointer 
                          transition-shadow hover:shadow-lg active:scale-[0.99] z-10 border-l-4 shadow-sm
                          ${isVirksomhed ? 'bg-purple-50 border-l-purple-400' : 'bg-pink-50 border-l-pink-400'}`}
                        style={{ height: `${height}px` }}
                        onClick={() => onSelectEvent(event)}
                      >
                        <div className="p-2.5 h-full flex flex-col">
                          {/* Time + Team Icon */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
                            </div>
                            {isTeamTask && (
                              <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                <Users className="h-3 w-3" />
                                <span className="text-[10px] font-medium">{(meta.team_boosters?.length || 0) + 1}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Customer Name / Company */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isVirksomhed ? (
                              <Building2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-foreground/70 shrink-0" />
                            )}
                            <span className="font-semibold truncate text-foreground">
                              {isVirksomhed ? (meta.company_name || meta.customer_name) : meta.customer_name || 'Kunde'}
                            </span>
                          </div>
                          
                          {/* Service Type */}
                          {durationSlots >= 1.5 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <span className="truncate font-medium">{meta.service || 'Booking'}</span>
                            </div>
                          )}
                          
                          {/* Address */}
                          {durationSlots >= 2.5 && meta.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{meta.address.split(',')[0]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Block day button */}
      <div className="p-3 border-t bg-background">
        <Button variant="outline" onClick={onBlockDay} className="w-full" size="sm">
          <Ban className="h-4 w-4 mr-2" />
          Bloker dag
        </Button>
      </div>
    </div>
  );
}

// Week View Component - Horizontal Time Grid
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

  // Time slots for week view (only hourly for compact display)
  const WEEK_TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getEventsAtHour = (d: Date, hour: string) => {
    const dayEvents = getDayEvents(d).filter(e => e.status === 'booked');
    const hourMinutes = timeToMinutes(hour);
    return dayEvents.filter(event => {
      const startMinutes = timeToMinutes(event.start_time.slice(0, 5));
      return startMinutes >= hourMinutes && startMinutes < hourMinutes + 60;
    });
  };

  const isHourOccupied = (d: Date, hour: string) => {
    const dayEvents = getDayEvents(d).filter(e => e.status === 'booked');
    const hourMinutes = timeToMinutes(hour);
    return dayEvents.some(event => {
      const startMinutes = timeToMinutes(event.start_time.slice(0, 5));
      const endMinutes = timeToMinutes(event.end_time.slice(0, 5));
      return hourMinutes > startMinutes && hourMinutes < endMinutes;
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Days Header */}
      <div className="flex border-b bg-muted/20 shrink-0">
        <div className="w-12 shrink-0 border-r" />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <button
              key={format(day, 'yyyy-MM-dd')}
              className={`flex-1 py-2 text-center border-r hover:bg-muted/30 transition-colors ${today ? 'bg-primary/10' : ''}`}
              onClick={() => onSelectDay(day)}
            >
              <div className="text-[10px] text-muted-foreground uppercase">
                {format(day, 'EEE', { locale: da })}
              </div>
              <div className={`text-sm font-semibold ${today ? 'text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Time Labels Column */}
          <div className="w-12 shrink-0 border-r bg-muted/10">
            {WEEK_TIME_SLOTS.map((timeSlot) => (
              <div 
                key={timeSlot}
                className="h-14 flex items-start justify-end pr-1.5 text-[10px] text-muted-foreground pt-0.5"
              >
                {timeSlot}
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {days.map((day) => {
            const today = isToday(day);
            
            return (
              <div 
                key={format(day, 'yyyy-MM-dd')} 
                className={`flex-1 min-w-0 border-r ${today ? 'bg-primary/5' : ''}`}
              >
                {WEEK_TIME_SLOTS.map((timeSlot, idx) => {
                  const eventsAtHour = getEventsAtHour(day, timeSlot);
                  const occupied = isHourOccupied(day, timeSlot);

                  return (
                    <div 
                      key={timeSlot}
                      className={`h-14 relative border-b border-border/20 ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}
                      onClick={() => onSelectDay(day)}
                    >
                      {/* Occupied slot overlay */}
                      {occupied && eventsAtHour.length === 0 && (
                        <div className="absolute inset-0 bg-muted/15" />
                      )}

                      {/* Events */}
                      {eventsAtHour.slice(0, 1).map((event) => {
                        const meta = parseNotes(event);
                        const isVirksomhed = meta.client_type === 'virksomhed';
                        const startMinutes = timeToMinutes(event.start_time.slice(0, 5));
                        const endMinutes = timeToMinutes(event.end_time.slice(0, 5));
                        const durationHours = (endMinutes - startMinutes) / 60;
                        const height = Math.max(durationHours * 56 - 2, 52);

                          const isTeamTask = meta.team_boosters && meta.team_boosters.length > 0;

                          return (
                            <div
                              key={event.id}
                              className={`absolute left-0.5 right-0.5 top-0.5 rounded overflow-hidden cursor-pointer 
                                transition-shadow hover:shadow-md z-10 border-l-2
                                ${isVirksomhed ? 'bg-purple-50 border-l-purple-400' : 'bg-pink-50 border-l-pink-400'}`}
                              style={{ height: `${height}px` }}
                              onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                            >
                              <div className="p-1.5 h-full flex flex-col">
                                <div className="flex items-center justify-between">
                                  <div className="text-[9px] text-muted-foreground">
                                    {event.start_time.slice(0, 5)}
                                  </div>
                                  {isTeamTask && (
                                    <Users className="h-2.5 w-2.5 text-primary" />
                                  )}
                                </div>
                                <div className="text-[10px] font-semibold truncate text-foreground">
                                  {isVirksomhed ? (meta.company_name || meta.customer_name) : meta.customer_name || 'Kunde'}
                                </div>
                                <div className="text-[9px] text-muted-foreground truncate">
                                  {meta.service || 'Booking'}
                                </div>
                                {durationHours >= 2 && meta.address && (
                                  <div className="text-[8px] text-muted-foreground truncate flex items-center gap-0.5 mt-auto">
                                    <MapPin className="h-2 w-2 shrink-0" />
                                    {meta.address.split(',')[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* More events indicator */}
                        {eventsAtHour.length > 1 && (
                          <div className="absolute bottom-0.5 right-0.5 text-[8px] bg-muted px-1 rounded">
                            +{eventsAtHour.length - 1}
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
    </div>
  );
}

// Month View Component - Calendar Grid
function MonthView({
  date,
  events,
  parseNotes,
  onSelectDay
}: {
  date: Date;
  events: BoosterEvent[];
  parseNotes: (e: BoosterEvent) => EventMeta;
  onSelectDay: (d: Date) => void;
}) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay() - 1; // Monday = 0
  
  const getDayEvents = (d: Date) => 
    events.filter((e) => e.date === format(d, "yyyy-MM-dd"));

  // Create calendar grid
  const calendarDays: (Date | null)[] = [];
  
  // Add empty cells for days before the month starts
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    calendarDays.push(new Date(date.getFullYear(), date.getMonth(), i));
  }

  const weekDays = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn'];

  return (
    <div className="p-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const dayEvents = getDayEvents(day);
          const bookedCount = dayEvents.filter(e => e.status === 'booked').length;
          const isBlocked = dayEvents.some(e => e.status === 'blocked' && e.start_time === '07:00:00');
          const today = isToday(day);
          
          return (
            <button
              key={format(day, 'yyyy-MM-dd')}
              onClick={() => onSelectDay(day)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5
                transition-colors relative
                ${today ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                ${isBlocked ? 'bg-destructive/10' : ''}
              `}
            >
              <span className={`text-sm font-medium ${today ? '' : ''}`}>
                {format(day, 'd')}
              </span>
              {bookedCount > 0 && !isBlocked && (
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(bookedCount, 3) }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${today ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  ))}
                </div>
              )}
              {isBlocked && (
                <CalendarX className={`h-3 w-3 ${today ? 'text-primary-foreground' : 'text-destructive'}`} />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Bookinger</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarX className="h-3 w-3 text-destructive" />
          <span>Blokeret</span>
        </div>
      </div>
    </div>
  );
}

function EventDetail({
  event,
  parseNotes,
  onOpenMaps,
  onCopy,
  onClose,
  onOpenChat,
  onOpenGroupChat,
  onReleaseJob
}: {
  event: BoosterEvent;
  parseNotes: (e: BoosterEvent) => EventMeta;
  onOpenMaps: (address: string) => void;
  onCopy: (text: string, label: string) => void;
  onClose: () => void;
  onOpenChat: () => void;
  onOpenGroupChat: () => void;
  onReleaseJob: () => void;
}) {
  const meta = parseNotes(event);
  const isVirksomhed = meta.client_type === 'virksomhed';
  const hasTeam = meta.team_boosters && meta.team_boosters.length > 0;
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
            
            {meta.customer_email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate text-muted-foreground">
                    {meta.customer_email.replace(/(.{3}).*(@.*)/, '$1***$2')}
                  </span>
                </div>
              </div>
            )}

            {meta.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${meta.customer_phone}`} className="text-primary hover:underline">
                  {meta.customer_phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Team Boosters */}
        {hasTeam && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Team ({(meta.team_boosters?.length || 0) + 1} boosters)
            </h4>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">Team opgave</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-800">
                  Dig
                </Badge>
                {meta.team_boosters?.map((booster, idx) => (
                  <Badge key={idx} variant="outline">
                    {booster}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

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

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button variant="default" className="flex-1 gap-2" onClick={onOpenChat}>
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => onOpenMaps(meta.address as string || '')}>
              <Navigation className="h-4 w-4" />
              Navigation
            </Button>
          </div>
          {hasTeam && (
            <Button variant="secondary" className="w-full gap-2" onClick={onOpenGroupChat}>
              <Users className="h-4 w-4" />
              Opret gruppechat
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full gap-2 text-destructive hover:text-destructive"
            onClick={onReleaseJob}
          >
            <HandHelping className="h-4 w-4" />
            Frigiv job
          </Button>
        </div>
      </div>
    </>
  );
}

// Customer Chat Dialog Component
function CustomerChatDialog({
  event,
  parseNotes,
  onClose
}: {
  event: BoosterEvent;
  parseNotes: (e: BoosterEvent) => EventMeta;
  onClose: () => void;
}) {
  const meta = parseNotes(event);
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: 'booster' | 'customer';
    text: string;
    timestamp: Date;
    imageUrl?: string;
  }>>([
    {
      id: '1',
      sender: 'customer',
      text: `Hej! Jeg glæder mig til ${meta.service || 'bookingen'}. Er der noget jeg skal forberede?`,
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      sender: 'booster',
      text: 'Hej! Tak for din besked. Sørg gerne for ren hud uden makeup, så er vi klar til at starte.',
      timestamp: new Date(Date.now() - 3000000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      sender: 'booster' as const,
      text: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // TODO: Send message to backend
    console.log('Sending message to customer:', { eventId: event.id, message: newMessage });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      const message = {
        id: Date.now().toString(),
        sender: 'booster' as const,
        text: '',
        timestamp: new Date(),
        imageUrl: publicUrl
      };
      
      setMessages(prev => [...prev, message]);
      toast.success('Billede sendt');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Kunne ikke uploade billede');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <DialogHeader className="p-4 border-b">
        <DialogTitle className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {meta.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KU'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{meta.customer_name || 'Kunde'}</div>
            <div className="text-xs text-muted-foreground truncate">{meta.service}</div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {meta.customer_phone && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`tel:${meta.customer_phone}`}><Phone className="h-4 w-4" /></a>
              </Button>
            )}
            {meta.customer_email && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href={`mailto:${meta.customer_email}`}><Mail className="h-4 w-4" /></a>
              </Button>
            )}
          </div>
        </DialogTitle>
      </DialogHeader>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'booster' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender === 'booster'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                }`}
              >
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Vedhæftet billede" 
                    className="max-w-full rounded-lg mb-2 cursor-pointer"
                    onClick={() => window.open(msg.imageUrl, '_blank')}
                  />
                )}
                {msg.text && <p className="text-sm">{msg.text}</p>}
                <p className={`text-xs mt-1 ${msg.sender === 'booster' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {format(msg.timestamp, "HH:mm", { locale: da })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button 
            variant="outline" 
            size="icon" 
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Skriv en besked..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim() || uploading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
