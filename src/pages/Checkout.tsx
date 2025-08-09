import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Clock, MapPin, User, CreditCard } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, booster, service, bookingDetails } = location.state || {};
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Editable booking state
  const [localBooking, setLocalBooking] = useState(booking);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    typeof booking.date === 'string' ? new Date(booking.date) : booking.date
  );
  const [selectedTime, setSelectedTime] = useState<string>(booking.time);

  // Address editing with autocomplete + current location
  const [addressQuery, setAddressQuery] = useState<string>(
    bookingDetails?.location
      ? `${bookingDetails.location.address}, ${bookingDetails.location.postalCode} ${bookingDetails.location.city}`
      : (booking.location || '')
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const timeSlots = Array.from({ length: 24 * 2 - 1 }).map((_, i) => {
    const hour = Math.floor(i / 2) + 0;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  useEffect(() => {
    try {
      // @ts-ignore
      if (navigator?.permissions?.query) {
        // @ts-ignore
        navigator.permissions.query({ name: 'geolocation' }).then((res: any) => {
          setHasLocationPermission(res.state === 'granted');
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Autocomplete
  useEffect(() => {
    const q = addressQuery.trim();
    if (q.length < 3) { setSuggestions([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = `https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(q)}&type=adresse&fuzzy=true&per_side=8`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        const opts = (Array.isArray(data) ? data : []).map((d: any) => d.tekst || d.forslagstekst || d.adressebetegnelse).filter(Boolean);
        setSuggestions(opts);
        setShowSuggestions(true);
      } catch {}
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [addressQuery]);

  const parseAddressFromText = (text: string) => {
    const m = text.match(/^(.*?),\s*(\d{4})\s+(.+)$/);
    if (m) return { street: m[1], postalCode: m[2], city: m[3] };
    return null;
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        let street = '', postalCode = '', city = '';
        const endpoints = [
          `https://api.dataforsyningen.dk/adresser/reverse?x=${coords.longitude}&y=${coords.latitude}&struktur=mini`,
          `https://api.dataforsyningen.dk/adgangsadresser/reverse?x=${coords.longitude}&y=${coords.latitude}&struktur=mini`,
        ];
        for (const url of endpoints) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const data = await r.json();
            const d = Array.isArray(data) ? data[0] : data;
            if (!d) continue;
            const vej = d.vejnavn || d.vejstykke?.navn || d.adgangsadresse?.vejstykke?.navn || '';
            const husnr = d.husnr || d.adgangsadresse?.husnr || '';
            street = [vej, husnr].filter(Boolean).join(' ').trim();
            postalCode = d.postnr || d.postnummer?.nr || d.adgangsadresse?.postnr || '';
            city = d.postnrnavn || d.postnummer?.navn || d.adgangsadresse?.postnummernavn || '';
            if (street && postalCode && city) break;
          } catch {}
        }
        const full = [street, `${postalCode} ${city}`].filter(Boolean).join(', ');
        setAddressQuery(full);
        setHasLocationPermission(true);
      } finally {
        setIsLoadingLocation(false);
      }
    }, () => setIsLoadingLocation(false), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };


  if (!booking || !booster) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Booking information mangler</h1>
          <p className="text-muted-foreground mb-6">Der opstod en fejl. Prøv igen.</p>
          <Button onClick={() => navigate('/stylists')}>Tilbage til stylists</Button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }
    
    if (!agreedToTerms) {
      toast.error('Du skal acceptere handelsbetingelserne for at fortsætte');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: service.price,
          customerEmail: customerInfo.email,
          bookingData: {
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            serviceName: service.name,
            boosterId: booster.id,
            boosterName: booster.name,
            date: selectedDate || booking.date,
            time: selectedTime,
            location: addressQuery,
            specialRequests: customerInfo.specialRequests
          }
        }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(`https://checkout.stripe.com/pay/${data.clientSecret}#fidkdWxOYHwnPyd1blpxYHZxWjA0YUNWSDdvNG5mT0ZNYnZddVdvU3BxQmgwPDdOTHJxPVNkdWBxVVJPYUBTcGhqTEtSMD1CSldVZl05NkFNQWBifUJGMDB1XGJxPEloM2FgPWNnYjR8VVc3Y10xf2BkdWV9MCcpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl`, '_blank');
      
      // Simulate successful payment for demo
      setTimeout(() => {
        navigate('/confirmation', {
          state: {
            booking,
            booster,
            customerInfo,
            paymentIntentId: data.paymentIntentId
          }
        });
      }, 3000);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Der opstod en fejl under betalingen');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Bekræft din booking</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking oversigt</CardTitle>
              <CardDescription>Redigér dato/tid og adresse inden betaling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Date */}
              <div className="space-y-2">
                <Label>Dato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? selectedDate.toLocaleDateString('da-DK') : "Vælg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        setSelectedDate(d);
                        setLocalBooking((prev: any) => ({ ...prev, date: d }));
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label>Tidspunkt</Label>
                <Select value={selectedTime} onValueChange={(v) => {
                  setSelectedTime(v);
                  setLocalBooking((prev: any) => ({ ...prev, time: v }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg tidspunkt" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50 max-h-72">
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label>Adresse</Label>
                <div className="relative">
                  <Input
                    placeholder="F.eks. Husumgade 1, 2200 København N"
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  />
                  {showSuggestions && addressQuery.trim().length >= 3 && (
                    <div className="absolute mt-1 left-0 right-0 bg-background border rounded-md shadow z-50 max-h-56 overflow-auto">
                      {suggestions.slice(0,8).map((opt) => (
                        <div
                          key={opt}
                          className="px-3 py-2 hover:bg-accent cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setAddressQuery(opt);
                            setShowSuggestions(false);
                            const parsed = parseAddressFromText(opt);
                            if (parsed) {
                              const full = `${parsed.street}, ${parsed.postalCode} ${parsed.city}`;
                              setLocalBooking((p: any) => ({ ...p, location: full }));
                              const stored = sessionStorage.getItem('bookingDetails');
                              try {
                                const bd = stored ? JSON.parse(stored) : {};
                                const newBD = {
                                  ...bd,
                                  location: { address: parsed.street, postalCode: parsed.postalCode, city: parsed.city },
                                };
                                sessionStorage.setItem('bookingDetails', JSON.stringify(newBD));
                              } catch {}
                            }
                          }}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={getCurrentLocation} disabled={isLoadingLocation} className="mt-2">
                    {isLoadingLocation ? (
                      <>
                        <div className="mr-2 h-4 w-4 rounded-full border-2 border-current border-b-transparent animate-spin" />
                        Finder lokation...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Brug nuværende lokation
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Service controls */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Service:</span>
                  <span>{service.name}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/services')}>Tilføj service</Button>
                  <Button variant="destructive" size="sm" onClick={() => navigate('/services')}>Fjern service</Button>
                </div>
              </div>

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>{service.price} DKK</span>
              </div>

              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Betalingsbetingelser:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Beløbet reserveres på dit kort indtil service er udført</li>
                  <li>• Aflysning 24+ timer før: Ingen gebyr</li>
                  <li>• Aflysning 6-24 timer før: 50% gebyr</li>
                  <li>• Aflysning under 6 timer før: 100% gebyr</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dine oplysninger</CardTitle>
              <CardDescription>
                Udfyld dine kontaktoplysninger for at gennemføre bookingen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fulde navn</Label>
                <Input 
                  id="name" 
                  placeholder="Indtast dit fulde navn"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="din@email.dk"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input 
                  id="phone" 
                  placeholder="+45 12 34 56 78"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="special-requests">Specielle ønsker (valgfrit)</Label>
                <Textarea 
                  id="special-requests" 
                  placeholder="Har du nogle specielle ønsker eller krav til behandlingen?"
                  rows={3}
                  value={customerInfo.specialRequests}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                />
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  Jeg accepterer betalingsbetingelserne og{" "}
                  <a href="#" className="text-primary underline">privatlivspolitikken</a>
                </Label>
              </div>
              
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handlePayment}
                disabled={isProcessing}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isProcessing ? 'Behandler...' : 'Reservér og betal'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}