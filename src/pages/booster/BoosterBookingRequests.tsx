import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { Check, X, Clock, MapPin, User, Phone, Mail, Calendar } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface BookingRequest {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  duration_hours: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  location: string;
  special_requests?: string;
  amount: number;
  booster_status: string;
}

const BoosterBookingRequests = () => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('booking-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `booster_status=eq.pending`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booster_status', 'pending')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast.error('Kunne ikke hente booking anmodninger');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (bookingId: string, action: 'accept' | 'reject') => {
    setProcessing(bookingId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('booster_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Booster profile not found');

      const { data, error } = await supabase.functions.invoke('handle-booking-response', {
        body: {
          bookingId,
          action,
          boosterId: profile.id
        }
      });

      if (error) throw error;

      if (action === 'accept') {
        toast.success('Booking accepteret! Den er nu tilføjet til din kalender.');
      } else {
        toast.info(data.message || 'Booking afvist');
      }

      fetchRequests();
    } catch (error: any) {
      console.error('Error handling booking response:', error);
      toast.error(error.message || 'Der opstod en fejl');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Booking Anmodninger</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Booking Anmodninger - BeautyBoosters</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booking Anmodninger</h2>
        <Badge variant="outline">
          {requests.length} {requests.length === 1 ? 'anmodning' : 'anmodninger'}
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Ingen pending booking anmodninger</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      {request.service_name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(request.booking_date), 'EEEE d. MMMM yyyy', { locale: da })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {request.booking_time.slice(0, 5)} ({request.duration_hours}t)
                      </div>
                    </div>
                  </div>
                  <Badge className="text-lg">
                    {request.amount} DKK
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Kunde:</span>
                        <span>{request.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${request.customer_email}`} className="hover:underline">
                          {request.customer_email}
                        </a>
                      </div>
                      {request.customer_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${request.customer_phone}`} className="hover:underline">
                            {request.customer_phone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Lokation:</span>
                        <span>{request.location}</span>
                      </div>
                    </div>
                  </div>

                  {request.special_requests && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Specielle ønsker:</p>
                      <p className="text-sm text-muted-foreground">{request.special_requests}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => handleResponse(request.id, 'accept')}
                      disabled={processing === request.id}
                      className="flex-1"
                      size="lg"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Acceptér Booking
                    </Button>
                    <Button
                      onClick={() => handleResponse(request.id, 'reject')}
                      disabled={processing === request.id}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Afvis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoosterBookingRequests;