import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PrintableGiftCard } from "@/components/giftcard/PrintableGiftCard";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_live_51QhO3hKPWTVQ25dUlUhbxkOCbYTlX3rFLZ7Yn8yFBKqG0xPOlMHWsZrYbcuTmkEjdkr5G4PjwmVk8pOo1L7bC6g800Bi6yBpjp");


function PaymentForm({ 
  giftCardData, 
  onSuccess 
}: { 
  giftCardData: any; 
  onSuccess: (code: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/giftcards`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message);
      setProcessing(false);
    } else {
      toast.success('Betaling gennemført!');
      onSuccess(giftCardData.code);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-6 rounded-lg min-h-[300px]">
        <PaymentElement 
          onReady={() => setIsLoading(false)}
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            }
          }} 
        />
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Indlæser betalingsmuligheder...</div>
          </div>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || processing || isLoading}>
        {processing ? 'Behandler...' : `Betal ${giftCardData.amount} DKK`}
      </Button>
    </form>
  );
}

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
  const [processing, setProcessing] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [giftCardCode, setGiftCardCode] = useState<string>('');

  const handleCreatePayment = async () => {
    if (!toName || !fromName) { toast.error('Udfyld venligst modtager og afsender'); return; }
    if (mode === 'amount' && (!amount || amount < 100)) { toast.error('Vælg et gyldigt beløb (min. 100 DKK)'); return; }
    if (mode === 'service' && !serviceName) { toast.error('Angiv servicenavn'); return; }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-giftcard-payment', {
        body: {
          amount: mode === 'amount' ? amount : (servicePrice || amount),
          toName, 
          fromName, 
          message,
          mode,
          serviceName: mode === 'service' ? serviceName : undefined,
          servicePrice: mode === 'service' && servicePrice ? Number(servicePrice) : undefined,
          validTo: validTo || undefined,
        }
      });
      if (error) throw error;
      setClientSecret(data.clientSecret);
      setGiftCardCode(data.code);
    } catch (e: any) {
      toast.error(e.message || 'Kunne ikke oprette betaling');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = (code: string) => {
    // Show options to send email or print
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
        {!clientSecret ? (
          <>
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

                <Button size="lg" className="w-full" onClick={handleCreatePayment} disabled={processing}>
                  {processing ? 'Opretter...' : 'Fortsæt til betaling'}
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
          </>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Gennemfør betaling</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  giftCardData={{ amount: mode === 'amount' ? amount : (servicePrice || amount), code: giftCardCode }}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!printData} onOpenChange={(open) => !open && setPrintData(null)}>
        <DialogContent className="max-w-4xl">
          {printData && <PrintableGiftCard {...printData} onClose={() => setPrintData(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
