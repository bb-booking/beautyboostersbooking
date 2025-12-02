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
import { useCart } from "@/contexts/CartContext";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { BoosterAssignment } from "@/components/booking/BoosterAssignment";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  description?: string;
  groupPricing?: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
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
  const { items: cartItems, removeFromCart, getTotalPrice, getTotalDuration } = useCart();
  
  // Get service ID from URL or determine from booster specialties
  const [determinedServiceId, setDeterminedServiceId] = useState<string>(searchParams.get('service') || '');
  const serviceId = determinedServiceId;
  
  // State
  const [service, setService] = useState<Service | null>(null);
  const [boosterServices, setBoosterServices] = useState<Service[]>([]);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [specificBooster, setSpecificBooster] = useState<Booster | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [selectedCounts, setSelectedCounts] = useState<{people: number; boosters: number; extraHours?: number} | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableBoosters, setAvailableBoosters] = useState<Booster[]>([]);
  const [nearbyBoosters, setNearbyBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoosters, setLoadingBoosters] = useState(false);
  const [loadingSpecificBooster, setLoadingSpecificBooster] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [boosterAssignments, setBoosterAssignments] = useState<Map<number, Booster[]>>(new Map());

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

  // Function to map specialties to service IDs (updated to match all Services.tsx)
  const getServiceIdFromSpecialties = (specialties: string[]): string => {
    const serviceMap: { [key: string]: string } = {
      'Spraytan': '4',
      'Makeup': '1',
      'Bryllup': '8', // Default bryllup til basis styling
      'Event': '16',
      'Shoot/Reklame': '20',
      'SFX': '23',
      'Hår': '2',
      'Hårstyling': '2',
      'Fashion': '1',
      'Konfirmation': '5',
      'Makeup Kurser': '14',
      'Børn': '17'
    };

    // Find the first matching specialty or default to basic makeup
    for (const specialty of specialties) {
      if (serviceMap[specialty]) {
        return serviceMap[specialty];
      }
    }
    return '1'; // Default to basic makeup
  };

  useEffect(() => {
    if (boosterId) {
      fetchSpecificBooster();
    }
    
    // Get booking details from sessionStorage or create default
    const savedDetails = sessionStorage.getItem('bookingDetails');
    if (savedDetails) {
      try {
        const parsed = JSON.parse(savedDetails);
        setBookingDetails(parsed);
        if (parsed.date) {
          const d = new Date(parsed.date);
          if (!isNaN(d.getTime())) setSelectedDate(d);
        }
        if (parsed.time) setSelectedTime(parsed.time);
      } catch {}
    } else if (boosterId) {
      // Create default booking details for direct booster booking
      setBookingDetails({
        serviceId: determinedServiceId || '1',
        location: {
          address: 'Kundens adresse',
          postalCode: '0000',
          city: 'Ikke specificeret'
        }
      });
    }

    // Load selected counts from service selection
    try {
      const storedCounts = sessionStorage.getItem('selectedCounts');
      if (storedCounts) setSelectedCounts(JSON.parse(storedCounts));
    } catch {}

  }, [boosterId, determinedServiceId]);

  // Load booster services when booster is loaded
  useEffect(() => {
    if (specificBooster && boosterId) {
      loadBoosterServices();
      // If no service selected, show service selection
      if (!searchParams.get('service') && !determinedServiceId) {
        setShowServiceSelection(true);
      }
    }
  }, [specificBooster, boosterId, searchParams]);

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  useEffect(() => {
    if (selectedDate && selectedTime && bookingDetails) {
      if (boosterId) {
        checkSpecificBoosterAvailability();
      } else {
        fetchAvailableBoosters();
      }
    }
  }, [selectedDate, selectedTime, bookingDetails, boosterId]);

  const getAllServices = () => {
    return [
      { id: '1', name: 'Makeup Styling', price: 1999, duration: 1, category: 'Makeup & Hår', description: 'Professionel makeup styling' },
      { id: '2', name: 'Hårstyling / håropsætning', price: 1999, duration: 1, category: 'Makeup & Hår', description: 'Professionel hårstyling' },
      { id: '3', name: 'Makeup & Hårstyling', price: 2999, duration: 1.5, category: 'Makeup & Hår', description: 'Komplet styling' },
      { id: '4', name: 'Spraytan', price: 499, duration: 0.5, category: 'Spraytan', description: 'Naturlig tan' },
      { id: '5', name: 'Konfirmationsstyling - Makeup OG Hårstyling', price: 2999, duration: 1.5, category: 'Konfirmation', description: 'Styling til konfirmation' },
      { id: '6', name: 'Brudestyling - Makeup Styling', price: 2999, duration: 2, category: 'Bryllup - Brudestyling', description: 'Makeup til bruden' },
      { id: '7', name: 'Brudestyling - Hårstyling', price: 2999, duration: 2, category: 'Bryllup - Brudestyling', description: 'Hår til bruden' },
      { id: '8', name: 'Brudestyling - Hår & Makeup (uden prøvestyling)', price: 4999, duration: 3, category: 'Bryllup - Brudestyling', description: 'Komplet brudestyling' },
      { id: '9', name: 'Brudestyling - Hår & Makeup (inkl. prøvestyling)', price: 6499, duration: 4.5, category: 'Bryllup - Brudestyling', description: 'Brudestyling med prøve' },
      { id: '10', name: 'Brudestyling Premium - Makeup og Hårstyling', price: 8999, duration: 8, category: 'Bryllup - Brudestyling', description: 'Premium brudestyling' },
      { id: '11', name: 'Brudepigestyling - Makeup & Hår (1 person)', price: 2999, duration: 1.5, category: 'Bryllup - Brudestyling', description: 'Brudepige styling' },
      { id: '12', name: 'Brudepigestyling - Makeup & Hår (2 personer)', price: 4999, duration: 2.5, category: 'Bryllup - Brudestyling', description: '2 brudepiger styling' },
      { id: '13', name: 'Brudestyling + 1 person ekstra', price: 7499, duration: 4, category: 'Bryllup - Brudestyling', description: 'Brud + ekstra person' },
      { id: '14', name: '1:1 Makeup Session', price: 2499, duration: 1.5, category: 'Makeup Kurser', description: 'Personlig makeup session' },
      { id: '16', name: 'Makeup Artist til Touch Up (3 timer)', price: 4499, duration: 3, category: 'Event', description: 'Touch-up service' },
      { id: '17', name: 'Ansigtsmaling til børn', price: 4499, duration: 3, category: 'Børn', description: 'Face painting' },
      { id: '20', name: 'Makeup & Hårstyling til Shoot/Reklamefilm', price: 4499, duration: 3, category: 'Shoot/reklame', description: 'Styling til shoot' },
    ];
  };

  const loadBoosterServices = () => {
    if (!specificBooster) return;
    
    const allServices = getAllServices();
    const specialtyMap: { [key: string]: string[] } = {
      'Makeup': ['1', '3', '5', '6', '8', '9', '10', '11', '12', '13', '14', '16', '20'],
      'Hår': ['2', '3', '5', '7', '8', '9', '10', '11', '12', '13', '20'],
      'Spraytan': ['4'],
      'Bryllup': ['6', '7', '8', '9', '10', '11', '12', '13'],
      'Event': ['16'],
      'Fashion': ['1', '3', '20'],
      'Konfirmation': ['5'],
      'Børn': ['17'],
      'Shoot/Reklame': ['20'],
      'SFX': ['20']
    };
    
    // Get all service IDs that match booster specialties
    const serviceIds = new Set<string>();
    specificBooster.specialties.forEach(specialty => {
      const ids = specialtyMap[specialty] || [];
      ids.forEach(id => serviceIds.add(id));
    });
    
    // Filter services
    const matchingServices = allServices.filter(s => serviceIds.has(s.id));
    setBoosterServices(matchingServices);
  };

  const fetchService = async () => {
    if (!serviceId) {
      setLoading(false);
      return;
    }

    try {
      const allServices = getAllServices();
      const serviceData = allServices.find(s => s.id === serviceId) || {
        id: serviceId,
        name: 'Beauty Service',
        price: 1999,
        duration: 1,
        category: 'Makeup & Hår',
        description: 'Professionel service'
      };
      
      setService(serviceData);
    } catch (error) {
      console.error('Error fetching service:', error);
      toast.error("Kunne ikke hente service information");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificBooster = async () => {
    if (!boosterId) return;

    // If boosterId is not a UUID (e.g. classic numeric ids like "2"),
    // use mock data instead of querying Supabase to avoid 22P02 errors.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boosterId);
    if (!isUuid) {
      const mockById: Record<string, Booster> = {
        '1': {
          id: '1',
          name: 'Sarah Nielsen',
          specialties: ['Makeup', 'Bryllup', 'Event'],
          hourly_rate: 1999,
          portfolio_image_url: '/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png',
          location: 'København N',
          rating: 4.8,
          review_count: 127,
          years_experience: 5,
          bio: 'Professionel makeup artist med speciale i bryllups- og event makeup'
        },
        '2': {
          id: '2',
          name: 'Maria Andersen',
          specialties: ['Makeup', 'Hår', 'Fashion'],
          hourly_rate: 1100,
          portfolio_image_url: '/lovable-uploads/abbb29f7-ab5c-498e-b6d4-df1c1ed999fc.png',
          location: 'Frederiksberg',
          rating: 4.9,
          review_count: 89,
          years_experience: 7,
          bio: 'Erfaren artist med fokus på moderne trends og personlig stil'
        }
      };
      const mock = mockById[boosterId];
      if (mock) setSpecificBooster(mock);
      return;
    }
    
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
      // Get service category to filter boosters
      const serviceCategory = service?.category || '';
      const serviceName = service?.name || '';
      
      // Filter boosters based on service type
      let filteredBoosters: Booster[] = [];
      
      if (serviceName.toLowerCase().includes('spraytan') || serviceCategory === 'Spraytan') {
        // Only Josephine O for spraytan
        filteredBoosters = [
          {
            id: 'ef8feb8b-b471-4c75-a729-6b569c296e75',
            name: 'Josephine O',
            specialties: ['Spraytan'],
            hourly_rate: 499,
            portfolio_image_url: '/lovable-uploads/abbb29f7-ab5c-498e-b6d4-df1c1ed999fc.png',
            location: 'København',
            rating: 4.9,
            review_count: 89,
            years_experience: 3,
            bio: 'Specialist i spraytan med fokus på naturlige nuancer'
          }
        ];
      } else {
        // For other services, include makeup artists
        filteredBoosters = [
          {
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'Sarah Nielsen',
            specialties: ['Makeup', 'Bryllup', 'Event'],
            hourly_rate: 1999,
            portfolio_image_url: '/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png',
            location: 'København N',
            rating: 4.8,
            review_count: 127,
            years_experience: 5,
            bio: 'Professionel makeup artist med speciale i bryllups- og event makeup'
          },
          {
            id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            name: 'Maria Andersen',
            specialties: ['Makeup', 'Hår', 'Fashion'],
            hourly_rate: 1100,
            portfolio_image_url: '/lovable-uploads/abbb29f7-ab5c-498e-b6d4-df1c1ed999fc.png',
            location: 'Frederiksberg',
            rating: 4.9,
            review_count: 89,
            years_experience: 7,
            bio: 'Erfaren artist med fokus på moderne trends og personlig stil'
          }
        ];
      }

      // Mock nearby boosters for fallback (with same filtering)
      const mockNearbyBoosters = filteredBoosters;

      // Simulate checking availability
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (filteredBoosters.length === 0) {
        setShowFallback(true);
        setNearbyBoosters(mockNearbyBoosters);
      } else {
        setAvailableBoosters(filteredBoosters);
      }
    } catch (error) {
      console.error('Error fetching boosters:', error);
      toast.error("Kunne ikke hente tilgængelige boosters");
    } finally {
      setLoadingBoosters(false);
    }
  };

  const handleBookBooster = (booster: Booster) => {
    if (!selectedDate || !selectedTime || !service || !bookingDetails) return;
    
    const booking = {
      service: service.name,
      date: selectedDate,
      time: selectedTime,
      booster: booster.name,
      boosterId: booster.id,
      duration: service.duration,
      price: service.price,
      location: bookingDetails.location.address
    };

    navigate('/checkout', { 
      state: { booking, booster, service, bookingDetails, counts: selectedCounts } 
    });
  };

  const handleAutoAssignBoosters = () => {
    if (availableBoosters.length === 0) {
      toast.error("Ingen tilgængelige boosters");
      return;
    }

    const newAssignments = new Map<number, Booster[]>();
    let boosterIndex = 0;

    cartItems.forEach((item, serviceIndex) => {
      const assigned: Booster[] = [];
      for (let i = 0; i < item.boosters; i++) {
        if (boosterIndex < availableBoosters.length) {
          assigned.push(availableBoosters[boosterIndex % availableBoosters.length]);
          boosterIndex++;
        }
      }
      newAssignments.set(serviceIndex, assigned);
    });

    setBoosterAssignments(newAssignments);
    toast.success("Boosters tildelt automatisk!");
  };

  const handleManualAssignBooster = (serviceIndex: number, booster: Booster) => {
    const currentAssignments = boosterAssignments.get(serviceIndex) || [];
    const item = cartItems[serviceIndex];

    if (currentAssignments.length >= item.boosters) {
      toast.error(`Alle boosters er allerede tildelt til denne service`);
      return;
    }

    if (currentAssignments.some(b => b.id === booster.id)) {
      toast.error("Denne booster er allerede valgt til denne service");
      return;
    }

    const newAssignments = new Map(boosterAssignments);
    newAssignments.set(serviceIndex, [...currentAssignments, booster]);
    setBoosterAssignments(newAssignments);
    toast.success(`${booster.name} tildelt!`);
  };

  const handleProceedToCheckout = () => {
    // Check if all services have assigned boosters
    const allAssigned = cartItems.every((item, index) => {
      const assigned = boosterAssignments.get(index) || [];
      return assigned.length >= item.boosters;
    });

    if (!allAssigned) {
      toast.error("Tildel venligst boosters til alle services før du fortsætter");
      return;
    }

    navigate('/checkout', {
      state: {
        cartItems,
        boosterAssignments: Array.from(boosterAssignments.entries()),
        selectedDate,
        selectedTime,
        bookingDetails
      }
    });
  };

  const handleSendRequest = async () => {
    if (!selectedDate || !selectedTime || !service || !specificBooster) {
      toast.error("Vælg venligst dato, tid og service");
      return;
    }
    
    setSendingRequest(true);
    try {
      // Create a booking request
      const { error } = await supabase
        .from('booster_booking_requests')
        .insert({
          booking_id: null, // Will be updated when customer completes booking
          booster_id: specificBooster.id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`Forespørgsel sendt til ${specificBooster.name}!`);
      
      // Navigate back or show confirmation
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error("Kunne ikke sende forespørgsel. Prøv igen.");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleSelectService = (selectedService: Service) => {
    setDeterminedServiceId(selectedService.id);
    setService(selectedService);
    setShowServiceSelection(false);
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

  // Show service selection for booster-specific booking
  if (boosterId && showServiceSelection && boosterServices.length > 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to={`/stylist/${boosterId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Tilbage til Booster
        </Link>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Vælg service hos {specificBooster?.name}
            </h1>
            <p className="text-muted-foreground">
              Vælg den service du ønsker at booke
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boosterServices.map((svc) => (
              <Card key={svc.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSelectService(svc)}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{svc.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{svc.price} kr</span>
                    <Badge variant="outline">{svc.duration} timer</Badge>
                  </div>
                  <Button className="w-full mt-4">
                    Vælg service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
          <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight break-words">
            {boosterId && specificBooster ? `Book ${specificBooster.name}` : 'Vælg dato og tid'}
          </h1>
          <p className="text-muted-foreground">
            {bookingDetails?.location?.address ? (
              `${bookingDetails.location.address}, ${bookingDetails.location.postalCode} ${bookingDetails.location.city}`
            ) : (
              'Lokation specificeres under booking processen'
            )}
          </p>
        </div>

        {/* Booking Summary - Show cart items */}
        {!boosterId && cartItems.length > 0 && (
          <BookingSummary
            items={cartItems}
            onRemoveItem={removeFromCart}
            totalPrice={getTotalPrice()}
            totalDuration={getTotalDuration()}
          />
        )}

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
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
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
                      onSelect={(date) => { setSelectedDate(date); setDatePopoverOpen(false); }}
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
                  <SelectContent className="bg-background border z-50 max-h-72">
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

            {/* Selected Summary - Clickable */}
            {selectedDate && selectedTime && (
              <div 
                className="mt-4 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => {
                  // Allow clicking on summary to edit time
                  setSelectedTime("");
                }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    <strong>{format(selectedDate, 'EEEE d. MMMM yyyy', { locale: da })}</strong> kl. {selectedTime}
                  </span>
                  <span className="text-muted-foreground ml-auto">Klik for at ændre tid</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Send request button for booster-specific booking */}
        {boosterId && selectedDate && selectedTime && service && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Klar til at sende forespørgsel?</h3>
                  <p className="text-muted-foreground">
                    Du sender nu en forespørgsel til {specificBooster?.name} for {service.name} den {format(selectedDate, 'EEEE d. MMMM yyyy', { locale: da })} kl. {selectedTime}
                  </p>
                </div>
                <Button 
                  onClick={handleSendRequest}
                  disabled={sendingRequest}
                  className="w-full"
                  size="lg"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingRequest ? 'Sender...' : 'Send forespørgsel til booster'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booster Assignment - Only for non-booster-specific bookings */}
        {!boosterId && selectedDate && selectedTime && cartItems.length > 0 && (
          <BoosterAssignment
            items={cartItems}
            availableBoosters={availableBoosters}
            loading={loadingBoosters}
            onAutoAssign={handleAutoAssignBoosters}
            onManualAssign={handleManualAssignBooster}
            assignments={boosterAssignments}
          />
        )}

        {/* Proceed to checkout button */}
        {!boosterId && selectedDate && selectedTime && cartItems.length > 0 && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleProceedToCheckout}
              className="gap-2"
            >
              Fortsæt til betaling
            </Button>
          </div>
        )}

        {/* Old booster list - keeping for fallback */}
        {!boosterId && selectedDate && selectedTime && cartItems.length === 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">
              {loadingBoosters ? 'Søger ledige tider...' : 
               showFallback ? 'Ingen ledige på dette tidspunkt' : 
               'Tilgængelige boosters'}
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
                        onClick={() => toast.info("Forespørgsel funktionalitet kommer snart")}
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
                              <h4 className="font-semibold line-clamp-1">{booster.name}</h4>
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
                                <span className="text-sm font-medium">{service.price} kr</span>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toast.info("Forespørgsel funktionalitet kommer snart")}
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
                            <h4 className="font-semibold line-clamp-1">{booster.name}</h4>
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
                          <span className="font-medium">{service.price} kr</span>
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