import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Clock, MapPin, User, CreditCard, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AssignBoostersDialog, { BoosterOption } from "@/components/boosters/AssignBoostersDialog";
import { Badge } from "@/components/ui/badge";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, booster, service, bookingDetails, counts, isDirectBooking } = location.state || {};
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Editable booking state
  const [localBooking, setLocalBooking] = useState(booking);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    booking?.date ? (typeof booking.date === 'string' ? new Date(booking.date) : booking.date) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(booking?.time || '');

  // Ekstra boosters tildeling
  const [assignOpen, setAssignOpen] = useState(false);
  const [extraBoosters, setExtraBoosters] = useState<BoosterOption[]>([]);

  // Address editing with autocomplete + current location
  const [addressQuery, setAddressQuery] = useState<string>(
    bookingDetails?.location
      ? `${bookingDetails.location.address}, ${bookingDetails.location.postalCode} ${bookingDetails.location.city}`
      : (booking?.location || '')
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

  // Åbn dialog automatisk hvis der er valgt flere boosters end 1
  useEffect(() => {
    if ((counts?.boosters ?? 1) > 1 && extraBoosters.length === 0) {
      setAssignOpen(true);
    }
  }, [counts, extraBoosters.length]);

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
          <Button onClick={() => navigate('/stylists')}>Tilbage til artister</Button>
        </div>
      </div>
    );
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      setApplyingPromo(true);
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .ilike('code', promoCode.trim())
        .eq('active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error('Ugyldig rabatkode');
        return;
      }
      const now = new Date();
      const vt = data.valid_to ? new Date(data.valid_to) : null;
      if (vt && vt < now) {
        toast.error('Koden er udløbet');
        return;
      }
      if (service.price < (data.min_amount ?? 0)) {
        toast.error('Ordren opfylder ikke minimumsbeløbet for denne kode');
        return;
      }

      // Validate usage limits
      if (data.max_redemptions) {
        const { count: totalUsed, error: countErr } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('discount_code', data.code)
          .not('payment_captured_at', 'is', null);
        if (countErr) throw countErr;
        if ((totalUsed || 0) >= data.max_redemptions) {
          toast.error('Koden er allerede brugt det maksimale antal gange');
          return;
        }
      }

      if (data.per_user_limit) {
        if (!customerInfo.email) {
          toast.error('Angiv din e-mail før du anvender denne kode');
          return;
        }
        const { count: userUsed, error: userErr } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('discount_code', data.code)
          .eq('customer_email', customerInfo.email)
          .not('payment_captured_at', 'is', null);
        if (userErr) throw userErr;
        if ((userUsed || 0) >= data.per_user_limit) {
          toast.error('Du har allerede brugt denne kode det maksimale antal gange');
          return;
        }
      }

      // Calculate discount
      let d = 0;
      const amt = Number(data.amount) || 0;
      if (data.type === 'percent') {
        d = Math.floor((service.price * amt) / 100);
      } else {
        d = amt;
      }
      d = Math.min(d, service.price);
      setDiscount(d);
      setAppliedCode(data.code);
      toast.success('Rabatkode anvendt');
    } catch (e: any) {
      console.error('Promo apply error', e);
      toast.error('Kunne ikke anvende rabatkoden');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setDiscount(0);
    setAppliedCode(null);
    setPromoCode('');
  };

  // Append-mode helpers: compute next start time and persist context
  const addHoursToTime = (timeStr: string, hours: number) => {
    if (!timeStr) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h || 0, m || 0, 0, 0);
    const minutesToAdd = Math.round((hours || 0) * 60);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleAppendService = () => {
    try {
      const nextTime = addHoursToTime(selectedTime, service.duration);
      const stored = sessionStorage.getItem('bookingDetails');
      const details = stored ? JSON.parse(stored) : {};
      
      // Preserve existing services and add new service with updated time
      const existingServices = details.services || [service];
      const newDetails = {
        ...details,
        services: existingServices, // Keep existing services
        date: (selectedDate || booking.date),
        time: nextTime,
        appendingService: true, // Flag to indicate we're adding, not replacing
      };
      sessionStorage.setItem('bookingDetails', JSON.stringify(newDetails));
      sessionStorage.setItem('appendBoosterId', booster.id);
      sessionStorage.setItem('appendMode', '1');
    } catch {}
    navigate('/services');
  };

  // Navigate back to edit the booking (change service, date, time)
  const handleEditBooking = () => {
    try {
      const stored = sessionStorage.getItem('bookingDetails');
      const details = stored ? JSON.parse(stored) : {};
      
      const newDetails = {
        ...details,
        boosterId: booster.id,
        date: (selectedDate || booking.date),
        time: selectedTime,
        editMode: true, // Flag to indicate we're editing
      };
      sessionStorage.setItem('bookingDetails', JSON.stringify(newDetails));
    } catch {}
    
    // Navigate back to booking page with booster context to allow service selection
    navigate(`/booking?booster=${booster.id}&edit=true`);
  };

  // Direct booking handler - creates confirmed booking without payment approval
  const handleDirectBooking = async () => {
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
      const bookingDate = selectedDate || booking.date;
      const formattedDate = bookingDate instanceof Date 
        ? bookingDate.toISOString().split('T')[0] 
        : new Date(bookingDate).toISOString().split('T')[0];

      // Create confirmed booking directly
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          service_name: service.name,
          booster_id: booster.id,
          booster_name: booster.name,
          booking_date: formattedDate,
          booking_time: selectedTime,
          location: addressQuery,
          special_requests: customerInfo.specialRequests,
          discount_code: appliedCode,
          discount_amount: discount,
          amount: Math.max(0, service.price - discount),
          status: 'confirmed', // Directly confirmed since time was available
          booster_status: 'accepted', // Auto-accepted since booster marked as available
          duration_hours: service.duration,
          cancellation_policy_accepted: true
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update booster_availability to mark the slot as booked
      const { error: availError } = await supabase
        .from('booster_availability')
        .update({ 
          status: 'booked',
          notes: JSON.stringify({
            booking_id: bookingData.id,
            customer_name: customerInfo.name,
            service: service.name
          })
        })
        .eq('booster_id', booster.id)
        .eq('date', formattedDate)
        .lte('start_time', selectedTime)
        .gte('end_time', selectedTime);

      if (availError) {
        console.error('Could not update availability:', availError);
        // Non-blocking - booking is still valid
      }

      toast.success('Booking bekræftet!');
      
      navigate('/confirmation', {
        state: {
          booking: {
            ...booking,
            id: bookingData.id,
            date: bookingDate,
            time: selectedTime
          },
          booster,
          customerInfo,
          isDirectBooking: true
        }
      });

    } catch (error: any) {
      console.error('Direct booking error:', error);
      toast.error(error.message || 'Der opstod en fejl under booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    // If this is a direct booking from available slot, use handleDirectBooking
    if (isDirectBooking) {
      return handleDirectBooking();
    }

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
      const amountToCharge = Math.max(0, service.price - discount);
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: amountToCharge,
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
              specialRequests: customerInfo.specialRequests,
              discountCode: appliedCode,
              discountAmount: discount,
              peopleCount: counts?.people,
              boostersCount: counts?.boosters,
              extraBoosterIds: extraBoosters.map(b => b.id),
              extraBoosterNames: extraBoosters.map(b => b.name)
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
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Bekræft din booking</h1>
          {isDirectBooking && (
            <Badge className="bg-green-500 text-white hover:bg-green-600">
              Direkte booking
            </Badge>
          )}
        </div>
        
        {isDirectBooking && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Ledig tid valgt!</strong> Denne tid er ledig i {booster.name}s kalender og vil blive bekræftet med det samme.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking oversigt</CardTitle>
              <CardDescription>
                {isDirectBooking 
                  ? 'Tjek dine oplysninger - bookingen bekræftes med det samme' 
                  : 'Redigér dato/tid og adresse inden betaling'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Top-oversigt */}
              <div className="p-3 rounded-md bg-muted/50">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Service: {service.name}</Badge>
                  <Badge variant="outline">Varighed: {service.duration} t</Badge>
                  {counts?.people ? (<Badge variant="outline">Personer: {counts.people}</Badge>) : null}
                  {counts?.boosters ? (<Badge variant="outline">Boosters: {counts.boosters}</Badge>) : null}
                  <Badge variant="outline">
                    Dato: {(selectedDate || booking.date)
                      ? (selectedDate
                          ? selectedDate.toLocaleDateString('da-DK')
                          : (typeof booking.date === 'string'
                              ? new Date(booking.date).toLocaleDateString('da-DK')
                              : (booking.date as Date).toLocaleDateString('da-DK')))
                      : 'Ikke valgt'}
                  </Badge>
                  <Badge variant="outline">Tid: {selectedTime || booking.time}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">Boosters:</span>
                  <Badge variant="secondary">{booster.name} (primær)</Badge>
                  {extraBoosters.map((b) => (
                    <Badge key={b.id} variant="outline">{b.name}</Badge>
                  ))}
                  {!isDirectBooking && (
                    <div className="ml-auto">
                      <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                        Vælg/administrér ekstra booster(s)
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Dato</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isDirectBooking}
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
                <Select 
                  value={selectedTime} 
                  onValueChange={(v) => {
                    setSelectedTime(v);
                    setLocalBooking((prev: any) => ({ ...prev, time: v }));
                  }}
                  disabled={isDirectBooking}
                >
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
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valgt service:</span>
                  <span className="truncate max-w-[60%] text-right">{service.name}</span>
                </div>
                
                {/* Edit booking button - prominent */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleEditBooking}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rediger booking (ændre service, dato, tid)
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleAppendService}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tilføj ekstra service
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/services')}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Fjern
                  </Button>
                </div>
              </div>

              {/* Rabatkode */}
              <div className="space-y-2">
                <Label>Rabatkode</Label>
                {appliedCode ? (
                  <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                    <span className="text-sm">Anvendt: {appliedCode} (-{discount} DKK)</span>
                    <Button variant="ghost" size="sm" onClick={handleRemovePromo}>
                      Fjern
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Indtast rabatkode"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button onClick={handleApplyPromo} disabled={applyingPromo || !promoCode.trim()}>
                      Anvend
                    </Button>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="space-y-1">
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Rabat</span>
                    <span>-{discount} DKK</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>{Math.max(0, service.price - discount)} DKK</span>
                </div>
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
                className={cn("w-full", isDirectBooking && "bg-green-600 hover:bg-green-700")}
                size="lg" 
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isDirectBooking ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Bekræfter...' : 'Bekræft booking'}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Behandler...' : 'Reservér og betal'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <AssignBoostersDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          primaryBoosterId={booster.id}
          date={selectedDate || booking.date}
          time={selectedTime}
          serviceCategory={service.category}
          desiredCount={Math.max(0, (counts?.boosters ?? 1) - 1)}
          onAutoAssign={async (allQualified) => {
            // Create booking requests for all qualified boosters
            // This will be handled after payment is completed
            console.log('Will send requests to qualified boosters:', allQualified.length);
            toast.success(`Sender forespørgsel til ${allQualified.length} kvalificerede boosters`);
            setExtraBoosters(allQualified);
            setAssignOpen(false);
          }}
          onConfirm={(sel) => setExtraBoosters(sel)}
        />

      </div>
    </div>
  );
}