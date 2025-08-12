import React, { useEffect, useState } from 'react';
import { useLocation, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, MapPin, User, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Confirmation() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { booking, booster, customerInfo, paymentIntentId: statePaymentIntentId } = location.state || {};
  
  // Get payment intent ID from URL or state
  const paymentIntentId = searchParams.get('payment_intent') || statePaymentIntentId;
  
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    if (paymentIntentId) {
      // Verify payment status and get booking details
      checkPaymentStatus();
    }
  }, [paymentIntentId]);

  const checkPaymentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();

      if (error) throw error;
      
      setBookingDetails(data);
      setPaymentStatus('success');
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  };

  if (!paymentIntentId && (!booking || !booster)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Booking information mangler</h1>
          <p className="text-muted-foreground mb-6">Der opstod en fejl. Prøv igen.</p>
          <Button asChild>
            <Link to="/stylists">Tilbage til artister</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Bekræfter din booking...</h1>
          <p className="text-muted-foreground">Vent venligst mens vi behandler din betaling.</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Noget gik galt</h1>
          <p className="text-muted-foreground mb-6">Vi kunne ikke bekræfte din betaling. Kontakt os hvis beløbet er trukket.</p>
          <Button asChild>
            <Link to="/stylists">Prøv igen</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Use booking details from database if available, otherwise fall back to state
  const displayBooking = bookingDetails || booking;
  const displayBooster = bookingDetails ? { name: bookingDetails.booster_name } : booster;
  const displayCustomer = bookingDetails ? { 
    name: bookingDetails.customer_name,
    email: bookingDetails.customer_email 
  } : customerInfo;

  // Append-mode helpers
  const addHoursToTime = (timeStr: string, hours: number) => {
    if (!timeStr) return timeStr as any;
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h || 0, m || 0, 0, 0);
    const minutesToAdd = Math.round((hours || 0) * 60);
    date.setMinutes(date.getMinutes() + minutesToAdd);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  const parseAddressFromText = (text: string) => {
    const m = text?.match(/^(.*?),\s*(\d{4})\s+(.+)$/);
    if (m) return { street: m[1], postalCode: m[2], city: m[3] };
    return null;
  };
  const handleAppendService = () => {
    try {
      const start = (displayBooking as any)?.booking_time || (displayBooking as any)?.time;
      const duration = Number((displayBooking as any)?.duration_hours ?? (displayBooking as any)?.duration ?? 0);
      const nextTime = addHoursToTime(start, duration);
      const dateVal = (displayBooking as any)?.booking_date || (displayBooking as any)?.date;
      const stored = sessionStorage.getItem('bookingDetails');
      const details = stored ? JSON.parse(stored) : {};
      let loc = details.location;
      if (!loc) {
        const parsed = parseAddressFromText((displayBooking as any)?.location || '');
        if (parsed) loc = { address: parsed.street, postalCode: parsed.postalCode, city: parsed.city };
      }
      const newDetails = { ...details, date: dateVal, time: nextTime, ...(loc ? { location: loc } : {}) };
      sessionStorage.setItem('bookingDetails', JSON.stringify(newDetails));
      const boosterId = (bookingDetails as any)?.booster_id || (booster as any)?.id;
      if (boosterId) sessionStorage.setItem('appendBoosterId', boosterId);
      sessionStorage.setItem('appendMode', '1');
    } catch {}
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Booking bekræftet!</h1>
          <p className="text-muted-foreground">
            Din booking er nu bekræftet og beløbet er reserveret på dit kort.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Booking detaljer</CardTitle>
            <CardDescription>
              Her er dine booking detaljer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>
                {(() => {
                  const date = displayBooking.booking_date || displayBooking.date;
                  return typeof date === 'string' ? date : date?.toLocaleDateString?.('da-DK') || 'N/A';
                })()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>{displayBooking.booking_time || displayBooking.time} ({displayBooking.duration_hours || displayBooking.duration} timer)</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{displayBooking.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                 <p className="font-medium">{displayBooster.name}</p>
                 <p className="text-sm text-muted-foreground">Din artist</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Service:</span>
                <span>{displayBooking.service_name || displayBooking.service}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total reserveret:</span>
                <span>{displayBooking.amount || displayBooking.price} DKK</span>
              </div>
            </div>

            {displayCustomer && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Kontaktoplysninger:</h4>
                <p className="text-sm text-muted-foreground">{displayCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{displayCustomer.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Næste skridt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mt-0.5">1</div>
                <div>
                  <p className="font-medium">Artist bekræftelse</p>
                  <p className="text-sm text-muted-foreground">
                    Din artist vil bekræfte bookingen inden for 2 timer
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium mt-0.5">2</div>
                <div>
                  <p className="font-medium">Betaling gennemført</p>
                  <p className="text-sm text-muted-foreground">
                    Beløbet trækkes først når servicen er udført
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium mt-0.5">3</div>
                <div>
                  <p className="font-medium">Påmindelse</p>
                  <p className="text-sm text-muted-foreground">
                    Du modtager en SMS påmindelse 2 timer før din aftale
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Aflysningsbetingelser</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>24+ timer før:</strong> Gratis aflysning</li>
              <li>• <strong>6-24 timer før:</strong> 50% af prisen opkræves</li>
              <li>• <strong>Under 6 timer før:</strong> 100% af prisen opkræves</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brug for hjælp?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Hvis du har spørgsmål eller behov for at ændre din booking, er du altid velkommen til at kontakte os.
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> support@beautyboosters.dk</p>
              <p><strong>Telefon:</strong> +45 12 34 56 78</p>
              <p><strong>Åbningstid:</strong> Mandag-fredag 9-17</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 mt-8">
          <Button asChild className="flex-1">
            <Link to="/bookings">Mine bookinger</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link to="/services">Book mere</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}