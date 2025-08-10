import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface DiscountCode {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  amount: number;
  min_amount: number;
  active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  currency: string;
  salon_id: string | null;
  created_at: string;
}

export default function SalonDiscountCodes() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  // form state
  const [form, setForm] = useState({
    code: "",
    type: "percent" as 'percent' | 'fixed',
    amount: 10,
    min_amount: 0,
    active: true,
    valid_from: "",
    valid_to: "",
    currency: "DKK",
  });

  const init = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) { setLoading(false); return; }
    const { data: salon, error } = await supabase
      .from('salon_profiles')
      .select('id')
      .eq('owner_user_id', uid)
      .maybeSingle();
    if (error || !salon) { setLoading(false); return; }
    setSalonId(salon.id);
    await fetchCodes(salon.id);
  };

  const fetchCodes = async (sid = salonId) => {
    if (!sid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('salon_id', sid)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Kunne ikke hente rabatkoder');
    } else {
      setCodes(data as any);
    }
    setLoading(false);
  };

  useEffect(() => { init(); }, []);

  const handleCreate = async () => {
    if (!salonId) { toast.error('Ingen salon fundet'); return; }
    if (!form.code.trim()) { toast.error('Angiv en kode'); return; }
    try {
      const payload: any = {
        code: form.code.trim(),
        type: form.type,
        amount: Number(form.amount) || 0,
        min_amount: Number(form.min_amount) || 0,
        active: form.active,
        currency: form.currency,
        salon_id: salonId,
      };
      if (form.valid_from) payload.valid_from = new Date(form.valid_from).toISOString();
      if (form.valid_to) payload.valid_to = new Date(form.valid_to).toISOString();

      const { error } = await supabase.from('discount_codes').insert(payload);
      if (error) throw error;
      toast.success('Rabatkode oprettet');
      setForm({ code: "", type: "percent", amount: 10, min_amount: 0, active: true, valid_from: "", valid_to: "", currency: "DKK" });
      fetchCodes(salonId);
    } catch (e: any) {
      toast.error(e.message || 'Fejl ved oprettelse');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from('discount_codes').update({ active }).eq('id', id);
    if (error) toast.error('Kunne ikke opdatere'); else { fetchCodes(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) toast.error('Kunne ikke slette'); else { toast.success('Slettet'); fetchCodes(); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Rabatkoder – Salon | BeautyBoosters</title>
        <meta name="description" content="Opret og administrer dine salon rabatkoder" />
        <link rel="canonical" href="/salon/discount-codes" />
      </Helmet>
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Rabatkoder</h1>

      {!salonId ? (
        <div className="text-muted-foreground">Ingen salonprofil knyttet til din bruger.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Opret ny rabatkode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kode</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="FX: WELCOME10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Procent (%)</SelectItem>
                      <SelectItem value="fixed">Fast beløb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Beløb</Label>
                  <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minimumsbeløb</Label>
                <Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Gyldig fra</Label>
                  <Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Gyldig til</Label>
                  <Input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Aktiv</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v as boolean })} />
              </div>
              <Button className="w-full" onClick={handleCreate}>Opret kode</Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Eksisterende koder</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">Henter...</div>
              ) : codes.length === 0 ? (
                <div className="text-muted-foreground">Ingen koder endnu</div>
              ) : (
                <div className="space-y-2">
                  {codes.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-md border">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.code}</div>
                        <div className="text-sm text-muted-foreground truncate">{c.type === 'percent' ? `${c.amount}%` : `${c.amount} ${c.currency}`} • min {c.min_amount} DKK {c.valid_from ? `• fra ${new Date(c.valid_from).toLocaleDateString('da-DK')}` : ''} {c.valid_to ? `• til ${new Date(c.valid_to).toLocaleDateString('da-DK')}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={c.active} onCheckedChange={(v) => toggleActive(c.id, v as boolean)} />
                        <Button variant="destructive" size="sm" onClick={() => remove(c.id)}>Slet</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
