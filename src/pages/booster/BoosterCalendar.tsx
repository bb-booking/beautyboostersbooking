import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { addDays, addMinutes, format, isEqual, startOfDay, startOfWeek } from "date-fns";
import { Plus } from "lucide-react";

interface BoosterEvent {
  id: string;
  date: string; // yyyy-mm-dd
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss
  status: string | null;
  notes: string | null; // JSON string with details {service, customer_name, customer_phone, duration_minutes}
}

type View = "day" | "week";

type CreateForm = {
  service: string;
  duration: number; // minutes
  customer_name: string;
  customer_phone: string;
  customer_email: string;
};

const DEFAULT_FORM: CreateForm = {
  service: "",
  duration: 60,
  customer_name: "",
  customer_phone: "",
  customer_email: "",
};

export default function BoosterCalendar() {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [events, setEvents] = useState<BoosterEvent[]>([]);
  const [openSlot, setOpenSlot] = useState<{ day: Date; time: string } | null>(null);
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [userId, setUserId] = useState<string | null>(null);

  // Init user and load events
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      await fetchEvents(session.user.id, date, view);
    };
    init();
  }, []);

  // Reload when date/view changes
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

    if (!error) setEvents(data as BoosterEvent[]);
  };

  // Time grid: 07:00 – 21:00 in 30-minute steps
  const times = useMemo(() => {
    const arr: string[] = [];
    const startH = 7;
    const endH = 21;
    for (let h = startH; h <= endH; h++) {
      arr.push(`${String(h).padStart(2, "0")}:00`);
      if (h !== endH) arr.push(`${String(h).padStart(2, "0")}:30`);
    }
    return arr;
  }, []);

  const days = useMemo(() => {
    if (view === "day") return [date];
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(monday, i));
  }, [date, view]);

  const getDayEvents = (d: Date) => {
    const key = format(d, "yyyy-MM-dd");
    return events.filter((e) => e.date === key);
  };

  // Helpers
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
      return minutes >= s && minutes < en; // inside event window
    });
  };

  const hasOverlap = (d: Date, startTime: string, durationMin: number) => {
    const key = format(d, "yyyy-MM-dd");
    const sNew = timeToMinutes(startTime + ":00");
    const eNew = sNew + durationMin;
    return getDayEvents(d).some((e) => {
      const s = timeToMinutes(e.start_time);
      const en = timeToMinutes(e.end_time);
      return s < eNew && sNew < en; // overlap
    });
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
    await supabase.from("booster_availability").delete().eq("id", id);
    if (userId) await fetchEvents(userId, date, view);
  };

  const parseNotes = (e: BoosterEvent) => {
    try { return e.notes ? JSON.parse(e.notes) as any : {}; } catch { return {}; }
  };

  const headerTitle = view === "day"
    ? format(date, "PPP")
    : `${format(days[0], "P")} – ${format(days[6], "P")}`;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Min kalender – Beauty Boosters</title>
        <meta name="description" content="Dag- og ugekalender for booster med 30-minutters tidsintervaller." />
        <link rel="canonical" href={`${window.location.origin}/booster/calendar`} />
      </Helmet>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Min kalender</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setDate(addDays(date, view === "day" ? -1 : -7))}>Forrige</Button>
          <Button variant="outline" onClick={() => setDate(startOfDay(new Date()))}>I dag</Button>
          <Button variant="outline" onClick={() => setDate(addDays(date, view === "day" ? 1 : 7))}>Næste</Button>
          <Select value={view} onValueChange={(v) => setView(v as View)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Visning" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="week">Uge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground mb-2">{headerTitle}</div>
        <div className="grid" style={{ gridTemplateColumns: `120px repeat(${view === "day" ? 1 : 7}, minmax(220px, 1fr))` }}>
          {/* Header row */}
          <div />
          {days.map((d) => (
            <div key={format(d, "yyyy-MM-dd")} className="px-3 py-2 border-b font-medium">
              {format(d, "EEE d/M")}
            </div>
          ))}

          {/* Rows */}
          {times.map((t) => (
            <>
              <div key={`time-${t}`} className="border-t px-2 text-xs text-muted-foreground h-12 flex items-start pt-2">{t}</div>
              {days.map((d) => {
                const dayKey = format(d, "yyyy-MM-dd");
                const booked = slotIsBooked(d, t);
                // Event starting exactly at this slot
                const startingHere = getDayEvents(d).filter((e) => e.start_time.startsWith(t));
                return (
                  <div key={`${dayKey}-${t}`} className={`border-t border-l h-12 group relative ${booked ? "bg-muted/40" : ""}`}>
                    {/* Add button */}
                    {!booked && (
                      <Dialog open={!!(openSlot && isEqual(openSlot.day, d) && openSlot.time === t)} onOpenChange={(o) => { if (!o) setOpenSlot(null); }}>
                        <DialogTrigger asChild>
                          <button className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onClick={() => setOpenSlot({ day: d, time: t })}>
                            <Plus className="h-4 w-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ny booking – {format(d, "PPP")} kl. {t}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div>
                              <Label>Service</Label>
                              <Input value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))} placeholder="Service" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label>Varighed (min)</Label>
                                <Input type="number" min={5} step={5} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value || 0) }))} />
                              </div>
                              <div>
                                <Label>Kunde</Label>
                                <Input value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} placeholder="Navn" />
                              </div>
                              <div>
                                <Label>Telefon</Label>
                                <Input value={form.customer_phone} onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))} placeholder="Telefon" />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" onClick={() => setOpenSlot(null)}>Annuller</Button>
                              <Button onClick={createEvent} disabled={!form.service.trim() || form.duration <= 0}>Opret booking</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Events that start at this exact time */}
                    {startingHere.map((e) => {
                      const meta = parseNotes(e);
                      return (
                        <div key={e.id} className="absolute inset-0 px-2 py-1">
                          <div className="h-full w-full rounded-md bg-primary/10 border border-primary/20 text-xs p-2 flex flex-col">
                            <div className="font-medium truncate">{meta.service || "Booking"}</div>
                            <div className="text-muted-foreground truncate">
                              {e.start_time.slice(0,5)}–{e.end_time.slice(0,5)} · {meta.customer_name || ""}
                            </div>
                            <div className="mt-auto flex justify-end">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={() => deleteEvent(e.id)}>Slet</Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </Card>
    </div>
  );
}
