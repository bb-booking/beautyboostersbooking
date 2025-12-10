import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, isEqual, startOfDay, startOfWeek } from "date-fns";
import { da } from "date-fns/locale";
import { Plus, User, Building2, Image, MapPin, Phone, Mail, Clock, Trash2, X, Ban, CalendarX, Users, Edit, Share2, Calendar, Tag, CreditCard, UsersRound, MessageCircle, ImagePlus, StickyNote, RefreshCw, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookingChatDialog } from "@/components/booking/BookingChatDialog";
import { ImageUploadDialog } from "@/components/booking/ImageUploadDialog";
import { AddServiceDialog } from "@/components/booking/AddServiceDialog";
import { toast } from "sonner";

interface BoosterEvent {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  notes: string | null;
}

type View = "day" | "week" | "month";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'privat' | 'virksomhed';
  company?: string;
}

type CreateForm = {
  service: string;
  duration: number;
  customer_type: 'new' | 'existing';
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  company_name: string;
  cvr: string;
  client_type: 'privat' | 'virksomhed';
  address: string;
  notes: string;
  look_images: string[];
};

const DEFAULT_FORM: CreateForm = {
  service: "",
  duration: 60,
  customer_type: 'new',
  customer_id: '',
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  company_name: "",
  cvr: "",
  client_type: 'privat',
  address: "",
  notes: "",
  look_images: [],
};

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Sarah Jensen', email: 'sarah@email.dk', phone: '+45 12345678', type: 'privat' },
  { id: '2', name: 'Marie Andersen', email: 'marie@email.dk', phone: '+45 87654321', type: 'privat' },
  { id: '3', name: 'Copenhagen Events', email: 'kontakt@cphevents.dk', phone: '+45 33221100', type: 'virksomhed', company: 'Copenhagen Events ApS' },
  { id: '4', name: 'DR Studios', email: 'booking@dr.dk', phone: '+45 11223344', type: 'virksomhed', company: 'Danmarks Radio' },
];

const MOCK_EVENTS: Omit<BoosterEvent, 'id'>[] = [
  { date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00:00', end_time: '11:00:00', status: 'booked', notes: JSON.stringify({ service: 'Bryllup makeup', customer_name: 'Sarah Jensen', customer_phone: '+45 12345678', customer_email: 'sarah@email.dk', address: 'Vesterbrogade 45, København', client_type: 'privat', people_count: 3, price: 2499, team_boosters: [] }) },
  { date: format(new Date(), 'yyyy-MM-dd'), start_time: '14:00:00', end_time: '16:00:00', status: 'booked', notes: JSON.stringify({ service: 'Event makeup', customer_name: 'Copenhagen Events', customer_phone: '+45 33221100', customer_email: 'kontakt@cphevents.dk', address: 'Bella Center, København', client_type: 'virksomhed', company_name: 'Copenhagen Events ApS', people_count: 8, price: 12500, team_boosters: ['Josephine O.', 'Katrine J.'] }) },
  { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), start_time: '10:00:00', end_time: '12:00:00', status: 'booked', notes: JSON.stringify({ service: 'Makeup styling', customer_name: 'Marie Andersen', customer_phone: '+45 87654321', customer_email: 'marie@email.dk', address: 'Nørrebrogade 100, København', client_type: 'privat', people_count: 1, price: 899, team_boosters: [] }) },
  { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), start_time: '08:00:00', end_time: '12:00:00', status: 'booked', notes: JSON.stringify({ service: 'TV-produktion', customer_name: 'DR Studios', customer_phone: '+45 11223344', customer_email: 'booking@dr.dk', address: 'DR Byen, Emil Holms Kanal 20, København', client_type: 'virksomhed', company_name: 'Danmarks Radio', people_count: 5, price: 8500, team_boosters: ['Fay'] }) },
  { date: format(addDays(new Date(), 3), 'yyyy-MM-dd'), start_time: '07:00:00', end_time: '21:00:00', status: 'blocked', notes: JSON.stringify({ blocked: true, reason: 'Ferie' }) },
];

