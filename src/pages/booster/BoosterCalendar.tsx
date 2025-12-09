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
import { Plus, User, Building2, Image, MapPin, Phone, Mail, Clock, Trash2, X } from "lucide-react";

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
  client_type: 'privat',
  address: "",
  notes: "",
  look_images: [],
};

// Mock existing customers
const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Sarah Jensen', email: 'sarah@email.dk', phone: '+45 12345678', type: 'privat' },
  { id: '2', name: 'Marie Andersen', email: 'marie@email.dk', phone: '+45 87654321', type: 'privat' },
  { id: '3', name: 'Copenhagen Events', email: 'kontakt@cphevents.dk', phone: '+45 33221100', type: 'virksomhed', company: 'Copenhagen Events ApS' },
  { id: '4', name: 'DR Studios', email: 'booking@dr.dk', phone: '+45 11223344', type: 'virksomhed', company: 'Danmarks Radio' },
];

// Mock events for demo
const MOCK_EVENTS: Omit<BoosterEvent, 'id'>[] = [
  {
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00:00',
    end_time: '11:00:00',
    status: 'booked',
    notes: JSON.stringify({ service: 'Bryllup makeup', customer_name: 'Sarah Jensen', customer_phone: '+45 12345678', address: 'Vesterbrogade 45, København', client_type: 'privat' })
  },
  {
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '14:00:00',
    end_time: '16:00:00',
    status: 'booked',
    notes: JSON.stringify({ service: 'Event makeup', customer_name: 'Copenhagen Events', customer_phone: '+45 33221100', address: 'Bella Center, København', client_type: 'virksomhed', company_name: 'Copenhagen Events ApS' })
  },
  {
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    start_time: '10:00:00',
    end_time: '12:00:00',
    status: 'booked',
    notes: JSON.stringify({ service: 'Makeup styling', customer_name: 'Marie Andersen', customer_phone: '+45 87654321', address: 'Nørrebrogade 100, København', client_type: 'privat' })
  },
  {
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    start_time: '08:00:00',
    end_time: '12:00:00',
    status: 'booked',
    notes: JSON.stringify({ service: 'TV-produktion', customer_name: 'DR Studios', customer_phone: '+45 11223344', address: 'DR Byen, Emil Holms Kanal 20, København', client_type: 'virksomhed', company_name: 'Danmarks Radio' })
  },
];

