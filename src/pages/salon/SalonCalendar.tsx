import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, startOfDay, startOfWeek, isSameDay } from "date-fns";
import { da } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalonBooking {
  id: string;
  salon_id: string;
  employee_id: string | null;
  service_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  start_time: string;
  end_time: string;
}

export default function SalonCalendar() {
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [salonId, setSalonId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; avatar_url: string | null }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; duration_minutes: number }>>([]);
  const [bookings, setBookings] = useState<SalonBooking[]>([]);

  const [openSlot, setOpenSlot] = useState<{ time: string; employeeId: string; date: Date } | null>(null);
  const [bookingForm, setBookingForm] = useState({
    serviceId: null as string | null,
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;
      const { data: salon } = await supabase
        .from("salon_profiles")
        .select("id")
        .eq("owner_user_id", userId)
        .maybeSingle();
      if (salon?.id) {
        setSalonId(salon.id);
        const [{ data: emps }, { data: svcs }] = await Promise.all([
          supabase.from("salon_employees").select("id,name,avatar_url").eq("salon_id", salon.id).order("name"),
          supabase.from("salon_services").select("id,name,duration_minutes").eq("salon_id", salon.id).order("name"),
        ]);
        setEmployees(emps || []);
        setServices(svcs || []);
      }
    };
    init();
  }, []);

  // Get date range based on view
  const dateRange = useMemo(() => {
    if (view === "day") {
      return { start: startOfDay(date), end: addDays(startOfDay(date), 1) };
    } else {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      return { start: weekStart, end: addDays(weekStart, 7) };
    }
  }, [view, date]);

  // Load bookings for current view range
  useEffect(() => {
    const loadBookings = async () => {
      if (!salonId) return;
      const { data } = await supabase
        .from("salon_bookings")
        .select("id,salon_id,employee_id,service_id,customer_name,customer_email,customer_phone,start_time,end_time")
        .eq("salon_id", salonId)
        .gte("start_time", dateRange.start.toISOString())
        .lt("start_time", dateRange.end.toISOString())
        .order("start_time");
      setBookings(data || []);
    };
    loadBookings();
  }, [salonId, dateRange]);

  const times = useMemo(() => {
    const arr: string[] = [];
    for (let h = 7; h <= 21; h++) {
      arr.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 21) arr.push(`${String(h).padStart(2, "0")}:30`);
    }
    return arr;
  }, []);

  const weekDays = useMemo(() => {
    if (view !== "week") return [];
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [view, date]);

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const isoToMinutes = (iso: string) => {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  };

  const isSlotBooked = (employeeId: string, t: string, checkDate: Date) => {
    const mins = timeToMinutes(t);
    return bookings.some((b) => {
      const bDate = new Date(b.start_time);
      return b.employee_id === employeeId && 
             isSameDay(bDate, checkDate) &&
             mins >= isoToMinutes(b.start_time) && 
             mins < isoToMinutes(b.end_time);
    });
  };

  const getBookingsStartingAt = (employeeId: string, t: string, checkDate: Date) => {
    return bookings.filter((b) => {
      const bDate = new Date(b.start_time);
      const bTime = `${String(bDate.getHours()).padStart(2, "0")}:${String(bDate.getMinutes()).padStart(2, "0")}`;
      return b.employee_id === employeeId && isSameDay(bDate, checkDate) && t === bTime;
    });
  };

  const createBooking = async () => {
    if (!salonId || !openSlot || !bookingForm.serviceId) return;
    const service = services.find(s => s.id === bookingForm.serviceId)!;

    const startMins = timeToMinutes(openSlot.time);
    const endMins = startMins + service.duration_minutes;
    const overlap = bookings.some((b) => {
      const bDate = new Date(b.start_time);
      return b.employee_id === openSlot.employeeId && 
             isSameDay(bDate, openSlot.date) &&
             startMins < isoToMinutes(b.end_time) && 
             endMins > isoToMinutes(b.start_time);
    });
    if (overlap) {
      alert("Tiden overlapper en eksisterende booking.");
      return;
    }

    const [hour, minute] = openSlot.time.split(":").map(Number);
    const start = new Date(openSlot.date);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + service.duration_minutes * 60000);
    
    await supabase.from("salon_bookings").insert({
      salon_id: salonId,
      employee_id: openSlot.employeeId,
      service_id: bookingForm.serviceId,
      customer_name: bookingForm.customer_name,
      customer_phone: bookingForm.customer_phone,
      customer_email: bookingForm.customer_email,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
    
    setOpenSlot(null);
    setBookingForm({ serviceId: null, customer_name: "", customer_phone: "", customer_email: "" });
    
    // Reload bookings
    const { data } = await supabase
      .from("salon_bookings")
      .select("id,salon_id,employee_id,service_id,customer_name,customer_email,customer_phone,start_time,end_time")
      .eq("salon_id", salonId)
      .gte("start_time", dateRange.start.toISOString())
      .lt("start_time", dateRange.end.toISOString())
      .order("start_time");
    setBookings(data || []);
  };

  const serviceName = (id: string | null) => services.find((s) => s.id === id)?.name || "Service";

  const navigateDate = (direction: number) => {
    if (view === "day") {
      setDate(addDays(date, direction));
    } else {
      setDate(addDays(date, direction * 7));
    }
  };

  const headerTitle = view === "day" 
    ? format(date, "EEEE d. MMMM yyyy", { locale: da })
    : `${format(dateRange.start, "d. MMM", { locale: da })} – ${format(addDays(dateRange.end, -1), "d. MMM yyyy", { locale: da })}`;

  return (
    <div className="space-y-4">
      <Helmet>
        <title>Salon kalender – Beauty Boosters</title>
        <meta name="description" content="Kalendervisning for salon med dags- og ugevisning." />
        <link rel="canonical" href={`${window.location.origin}/salon/calendar`} />
      </Helmet>
      
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Kalender</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setDate(startOfDay(new Date()))}>
            I dag
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("day")}
            >
              Dag
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("week")}
            >
              Uge
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="text-sm font-medium text-muted-foreground mb-3">{headerTitle}</div>
        
        {view === "day" ? (
          // Day View
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(${Math.max(employees.length, 1)}, minmax(180px, 1fr))` }}>
            <div className="border-b" />
            {employees.length > 0 ? employees.map((e) => (
              <div key={e.id} className="px-3 py-2 border-b border-l font-medium text-center truncate">{e.name}</div>
            )) : <div className="px-3 py-2 border-b border-l text-muted-foreground">Ingen medarbejdere</div>}
            
            {times.map((t) => (
              <div key={t} className="contents">
                <div className="border-t px-2 text-xs text-muted-foreground h-10 flex items-center">{t}</div>
                {employees.length > 0 ? employees.map((e) => {
                  const booked = isSlotBooked(e.id, t, date);
                  const starts = getBookingsStartingAt(e.id, t, date);
                  return (
                    <div 
                      key={`${e.id}-${t}`} 
                      className={cn(
                        "border-t border-l h-10 group relative cursor-pointer transition-colors",
                        booked ? "bg-muted/40" : "hover:bg-primary/5"
                      )}
                      onClick={() => !booked && setOpenSlot({ time: t, employeeId: e.id, date })}
                    >
                      {!booked && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {starts.map((b) => (
                        <div key={b.id} className="absolute inset-x-1 top-0 px-2 py-1 z-10">
                          <div className="rounded bg-primary/10 border border-primary/20 text-xs p-1.5">
                            <div className="font-medium truncate">{serviceName(b.service_id)}</div>
                            <div className="text-muted-foreground truncate text-[10px]">
                              {new Date(b.start_time).toLocaleTimeString("da", { hour: "2-digit", minute: "2-digit" })}
                              –{new Date(b.end_time).toLocaleTimeString("da", { hour: "2-digit", minute: "2-digit" })}
                              {b.customer_name && ` · ${b.customer_name}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }) : <div className="border-t border-l h-10 flex items-center px-3 text-sm text-muted-foreground">Tilføj medarbejdere under Team</div>}
              </div>
            ))}
          </div>
        ) : (
          // Week View
          <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, minmax(100px, 1fr))` }}>
            <div className="border-b" />
            {weekDays.map((d) => (
              <div 
                key={d.toISOString()} 
                className={cn(
                  "px-2 py-2 border-b border-l text-center",
                  isSameDay(d, new Date()) && "bg-primary/10"
                )}
              >
                <div className="text-xs text-muted-foreground">{format(d, "EEE", { locale: da })}</div>
                <div className="font-medium">{format(d, "d")}</div>
              </div>
            ))}
            
            {times.filter((_, i) => i % 2 === 0).map((t) => (
              <div key={t} className="contents">
                <div className="border-t px-2 text-xs text-muted-foreground h-12 flex items-center">{t}</div>
                {weekDays.map((d) => {
                  const dayBookings = bookings.filter((b) => {
                    const bDate = new Date(b.start_time);
                    const bHour = bDate.getHours();
                    const tHour = parseInt(t.split(":")[0]);
                    return isSameDay(bDate, d) && bHour >= tHour && bHour < tHour + 1;
                  });
                  return (
                    <div 
                      key={`${d.toISOString()}-${t}`}
                      className={cn(
                        "border-t border-l h-12 group relative cursor-pointer transition-colors",
                        isSameDay(d, new Date()) && "bg-primary/5",
                        "hover:bg-primary/10"
                      )}
                      onClick={() => employees.length > 0 && setOpenSlot({ time: t, employeeId: employees[0].id, date: d })}
                    >
                      {dayBookings.length > 0 && (
                        <div className="absolute inset-1 rounded bg-primary/20 text-[10px] p-1 overflow-hidden">
                          {dayBookings.length} booking{dayBookings.length > 1 ? "s" : ""}
                        </div>
                      )}
                      {dayBookings.length === 0 && employees.length > 0 && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Booking Dialog */}
      <Dialog open={!!openSlot} onOpenChange={(o) => !o && setOpenSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ny booking – {openSlot && format(openSlot.date, "d. MMM", { locale: da })} kl. {openSlot?.time}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {view === "week" && employees.length > 1 && (
              <div>
                <Label>Medarbejder</Label>
                <Select 
                  value={openSlot?.employeeId} 
                  onValueChange={(v) => openSlot && setOpenSlot({ ...openSlot, employeeId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Vælg medarbejder" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Service</Label>
              <Select value={bookingForm.serviceId ?? undefined} onValueChange={(v) => setBookingForm(b => ({ ...b, serviceId: v }))}>
                <SelectTrigger><SelectValue placeholder="Vælg service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Kunde</Label>
                <Input value={bookingForm.customer_name} onChange={(e) => setBookingForm(b => ({ ...b, customer_name: e.target.value }))} placeholder="Navn" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={bookingForm.customer_phone} onChange={(e) => setBookingForm(b => ({ ...b, customer_phone: e.target.value }))} placeholder="Telefon" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={bookingForm.customer_email} onChange={(e) => setBookingForm(b => ({ ...b, customer_email: e.target.value }))} placeholder="Email" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenSlot(null)}>Annuller</Button>
              <Button onClick={createBooking} disabled={!bookingForm.serviceId}>Opret booking</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}