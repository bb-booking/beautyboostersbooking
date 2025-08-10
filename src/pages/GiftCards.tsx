import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function GiftCards() {
  const [mode, setMode] = useState<'amount' | 'service'>('amount');
  const [amount, setAmount] = useState<number>(500);
  const presets = [250, 500, 750, 1000];
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number | ''>('');
  const [toName, setToName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [message, setMessage] = useState('');
  const [validTo, setValidTo] = useState<string>('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!toName || !toEmail || !fromName) { toast.error('Udfyld venligst modtager og afsender'); return; }
    if (mode === 'amount' && (!amount || amount < 100)) { toast.error('Vælg et gyldigt beløb (min. 100 DKK)'); return; }
    if (mode === 'service' && !serviceName) { toast.error('Angiv servicenavn'); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-giftcard', {
        body: {
          toName, toEmail, fromName, message,
          mode,
          amount: mode === 'amount' ? amount : undefined,
          serviceName: mode === 'service' ? serviceName : undefined,
          servicePrice: mode === 'service' && servicePrice ? Number(servicePrice) : undefined,
          validTo: validTo || undefined,
        }
      });
      if (error) throw error;
      toast.success('Gavekort sendt! Tjek din e-mail.');
      setToName(''); setToEmail(''); setFromName(''); setMessage('');
      setMode('amount'); setAmount(500); setServiceName(''); setServicePrice(''); setValidTo('');
    } catch (e: any) {
      toast.error(e.message || 'Kunne ikke sende gavekort');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Køb gavekort | BeautyBoosters</title>
        <meta name="description" content="Køb gavekort til BeautyBoosters. Vælg beløb eller service og få det sendt på mail." />
        <link rel="canonical" href="/giftcards" />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Køb gavekort</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Udfyld oplysninger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Til (navn)</Label>
                <Input value={toName} onChange={(e) => setToName(e.target.value)} placeholder="Modtagers navn" />
              </div>
              <div className="space-y-2">
                <Label>Til (e-mail)</Label>
                <Input type="email" value={toEmail} onChange={(e) => setToEmail(e.target.value)} placeholder="modtager@mail.dk" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fra</Label>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Dit navn" />
            </div>
            <div className="space-y-2">
              <Label>Personlig hilsen (valgfri)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Skriv en kort hilsen..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as 'amount' | 'service')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Beløb</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gyldig til</Label>
                <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} />
                <div className="text-xs text-muted-foreground">Vælg slutdato (ellers 24 mdr. fra i dag)</div>
              </div>
            </div>

            {mode === 'amount' ? (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {presets.map((p) => (
                    <Button key={p} type="button" variant={amount === p ? "default" : "outline"} onClick={() => setAmount(p)}>
                      {p} DKK
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Andet beløb</Label>
                  <Input type="number" min={100} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Fx. Brudestyling" />
                </div>
                <div className="space-y-2">
                  <Label>Service pris (valgfri)</Label>
                  <Input type="number" min={0} value={servicePrice} onChange={(e) => setServicePrice(e.target.value ? Number(e.target.value) : '')} placeholder="Fx. 1200" />
                </div>
              </div>
            )}

            <Button size="lg" className="w-full" onClick={handleSubmit} disabled={sending}>
              {sending ? 'Sender...' : 'Send gavekort på e-mail'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sådan fungerer det</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Vælg beløb eller angiv en service</li>
              <li>Modtageren får gavekortet som e-mail</li>
              <li>Koden bruges som rabatkode ved checkout</li>
              <li>Gyldig indtil den valgte dato</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
