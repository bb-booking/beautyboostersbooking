import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { da } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MapPin, User, Star, Send, CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}

interface Booster {
  id: string;
  name: string;
  specialties: string[];
  hourly_rate: number;
  portfolio_image_url: string | null;
  location: string;
  rating: number;
  review_count: number;
  years_experience: number;
  bio: string | null;
}

interface BookingDetails {
  serviceId: string;
  location: {
    address: string;
    postalCode: string;
    city: string;
  };
}

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { boosterId } = useParams();
  
  // Get service ID from URL (if coming from services) or use default if coming from booster
  const serviceId = searchParams.get('service') || '1'; // Default to basic makeup service
  
  // State
  const [service, setService] = useState<Service | null>(null);
  const [specificBooster, setSpecificBooster] = useState<Booster | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableBoosters, setAvailableBoosters] = useState<Booster[]>([]);
  const [nearbyBoosters, setNearbyBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoosters, setLoadingBoosters] = useState(false);
  const [loadingSpecificBooster, setLoadingSpecificBooster] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Generate time slots in 30-minute intervals from 06:00-23:00
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
    
    if (boosterId) {
      fetchSpecificBooster();
    }
    
    // Get booking details from sessionStorage or create default
    const savedDetails = sessionStorage.getItem('bookingDetails');
    if (savedDetails) {
      setBookingDetails(JSON.parse(savedDetails));
    } else if (boosterId) {
      // Create default booking details for direct booster booking
      setBookingDetails({
        serviceId: '1',
        location: {
          address: 'Kundens adresse',
          postalCode: '0000',
          city: 'Ikke specificeret'
        }
      });
    }
  }, [serviceId, boosterId]);

  useEffect(() => {
    if (selectedDate && selectedTime && bookingDetails) {
      if (boosterId) {
        checkSpecificBoosterAvailability();
      } else {
        fetchAvailableBoosters();
      }
    }
  }, [selectedDate, selectedTime, bookingDetails, boosterId]);

  const fetchService = async () => {
    try {
      // Mock service data - replace with actual API call
      const mockServices = {
        '1': { id: '1', name: 'Makeup Styling', price: 1999, duration: 1, category: 'Makeup & Hår' },
        '2': { id: '2', name: 'Bryllups Makeup', price: 2999, duration: 2, category: 'Makeup & Hår' },
        '3': { id: '3', name: 'Event Makeup', price: 1499, duration: 1, category: 'Makeup & Hår' },
      };
      
      const serviceData = mockServices[serviceId as keyof typeof mockServices];
      if (serviceData) {
        setService(serviceData);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error("Kunne ikke hente service information");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificBooster = async () => {
    if (!boosterId) return;
    
    setLoadingSpecificBooster(true);
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
        .eq('id', boosterId)
        .maybeSingle();

      if (error) throw error;
      setSpecificBooster(data);
    } catch (error) {
      console.error('Error fetching specific booster:', error);
      toast.error("Kunne ikke hente booster information");
    } finally {
      setLoadingSpecificBooster(false);
    }
  };

  const checkSpecificBoosterAvailability = async () => {
    if (!specificBooster) return;
    
    setLoadingBoosters(true);
    setShowFallback(false);
    
    try {
      // Mock availability check for specific booster
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate random availability (80% chance available)
      const isAvailable = Math.random() > 0.2;
      
      if (isAvailable) {
        setAvailableBoosters([specificBooster]);
      } else {
        setShowFallback(true);
        setNearbyBoosters([specificBooster]);
      }
    } catch (error) {
      console.error('Error checking booster availability:', error);
      setShowFallback(true);
      setNearbyBoosters([specificBooster]);
    } finally {
      setLoadingBoosters(false);
    }
  };

  const fetchAvailableBoosters = async () => {
    setLoadingBoosters(true);
    setShowFallback(false);
    
    try {
      // Mock availability check
      const mockAvailableBoosters: Booster[] = [];
      
      // Mock nearby boosters for fallback
      const mockNearbyBoosters: Booster[] = [
        {
          id: '1',
          name: 'Sarah Nielsen',
          specialties: ['Makeup', 'Bryllup', 'Event'],
          hourly_rate: 950,
          portfolio_image_url: '/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png',
          location: 'København',
          rating: 4.8,
          review_count: 127,
          years_experience: 5,
          bio: 'Professionel makeup artist med speciale i bryllups- og event makeup'
        },
        {
          id: '2',
          name: 'Maria Andersen',
          specialties: ['Makeup', 'Hår', 'Fashion'],
          hourly_rate: 1100,
          portfolio_image_url: '/lovable-uploads/abbb29f7-ab5c-498e-b6d4-df1c1ed999fc.png',
          location: 'Frederiksberg',
          rating: 4.9,
          review_count: 89,
          years_experience: 7,
          bio: 'Erfaren stylist med fokus på moderne trends og personlig stil'
        }
      ];

      // Simulate checking availability
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (mockAvailableBoosters.length === 0) {
        setShowFallback(true);
        setNearbyBoosters(mockNearbyBoosters);
      } else {
        setAvailableBoosters(mockAvailableBoosters);
      }
    } catch (error) {
      console.error('Error fetching boosters:', error);
      toast.error("Kunne ikke hente tilgængelige boosters");
    } finally {
      setLoadingBoosters(false);
    }
  };

  const handleBookBooster = (booster: Booster) => {
    if (!selectedDate || !selectedTime || !service) return;
    
    // Navigate to confirmation with all booking details
    navigate('/booking-confirmation', {
      state: {
        service,
        booster,
        date: selectedDate,
        time: selectedTime,
        location: bookingDetails?.location
      }
    });
  };

  const handleSendInquiry = (boosterId?: string) => {
    if (!selectedDate || !selectedTime || !service) return;
    
    const inquiryData = {
      service,
      date: selectedDate,
      time: selectedTime,
      location: bookingDetails?.location,
      boosterId
    };
    
    // Navigate to inquiry form or show success message
    toast.success("Forespørgsel sendt til booster netværket!");
    console.log('Inquiry data:', inquiryData);
  };

  if (loading || (boosterId && loadingSpecificBooster)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!service || (!bookingDetails && !boosterId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Tilbage til Services
        </Link>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Booking information mangler</h2>
          <p className="text-muted-foreground mb-4">Gå tilbage og vælg en service og lokation.</p>
          <Button asChild>
            <Link to="/services">Vælg Service</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to={boosterId ? `/stylist/${boosterId}` : "/services"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        {boosterId ? 'Tilbage til Booster' : 'Tilbage til Services'}
      </Link>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {boosterId && specificBooster ? `Book ${specificBooster.name}` : `Book ${service.name}`}
          </h1>
          <p className="text-muted-foreground">
            {bookingDetails?.location?.address ? (
              `${bookingDetails.location.address}, ${bookingDetails.location.postalCode} ${bookingDetails.location.city}`
            ) : (
              'Lokation specificeres under booking processen'
            )}
          </p>
        </div>

        {/* Date & Time Selection - Compact Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Vælg dato og tidspunkt
            </CardTitle>
            <CardDescription>
              Vælg dit foretrukne tidspunkt for behandlingen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Date Picker - Compact */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dato</Label>
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
                      {selectedDate ? format(selectedDate, "PPP", { locale: da }) : "Vælg dato"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => isBefore(date, startOfDay(new Date()))}
                      className={cn("rounded-md border pointer-events-auto")}
                      locale={da}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tidspunkt</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg tidspunkt" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Next Available Times Button */}
              <div className="space-y-2">
                <Label className="text-sm font-medium opacity-0">Næste</Label>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Show next available times close to requested time
                    const tomorrow = addDays(new Date(), 1);
                    setSelectedDate(tomorrow);
                    setSelectedTime("09:00");
                    toast.success("Viser næste ledige tider");
                  }}
                >
                  Vis næste ledige tider
                </Button>
              </div>
            </div>

            {/* Selected Summary */}
            {selectedDate && selectedTime && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    <strong>{format(selectedDate, 'EEEE d. MMMM yyyy', { locale: da })}</strong> kl. {selectedTime}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Summary - More Compact */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{service.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{service.category}</Badge>
                  <span className="text-sm text-muted-foreground">{service.duration} time{service.duration > 1 ? 'r' : ''}</span>
                </div>
              </div>
                <div className="text-right">
                  <div className="font-semibold">Fra {service.price} kr</div>
                  <div className="text-sm text-muted-foreground">
                    {bookingDetails?.location?.city || 'Lokation ikke specificeret'}
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Boosters */}
        {selectedDate && selectedTime && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {loadingBoosters ? 'Søger ledige tider...' : 
               showFallback ? (boosterId ? `${specificBooster?.name} er ikke ledig på dette tidspunkt` : 'Ingen ledige på dette tidspunkt') : 
               boosterId ? `Ledig tid for ${specificBooster?.name}` : 'Tilgængelige boosters'}
            </h2>

            {loadingBoosters ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-96 w-full" />
                ))}
              </div>
            ) : showFallback ? (
              <div className="space-y-6">
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <p className="text-orange-800">
                        Der er ingen boosters ledige på det valgte tidspunkt. Du kan sende en forespørgsel til vores booster-netværk.
                      </p>
                      <Button 
                        onClick={() => handleSendInquiry()}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send forespørgsel til alle boosters
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Eller send til specifikke boosters i området:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nearbyBoosters.map((booster) => (
                      <Card key={booster.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <img
                              src={booster.portfolio_image_url || '/placeholder.svg'}
                              alt={booster.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold">{booster.name}</h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-3 w-3" />
                                {booster.location}
                              </div>
                              <div className="flex items-center gap-1 text-sm mb-2">
                                <Star className="h-3 w-3 fill-current text-yellow-500" />
                                <span>{booster.rating}</span>
                                <span className="text-muted-foreground">({booster.review_count})</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mb-3">
                                {booster.specialties.slice(0, 2).map((specialty) => (
                                  <Badge key={specialty} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{booster.hourly_rate} kr/time</span>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendInquiry(booster.id)}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Send forespørgsel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableBoosters.map((booster) => (
                  <Card key={booster.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={booster.portfolio_image_url || '/placeholder.svg'}
                            alt={booster.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">{booster.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                              <MapPin className="h-3 w-3" />
                              {booster.location}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              <span>{booster.rating}</span>
                              <span className="text-muted-foreground">({booster.review_count})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {booster.specialties.map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>

                        {booster.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {booster.bio}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-medium">{booster.hourly_rate} kr/time</span>
                          <Button 
                            onClick={() => handleBookBooster(booster)}
                            size="sm"
                          >
                            Vælg booster
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;