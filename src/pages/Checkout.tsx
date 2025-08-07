import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
            date: booking.date,
            time: booking.time,
            location: bookingDetails.address,
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span>{typeof booking.date === 'string' ? booking.date : booking.date?.toLocaleDateString?.('da-DK') || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span>{booking.time} ({booking.duration} timer)</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{booking.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span>{booking.booster}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Service:</span>
                <span>{booking.service}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>{booking.price} DKK</span>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
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