export default function BoosterCalendar() {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [events, setEvents] = useState<BoosterEvent[]>([]);
  const [openSlot, setOpenSlot] = useState<{ day: Date; time: string } | null>(null);
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BoosterEvent | null>(null);

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

    const { data, error } = await supabase
      .from("booster_availability")
      .select("id,date,start_time,end_time,status,notes")
      .eq("booster_id", uid)
      .gte("date", format(start, "yyyy-MM-dd"))
      .lt("date", format(end, "yyyy-MM-dd"))
      .order("date")
      .order("start_time");

    if (!error && data) {
      // Merge real data with mock data for demo
      const mockWithIds = MOCK_EVENTS.map((e, i) => ({ ...e, id: `mock-${i}` }));
      const allEvents = [...(data as BoosterEvent[]), ...mockWithIds.filter(me => {
        const meDate = me.date;
        return meDate >= format(start, "yyyy-MM-dd") && meDate < format(end, "yyyy-MM-dd");
      })];
      setEvents(allEvents);
    }
  };

  // Time grid: 07:00 – 21:00 in 30-minute steps
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

  const getDayEvents = (d: Date) => {
    const key = format(d, "yyyy-MM-dd");
    return events.filter((e) => e.date === key);
  };

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  };

  const slotIsBooked = (d: Date, time: string) => {
    const key = format(d, "yyyy-MM-dd");
    const minutes = timeToMinutes(time + ":00");
    return events.some((e) => {
      if (e.date !== key) return false;
      const s = timeToMinutes(e.start_time);
      const en = timeToMinutes(e.end_time);
      return minutes >= s && minutes < en;
    });
  };

  const hasOverlap = (d: Date, startTime: string, durationMin: number) => {
    const sNew = timeToMinutes(startTime + ":00");
    const eNew = sNew + durationMin;
    return getDayEvents(d).some((e) => {
      const s = timeToMinutes(e.start_time);
      const en = timeToMinutes(e.end_time);
      return s < eNew && sNew < en;
    });
  };

  const handleSelectCustomer = (customerId: string) => {
    const customer = MOCK_CUSTOMERS.find(c => c.id === customerId);
    if (customer) {
      setForm(f => ({
        ...f,
        customer_id: customerId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        client_type: customer.type,
        company_name: customer.company || '',
      }));
    }
  };

  const createEvent = async () => {
    if (!userId || !openSlot) return;
    if (!form.service.trim() || form.duration <= 0) return;

    if (hasOverlap(openSlot.day, openSlot.time, form.duration)) {
      alert("Tiden overlapper en eksisterende booking.");
      return;
    }

    const startMins = timeToMinutes(openSlot.time + ":00");
    const endMins = startMins + form.duration;

    const payload = {
      service: form.service,
      duration_minutes: form.duration,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email,
      address: form.address,
      client_type: form.client_type,
      company_name: form.company_name,
      notes: form.notes,
      look_images: form.look_images,
    };

    const { error } = await supabase.from("booster_availability").insert({
      booster_id: userId,
      date: format(openSlot.day, "yyyy-MM-dd"),
      start_time: minutesToTime(startMins),
      end_time: minutesToTime(endMins),
      status: "booked",
      notes: JSON.stringify(payload),
    });

    if (!error) {
      setOpenSlot(null);
      setForm(DEFAULT_FORM);
      await fetchEvents(userId, date, view);
    }
  };

  const deleteEvent = async (id: string) => {
    if (id.startsWith('mock-')) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEvent(null);
      return;
    }
    await supabase.from("booster_availability").delete().eq("id", id);
    if (userId) await fetchEvents(userId, date, view);
    setSelectedEvent(null);
  };

  const parseNotes = (e: BoosterEvent) => {
    try { return e.notes ? JSON.parse(e.notes) as any : {}; } catch { return {}; }
  };

  const getEventSpan = (e: BoosterEvent) => {
    const startMins = timeToMinutes(e.start_time);
    const endMins = timeToMinutes(e.end_time);
    return Math.ceil((endMins - startMins) / 30);
  };

  const headerTitle = view === "day"
    ? format(date, "d. MMMM yyyy", { locale: da })
    : view === "week" 
    ? `${format(days[0], "dd/MM/yyyy")} – ${format(days[days.length - 1], "dd/MM/yyyy")}`
    : format(date, "MMMM yyyy", { locale: da });

  const slotHeight = 28; // Compact slots

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Helmet>
        <title>Min kalender – Beauty Boosters</title>
        <meta name="description" content="Dag- og ugekalender for booster med 30-minutters tidsintervaller." />
        <link rel="canonical" href={`${window.location.origin}/booster/calendar`} />
      </Helmet>

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Min kalender</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, view === "day" ? -1 : view === "week" ? -7 : -30))}>Forrige</Button>
            <Button variant="outline" size="sm" onClick={() => setDate(startOfDay(new Date()))}>I dag</Button>
            <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, view === "day" ? 1 : view === "week" ? 7 : 30))}>Næste</Button>
          </div>
          <Select value={view} onValueChange={(v) => setView(v as View)}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Visning" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="week">Uge</SelectItem>
              <SelectItem value="month">Måned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-2 overflow-x-auto">
        <div className="text-sm text-muted-foreground mb-2 font-medium">{headerTitle}</div>
        <div 
          className="grid min-w-[600px]" 
          style={{ 
            gridTemplateColumns: `50px repeat(${days.length}, minmax(${view === 'day' ? '200px' : view === 'week' ? '100px' : '40px'}, 1fr))` 
          }}
        >
          {/* Header row */}
          <div className="sticky left-0 bg-card z-10" />
          {days.map((d) => (
            <div 
              key={format(d, "yyyy-MM-dd")} 
              className={`px-1 py-1 border-b font-medium text-[10px] md:text-xs text-center ${
                isEqual(startOfDay(d), startOfDay(new Date())) ? 'bg-primary/10 text-primary' : ''
              }`}
            >
              <div>{format(d, "EEE", { locale: da })}</div>
              <div className="font-bold">{format(d, "d/M")}</div>
            </div>
          ))}

          {/* Time rows */}
          {times.map((t) => (
            <div key={`row-${t}`} className="contents">
              <div 
                className="sticky left-0 bg-card z-10 border-t px-1 text-[9px] text-muted-foreground flex items-center justify-end pr-2"
                style={{ height: slotHeight }}
              >
                {t}
              </div>
              {days.map((d) => {
                const dayKey = format(d, "yyyy-MM-dd");
                const booked = slotIsBooked(d, t);
                const startingHere = getDayEvents(d).filter((e) => e.start_time.startsWith(t));
                
                return (
                  <div 
                    key={`${dayKey}-${t}`} 
                    className={`border-t border-l group relative ${booked && startingHere.length === 0 ? "bg-primary/5" : ""}`}
                    style={{ height: slotHeight }}
                  >
                    {/* Add button */}
                    {!booked && (
                      <Dialog open={!!(openSlot && isEqual(openSlot.day, d) && openSlot.time === t)} onOpenChange={(o) => { if (!o) setOpenSlot(null); }}>
                        <DialogTrigger asChild>
                          <button 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-primary/5 hover:bg-primary/10" 
                            onClick={() => setOpenSlot({ day: d, time: t })}
                          >
                            <Plus className="h-3 w-3 text-primary" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Ny booking – {format(d, "EEEE d. MMMM", { locale: da })} kl. {t}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Customer Type */}
                            <div className="space-y-2">
                              <Label>Kunde</Label>
                              <RadioGroup 
                                value={form.customer_type} 
                                onValueChange={(v) => setForm(f => ({ ...f, customer_type: v as 'new' | 'existing', customer_id: '' }))}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="new" id="new" />
                                  <Label htmlFor="new" className="cursor-pointer">Ny kunde</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="existing" id="existing" />
                                  <Label htmlFor="existing" className="cursor-pointer">Eksisterende kunde</Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* Existing Customer Select */}
                            {form.customer_type === 'existing' && (
                              <div>
                                <Label>Vælg kunde</Label>
                                <Select value={form.customer_id} onValueChange={handleSelectCustomer}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Vælg kunde..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MOCK_CUSTOMERS.map(c => (
                                      <SelectItem key={c.id} value={c.id}>
                                        <div className="flex items-center gap-2">
                                          {c.type === 'virksomhed' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                          {c.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Client Type */}
                            <div className="space-y-2">
                              <Label>Kundetype</Label>
                              <RadioGroup 
                                value={form.client_type} 
                                onValueChange={(v) => setForm(f => ({ ...f, client_type: v as 'privat' | 'virksomhed' }))}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="privat" id="privat" />
                                  <Label htmlFor="privat" className="cursor-pointer flex items-center gap-1">
                                    <User className="h-3 w-3" /> Privat
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="virksomhed" id="virksomhed" />
                                  <Label htmlFor="virksomhed" className="cursor-pointer flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> Virksomhed
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* Company Name */}
                            {form.client_type === 'virksomhed' && (
                              <div>
                                <Label>Virksomhedsnavn</Label>
                                <Input 
                                  value={form.company_name} 
                                  onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} 
                                  placeholder="Virksomhedsnavn"
                                />
                              </div>
                            )}

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Kontaktperson</Label>
                                <Input 
                                  value={form.customer_name} 
                                  onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))} 
                                  placeholder="Navn"
                                />
                              </div>
                              <div>
                                <Label>Telefon</Label>
                                <Input 
                                  value={form.customer_phone} 
                                  onChange={(e) => setForm(f => ({ ...f, customer_phone: e.target.value }))} 
                                  placeholder="+45 12345678"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Email</Label>
                              <Input 
                                type="email"
                                value={form.customer_email} 
                                onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))} 
                                placeholder="email@example.dk"
                              />
                            </div>

                            {/* Service & Duration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Service</Label>
                                <Select value={form.service} onValueChange={(v) => setForm(f => ({ ...f, service: v }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Vælg service..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Makeup Styling">Makeup Styling</SelectItem>
                                    <SelectItem value="Hår Styling">Hår Styling</SelectItem>
                                    <SelectItem value="Bryllup makeup">Bryllup makeup</SelectItem>
                                    <SelectItem value="Event makeup">Event makeup</SelectItem>
                                    <SelectItem value="Fotoshoot">Fotoshoot</SelectItem>
                                    <SelectItem value="SFX Makeup">SFX Makeup</SelectItem>
                                    <SelectItem value="TV-produktion">TV-produktion</SelectItem>
                                    <SelectItem value="Andet">Andet</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Varighed</Label>
                                <Select value={String(form.duration)} onValueChange={(v) => setForm(f => ({ ...f, duration: Number(v) }))}>
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
                                    <SelectItem value="300">5 timer</SelectItem>
                                    <SelectItem value="360">6 timer</SelectItem>
                                    <SelectItem value="480">8 timer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Address */}
                            <div>
                              <Label>Adresse</Label>
                              <Input 
                                value={form.address} 
                                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} 
                                placeholder="Adresse til booking"
                              />
                            </div>

                            {/* Look Images */}
                            <div>
                              <Label className="flex items-center gap-1">
                                <Image className="h-3 w-3" /> Ønskede looks (billeder)
                              </Label>
                              <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                                <Image className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <p>Træk billeder hertil eller klik for at uploade</p>
                                <p className="text-xs mt-1">PNG, JPG op til 10MB</p>
                              </div>
                            </div>

                            {/* Notes */}
                            <div>
                              <Label>Noter</Label>
                              <Textarea 
                                value={form.notes} 
                                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} 
                                placeholder="Specielle ønsker, allergier, etc..."
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" onClick={() => setOpenSlot(null)}>Annuller</Button>
                              <Button onClick={createEvent} disabled={!form.service.trim() || form.duration <= 0}>
                                Opret booking
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Events that start at this exact time */}
                    {startingHere.map((e) => {
                      const meta = parseNotes(e);
                      const spanSlots = getEventSpan(e);
                      const height = spanSlots * slotHeight - 2;
                      
                      return (
                        <div 
                          key={e.id} 
                          className="absolute left-0 right-0 px-0.5 cursor-pointer z-10"
                          style={{ height, top: 0 }}
                          onClick={() => setSelectedEvent(e)}
                        >
                          <div className={`h-full w-full rounded text-[9px] p-1 flex flex-col overflow-hidden border ${
                            meta.client_type === 'virksomhed' 
                              ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700' 
                              : 'bg-primary/10 border-primary/20'
                          }`}>
                            <div className="font-semibold truncate leading-tight">{meta.service || "Booking"}</div>
                            <div className="text-muted-foreground truncate leading-tight">
                              {meta.customer_name}
                            </div>
                            {view !== 'month' && height > 40 && (
                              <div className="text-muted-foreground truncate leading-tight mt-auto">
                                {e.start_time.slice(0,5)}–{e.end_time.slice(0,5)}
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
          ))}
        </div>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => { if (!o) setSelectedEvent(null); }}>
        <DialogContent>
          {selectedEvent && (() => {
            const meta = parseNotes(selectedEvent);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {meta.service || "Booking"}
                    <Badge variant={meta.client_type === 'virksomhed' ? 'secondary' : 'outline'}>
                      {meta.client_type === 'virksomhed' ? 'Virksomhed' : 'Privat'}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(selectedEvent.date), "EEEE d. MMMM yyyy", { locale: da })}</span>
                    <span className="font-medium">{selectedEvent.start_time.slice(0,5)} – {selectedEvent.end_time.slice(0,5)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{meta.customer_name || "Ikke angivet"}</span>
                  </div>

                  {meta.company_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{meta.company_name}</span>
                    </div>
                  )}

                  {meta.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${meta.customer_phone}`} className="text-primary hover:underline">{meta.customer_phone}</a>
                    </div>
                  )}

                  {meta.customer_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${meta.customer_email}`} className="text-primary hover:underline">{meta.customer_email}</a>
                    </div>
                  )}

                  {meta.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {meta.address}
                      </a>
                    </div>
                  )}

                  {meta.notes && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="font-medium mb-1">Noter</p>
                      <p className="text-muted-foreground">{meta.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="destructive" size="sm" onClick={() => deleteEvent(selectedEvent.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Slet
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                      Luk
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
