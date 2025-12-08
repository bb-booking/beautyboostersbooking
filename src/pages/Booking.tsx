import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { format, addDays, isBefore, startOfDay, isToday } from "date-fns";
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
import { LocationBubble } from "@/components/booking/LocationBubble";

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
  
  // Check if we're in calendar-first mode (from "Se ledige tider")
  const viewCalendarFirst = searchParams.get('view') === 'calendar';
  // Check if we're in edit mode (from checkout "Rediger booking")
  const isEditMode = searchParams.get('edit') === 'true';
  
  // Get service ID from URL or determine from booster specialties
  const [determinedServiceId, setDeterminedServiceId] = useState<string>(searchParams.get('service') || '');
  const serviceId = determinedServiceId;
  
  // State
  const [service, setService] = useState<Service | null>(null);
  const [boosterServices, setBoosterServices] = useState<Service[]>([]);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [showCalendarFirst, setShowCalendarFirst] = useState(viewCalendarFirst);
  const [calendarTimeSelected, setCalendarTimeSelected] = useState(false);
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
  
  // Availability state
  const [boosterAvailability, setBoosterAvailability] = useState<{date: string; start_time: string; end_time: string; status: string}[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

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
      fetchBoosterAvailability();
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
      // If in edit mode from checkout, show service selection directly
      if (isEditMode) {
        setShowServiceSelection(true);
        setShowCalendarFirst(false);
      } else if (showCalendarFirst) {
        // If in calendar-first mode, don't show service selection yet
        setShowServiceSelection(false);
      } else if (!searchParams.get('service') && !determinedServiceId) {
        // If no service selected and not calendar-first, show service selection
        setShowServiceSelection(true);
      }
    }
  }, [specificBooster, boosterId, searchParams, showCalendarFirst, isEditMode]);

  useEffect(() => {
    if (serviceId) {
      fetchService();
    } else {
      // No serviceId, stop loading
      setLoading(false);
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
      // Original mappings
      'Makeup': ['1', '3', '5', '6', '8', '9', '10', '11', '12', '13', '14', '16', '20'],
      'Hår': ['2', '3', '5', '7', '8', '9', '10', '11', '12', '13', '20'],
      'Spraytan': ['4'],
      'Bryllup': ['6', '7', '8', '9', '10', '11', '12', '13'],
      'Event': ['16'],
      'Fashion': ['1', '3', '20'],
      'Konfirmation': ['5'],
      'Børn': ['17'],
      'Shoot/Reklame': ['20'],
      'SFX': ['20'],
      // Database specialty names
      'Makeup artist': ['1', '3', '5', '6', '8', '9', '10', '11', '12', '13', '14', '16', '20'],
      'Hårstylist': ['2', '3', '5', '7', '8', '9', '10', '11', '12', '13', '20'],
      'Frisør': ['2', '3', '5', '7', '8', '9', '10', '11', '12', '13', '20'],
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
      // Fetch real boosters from database
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false });

      if (error) throw error;

      // Filter based on service category
      const serviceCategory = service?.category || '';
      const serviceName = service?.name || '';
      
      let filteredBoosters = data || [];
      
      // Filter boosters with matching specialties (using actual specialty names from database)
      if (serviceName.toLowerCase().includes('spraytan') || serviceCategory === 'Spraytan') {
        filteredBoosters = filteredBoosters.filter(b => 
          b.specialties.some((s: string) => s.toLowerCase().includes('spraytan'))
        );
      } else if (serviceCategory.includes('Makeup') || serviceCategory.includes('Hår')) {
        filteredBoosters = filteredBoosters.filter(b => 
          b.specialties.some((s: string) => 
            s.toLowerCase().includes('makeup') || 
            s.toLowerCase().includes('hår') ||
            s.toLowerCase().includes('frisør')
          )
        );
      } else {
        // For other services, show all available boosters
        filteredBoosters = data || [];
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      if (filteredBoosters.length === 0) {
        setShowFallback(true);
        setNearbyBoosters(data || []);
      } else {
        setAvailableBoosters(filteredBoosters);
      }
    } catch (error) {
      console.error('Error fetching boosters:', error);
      toast.error("Kunne ikke hente tilgængelige boosters");
      setShowFallback(true);
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

  const handleRemoveBooster = (serviceIndex: number, boosterIndex: number) => {
    const newAssignments = new Map(boosterAssignments);
    const currentAssignments = newAssignments.get(serviceIndex) || [];
    newAssignments.set(
      serviceIndex,
      currentAssignments.filter((_, i) => i !== boosterIndex)
    );
    setBoosterAssignments(newAssignments);
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
          // Use modulo to cycle through available boosters if needed
          assigned.push(availableBoosters[boosterIndex % availableBoosters.length]);
          boosterIndex++;
        }
      }
      if (assigned.length > 0) {
        newAssignments.set(serviceIndex, assigned);
      }
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

  const findNextAvailableTime = async () => {
    setLoadingBoosters(true);

    try {
      // Always search from NOW, not from selected date
      const now = new Date();
      const searchDate = now;
      const endDate = addDays(now, 14);
      const currentTime = format(now, 'HH:mm');

      // Get service categories to filter boosters
      const serviceCategories = cartItems.length > 0 
        ? cartItems.map(item => item.category)
        : [service?.category || 'Makeup'];

      // Fetch boosters matching service categories
      const { data: boosters, error: boosterError } = await supabase
        .from('booster_profiles')
        .select('id, specialties')
        .eq('is_available', true);

      if (boosterError) throw boosterError;

      // Filter boosters by specialties matching services (using actual specialty names)
      const matchingBoosterIds = boosters
        ?.filter(b => {
          // Check if booster has any matching specialty
          return serviceCategories.some(category => {
            return b.specialties.some((s: string) => {
              const specialty = s.toLowerCase();
              if (category.includes('Makeup')) return specialty.includes('makeup');
              if (category.includes('Hår')) return specialty.includes('hår') || specialty.includes('frisør');
              if (category === 'Spraytan') return specialty.includes('spraytan');
              if (category.includes('Bryllup')) return specialty.includes('makeup') || specialty.includes('hår');
              return true; // Default match
            });
          });
        })
        .map(b => b.id) || [];

      if (matchingBoosterIds.length === 0) {
        // If no specific match, use all available boosters
        const allBoosterIds = boosters?.map(b => b.id) || [];
        if (allBoosterIds.length === 0) {
          toast.error("Ingen tilgængelige boosters fundet");
          return;
        }
        // Continue with all boosters
        const { data, error } = await supabase
          .from('booster_availability')
          .select('*')
          .in('booster_id', allBoosterIds)
          .eq('status', 'available')
          .gte('date', format(searchDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          // Find the first slot that's actually in the future (considering time for today)
          const today = format(now, 'yyyy-MM-dd');
          const validSlot = data.find(slot => {
            if (slot.date > today) return true;
            if (slot.date === today) {
              return slot.start_time.substring(0, 5) > currentTime;
            }
            return false;
          });
          
          if (validSlot) {
            setSelectedDate(new Date(validSlot.date));
            setSelectedTime(validSlot.start_time.substring(0, 5));
            toast.success(`Fundet ledig tid: ${format(new Date(validSlot.date), 'd. MMMM', { locale: da })} kl. ${validSlot.start_time.substring(0, 5)}`);
          } else {
            const tomorrow = addDays(now, 1);
            setSelectedDate(tomorrow);
            setSelectedTime("09:00");
            toast.info("Ingen ledige tider fundet");
          }
        } else {
          const tomorrow = addDays(now, 1);
          setSelectedDate(tomorrow);
          setSelectedTime("09:00");
          toast.info("Ingen ledige tider fundet");
        }
        return;
      }

      // Find available time slots for matching boosters
      const { data, error } = await supabase
        .from('booster_availability')
        .select('*')
        .in('booster_id', matchingBoosterIds)
        .eq('status', 'available')
        .gte('date', format(searchDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        // Find the first slot that's actually in the future (considering time for today)
        const today = format(now, 'yyyy-MM-dd');
        const validSlot = data.find(slot => {
          if (slot.date > today) return true;
          if (slot.date === today) {
            return slot.start_time.substring(0, 5) > currentTime;
          }
          return false;
        });
        
        if (validSlot) {
          setSelectedDate(new Date(validSlot.date));
          setSelectedTime(validSlot.start_time.substring(0, 5));
          toast.success(`Fundet ledig tid: ${format(new Date(validSlot.date), 'd. MMMM', { locale: da })} kl. ${validSlot.start_time.substring(0, 5)}`);
        } else {
          const tomorrow = addDays(now, 1);
          setSelectedDate(tomorrow);
          setSelectedTime("09:00");
          toast.info("Ingen registrerede ledige tider fundet i de næste 14 dage");
        }
      } else {
        // If no availability found in database, suggest next day at 09:00
        const tomorrow = addDays(now, 1);
        setSelectedDate(tomorrow);
        setSelectedTime("09:00");
        toast.info("Ingen registrerede ledige tider fundet i de næste 14 dage");
      }
    } catch (error) {
      console.error('Error finding available time:', error);
      toast.error("Kunne ikke finde ledige tider");
    } finally {
      setLoadingBoosters(false);
    }
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

    if (!selectedDate || !selectedTime) {
      toast.error("Vælg venligst dato og tid");
      return;
    }

    // Get the first cart item as the primary service
    const primaryService = cartItems[0];
    // Get the first assigned booster as the primary booster
    const primaryAssignments = boosterAssignments.get(0) || [];
    const primaryBooster = primaryAssignments[0];
    
    // Get extra boosters (all other assigned boosters)
    const allAssignedBoosters = Array.from(boosterAssignments.values()).flat();
    const extraBoosters = allAssignedBoosters.slice(1); // All except primary

    const booking = {
      service: primaryService.name,
      date: selectedDate,
      time: selectedTime,
      booster: primaryBooster?.name || 'Ikke tildelt',
      boosterId: primaryBooster?.id,
      duration: primaryService.totalDuration,
      price: primaryService.finalPrice,
      location: bookingDetails?.location?.address || ''
    };

    // Calculate total price from all cart items
    const totalPrice = cartItems.reduce((sum, item) => sum + item.finalPrice, 0);

    navigate('/checkout', {
      state: {
        booking,
        booster: primaryBooster,
        service: {
          id: primaryService.id,
          name: primaryService.name,
          price: totalPrice,
          duration: primaryService.totalDuration,
          category: primaryService.category
        },
        bookingDetails,
        counts: { 
          people: primaryService.people, 
          boosters: cartItems.reduce((sum, item) => sum + item.boosters, 0)
        },
        cartItems,
        extraBoosters: extraBoosters.map(b => ({
          id: b.id,
          name: b.name,
          portfolio_image_url: b.portfolio_image_url,
          location: b.location
        }))
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
    // If coming from calendar-first flow with a selected time from availability,
    // go directly to checkout for instant booking (no approval needed)
    if (calendarTimeSelected && specificBooster && selectedDate && selectedTime) {
      const booking = {
        service: selectedService.name,
        date: selectedDate,
        time: selectedTime,
        booster: specificBooster.name,
        boosterId: specificBooster.id,
        duration: selectedService.duration,
        price: selectedService.price,
        location: bookingDetails?.location?.address || ''
      };

      navigate('/checkout', { 
        state: { 
          booking, 
          booster: specificBooster, 
          service: selectedService, 
          bookingDetails, 
          counts: { people: 1, boosters: 1 },
          isDirectBooking: true // Flag for direct booking from available slot
        } 
      });
      return;
    }

    setDeterminedServiceId(selectedService.id);
    setService(selectedService);
    setShowServiceSelection(false);
    setShowCalendarFirst(false);
    setCalendarTimeSelected(false);
  };

  const handleCalendarTimeConfirm = () => {
    if (selectedDate && selectedTime) {
      setCalendarTimeSelected(true);
      setShowServiceSelection(true);
    }
  };

  // Only show skeleton for booster-specific booking that needs to load booster data
  // For general booking (from Services), we should show content immediately if cart has items
  const shouldShowSkeleton = loading && cartItems.length === 0;
  const boosterLoading = boosterId && (loadingSpecificBooster || !specificBooster);
  
  if (shouldShowSkeleton || boosterLoading) {
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

  // Get available dates from availability data
  const getAvailableDates = (): Set<string> => {
    const dates = new Set<string>();
    boosterAvailability.forEach(slot => {
      dates.add(slot.date);
    });
    return dates;
  };

  // Get available time slots for a specific date
  const getAvailableTimesForDate = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slots = boosterAvailability.filter(slot => slot.date === dateStr);
    
    const availableTimes: string[] = [];
    const now = new Date();
    const currentHourNow = now.getHours();
    const currentMinNow = now.getMinutes();
    const isTodayDate = isToday(date);
    
    slots.forEach(slot => {
      const startHour = parseInt(slot.start_time.split(':')[0]);
      const startMin = parseInt(slot.start_time.split(':')[1]);
      const endHour = parseInt(slot.end_time.split(':')[0]);
      const endMin = parseInt(slot.end_time.split(':')[1]);
      
      // Generate 30-minute slots between start and end time
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        
        // Skip past times if date is today
        if (!isTodayDate || currentHour > currentHourNow || (currentHour === currentHourNow && currentMin > currentMinNow)) {
          availableTimes.push(timeStr);
        }
        
        currentMin += 30;
        if (currentMin >= 60) {
          currentMin = 0;
          currentHour++;
        }
      }
    });
    
    return availableTimes;
  };

  const availableDates = getAvailableDates();
  const availableTimesForSelectedDate = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
  const hasAvailability = boosterAvailability.length > 0;

  // Show calendar first when coming from "Se ledige tider"
  if (boosterId && showCalendarFirst && !calendarTimeSelected && specificBooster) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-8">
          <Link to="/stylists" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Tilbage til Boosters
          </Link>
          
          {/* Booster Header */}
          <div className="flex items-center gap-4 mb-8">
            {specificBooster.portfolio_image_url && (
              <img 
                src={specificBooster.portfolio_image_url} 
                alt={specificBooster.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20 shadow-lg"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Ledige tider hos {specificBooster.name}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {specificBooster.location}
                </span>
                <span className="hidden sm:inline mx-2">•</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {specificBooster.rating} ({specificBooster.review_count} anmeldelser)
                </span>
              </p>
            </div>
          </div>

          {loadingAvailability ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="text-muted-foreground">Henter ledige tider...</p>
                </div>
              </CardContent>
            </Card>
          ) : !hasAvailability ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ingen ledige tider</h3>
                  <p className="text-muted-foreground mb-6">
                    {specificBooster.name} har ingen ledige tider i øjeblikket.
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/stylists">Se andre boosters</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Vælg dato og tidspunkt
                </CardTitle>
                <CardDescription>
                  Vælg hvornår du ønsker din behandling
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  {/* Date Selection */}
                  <div className="flex-shrink-0">
                    <Label className="text-sm font-semibold mb-3 block">Dato</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedTime("");
                      }}
                      disabled={(date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        return isBefore(date, startOfDay(new Date())) || !availableDates.has(dateStr);
                      }}
                      className="rounded-xl border bg-card p-3 pointer-events-auto"
                      locale={da}
                      modifiers={{
                        available: (date) => availableDates.has(format(date, 'yyyy-MM-dd'))
                      }}
                      modifiersStyles={{
                        available: { 
                          fontWeight: 'bold',
                          backgroundColor: 'hsl(var(--primary) / 0.1)'
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-primary/10 inline-block" />
                      Markerede datoer har ledige tider
                    </p>
                  </div>
                  
                  {/* Time Selection */}
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-semibold mb-3 block">Tidspunkt</Label>
                    {!selectedDate ? (
                      <div className="rounded-xl border bg-muted/30 p-8 text-center h-[280px] flex flex-col items-center justify-center">
                        <CalendarIcon className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          Vælg en dato for at se ledige tidspunkter
                        </p>
                      </div>
                    ) : availableTimesForSelectedDate.length === 0 ? (
                      <div className="rounded-xl border bg-muted/30 p-8 text-center h-[280px] flex flex-col items-center justify-center">
                        <Clock className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          Ingen ledige tider på denne dato
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[320px] overflow-y-auto">
                        {availableTimesForSelectedDate.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "transition-all",
                              selectedTime === time 
                                ? "ring-2 ring-primary ring-offset-2" 
                                : "hover:bg-primary/10 hover:border-primary"
                            )}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selection Summary & Continue */}
                <div className={cn(
                  "mt-8 pt-6 border-t transition-all duration-300",
                  selectedDate && selectedTime ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary/5 rounded-xl p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Valgt tidspunkt</p>
                      <p className="font-semibold text-lg">
                        {selectedDate && format(selectedDate, "EEEE d. MMMM yyyy", { locale: da })} kl. {selectedTime}
                      </p>
                    </div>
                    <Button onClick={handleCalendarTimeConfirm} size="lg" className="w-full sm:w-auto">
                      Fortsæt til valg af service
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Show service selection for booster-specific booking (after calendar in calendar-first mode)
  if (boosterId && showServiceSelection && specificBooster) {
    // If services not loaded yet, show loading
    if (boosterServices.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4 py-8">
            <button 
              onClick={() => {
                if (calendarTimeSelected) {
                  setCalendarTimeSelected(false);
                  setShowServiceSelection(false);
                } else {
                  navigate('/stylists');
                }
              }}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {calendarTimeSelected ? 'Tilbage til kalender' : 'Tilbage til Boosters'}
            </button>
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <p className="text-muted-foreground">Henter services...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-8">
          <button 
            onClick={() => {
              if (calendarTimeSelected) {
                setCalendarTimeSelected(false);
                setShowServiceSelection(false);
              } else {
                navigate('/stylists');
              }
            }}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {calendarTimeSelected ? 'Tilbage til kalender' : 'Tilbage til Boosters'}
          </button>
          
          <div className="space-y-6">
            {/* Header with selected time */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Vælg service hos {specificBooster.name}
                </h1>
                <p className="text-muted-foreground">
                  Vælg den service du ønsker at booke
                </p>
              </div>
              {calendarTimeSelected && selectedDate && selectedTime && (
                <div className="bg-primary/10 rounded-xl px-4 py-3 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Valgt tidspunkt</p>
                  <p className="font-semibold">
                    {format(selectedDate, "d. MMMM yyyy", { locale: da })} kl. {selectedTime}
                  </p>
                </div>
              )}
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boosterServices.map((svc) => (
                <Card 
                  key={svc.id} 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-card"
                  onClick={() => handleSelectService(svc)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{svc.name}</h3>
                      <Badge variant="secondary" className="shrink-0">
                        {svc.duration} {svc.duration === 1 ? 'time' : 'timer'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{svc.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-2xl font-bold text-primary">{svc.price} kr</span>
                      <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Vælg
                        <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                      </Button>
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

  // Allow booking page if we have cart items OR a service with booking details
  const hasValidContext = cartItems.length > 0 || (service && (bookingDetails || boosterId));
  
  if (!hasValidContext) {
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

  // Determine back navigation based on context
  const getBackPath = () => {
    if (boosterId) return "/stylists";
    // Check if coming from services
    try {
      const stored = sessionStorage.getItem('bookingDetails');
      const details = stored ? JSON.parse(stored) : null;
      if (details?.serviceId) return "/services";
    } catch {}
    return "/services";
  };

  const getBackLabel = () => {
    if (boosterId) return "Tilbage til Boosters";
    return "Tilbage til Services";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to={getBackPath()} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        {getBackLabel()}
      </Link>

      <div className="space-y-8">
        {/* Header with Location Bubble */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight break-words">
            {boosterId && specificBooster ? `Book ${specificBooster.name}` : 'Vælg dato og booster'}
          </h1>
          <LocationBubble
            onLocationChange={(address, postalCode, city) => {
              setBookingDetails(prev => ({
                ...prev,
                serviceId: prev?.serviceId || '',
                location: { address, postalCode, city }
              }));
            }}
            initialAddress={bookingDetails?.location?.address ? 
              `${bookingDetails.location.address}, ${bookingDetails.location.postalCode} ${bookingDetails.location.city}` : 
              undefined
            }
          />
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

        {/* Date & Time Selection - Smart Layout */}
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
          <CardContent className="space-y-4">
            {/* Next Available Time Button - Prominent */}
            <Button 
              variant="default" 
              className="w-full"
              onClick={findNextAvailableTime}
              disabled={loadingBoosters}
            >
              {loadingBoosters ? "Søger..." : "🕐 Find næste ledige tid"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">eller vælg selv</span>
              </div>
            </div>

            {/* Date Picker */}
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
                    {selectedDate ? format(selectedDate, "EEEE d. MMMM yyyy", { locale: da }) : "Vælg dato"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setSelectedTime(""); setDatePopoverOpen(false); }}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className={cn("rounded-md border pointer-events-auto")}
                    locale={da}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Available Time Slots - Shown when date is selected */}
            {selectedDate && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ledige tider {format(selectedDate, 'd. MMMM', { locale: da })}</Label>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const availableTimes = timeSlots.filter((time) => {
                      if (!isToday(selectedDate)) return true;
                      const [hour, min] = time.split(':').map(Number);
                      const now = new Date();
                      return hour > now.getHours() || (hour === now.getHours() && min > now.getMinutes());
                    });
                    
                    if (availableTimes.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground py-2">
                          Ingen ledige tider på denne dato. Prøv en anden dag.
                        </p>
                      );
                    }
                    
                    return availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="min-w-[70px]"
                      >
                        {time}
                      </Button>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Selected Summary */}
            {selectedDate && selectedTime && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {format(selectedDate, 'EEEE d. MMMM yyyy', { locale: da })} kl. {selectedTime}
                  </span>
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
            onRemoveBooster={handleRemoveBooster}
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