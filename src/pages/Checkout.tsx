import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, Clock, MapPin, User, CreditCard, Check, Pencil, Plus, Trash2, FileText } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AssignBoostersDialog, { BoosterOption } from "@/components/boosters/AssignBoostersDialog";
import { Badge } from "@/components/ui/badge";
import SwipeToBook from "@/components/checkout/SwipeToBook";
import PaymentLogos from "@/components/checkout/PaymentLogos";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, booster, service, bookingDetails, counts, isDirectBooking, extraBoosters: initialExtraBoosters, cartItems } = location.state || {};
  
  // Check if this is a business booking
  const [clientType, setClientType] = useState<'privat' | 'virksomhed'>('privat');
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });

  // Business invoice fields
  const [invoiceInfo, setInvoiceInfo] = useState({
    cvr: '',
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [cvrVerified, setCvrVerified] = useState(false);
  const [verifyingCvr, setVerifyingCvr] = useState(false);
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerInfoLoaded, setCustomerInfoLoaded] = useState(false);

  // Step-based checkout: 1 = confirm booking, 2 = your info
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

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

  // Ekstra boosters tildeling - initialize from navigation state if available
  const [assignOpen, setAssignOpen] = useState(false);
  const [extraBoosters, setExtraBoosters] = useState<BoosterOption[]>(initialExtraBoosters || []);

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

  // Simulated saved card (in production this would come from Stripe)
  const [hasSavedCard] = useState(true);
  const savedCard = { last4: '4242', brand: 'Visa' };

  // Load client type from sessionStorage
  useEffect(() => {
    const storedClientType = sessionStorage.getItem('selectedClientType');
    if (storedClientType === 'virksomhed') {
      setClientType('virksomhed');
    }
  }, []);

  const timeSlots = Array.from({ length: 24 * 2 - 1 }).map((_, i) => {
    const hour = Math.floor(i / 2) + 0;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Auto-load user data and saved address for logged-in customers
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsLoggedIn(true);
        
        // Auto-fill customer info from auth user
        setCustomerInfo(prev => ({
          ...prev,
          email: user.email || prev.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || prev.name,
          phone: user.user_metadata?.phone || user.phone || prev.phone
        }));
        setCustomerInfoLoaded(true);
        
        // Load saved address if not already set
        if (!addressQuery) {
          const { data: addresses } = await supabase
            .from("customer_addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .limit(1);
          
          if (addresses && addresses.length > 0) {
            const defaultAddr = addresses[0];
            const fullAddress = `${defaultAddr.address}, ${defaultAddr.postal_code} ${defaultAddr.city}`;
            setAddressQuery(fullAddress);
          }
        }
      } else {
        setCustomerInfoLoaded(true);
      }
    };
    loadUserData();
  }, []);

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
          <Button onClick={() => navigate('/services')}>Tilbage til services</Button>
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
      toast.error(error.message || 'Der opstod en fejl under booking');
    } finally {
      setIsProcessing(false);
    }
  };

  // CVR verification for business bookings - auto-fills company details
  const verifyCVR = async () => {
    if (!invoiceInfo.cvr || invoiceInfo.cvr.length !== 8) {
      toast.error('CVR-nummer skal være 8 cifre');
      return;
    }

    setVerifyingCvr(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-cvr', {
        body: { cvr: invoiceInfo.cvr }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Auto-fill all company details from CVR
      setInvoiceInfo(prev => ({
        ...prev,
        companyName: data.name || '',
        // Auto-fill email if available from CVR data
        contactEmail: prev.contactEmail || data.email || '',
        contactPhone: prev.contactPhone || data.phone || ''
      }));
      setCvrVerified(true);
      toast.success(`Verificeret: ${data.name}`);
    } catch (error: any) {
      toast.error('Kunne ikke verificere CVR');
    } finally {
      setVerifyingCvr(false);
    }
  };

  // Business invoice booking handler
  const handleInvoiceBooking = async () => {
    if (!invoiceInfo.cvr || !cvrVerified || !invoiceInfo.contactEmail || !invoiceInfo.contactName) {
      toast.error('Udfyld venligst alle påkrævede faktura-felter');
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

      // Create job for business (invoice-based) booking
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          title: service.name,
          service_type: service.name,
          location: addressQuery,
          date_needed: formattedDate,
          time_needed: selectedTime,
          hourly_rate: Math.max(0, service.price - discount),
          client_type: 'virksomhed',
          client_name: invoiceInfo.companyName,
          client_email: invoiceInfo.contactEmail,
          client_phone: invoiceInfo.contactPhone,
          description: `CVR: ${invoiceInfo.cvr}\nKontaktperson: ${invoiceInfo.contactName}\n${customerInfo.specialRequests || ''}`,
          status: 'confirmed',
          duration_hours: service.duration || 2,
          boosters_needed: (counts?.boosters || 1),
          assigned_booster_id: booster.id,
          invoice_sent: false // Will be set true after admin approves and sends invoice
        })
        .select()
        .single();

      if (jobError) throw jobError;

      toast.success('Booking bekræftet! Faktura sendes på behandlingsdagen.');
      
      navigate('/confirmation', {
        state: {
          booking: {
            ...booking,
            id: jobData.id,
            date: bookingDate,
            time: selectedTime
          },
          booster,
          customerInfo: {
            name: invoiceInfo.contactName,
            email: invoiceInfo.contactEmail,
            phone: invoiceInfo.contactPhone,
            specialRequests: customerInfo.specialRequests
          },
          isBusinessBooking: true,
          companyName: invoiceInfo.companyName,
          cvr: invoiceInfo.cvr
        }
      });

    } catch (error: any) {
      toast.error(error.message || 'Der opstod en fejl under booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    // Business bookings use invoice flow
    if (clientType === 'virksomhed') {
      return handleInvoiceBooking();
    }

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
      toast.error(error.message || 'Der opstod en fejl under betalingen');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate total from all cart items
  // cartItems from CartContext have finalPrice, service has price
  const allCartItems = cartItems || [{ service, booster, booking }];
  const cartTotal = allCartItems.reduce((sum: number, item: any) => {
    // Handle both CartContext items (have finalPrice) and legacy single-service (has service.price)
    if (item.finalPrice !== undefined) {
      return sum + item.finalPrice;
    }
    return sum + (item.service?.price || service?.price || 0);
  }, 0);
  
  // Calculate VAT for business customers (25% moms on top)
  const subtotalAfterDiscount = Math.max(0, cartTotal - discount);
  const vatAmount = clientType === 'virksomhed' ? Math.round(subtotalAfterDiscount * 0.25) : 0;
  const finalTotal = subtotalAfterDiscount + vatAmount;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              currentStep === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">1</span>
              <span>Oversigt</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              currentStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              <span className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">2</span>
              <span>Betaling</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-center">
            {currentStep === 1 ? 'Din ordre' : 'Gennemfør betaling'}
          </h1>
        </div>
        
        {/* Step 1: Order Overview */}
        {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* All Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Din kurv ({allCartItems.length} {allCartItems.length === 1 ? 'service' : 'services'})</CardTitle>
              <CardDescription>Gennemgå dine valgte services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allCartItems.map((item: any, index: number) => (
                <div key={index} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{item.name || item.service?.name || service.name}</h4>
                    </div>
                    <span className="font-semibold">{item.finalPrice ?? item.service?.price ?? service.price} DKK</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {selectedDate?.toLocaleDateString('da-DK') || 'Dato ikke valgt'}
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedTime || 'Tid ikke valgt'}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Show all selected boosters */}
              {(booster || extraBoosters.length > 0) && (
                <div className="p-3 rounded-md bg-muted/50">
                  <span className="text-sm font-medium">Valgte boosters:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {booster && <Badge variant="outline">{booster.name}</Badge>}
                    {extraBoosters.map((b) => (
                      <Badge key={b.id} variant="outline">{b.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Address */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Leveringsadresse
                </Label>
                <div className="relative">
                  <Input
                    placeholder="F.eks. Husumgade 1, 2200 København N"
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                  />
                  {showSuggestions && addressQuery.trim().length >= 3 && suggestions.length > 0 && (
                    <div className="absolute mt-1 left-0 right-0 bg-background border rounded-md shadow z-50 max-h-56 overflow-auto">
                      {suggestions.slice(0,8).map((opt) => (
                        <div key={opt} className="px-3 py-2 hover:bg-accent cursor-pointer"
                          onMouseDown={(e) => { e.preventDefault(); setAddressQuery(opt); setShowSuggestions(false); }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={getCurrentLocation} disabled={isLoadingLocation}>
                  <MapPin className="mr-2 h-4 w-4" />
                  {isLoadingLocation ? 'Finder...' : 'Brug nuværende lokation'}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleEditBooking}>
                  <Pencil className="mr-2 h-4 w-4" />Rediger
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleAppendService}>
                  <Plus className="mr-2 h-4 w-4" />Tilføj service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Pris oversigt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allCartItems.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name || item.service?.name || service.name}</span>
                  <span>{item.finalPrice ?? item.service?.price ?? service.price} DKK</span>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between">
                <span>Subtotal {clientType === 'virksomhed' ? '(eks. moms)' : ''}</span>
                <span>{cartTotal} DKK</span>
              </div>

              {/* Promo code */}
              <div className="space-y-2">
                <Label>Rabatkode</Label>
                {appliedCode ? (
                  <div className="flex items-center justify-between p-2 rounded-md bg-green-50 dark:bg-green-950/30">
                    <span className="text-sm text-green-700 dark:text-green-300">{appliedCode} (-{discount} DKK)</span>
                    <Button variant="ghost" size="sm" onClick={handleRemovePromo}>Fjern</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Indtast kode" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                    <Button onClick={handleApplyPromo} disabled={applyingPromo || !promoCode.trim()}>Anvend</Button>
                  </div>
                )}
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Rabat</span>
                  <span>-{discount} DKK</span>
                </div>
              )}

              {/* Show VAT for business customers */}
              {clientType === 'virksomhed' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal efter rabat</span>
                    <span>{subtotalAfterDiscount} DKK</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Moms (25%)</span>
                    <span>+{vatAmount} DKK</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total {clientType === 'virksomhed' ? '(inkl. moms)' : 'at betale'}</span>
                <span>{finalTotal} DKK</span>
              </div>

              <Button className="w-full mt-4" size="lg" onClick={() => setCurrentStep(2)}>
                Fortsæt til betaling
              </Button>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Step 2: Customer Info & Payment */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information - Different for private vs business */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {clientType === 'virksomhed' ? 'Fakturering' : 'Dine oplysninger'}
                </CardTitle>
                <CardDescription>
                  {clientType === 'virksomhed' 
                    ? 'Udfyld virksomhedsoplysninger til fakturering'
                    : (isLoggedIn && customerInfo.email 
                      ? 'Vi har udfyldt dine oplysninger - tjek dem'
                      : 'Udfyld kontaktoplysninger')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientType === 'virksomhed' ? (
                  // Business invoice form - CVR first for auto-fill
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cvr">CVR-nummer *</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="cvr" 
                          placeholder="12345678 - vi henter virksomhedsinfo automatisk"
                          value={invoiceInfo.cvr}
                          onChange={(e) => {
                            setInvoiceInfo(prev => ({ ...prev, cvr: e.target.value.replace(/\D/g, '').slice(0, 8) }));
                            setCvrVerified(false);
                          }}
                          maxLength={8}
                        />
                        <Button 
                          type="button" 
                          variant={cvrVerified ? "outline" : "default"}
                          onClick={verifyCVR}
                          disabled={verifyingCvr || invoiceInfo.cvr.length !== 8}
                        >
                          {verifyingCvr ? 'Henter...' : cvrVerified ? <Check className="h-4 w-4" /> : 'Hent info'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Indtast CVR-nummer og klik "Hent info" for automatisk udfyldning
                      </p>
                    </div>

                    {/* Company name - shown after CVR verification, editable */}
                    {cvrVerified && (
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Virksomhedsnavn</Label>
                        <Input 
                          id="companyName" 
                          value={invoiceInfo.companyName}
                          onChange={(e) => setInvoiceInfo(prev => ({ ...prev, companyName: e.target.value }))}
                          className="bg-green-50 dark:bg-green-950/20 border-green-200"
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="contactName">Kontaktperson *</Label>
                      <Input 
                        id="contactName" 
                        placeholder="Dit navn"
                        value={invoiceInfo.contactName}
                        onChange={(e) => setInvoiceInfo(prev => ({ ...prev, contactName: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Faktura e-mail *</Label>
                      <Input 
                        id="contactEmail" 
                        type="email" 
                        placeholder="faktura@virksomhed.dk"
                        value={invoiceInfo.contactEmail}
                        onChange={(e) => setInvoiceInfo(prev => ({ ...prev, contactEmail: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Telefon</Label>
                      <Input 
                        id="contactPhone" 
                        placeholder="+45 12 34 56 78"
                        value={invoiceInfo.contactPhone}
                        onChange={(e) => setInvoiceInfo(prev => ({ ...prev, contactPhone: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="special-requests">Specielle ønsker (valgfrit)</Label>
                      <Textarea 
                        id="special-requests" 
                        placeholder="Har du nogle specielle ønsker?"
                        rows={3}
                        value={customerInfo.specialRequests}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                      />
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Fakturering:</strong> Faktura sendes automatisk til den angivne e-mail på behandlingsdagen. 
                        Admin godkender fakturaen inden afsendelse, i tilfælde af ændringer til booking.
                      </p>
                    </div>
                  </>
                ) : (
                  // Private customer form
                  <>
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
                        placeholder="Har du nogle specielle ønsker?"
                        rows={3}
                        value={customerInfo.specialRequests}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    Jeg accepterer {clientType === 'virksomhed' ? 'betalingsbetingelserne' : 'betalingsbetingelserne'} og{" "}
                    <a href="#" className="text-primary underline">privatlivspolitikken</a>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary & Payment */}
            <div className="space-y-6">
              {/* Mini Order Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ordre oversigt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allCartItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="font-medium">{item.name || item.service?.name || service.name}</span>
                      <span>{item.finalPrice ?? item.service?.price ?? service.price} DKK</span>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{selectedDate?.toLocaleDateString('da-DK')}</span>
                    <span>kl. {selectedTime}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{addressQuery}</div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Rabat ({appliedCode})</span>
                      <span>-{discount} DKK</span>
                    </div>
                  )}
                  {clientType === 'virksomhed' && (
                    <div className="flex justify-between text-sm">
                      <span>Moms (25%)</span>
                      <span>+{vatAmount} DKK</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total {clientType === 'virksomhed' ? '(inkl. moms)' : ''}</span>
                    <span>{finalTotal} DKK</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    <Pencil className="h-3 w-3 mr-1" /> Rediger ordre
                  </Button>
                </CardContent>
              </Card>

              {/* Payment - Different for private vs business */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {clientType === 'virksomhed' ? <FileText className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                    {clientType === 'virksomhed' ? 'Bekræft booking' : 'Betalingsmetode'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientType === 'virksomhed' ? (
                    // Business invoice flow
                    <>
                      <div className="p-4 bg-muted/50 rounded-lg mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Fakturering på behandlingsdagen</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ved booking af virksomhedsydelser sendes faktura automatisk på dagen for behandlingen. 
                          Admin gennemgår og godkender fakturaen inden afsendelse, så eventuelle ændringer til booking 
                          (fx. flere timers behandling) kan medtages.
                        </p>
                      </div>

                      <Button 
                        className="w-full"
                        size="lg" 
                        onClick={handlePayment}
                        disabled={isProcessing || !agreedToTerms || !cvrVerified || !invoiceInfo.contactEmail || !invoiceInfo.contactName}
                      >
                        {isProcessing ? 'Behandler...' : 'Bekræft booking'}
                      </Button>

                      <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Betaling:</strong> Faktura med betalingsfrist på 8 dage sendes efter behandlingen.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Afbestilling:</strong> Gratis afbestilling op til 24 timer før. Afbestilling 12-24 timer før: 25% gebyr. 
                          Afbestilling 6-12 timer før: 50% gebyr. Afbestilling under 6 timer før eller udeblivelse: 100% af beløbet.
                        </p>
                      </div>
                    </>
                  ) : (
                    // Private card payment flow
                    <>
                      <div className="p-4 bg-muted/50 rounded-lg mb-4">
                        <p className="text-sm text-muted-foreground mb-3">Vi accepterer:</p>
                        <PaymentLogos />
                      </div>
                      
                      {hasSavedCard && (
                        <div className="p-3 bg-muted/30 rounded-lg mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm">Gemt kort: •••• {savedCard.last4}</span>
                          </div>
                          <Badge>{savedCard.brand}</Badge>
                        </div>
                      )}

                      {hasSavedCard && agreedToTerms && customerInfo.name && customerInfo.email && customerInfo.phone ? (
                        <SwipeToBook
                          amount={finalTotal}
                          onComplete={handlePayment}
                          isProcessing={isProcessing}
                          savedCard={savedCard || undefined}
                        />
                      ) : (
                        <Button 
                          className="w-full"
                          size="lg" 
                          onClick={handlePayment}
                          disabled={isProcessing || !agreedToTerms || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {isProcessing ? 'Behandler...' : `Betal ${finalTotal} DKK`}
                        </Button>
                      )}

                      <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-2">
                        <p className="text-xs text-muted-foreground">
                          <strong>Reservation:</strong> Beløbet reserveres på dit kort og trækkes først når behandlingen er udført.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Afbestilling:</strong> Gratis afbestilling op til 24 timer før. Afbestilling 12-24 timer før: 25% gebyr. 
                          Afbestilling 6-12 timer før: 50% gebyr. Afbestilling under 6 timer før eller udeblivelse: 100% af beløbet.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

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