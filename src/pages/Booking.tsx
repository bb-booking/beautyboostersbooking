import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { format, addDays, isBefore, startOfDay, isToday } from "date-fns";
import { da } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Clock, MapPin, User, Star, CalendarIcon, Check, ChevronLeft, ChevronRight, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { BoosterAssignment } from "@/components/booking/BoosterAssignment";
import { LocationBubble } from "@/components/booking/LocationBubble";
import { BookingSteps } from "@/components/booking/BookingSteps";
import { UpsellServices } from "@/components/booking/UpsellServices";
import { InlineImageUpload } from "@/components/booking/ImageUploadDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  description?: string;
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

const BOOKING_STEPS = [
  { id: 1, name: "Dato & tid", description: "Vælg hvornår" },
  { id: 2, name: "Vælg booster", description: "Tildel artister" },
  { id: 3, name: "Bekræft", description: "Gennemse booking" },
];

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { boosterId } = useParams();
  const { items: cartItems, removeFromCart, getTotalPrice, getTotalDuration } = useCart();
  
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Check if we're in calendar-first mode (from "Se ledige tider")
  const viewCalendarFirst = searchParams.get('view') === 'calendar';
  const isEditMode = searchParams.get('edit') === 'true';
  
  const [determinedServiceId, setDeterminedServiceId] = useState<string>(searchParams.get('service') || '');
  const serviceId = determinedServiceId;
  
  // State
  const [service, setService] = useState<Service | null>(null);
  const [boosterServices, setBoosterServices] = useState<Service[]>([]);
  const [showServiceSelection, setShowServiceSelection] = useState(viewCalendarFirst);
  const [specificBooster, setSpecificBooster] = useState<Booster | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [selectedCounts, setSelectedCounts] = useState<{people: number; boosters: number} | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableBoosters, setAvailableBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoosters, setLoadingBoosters] = useState(false);
  const [loadingSpecificBooster, setLoadingSpecificBooster] = useState(false);
