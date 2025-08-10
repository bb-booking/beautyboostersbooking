import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format, startOfDay } from "date-fns";
import { Plus } from "lucide-react";

export default function SalonCalendar() {
  const [view, setView] = useState<"day" | "week" | "month">("day");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [salonId, setSalonId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; avatar_url: string | null }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string; duration_minutes: number }>>([]);

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

  const times = useMemo(() => {
    const arr: string[] = [];
    for (let h = 8; h <= 18; h++) {
      arr.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== 18) arr.push(`${String(h).padStart(2, "0")}:30`);
    }
    return arr;
  }, []);

  const [openSlot, setOpenSlot] = useState<{ time: string; employeeId: string } | null>(null);
  const [bookingForm, setBookingForm] = useState<{ serviceId: string | null; customer_name: string; customer_phone: string; customer_email: string; }>(
    { serviceId: null, customer_name: "", customer_phone: "", customer_email: "" }
  );

  const createBooking = async () => {
    if (!salonId || !openSlot || !bookingForm.serviceId) return;
    const service = services.find(s => s.id === bookingForm.serviceId)!;
    const [hour, minute] = openSlot.time.split(":").map(Number);
    const start = new Date(date);
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
  };

  const headerTitle = view === "day" ? format(date, "PPP") : view === "week" ? `${format(date, "P")} – ${format(addDays(date, 6), "P")}` : format(date, "LLLL yyyy");

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Salon kalender – Beauty Boosters</title>
        <meta name="description" content="Kalendervisning for salon med dags-, uge- og månedsvisning." />
        <link rel="canonical" href={`${window.location.origin}/salon/calendar`} />
      </Helmet>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kalender</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setDate(addDays(date, - (view === "day" ? 1 : view === "week" ? 7 : 30)))}>Forrige</Button>
          <Button variant="outline" onClick={() => setDate(startOfDay(new Date()))}>I dag</Button>
          <Button variant="outline" onClick={() => setDate(addDays(date, (view === "day" ? 1 : view === "week" ? 7 : 30)))}>Næste</Button>
          <Select value={view} onValueChange={(v) => setView(v as any)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Visning" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="week">Uge</SelectItem>
              <SelectItem value="month">Måned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground mb-2">{headerTitle}</div>
        {view !== "month" ? (
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${Math.max(employees.length, 1)}, minmax(200px, 1fr))` }}>
            {/* time column header */}
            <div />
            {employees.length > 0 ? employees.map((e) => (
              <div key={e.id} className="px-3 py-2 border-b font-medium">{e.name}</div>
            )) : <div className="px-3 py-2 border-b text-muted-foreground">Ingen medarbejdere endnu</div>}
            {times.map((t) => (
              <>
                <div key={`time-${t}`} className="border-t px-2 text-xs text-muted-foreground h-12 flex items-start pt-2">{t}</div>
                {employees.length > 0 ? employees.map((e) => (
                  <div key={`${e.id}-${t}`} className="border-t border-l h-12 group relative">
                    <Dialog open={!!(openSlot && openSlot.employeeId===e.id && openSlot.time===t)} onOpenChange={(o) => { if(!o) setOpenSlot(null) }}>
                      <DialogTrigger asChild>
                        <button className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="h-4 w-4" onClick={() => setOpenSlot({ time: t, employeeId: e.id })} />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ny booking – {e.name} kl. {t}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>Service</Label>
                            <Select value={bookingForm.serviceId ?? undefined} onValueChange={(v) => setBookingForm(b => ({ ...b, serviceId: v }))}>
                              <SelectTrigger><SelectValue placeholder="Vælg service" /></SelectTrigger>
                              <SelectContent>
                                {services.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
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
                )) : <div className="border-t border-l h-12 flex items-center px-3 text-sm text-muted-foreground">Tilføj medarbejdere under Team</div>}
              </>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Månedsvisning kommer snart</div>
        )}
      </Card>
    </div>
  );
}
