import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const MAIN_CATEGORIES = [
  "Makeup & Hår",
  "Bryllup - Brudestyling",
  "Event",
  "Shoot/reklame",
  "Specialister til projekt",
];

export default function SalonServices() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [services, setServices] = useState<Array<{ id: string; name: string; category: string; price: number; duration_minutes: number }>>([]);
  const [form, setForm] = useState({ name: "", category: "", price: "", duration: "60" });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;
      const { data: salon } = await supabase.from("salon_profiles").select("id").eq("owner_user_id", userId).maybeSingle();
      if (salon?.id) {
        setSalonId(salon.id);
        const { data: svcs } = await supabase.from("salon_services").select("id,name,category,price,duration_minutes").eq("salon_id", salon.id).order("name");
        setServices(svcs || []);
      }
    };
    load();
  }, []);

  const addService = async () => {
    if (!salonId || !form.name.trim() || !form.category || !form.price) return;
    const payload = {
      salon_id: salonId,
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      duration_minutes: Number(form.duration || "60"),
    };
    const { data, error } = await supabase.from("salon_services").insert(payload).select("id,name,category,price,duration_minutes").single();
    if (!error && data) {
      setServices((prev) => [...prev, data]);
      setForm({ name: "", category: "", price: "", duration: "60" });
    }
  };

  const removeService = async (id: string) => {
    await supabase.from("salon_services").delete().eq("id", id);
    setServices((prev) => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Services – Beauty Boosters</title>
        <meta name="description" content="Opret og administrer salonens services og underkategorier." />
        <link rel="canonical" href={`${window.location.origin}/salon/services`} />
      </Helmet>
      <h1 className="text-2xl font-bold">Services</h1>
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Label>Navn</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Service navn" />
          </div>
          <div>
            <Label>Hovedkategori</Label>
            <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Vælg kategori" /></SelectTrigger>
              <SelectContent>
                {MAIN_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pris (DKK)</Label>
            <Input type="number" inputMode="numeric" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <Label>Varighed (min)</Label>
            <Input type="number" inputMode="numeric" value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))} />
          </div>
          <div className="md:col-span-5 flex justify-end"><Button onClick={addService} disabled={!salonId}>Tilføj service</Button></div>
        </div>
        <div className="divide-y">
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.category} · {s.duration_minutes} min · {s.price} DKK</div>
              </div>
              <Button variant="outline" onClick={() => removeService(s.id)}>Fjern</Button>
            </div>
          ))}
          {services.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Ingen services endnu. Tilføj dine services for at kunne booke hurtigt i kalenderen.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