const [boosterAssignments, setBoosterAssignments] = useState<Map<number, Booster[]>>(new Map());
  
  // Availability state for booster-specific booking
  const [boosterAvailability, setBoosterAvailability] = useState<{date: string; start_time: string; end_time: string; status: string}[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);
  
  // Inspiration images
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  
  const isMobile = useIsMobile();
  const INITIAL_TIMES_TO_SHOW = isMobile ? 8 : 16;

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

  // Initialize booking
  useEffect(() => {
    if (boosterId) {
      fetchSpecificBooster();
      fetchBoosterAvailability();
    }
    
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
      setBookingDetails({
        serviceId: determinedServiceId || '1',
        location: {
          address: 'Kundens adresse',
          postalCode: '0000',
          city: 'Ikke specificeret'
        }
      });
    }

    try {
      const storedCounts = sessionStorage.getItem('selectedCounts');
      if (storedCounts) setSelectedCounts(JSON.parse(storedCounts));
    } catch {}
  }, [boosterId, determinedServiceId]);

  useEffect(() => {
    if (specificBooster && boosterId) {
      loadBoosterServices();
    }
  }, [specificBooster, boosterId]);

  useEffect(() => {
    if (serviceId) {
      fetchService();
    } else {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (selectedDate && selectedTime && bookingDetails && !boosterId) {
      fetchAvailableBoosters();
    }
  }, [selectedDate, selectedTime, bookingDetails, boosterId]);

  const getAllServices = () => [
    { id: '1', name: 'Makeup Styling', price: 1999, duration: 1, category: 'Makeup & Hår', description: 'Professionel makeup styling' },
    { id: '2', name: 'Hårstyling / håropsætning', price: 1999, duration: 1, category: 'Makeup & Hår', description: 'Professionel hårstyling' },
    { id: '3', name: 'Makeup & Hårstyling', price: 2999, duration: 1.5, category: 'Makeup & Hår', description: 'Komplet styling' },
    { id: '4', name: 'Spraytan', price: 499, duration: 0.5, category: 'Spraytan', description: 'Naturlig tan' },
    { id: '5', name: 'Konfirmationsstyling', price: 2999, duration: 1.5, category: 'Konfirmation', description: 'Styling til konfirmation' },
    { id: '6', name: 'Brudestyling - Makeup', price: 2999, duration: 2, category: 'Bryllup', description: 'Makeup til bruden' },
    { id: '7', name: 'Brudestyling - Hårstyling', price: 2999, duration: 2, category: 'Bryllup', description: 'Hår til bruden' },
    { id: '8', name: 'Brudestyling - Komplet', price: 4999, duration: 3, category: 'Bryllup', description: 'Komplet brudestyling' },
    { id: '14', name: '1:1 Makeup Session', price: 2499, duration: 1.5, category: 'Makeup Kurser', description: 'Personlig session' },
    { id: '16', name: 'Event Touch Up', price: 4499, duration: 3, category: 'Event', description: 'Touch-up service' },
    { id: '17', name: 'Ansigtsmaling', price: 4499, duration: 3, category: 'Børn', description: 'Face painting' },
    { id: '20', name: 'Shoot/Reklamefilm', price: 4499, duration: 3, category: 'Shoot/reklame', description: 'Styling til shoot' },
  ];

  const loadBoosterServices = () => {
    if (!specificBooster) return;
    
    const allServices = getAllServices();
    const specialtyMap: { [key: string]: string[] } = {
      'Makeup': ['1', '3', '5', '6', '8', '14', '16', '20'],
      'Hår': ['2', '3', '5', '7', '8', '20'],
      'Spraytan': ['4'],
      'Bryllup': ['6', '7', '8'],
      'Event': ['16'],
      'Børn': ['17'],
      'Makeup artist': ['1', '3', '5', '6', '8', '14', '16', '20'],
      'Hårstylist': ['2', '3', '5', '7', '8', '20'],
      'Frisør': ['2', '3', '5', '7', '8', '20'],
    };
    
    const serviceIds = new Set<string>();
    specificBooster.specialties.forEach(specialty => {
      const ids = specialtyMap[specialty] || [];
      ids.forEach(id => serviceIds.add(id));
    });
    
    setBoosterServices(allServices.filter(s => serviceIds.has(s.id)));
  };

  const fetchService = async () => {
    if (!serviceId) { setLoading(false); return; }
    const allServices = getAllServices();
    const serviceData = allServices.find(s => s.id === serviceId) || {
      id: serviceId, name: 'Beauty Service', price: 1999, duration: 1, category: 'Makeup & Hår'
    };
    setService(serviceData);
    setLoading(false);
  };

  const fetchSpecificBooster = async () => {
    if (!boosterId) return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(boosterId);
    
    if (!isUuid) {
      const mockById: Record<string, Booster> = {
        '1': { id: '1', name: 'Sarah Nielsen', specialties: ['Makeup', 'Bryllup'], hourly_rate: 1999, portfolio_image_url: '/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png', location: 'København N', rating: 4.8, review_count: 127, years_experience: 5, bio: 'Professionel makeup artist' },
        '2': { id: '2', name: 'Maria Andersen', specialties: ['Makeup', 'Hår'], hourly_rate: 1100, portfolio_image_url: '/lovable-uploads/abbb29f7-ab5c-498e-b6d4-df1c1ed999fc.png', location: 'Frederiksberg', rating: 4.9, review_count: 89, years_experience: 7, bio: 'Erfaren artist' }
      };
      if (mockById[boosterId]) setSpecificBooster(mockById[boosterId]);
      return;
    }
    
    setLoadingSpecificBooster(true);
    try {
      const { data, error } = await supabase.from('booster_profiles').select('*').eq('id', boosterId).maybeSingle();
      if (error) throw error;
      setSpecificBooster(data);
    } catch (error) {
      console.error('Error fetching booster:', error);
    } finally {
      setLoadingSpecificBooster(false);
    }
  };

  const fetchBoosterAvailability = async () => {
    if (!boosterId) return;
    setLoadingAvailability(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('booster_availability')
        .select('date, start_time, end_time, status')
        .eq('booster_id', boosterId)
        .eq('status', 'available')
        .gte('date', today)
        .order('date', { ascending: true });
      if (error) throw error;
      setBoosterAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchAvailableBoosters = async () => {
    setLoadingBoosters(true);
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      
      const serviceCategory = service?.category || cartItems[0]?.category || '';
      let filteredBoosters = data || [];
      
      // Filter by specialty
      if (serviceCategory.includes('Spraytan')) {
        filteredBoosters = filteredBoosters.filter(b => b.specialties.some((s: string) => s.toLowerCase().includes('spraytan')));
      } else if (serviceCategory.includes('Makeup') || serviceCategory.includes('Hår')) {
        filteredBoosters = filteredBoosters.filter(b => b.specialties.some((s: string) => 
          s.toLowerCase().includes('makeup') || s.toLowerCase().includes('hår') || s.toLowerCase().includes('frisør')
        ));
      }

      // Filter by location - only show boosters from customer's area
      const customerCity = bookingDetails?.location?.city?.toLowerCase() || '';
      if (customerCity) {
        // Extract base city name (e.g., "København" from "København N")
        const baseCityName = customerCity.includes('køben') ? 'køben' : 
                           customerCity.includes('århus') || customerCity.includes('aarhus') ? 'arhu' :
                           customerCity.includes('odense') ? 'odense' :
                           customerCity.includes('aalborg') ? 'aalborg' :
                           customerCity;
        
        const locationFiltered = filteredBoosters.filter(b => 
          b.location.toLowerCase().includes(baseCityName)
        );
        
        // Only apply location filter if we found matches
        if (locationFiltered.length > 0) {
          filteredBoosters = locationFiltered;
        }
      }

      setAvailableBoosters(filteredBoosters.length > 0 ? filteredBoosters : (data || []));
    } catch (error) {
      console.error('Error fetching boosters:', error);
    } finally {
      setLoadingBoosters(false);
    }
  };

  const findNextAvailableTime = async () => {
    setLoadingBoosters(true);
    try {
      const now = new Date();
      const endDate = addDays(now, 14);
      const currentTime = format(now, 'HH:mm');
      const today = format(now, 'yyyy-MM-dd');

      const { data: boosters } = await supabase.from('booster_profiles').select('id').eq('is_available', true);
      const boosterIds = boosters?.map(b => b.id) || [];

      if (boosterIds.length === 0) {
        // No boosters in DB, suggest tomorrow at 10:00
        setSelectedDate(addDays(now, 1));
        setSelectedTime("10:00");
        toast.success("Foreslået tid: i morgen kl. 10:00");
        return;
      }

      const { data, error } = await supabase
        .from('booster_availability')
        .select('*')
        .in('booster_id', boosterIds)
        .eq('status', 'available')
        .gte('date', today)
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const validSlot = data.find(slot => {
          if (slot.date > today) return true;
          if (slot.date === today) return slot.start_time.substring(0, 5) > currentTime;
          return false;
        });
        
        if (validSlot) {
          setSelectedDate(new Date(validSlot.date));
          setSelectedTime(validSlot.start_time.substring(0, 5));
          toast.success(`Fundet: ${format(new Date(validSlot.date), 'd. MMMM', { locale: da })} kl. ${validSlot.start_time.substring(0, 5)}`);
          return;
        }
      }
      
      // No registered availability - suggest tomorrow at 10:00 (popular time)
      setSelectedDate(addDays(now, 1));
      setSelectedTime("10:00");
      toast.success("Foreslået tid: i morgen kl. 10:00");
    } catch (error) {
      console.error('Error finding available time:', error);
      toast.error("Kunne ikke finde ledige tider");
    } finally {
      setLoadingBoosters(false);
    }
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
        assigned.push(availableBoosters[boosterIndex % availableBoosters.length]);
        boosterIndex++;
      }
      if (assigned.length > 0) newAssignments.set(serviceIndex, assigned);
    });

    setBoosterAssignments(newAssignments);
    toast.success("Boosters tildelt!");
  };

  const handleManualAssignBooster = (serviceIndex: number, booster: Booster) => {
    const currentAssignments = boosterAssignments.get(serviceIndex) || [];
    const item = cartItems[serviceIndex];

    if (currentAssignments.length >= item.boosters) {
      toast.error("Alle boosters er allerede tildelt");
      return;
    }

    if (currentAssignments.some(b => b.id === booster.id)) {
      toast.error("Denne booster er allerede valgt");
      return;
    }

    const newAssignments = new Map(boosterAssignments);
    newAssignments.set(serviceIndex, [...currentAssignments, booster]);
    setBoosterAssignments(newAssignments);
    toast.success(`${booster.name} tildelt!`);
  };

  const handleRemoveBooster = (serviceIndex: number, boosterIndex: number) => {
    const newAssignments = new Map(boosterAssignments);
    const currentAssignments = newAssignments.get(serviceIndex) || [];
    newAssignments.set(serviceIndex, currentAssignments.filter((_, i) => i !== boosterIndex));
    setBoosterAssignments(newAssignments);
  };

  const handleProceedToCheckout = () => {
    const allAssigned = cartItems.every((item, index) => {
      const assigned = boosterAssignments.get(index) || [];
      return assigned.length >= item.boosters;
    });

    if (!allAssigned) {
      toast.error("Tildel venligst boosters til alle services");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("Vælg venligst dato og tid");
      return;
    }

    const primaryService = cartItems[0];
    const primaryBooster = (boosterAssignments.get(0) || [])[0];
    const allAssignedBoosters = Array.from(boosterAssignments.values()).flat();

    navigate('/checkout', {
      state: {
        booking: {
          service: primaryService.name,
          date: selectedDate,
          time: selectedTime,
          booster: primaryBooster?.name || 'Ikke tildelt',
          boosterId: primaryBooster?.id,
          duration: primaryService.totalDuration,
          price: primaryService.finalPrice,
          location: bookingDetails?.location?.address || ''
        },
        booster: primaryBooster,
        service: { id: primaryService.id, name: primaryService.name, price: getTotalPrice(), duration: primaryService.totalDuration, category: primaryService.category },
        bookingDetails,
        counts: { people: primaryService.people, boosters: cartItems.reduce((sum, item) => sum + item.boosters, 0) },
        cartItems,
        extraBoosters: allAssignedBoosters.slice(1).map(b => ({ id: b.id, name: b.name, portfolio_image_url: b.portfolio_image_url, location: b.location })),
        inspirationImages
      }
    });
  };

  const handleSelectBoosterService = (selectedService: Service) => {
    if (specificBooster && selectedDate && selectedTime) {
      navigate('/checkout', { 
        state: { 
          booking: {
            service: selectedService.name,
            date: selectedDate,
            time: selectedTime,
            booster: specificBooster.name,
            boosterId: specificBooster.id,
            duration: selectedService.duration,
            price: selectedService.price,
            location: bookingDetails?.location?.address || ''
          },
          booster: specificBooster, 
          service: selectedService, 
          bookingDetails, 
          counts: { people: 1, boosters: 1 },
          isDirectBooking: true
        } 
      });
    } else {
      setDeterminedServiceId(selectedService.id);
      setService(selectedService);
      setShowServiceSelection(false);
    }
  };

  // Validation for steps
  const canProceed = (step: number) => {
    switch (step) {
      case 1: return selectedDate && selectedTime;
      case 2: return cartItems.every((item, index) => (boosterAssignments.get(index) || []).length >= item.boosters);
      case 3: return true;
      default: return false;
    }
  };

  const handleNextStep = () => {
    if (canProceed(currentStep) && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
    } else if (currentStep === 3) {
      handleProceedToCheckout();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0);
    }
  };

  // Loading state
  const shouldShowSkeleton = loading && cartItems.length === 0;
  const boosterLoading = boosterId && (loadingSpecificBooster || !specificBooster);
  
  if (shouldShowSkeleton || boosterLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Helper functions for booster-specific calendar view
  const getAvailableDates = (): Set<string> => {
    const dates = new Set<string>();
    boosterAvailability.forEach(slot => dates.add(slot.date));
    return dates;
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slots = boosterAvailability.filter(slot => slot.date === dateStr);
    const availableTimes: string[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const isTodayDate = isToday(date);
    
    slots.forEach(slot => {
      const startHour = parseInt(slot.start_time.split(':')[0]);
      const startMin = parseInt(slot.start_time.split(':')[1]);
      const endHour = parseInt(slot.end_time.split(':')[0]);
      const endMin = parseInt(slot.end_time.split(':')[1]);
      
      let h = startHour, m = startMin;
      while (h < endHour || (h === endHour && m < endMin)) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        if (!isTodayDate || h > currentHour || (h === currentHour && m > currentMin)) {
          availableTimes.push(timeStr);
        }
        m += 30;
        if (m >= 60) { m = 0; h++; }
      }
    });
    
    return availableTimes;
  };

  // BOOSTER-SPECIFIC BOOKING FLOW
  if (boosterId && specificBooster) {
    const availableDates = getAvailableDates();
    const availableTimesForSelectedDate = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
    const hasAvailability = boosterAvailability.length > 0;

    // Service selection for booster
    if (showServiceSelection) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <button onClick={() => setShowServiceSelection(false)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="h-4 w-4" />
              Tilbage
            </button>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Vælg service</h1>
                  <p className="text-muted-foreground">Hos {specificBooster.name}</p>
                </div>
                {selectedDate && selectedTime && (
                  <Badge variant="secondary" className="text-sm">
                    {format(selectedDate, "d. MMM", { locale: da })} kl. {selectedTime}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boosterServices.map((svc) => (
                  <Card key={svc.id} className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50" onClick={() => handleSelectBoosterService(svc)}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{svc.name}</h3>
                        <Badge variant="outline">{svc.duration}t</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{svc.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-xl font-bold text-primary">{svc.price} kr</span>
                        <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">Vælg <ArrowRight className="h-3 w-3 ml-1" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Calendar view for booster
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Link to="/stylists" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Tilbage til Boosters
          </Link>
          
          {/* Booster Header */}
          <div className="flex items-center gap-4 mb-8">
            {specificBooster.portfolio_image_url && (
              <img src={specificBooster.portfolio_image_url} alt={specificBooster.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/20" />
            )}
            <div>
              <h1 className="text-2xl font-bold">Book {specificBooster.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{specificBooster.location}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{specificBooster.rating}</span>
              </div>
            </div>
          </div>

          {loadingAvailability ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p className="text-muted-foreground">Henter ledige tider...</p>
            </div>
          ) : !hasAvailability ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen ledige tider</h3>
                <p className="text-muted-foreground mb-4">{specificBooster.name} har ingen ledige tider i øjeblikket.</p>
                <Button asChild variant="outline"><Link to="/stylists">Se andre boosters</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Vælg dato og tidspunkt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Calendar */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Dato</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { setSelectedDate(date); setSelectedTime(""); }}
                      disabled={(date) => isBefore(date, startOfDay(new Date())) || !availableDates.has(format(date, 'yyyy-MM-dd'))}
                      className="rounded-lg border"
                      locale={da}
                      modifiers={{ available: (date) => availableDates.has(format(date, 'yyyy-MM-dd')) }}
                      modifiersStyles={{ available: { fontWeight: 'bold', backgroundColor: 'hsl(var(--primary) / 0.1)' } }}
                    />
                  </div>
                  
                  {/* Time slots */}
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">Tidspunkt</Label>
                    {!selectedDate ? (
                      <div className="rounded-lg border bg-muted/30 p-8 text-center">
                        <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Vælg en dato</p>
                      </div>
                    ) : availableTimesForSelectedDate.length === 0 ? (
                      <div className="rounded-lg border bg-muted/30 p-8 text-center">
                        <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Ingen ledige tider</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto">
                        {availableTimesForSelectedDate.map((time) => (
                          <Button key={time} variant={selectedTime === time ? "default" : "outline"} size="sm" onClick={() => setSelectedTime(time)}>
                            {time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Continue button */}
                {selectedDate && selectedTime && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary/5 rounded-lg p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Valgt tidspunkt</p>
                        <p className="font-semibold">{format(selectedDate, "EEEE d. MMMM", { locale: da })} kl. {selectedTime}</p>
                      </div>
                      <Button onClick={() => setShowServiceSelection(true)} size="lg">
                        Fortsæt til service <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // STANDARD BOOKING FLOW (from Services)
  const hasValidContext = cartItems.length > 0;
  
  if (!hasValidContext) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Tilbage til Services
        </Link>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Ingen services valgt</h2>
          <p className="text-muted-foreground mb-4">Gå tilbage og vælg en service.</p>
          <Button asChild><Link to="/services">Vælg Service</Link></Button>
        </div>
      </div>
    );
  }

  // Filter past times for today
  const getFilteredTimes = () => {
    return timeSlots.filter((time) => {
      if (!selectedDate || !isToday(selectedDate)) return true;
      const [hour, min] = time.split(':').map(Number);
      const now = new Date();
      return hour > now.getHours() || (hour === now.getHours() && min > now.getMinutes());
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {currentStep === 1 ? (
          <Link to="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Tilbage til Services
          </Link>
        ) : (
          <button 
            onClick={() => setCurrentStep(currentStep - 1)} 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbage til forrige trin
          </button>
        )}

        {/* Step Indicator */}
        <BookingSteps 
          steps={BOOKING_STEPS} 
          currentStep={currentStep}
          onStepClick={(step) => step < currentStep && setCurrentStep(step)}
        />

        {/* Location */}
        <div className="mb-6">
          <LocationBubble
            onLocationChange={(address, postalCode, city) => {
              setBookingDetails(prev => ({
                ...prev,
                serviceId: prev?.serviceId || '',
                location: { address, postalCode, city }
              }));
            }}
            initialAddress={bookingDetails?.location?.address ? 
              `${bookingDetails.location.address}, ${bookingDetails.location.postalCode} ${bookingDetails.location.city}` : undefined}
          />
        </div>

        {/* Cart Summary (always visible) */}
        <div className="mb-4">
          <BookingSummary
            items={cartItems}
            onRemoveItem={removeFromCart}
            totalPrice={getTotalPrice()}
            totalDuration={getTotalDuration()}
          />
        </div>

        {/* Upsell related services */}
        <div className="mb-6">
          <UpsellServices excludeIds={cartItems.map(item => item.id.split('-')[0])} />
        </div>

        {/* STEP 1: Date & Time */}
        {currentStep === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Vælg dato og tidspunkt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick find button */}
              <Button variant="outline" className="w-full" onClick={findNextAvailableTime} disabled={loadingBoosters}>
                {loadingBoosters ? "Søger..." : "🕐 Find næste ledige tid"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">eller vælg selv</span>
                </div>
              </div>

              {/* Calendar & Time slots - side by side on desktop */}
              <div className="flex flex-col md:flex-row md:gap-8">
                {/* Calendar */}
                <div className="flex justify-center md:justify-start shrink-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setSelectedTime(""); setShowAllTimes(false); }}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className="rounded-lg border"
                    locale={da}
                  />
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <div className="flex-1 mt-4 md:mt-0 space-y-3">
                    <Label className="text-sm font-medium">Ledige tider {format(selectedDate, 'd. MMMM', { locale: da })}</Label>
                    {(() => {
                      const allTimes = getFilteredTimes();
                      const timesToShow = showAllTimes ? allTimes : allTimes.slice(0, INITIAL_TIMES_TO_SHOW);
                      const hasMoreTimes = allTimes.length > INITIAL_TIMES_TO_SHOW;
                      
                      if (allTimes.length === 0) {
                        return <p className="text-sm text-muted-foreground py-2">Ingen ledige tider - prøv en anden dag.</p>;
                      }
                      
                      return (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {timesToShow.map((time) => (
                              <Button 
                                key={time} 
                                variant={selectedTime === time ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => setSelectedTime(time)}
                                className="min-w-[70px]"
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                          {hasMoreTimes && !showAllTimes && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowAllTimes(true)}
                              className="text-primary hover:text-primary/80"
                            >
                              Se flere tider ({allTimes.length - INITIAL_TIMES_TO_SHOW} mere)
                            </Button>
                          )}
                          {showAllTimes && hasMoreTimes && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowAllTimes(false)}
                              className="text-muted-foreground"
                            >
                              Vis færre
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Selection summary */}
              {selectedDate && selectedTime && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="font-medium">{format(selectedDate, 'EEEE d. MMMM', { locale: da })} kl. {selectedTime}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Booster Assignment */}
        {currentStep === 2 && (
          <div className="mb-6">
            <BoosterAssignment
              items={cartItems}
              availableBoosters={availableBoosters}
              loading={loadingBoosters}
              onAutoAssign={handleAutoAssignBoosters}
              onManualAssign={handleManualAssignBooster}
              onRemoveBooster={handleRemoveBooster}
              assignments={boosterAssignments}
            />
          </div>
        )}

        {/* STEP 3: Confirm */}
        {currentStep === 3 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Bekræft din booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Dato & tid</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, 'EEEE d. MMMM', { locale: da })} kl. {selectedTime}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Lokation</span>
                  <span className="font-medium">{bookingDetails?.location?.address || 'Ikke angivet'}</span>
                </div>
                <div className="py-2 border-b">
                  <span className="text-muted-foreground block mb-2">Tildelte boosters</span>
                  {Array.from(boosterAssignments.entries()).map(([index, boosters]) => (
                    <div key={index} className="ml-2">
                      {boosters.map(b => (
                        <div key={b.id} className="flex items-center gap-2 py-1">
                          {b.portfolio_image_url && <img src={b.portfolio_image_url} alt={b.name} className="w-6 h-6 rounded-full" />}
                          <span className="font-medium">{b.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-2 text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-primary">{getTotalPrice()} kr</span>
                </div>
              </div>
              
              {/* Inspiration Images Upload */}
              <div className="pt-4 border-t">
                <InlineImageUpload 
                  images={inspirationImages}
                  onImagesChange={setInspirationImages}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Tilbage
          </Button>
          
          <Button onClick={handleNextStep} disabled={!canProceed(currentStep)}>
            {currentStep === 3 ? "Fortsæt til betaling" : "Næste"}
            {currentStep < 3 && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
