import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin, User } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Booster {
  id: string;
  name: string;
  specialties: string[];
  hourly_rate: number;
  portfolio_image_url: string;
  location: string;
}

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booster, setBooster] = useState<Booster | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooster();
    }
  }, [id]);

  const fetchBooster = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('id, name, specialties, hourly_rate, portfolio_image_url, location')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setBooster(data);
    } catch (error) {
      console.error('Error fetching booster:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !booster) {
      toast.error("Udfyld venligst alle påkrævede felter");
      return;
    }

    setSubmitting(true);

    try {
      // Create booking datetime
      const bookingDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);

      const totalPrice = booster.hourly_rate * duration;

      const bookingData = {
        booster_id: booster.id,
        service_date: bookingDateTime.toISOString(),
        duration_hours: duration,
        total_price: totalPrice,
        status: 'pending',
        notes: notes || null,
        created_at: new Date().toISOString()
      };

      console.log('Booking data:', bookingData);
      
      // For now, just show success message since we don't have user auth
      toast.success("Booking anmodning sendt!");
      navigate(`/booking-confirmation`, { 
        state: { 
          booking: bookingData, 
          booster: booster 
        } 
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error("Der skete en fejl. Prøv igen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!booster) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/stylists" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Tilbage til Boosters
        </Link>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Booster ikke fundet</h2>
        </div>
      </div>
    );
  }

  const totalPrice = booster.hourly_rate * duration;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to={`/stylist/${booster.id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Tilbage til profil
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Book tid</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vælg dato</CardTitle>
                <CardDescription>
                  Vælg din foretrukne dag for behandlingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vælg tidspunkt</CardTitle>
                <CardDescription>
                  Vælg dit foretrukne tidspunkt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg et tidspunkt" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Varighed</CardTitle>
                <CardDescription>
                  Hvor mange timer skal behandlingen vare?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((hours) => (
                      <SelectItem key={hours} value={hours.toString()}>
                        {hours} time{hours > 1 ? 'r' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Særlige ønsker</CardTitle>
                <CardDescription>
                  Beskriv dine ønsker eller særlige behov (valgfrit)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="F.eks. 'Jeg ønsker naturlig makeup til bryllup' eller 'Har allergi overfor visse produkter'"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={submitting || !selectedDate || !selectedTime}
            >
              {submitting ? "Sender..." : `Book nu - ${totalPrice} kr`}
            </Button>
          </form>
        </div>

        {/* Booking Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Booking oversigt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <img
                  src={booster.portfolio_image_url}
                  alt={booster.name}
                  className="w-16 h-16 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{booster.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    {booster.location}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {booster.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dato:</span>
                  <span className="font-medium">
                    {selectedDate ? selectedDate.toLocaleDateString('da-DK') : 'Ikke valgt'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tidspunkt:</span>
                  <span className="font-medium">
                    {selectedTime || 'Ikke valgt'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Varighed:</span>
                  <span className="font-medium">
                    {duration} time{duration > 1 ? 'r' : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Timepris:</span>
                  <span className="font-medium">{booster.hourly_rate} kr</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">{totalPrice} kr</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;