const parseEventNotes = (e: BoosterEvent): Record<string, unknown> => {
  try { return e.notes ? JSON.parse(e.notes) : {}; } catch { return {}; }
};

const getBlockedDates = (events: BoosterEvent[]): Set<string> => {
  const blocked = new Set<string>();
  events.forEach(e => {
    if (e.status === 'blocked') {
      const meta = parseEventNotes(e);
      if (meta.blocked && e.start_time === '07:00:00' && e.end_time === '21:00:00') {
        blocked.add(e.date);
      }
    }
  });
  return blocked;
};

export default function BoosterCalendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [events, setEvents] = useState<BoosterEvent[]>([]);
  const [openSlot, setOpenSlot] = useState<{ day: Date; time: string } | null>(null);
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BoosterEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CreateForm>(DEFAULT_FORM);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockType, setBlockType] = useState<'time' | 'day'>('time');
  const [blockDate, setBlockDate] = useState<Date | null>(null);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('17:00');
  const [blockReason, setBlockReason] = useState('');
  const [cvrLoading, setCvrLoading] = useState(false);
  const [cvrError, setCvrError] = useState<string | null>(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [currentBookingImages, setCurrentBookingImages] = useState<string[]>([]);
  const [currentBookingServices, setCurrentBookingServices] = useState<any[]>([]);

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
    const start = v === "day" ? startOfDay(baseDate) : v === "week" ? startOfWeek(baseDate, { weekStartsOn: 1 }) : new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const end = v === "day" ? addDays(start, 1) : v === "week" ? addDays(start, 7) : new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    const { data, error } = await supabase.from("booster_availability").select("id,date,start_time,end_time,status,notes").eq("booster_id", uid).gte("date", format(start, "yyyy-MM-dd")).lt("date", format(end, "yyyy-MM-dd")).order("date").order("start_time");
    if (!error && data) {
      const mockWithIds = MOCK_EVENTS.map((e, i) => ({ ...e, id: `mock-${i}` }));
      const allEvents = [...(data as BoosterEvent[]), ...mockWithIds.filter(me => me.date >= format(start, "yyyy-MM-dd") && me.date < format(end, "yyyy-MM-dd"))];
      setEvents(allEvents);
    }
  };

  const times = useMemo(() => {
    const arr: string[] = [];
    for (let h = 7; h <= 21; h++) {
      arr.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 21) arr.push(`${String(h).padStart(2, "0")}:30`);
    }
    return arr;
  }, []);

  const days = useMemo(() => {
    if (view === "day") return [date];
    if (view === "week") {
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      return Array.from({ length: 7 }).map((_, i) => addDays(monday, i));
    }
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return Array.from({ length: endOfMonth.getDate() }).map((_, i) => addDays(startOfMonth, i));
  }, [date, view]);

  const getDayEvents = (d: Date) => events.filter((e) => e.date === format(d, "yyyy-MM-dd"));
  const timeToMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const minutesToTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}:00`;

  const slotIsBooked = (d: Date, time: string) => {
    const key = format(d, "yyyy-MM-dd");
    const minutes = timeToMinutes(time + ":00");
    return events.some((e) => e.date === key && minutes >= timeToMinutes(e.start_time) && minutes < timeToMinutes(e.end_time));
  };

  const hasOverlap = (d: Date, startTime: string, durationMin: number) => {
    const sNew = timeToMinutes(startTime + ":00");
    const eNew = sNew + durationMin;
    return getDayEvents(d).some((e) => { const s = timeToMinutes(e.start_time); const en = timeToMinutes(e.end_time); return s < eNew && sNew < en; });
  };

  const handleSelectCustomer = (customerId: string) => {
    const customer = MOCK_CUSTOMERS.find(c => c.id === customerId);
    if (customer) setForm(f => ({ ...f, customer_id: customerId, customer_name: customer.name, customer_email: customer.email, customer_phone: customer.phone, client_type: customer.type, company_name: customer.company || '', cvr: '' }));
  };

  const handleCvrLookup = async (cvr: string) => {
    setForm(f => ({ ...f, cvr }));
    setCvrError(null);
    
    // Only lookup if CVR is exactly 8 digits
    if (!/^\d{8}$/.test(cvr)) {
      if (cvr.length > 0 && cvr.length !== 8) {
        setCvrError('CVR skal være 8 cifre');
      }
      return;
    }
    
    setCvrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-cvr', {
        body: { cvr }
      });
      
      if (error) {
        setCvrError('Kunne ikke verificere CVR');
        return;
      }
      
      if (data.error) {
        setCvrError(data.error);
        return;
      }
      
      // Auto-fill company info from CVR data
      setForm(f => ({
        ...f,
        company_name: data.name || '',
        address: data.address ? `${data.address}, ${data.zipcode} ${data.city}` : f.address,
        customer_phone: data.phone || f.customer_phone,
        customer_email: data.email || f.customer_email
      }));
    } catch (err) {
      console.error('CVR lookup error:', err);
      setCvrError('Fejl ved CVR opslag');
    } finally {
      setCvrLoading(false);
    }
  };

  const handleReleaseJob = async (eventId: string, bookingId?: string) => {
    if (!userId) return;
    
    setReleaseLoading(true);
    try {
      // If we have a real booking ID, use the edge function
      if (bookingId && !bookingId.startsWith('mock-')) {
        const { data, error } = await supabase.functions.invoke('release-job', {
          body: { bookingId, boosterId: userId, reason: releaseReason }
        });
        
        if (error) {
          console.error('Error releasing job:', error);
          alert('Kunne ikke frigive job. Prøv igen.');
          return;
        }
        
        alert(`Job frigivet! ${data?.notifiedBoosters || 0} boosters er blevet notificeret.`);
      } else {
        // For mock events, just remove from local state
        setEvents(prev => prev.filter(e => e.id !== eventId));
        alert('Job frigivet til andre boosters i området!');
      }
      
      // Refresh events
      if (userId) await fetchEvents(userId, date, view);
      setSelectedEvent(null);
      setReleaseDialogOpen(false);
      setReleaseReason('');
    } catch (err) {
      console.error('Release job error:', err);
      alert('Der opstod en fejl. Prøv igen.');
    } finally {
      setReleaseLoading(false);
    }
  };

  const createEvent = async () => {
    if (!userId || !openSlot || !form.service.trim() || form.duration <= 0) return;
    if (hasOverlap(openSlot.day, openSlot.time, form.duration)) { alert("Tiden overlapper en eksisterende booking."); return; }
    const startMins = timeToMinutes(openSlot.time + ":00");
    const { error } = await supabase.from("booster_availability").insert({ booster_id: userId, date: format(openSlot.day, "yyyy-MM-dd"), start_time: minutesToTime(startMins), end_time: minutesToTime(startMins + form.duration), status: "booked", notes: JSON.stringify({ service: form.service, duration_minutes: form.duration, customer_name: form.customer_name, customer_phone: form.customer_phone, customer_email: form.customer_email, address: form.address, client_type: form.client_type, company_name: form.company_name, notes: form.notes, look_images: form.look_images }) });
    if (!error) { setOpenSlot(null); setForm(DEFAULT_FORM); await fetchEvents(userId, date, view); }
  };

  const deleteEvent = async (id: string) => {
    if (id.startsWith('mock-')) { setEvents(prev => prev.filter(e => e.id !== id)); setSelectedEvent(null); return; }
    await supabase.from("booster_availability").delete().eq("id", id);
    if (userId) await fetchEvents(userId, date, view);
    setSelectedEvent(null);
  };

  const parseNotes = (e: BoosterEvent) => { try { return e.notes ? JSON.parse(e.notes) : {}; } catch { return {}; } };
  const blockedDates = useMemo(() => getBlockedDates(events), [events]);
  const isDayBlocked = (d: Date) => blockedDates.has(format(d, 'yyyy-MM-dd'));

  const blockTime = async () => {
    if (!userId || !blockDate) return;
    const startTime = blockType === 'day' ? '07:00:00' : `${blockStartTime}:00`;
    const endTime = blockType === 'day' ? '21:00:00' : `${blockEndTime}:00`;
    const { error } = await supabase.from("booster_availability").insert({ booster_id: userId, date: format(blockDate, "yyyy-MM-dd"), start_time: startTime, end_time: endTime, status: "blocked", notes: JSON.stringify({ blocked: true, reason: blockReason }) });
    if (!error) { setBlockDialogOpen(false); setBlockReason(''); await fetchEvents(userId, date, view); }
  };

  const unblockDay = async (d: Date) => {
    if (!userId) return;
    const blockedEvent = events.find(e => e.date === format(d, 'yyyy-MM-dd') && e.status === 'blocked');
    if (blockedEvent) {
      if (blockedEvent.id.startsWith('mock-')) setEvents(prev => prev.filter(e => e.id !== blockedEvent.id));
      else { await supabase.from("booster_availability").delete().eq("id", blockedEvent.id); await fetchEvents(userId, date, view); }
    }
  };

  const getEventSpan = (e: BoosterEvent) => Math.ceil((timeToMinutes(e.end_time) - timeToMinutes(e.start_time)) / 30);
  const headerTitle = view === "day" ? format(date, "d. MMMM yyyy", { locale: da }) : view === "week" ? `${format(days[0], "dd/MM/yyyy")} – ${format(days[days.length - 1], "dd/MM/yyyy")}` : format(date, "MMMM yyyy", { locale: da });
  const slotHeight = 28;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Helmet><title>Min kalender – Beauty Boosters</title></Helmet>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Min kalender</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, view === "day" ? -1 : view === "week" ? -7 : -30))}>Forrige</Button>
            <Button variant="outline" size="sm" onClick={() => setDate(startOfDay(new Date()))}>I dag</Button>
            <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, view === "day" ? 1 : view === "week" ? 7 : 30))}>Næste</Button>
          </div>
          <Select value={view} onValueChange={(v) => setView(v as View)}><SelectTrigger className="w-full sm:w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">Dag</SelectItem><SelectItem value="week">Uge</SelectItem><SelectItem value="month">Måned</SelectItem></SelectContent></Select>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => navigate('/booster/settings')}
          >
            <RefreshCw className="h-4 w-4" /> 
            Synkroniser kalender
          </Button>
          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1"><Ban className="h-4 w-4" /> Bloker tid</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Bloker tid</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <RadioGroup value={blockType} onValueChange={(v) => setBlockType(v as 'time' | 'day')} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="time" id="block-time" /><Label htmlFor="block-time">Tidsrum</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="day" id="block-day" /><Label htmlFor="block-day">Hele dagen</Label></div>
                </RadioGroup>
                <div><Label>Dato</Label><Input type="date" value={blockDate ? format(blockDate, 'yyyy-MM-dd') : ''} onChange={(e) => setBlockDate(e.target.value ? new Date(e.target.value) : null)} /></div>
                {blockType === 'time' && (<div className="grid grid-cols-2 gap-3"><div><Label>Fra</Label><Select value={blockStartTime} onValueChange={setBlockStartTime}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div><div><Label>Til</Label><Select value={blockEndTime} onValueChange={setBlockEndTime}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div></div>)}
                <div><Label>Årsag (valgfrit)</Label><Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="F.eks. Ferie..." /></div>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setBlockDialogOpen(false)}>Annuller</Button><Button onClick={blockTime} disabled={!blockDate}><Ban className="h-4 w-4 mr-1" /> Bloker</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-2 overflow-x-auto">
        <div className="text-sm text-muted-foreground mb-2 font-medium">{headerTitle}</div>
        <div className="grid min-w-[600px]" style={{ gridTemplateColumns: `50px repeat(${days.length}, minmax(${view === 'day' ? '200px' : view === 'week' ? '100px' : '40px'}, 1fr))` }}>
          <div className="sticky left-0 bg-card z-10" />
          {days.map((d) => {
            const dayBlocked = isDayBlocked(d);
            return (
              <div key={format(d, "yyyy-MM-dd")} className={`px-1 py-1 border-b font-medium text-[10px] md:text-xs text-center relative group ${isEqual(startOfDay(d), startOfDay(new Date())) ? 'bg-primary/10 text-primary' : ''} ${dayBlocked ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                <div className="flex items-center justify-center gap-1"><span>{format(d, "EEE", { locale: da })}</span>{dayBlocked && <CalendarX className="h-3 w-3 text-destructive" />}</div>
                <div className="font-bold">{format(d, "d/M")}</div>
                {!dayBlocked ? (<button className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-destructive/10 hover:bg-destructive/20" onClick={() => { setBlockDate(d); setBlockType('day'); setBlockDialogOpen(true); }} title="Bloker hele dagen"><Ban className="h-3 w-3 text-destructive" /></button>) : (<button className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-green-100 hover:bg-green-200 dark:bg-green-900/30" onClick={() => unblockDay(d)} title="Fjern blokering"><X className="h-3 w-3 text-green-600" /></button>)}
              </div>
            );
          })}

          {times.map((t) => (
            <div key={`row-${t}`} className="contents">
              <div className="sticky left-0 bg-card z-10 border-t px-1 text-[9px] text-muted-foreground flex items-center justify-end pr-2" style={{ height: slotHeight }}>{t}</div>
              {days.map((d) => {
                const dayKey = format(d, "yyyy-MM-dd");
                const booked = slotIsBooked(d, t);
                const startingHere = getDayEvents(d).filter((e) => e.start_time.startsWith(t));
                return (
                  <div key={`${dayKey}-${t}`} className={`border-t border-l group relative ${booked && startingHere.length === 0 ? "bg-primary/5" : ""}`} style={{ height: slotHeight }}>
                    {!booked && (
                      <Dialog open={!!(openSlot && isEqual(openSlot.day, d) && openSlot.time === t)} onOpenChange={(o) => { if (!o) setOpenSlot(null); }}>
                        <DialogTrigger asChild><button className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-primary/5 hover:bg-primary/10" onClick={() => setOpenSlot({ day: d, time: t })}><Plus className="h-3 w-3 text-primary" /></button></DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Ny booking – {format(d, "EEEE d. MMMM", { locale: da })} kl. {t}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <RadioGroup value={form.customer_type} onValueChange={(v) => setForm(f => ({ ...f, customer_type: v as 'new' | 'existing', customer_id: '' }))} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="new" id="new" /><Label htmlFor="new">Ny kunde</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="existing" id="existing" /><Label htmlFor="existing">Eksisterende kunde</Label></div></RadioGroup>
                            {form.customer_type === 'existing' && (<Select value={form.customer_id} onValueChange={handleSelectCustomer}><SelectTrigger><SelectValue placeholder="Vælg kunde..." /></SelectTrigger><SelectContent>{MOCK_CUSTOMERS.map(c => <SelectItem key={c.id} value={c.id}><div className="flex items-center gap-2">{c.type === 'virksomhed' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}{c.name}</div></SelectItem>)}</SelectContent></Select>)}
                            <RadioGroup value={form.client_type} onValueChange={(v) => setForm(f => ({ ...f, client_type: v as 'privat' | 'virksomhed', cvr: '', company_name: '' }))} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="privat" id="privat" /><Label htmlFor="privat"><User className="h-3 w-3 inline mr-1" />Privat</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="virksomhed" id="virksomhed" /><Label htmlFor="virksomhed"><Building2 className="h-3 w-3 inline mr-1" />Virksomhed</Label></div></RadioGroup>
                            {form.client_type === 'virksomhed' && (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Input 
                                    value={form.cvr} 
                                    onChange={(e) => handleCvrLookup(e.target.value.replace(/\D/g, '').slice(0, 8))} 
                                    placeholder="CVR-nummer (8 cifre)" 
                                    maxLength={8}
                                    className={cvrError ? 'border-destructive' : ''}
                                  />
                                  {cvrLoading && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  )}
                                </div>
                                {cvrError && <p className="text-xs text-destructive">{cvrError}</p>}
                                <Input 
                                  value={form.company_name} 
                                  onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} 
                                  placeholder="Virksomhedsnavn" 
                                  className={form.company_name && !cvrLoading ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : ''}
                                />
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3"><Input value={form.customer_name} onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Navn" /><Input value={form.customer_phone} onChange={(e) => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="Telefon" /></div>
                            <Input type="email" value={form.customer_email} onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))} placeholder="Email" />
                            <div className="grid grid-cols-2 gap-3"><Select value={form.service} onValueChange={(v) => setForm(f => ({ ...f, service: v }))}><SelectTrigger><SelectValue placeholder="Vælg service..." /></SelectTrigger><SelectContent><SelectItem value="Makeup Styling">Makeup Styling</SelectItem><SelectItem value="Hår Styling">Hår Styling</SelectItem><SelectItem value="Bryllup makeup">Bryllup makeup</SelectItem><SelectItem value="Event makeup">Event makeup</SelectItem><SelectItem value="SFX Makeup">SFX Makeup</SelectItem><SelectItem value="TV-produktion">TV-produktion</SelectItem></SelectContent></Select><Select value={String(form.duration)} onValueChange={(v) => setForm(f => ({ ...f, duration: Number(v) }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="60">1 time</SelectItem><SelectItem value="120">2 timer</SelectItem><SelectItem value="180">3 timer</SelectItem><SelectItem value="240">4 timer</SelectItem></SelectContent></Select></div>
                            <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Adresse" />
                            <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground"><Image className="h-6 w-6 mx-auto mb-2" /><p>Træk billeder hertil</p></div>
                            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Noter..." rows={2} />
                            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpenSlot(null)}>Annuller</Button><Button onClick={createEvent} disabled={!form.service.trim()}>Opret</Button></div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {startingHere.map((e) => {
                      const meta = parseNotes(e);
                      const height = getEventSpan(e) * slotHeight - 2;
                      return (
                        <div key={e.id} className="absolute left-0 right-0 px-0.5 cursor-pointer z-10" style={{ height, top: 0 }} onClick={() => setSelectedEvent(e)}>
                          <div className={`h-full w-full rounded text-[9px] p-1 flex flex-col overflow-hidden border ${e.status === 'blocked' ? 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700' : meta.client_type === 'virksomhed' ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' : 'bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700'}`}>
                            <div className="font-semibold truncate">{e.status === 'blocked' ? (meta.reason || 'Blokeret') : (meta.service || "Booking")}</div>
                            {e.status !== 'blocked' && <div className="text-muted-foreground truncate">{meta.customer_name}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={(o) => { if (!o) { setSelectedEvent(null); setIsEditing(false); } }}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (() => {
            const meta = parseNotes(selectedEvent);
            const teamBoosters = Array.isArray(meta.team_boosters) ? meta.team_boosters : [];
            const peopleCount = meta.people_count || 1;
            const price = meta.price || 0;
            const durationMins = (timeToMinutes(selectedEvent.end_time) - timeToMinutes(selectedEvent.start_time));
            const durationHours = Math.floor(durationMins / 60);
            const durationMinsRest = durationMins % 60;
            const durationStr = durationMinsRest > 0 ? `${durationHours}t ${durationMinsRest}m` : `${durationHours}t`;

            if (isEditing) {
              return (
                <>
                  <DialogHeader><DialogTitle>Rediger booking</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-foreground">Service</Label><Select value={editForm.service} onValueChange={(v) => setEditForm(f => ({ ...f, service: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Makeup Styling">Makeup Styling</SelectItem><SelectItem value="Hår Styling">Hår Styling</SelectItem><SelectItem value="Bryllup makeup">Bryllup makeup</SelectItem><SelectItem value="Event makeup">Event makeup</SelectItem><SelectItem value="SFX Makeup">SFX Makeup</SelectItem><SelectItem value="TV-produktion">TV-produktion</SelectItem></SelectContent></Select></div>
                      <div><Label className="text-foreground">Varighed</Label><Select value={String(editForm.duration)} onValueChange={(v) => setEditForm(f => ({ ...f, duration: Number(v) }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="60">1 time</SelectItem><SelectItem value="120">2 timer</SelectItem><SelectItem value="180">3 timer</SelectItem><SelectItem value="240">4 timer</SelectItem></SelectContent></Select></div>
                    </div>
                    <div><Label className="text-foreground">Kunde</Label><Input value={editForm.customer_name} onChange={(e) => setEditForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-foreground">Telefon</Label><Input value={editForm.customer_phone} onChange={(e) => setEditForm(f => ({ ...f, customer_phone: e.target.value }))} /></div>
                      <div><Label className="text-foreground">Email</Label><Input value={editForm.customer_email} onChange={(e) => setEditForm(f => ({ ...f, customer_email: e.target.value }))} /></div>
                    </div>
                    <div><Label className="text-foreground">Adresse</Label><Input value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
                    <div><Label className="text-foreground">Noter</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsEditing(false)}>Annuller</Button><Button onClick={() => { setIsEditing(false); }}>Gem ændringer</Button></div>
                  </div>
                </>
              );
            }

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-foreground">
                    {meta.service || "Booking"}
                    <Badge variant={meta.client_type === 'virksomhed' ? 'secondary' : 'outline'} className="text-foreground">{meta.client_type === 'virksomhed' ? 'Virksomhed' : 'Privat'}</Badge>
                    {teamBoosters.length > 0 && <Badge variant="secondary" className="gap-1 text-foreground"><UsersRound className="h-3 w-3" />Team</Badge>}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-1 text-foreground">
                  <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm py-2">
                    <span className="font-medium text-foreground">Tidspunkt:</span>
                    <span className="text-foreground">{format(new Date(selectedEvent.date), "EEEE d. MMMM", { locale: da })}, {selectedEvent.start_time.slice(0,5)}–{selectedEvent.end_time.slice(0,5)}</span>
                    
                    <span className="font-medium text-foreground">Varighed:</span>
                    <span className="text-foreground">{durationStr}</span>
                    
                    <span className="font-medium text-foreground">Kunde:</span>
                    <span className="text-foreground">{meta.customer_name || "Ikke angivet"} {meta.customer_phone && `– ${meta.customer_phone}`}</span>
                    
                    {meta.company_name && (
                      <>
                        <span className="font-medium text-foreground">Virksomhed:</span>
                        <span className="text-foreground">{meta.company_name}</span>
                      </>
                    )}
                    
                    <span className="font-medium text-foreground">Adresse:</span>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.address || '')}`} target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:text-primary">{meta.address || '-'}</a>
                    
                    <span className="font-medium text-foreground">Service:</span>
                    <span className="text-foreground">{meta.service} ({peopleCount} {peopleCount === 1 ? 'person' : 'personer'})</span>
                    
                    <span className="font-medium text-foreground">Pris:</span>
                    <span className="text-foreground font-semibold">{price.toLocaleString('da-DK')} kr.</span>
                    
                    {teamBoosters.length > 0 && (
                      <>
                        <span className="font-medium text-foreground">Team:</span>
                        <div className="flex flex-wrap gap-1">
                          {teamBoosters.map((b: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs text-foreground">{b}</Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Look billeder */}
                  {meta.look_images && Array.isArray(meta.look_images) && meta.look_images.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm text-foreground">Look billeder</p>
                      <div className="flex gap-2 flex-wrap">
                        {meta.look_images.map((img: string, i: number) => (
                          <div key={i} className="w-16 h-16 rounded border overflow-hidden">
                            <img src={img} alt={`Look ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Noter sektion */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground flex items-center gap-1"><StickyNote className="h-4 w-4" /> Noter</p>
                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => {
                        setEditForm(f => ({ ...f, notes: meta.notes || '' }));
                        setIsEditing(true);
                      }}><Edit className="h-3 w-3" /> Tilføj/rediger</Button>
                    </div>
                    <p className="text-muted-foreground">{meta.notes || 'Ingen noter tilføjet'}</p>
                  </div>

                  {/* Hurtigknapper */}
                  <div className="flex flex-wrap gap-2 pt-3">
                    <Button variant="default" size="sm" className="gap-1" onClick={() => setChatDialogOpen(true)}>
                      <MessageCircle className="h-4 w-4" /> Chat med kunde
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                      setCurrentBookingImages(meta.look_images || []);
                      setImageDialogOpen(true);
                    }}>
                      <ImagePlus className="h-4 w-4" /> Tilføj billede
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                      setCurrentBookingServices([{ 
                        id: '1', 
                        name: meta.service || '', 
                        price: price, 
                        peopleCount: peopleCount 
                      }]);
                      setServiceDialogOpen(true);
                    }}>
                      <Tag className="h-4 w-4" /> Tilføj service
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => { 
                      setEditForm({
                        service: meta.service || '',
                        duration: durationMins,
                        customer_type: 'existing',
                        customer_id: '',
                        customer_name: meta.customer_name || '',
                        customer_phone: meta.customer_phone || '',
                        customer_email: meta.customer_email || '',
                        company_name: meta.company_name || '',
                        cvr: meta.cvr || '',
                        client_type: meta.client_type || 'privat',
                        address: meta.address || '',
                        notes: meta.notes || '',
                        look_images: [],
                      });
                      setIsEditing(true);
                    }}>
                      <Edit className="h-4 w-4" /> Rediger
                    </Button>
                    <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50">
                          <Share2 className="h-4 w-4" /> Frigiv job
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Frigiv job</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Jobbet vil blive sendt ud til andre boosters i området, og admin vil blive notificeret.
                          </p>
                          <div>
                            <Label>Årsag til frigivelse (valgfrit)</Label>
                            <Textarea 
                              value={releaseReason} 
                              onChange={(e) => setReleaseReason(e.target.value)} 
                              placeholder="F.eks. sygdom, dobbeltbooking..."
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setReleaseDialogOpen(false)}>
                              Annuller
                            </Button>
                            <Button 
                              variant="default" 
                              className="bg-amber-500 hover:bg-amber-600"
                              onClick={() => handleReleaseJob(selectedEvent.id, meta.booking_id)}
                              disabled={releaseLoading}
                            >
                              {releaseLoading ? (
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              ) : (
                                <Share2 className="h-4 w-4 mr-1" />
                              )}
                              Frigiv job
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" size="sm" className="gap-1" onClick={() => deleteEvent(selectedEvent.id)}>
                      <Trash2 className="h-4 w-4" /> Slet
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>Luk</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      {selectedEvent && (() => {
        const meta = parseNotes(selectedEvent);
        return (
          <BookingChatDialog
            open={chatDialogOpen}
            onOpenChange={setChatDialogOpen}
            customerName={meta.customer_name || 'Kunde'}
            customerEmail={meta.customer_email}
            customerPhone={meta.customer_phone}
            bookingId={selectedEvent.id}
            service={meta.service}
          />
        );
      })()}

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        existingImages={currentBookingImages}
        onImagesChange={(images) => {
          setCurrentBookingImages(images);
          // TODO: Save images to booking
          toast.success('Billeder opdateret');
        }}
        bookingId={selectedEvent?.id}
      />

      {/* Add Service Dialog */}
      <AddServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        existingServices={currentBookingServices}
        onServicesChange={(services) => {
          setCurrentBookingServices(services);
          // TODO: Update booking with new services
          toast.success('Services opdateret');
        }}
      />
    </div>
  );
}