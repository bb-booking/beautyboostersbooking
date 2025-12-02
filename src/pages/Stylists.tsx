import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock, Bike, Store, Heart, Calendar } from "lucide-react";
import { toast } from "sonner";
import { boosterImageOverrides } from "@/data/boosterImages";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Booster {
  id: string;
  name: string;
  specialties: string[];
  bio: string;
  hourly_rate: number;
  portfolio_image_url: string;
  rating: number;
  review_count: number;
  location: string;
  years_experience: number;
  is_available: boolean;
}

interface BoosterAvailability {
  boosterId: string;
  availableSlots: number;
  nextAvailable: string | null;
}

const Stylists = () => {
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [filteredBoosters, setFilteredBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Map<string, BoosterAvailability>>(new Map());

  useEffect(() => {
    const initializePage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      await fetchBoosters();
      if (user?.id) {
        await fetchFavorites(user.id);
      }
    };
    initializePage();
  }, []);

  useEffect(() => {
    filterBoosters();
  }, [boosters, searchTerm, specialtyFilter, locationFilter]);

  const fetchBoosters = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setBoosters(data || []);
      
      // Fetch availability for all boosters
      if (data) {
        await fetchAvailability(data.map(b => b.id));
      }
    } catch (error) {
      console.error('Error fetching boosters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_favorites')
        .select('booster_id')
        .eq('user_id', uid);

      if (error) throw error;
      setFavorites(new Set(data?.map(f => f.booster_id) || []));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchAvailability = async (boosterIds: string[]) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('booster_availability')
        .select('booster_id, date, status')
        .in('booster_id', boosterIds)
        .gte('date', today)
        .lte('date', nextWeek)
        .eq('status', 'available');

      if (error) throw error;

      const availabilityMap = new Map<string, BoosterAvailability>();
      boosterIds.forEach(id => {
        const slots = data?.filter(a => a.booster_id === id) || [];
        const nextAvailable = slots.length > 0 ? slots[0].date : null;
        availabilityMap.set(id, {
          boosterId: id,
          availableSlots: slots.length,
          nextAvailable
        });
      });

      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const toggleFavorite = async (boosterId: string) => {
    if (!userId) {
      toast.error('Log ind for at gemme favoritter');
      return;
    }

    const isFavorite = favorites.has(boosterId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('customer_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('booster_id', boosterId);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(boosterId);
          return newSet;
        });
        toast.success('Fjernet fra favoritter');
      } else {
        const { error } = await supabase
          .from('customer_favorites')
          .insert({ user_id: userId, booster_id: boosterId });

        if (error) throw error;

        setFavorites(prev => new Set(prev).add(boosterId));
        toast.success('Tilføjet til favoritter');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Kunne ikke opdatere favorit');
    }
  };

  const filterBoosters = () => {
    let filtered = boosters;

    if (searchTerm) {
      filtered = filtered.filter(booster =>
        booster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booster.specialties.some(specialty =>
          specialty.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (specialtyFilter !== "all") {
      filtered = filtered.filter(booster =>
        booster.specialties.some(specialty =>
          specialty.toLowerCase().includes(specialtyFilter.toLowerCase())
        )
      );
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(booster =>
        booster.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    const collator = new Intl.Collator('da', { sensitivity: 'base' });
    filtered = [...filtered].sort((a, b) => collator.compare(a.name, b.name));

    setFilteredBoosters(filtered);
  };

  const uniqueSpecialties = Array.from(
    new Set(boosters.flatMap(booster => booster.specialties))
  );

  const uniqueLocations = Array.from(
    new Set(boosters.map(booster => booster.location))
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-[400px]">
              <CardHeader>
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">Vores Boosters</h1>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto">
          Book din næste skønhedsbehandling med en af vores professionelle makeup artists og hårstylister
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Søg efter Booster eller specialitet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-sm"
          />
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="md:max-w-xs">
              <SelectValue placeholder="Vælg specialitet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle specialiteter</SelectItem>
              {uniqueSpecialties.map(specialty => (
                <SelectItem key={specialty} value={specialty.toLowerCase()}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="md:max-w-xs">
              <SelectValue placeholder="Vælg lokation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle lokationer</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location.toLowerCase()}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoosters.map((booster) => (
          <Card key={booster.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img loading="lazy"
                src={(() => {
                  const n = booster.name.toLowerCase();
                  return boosterImageOverrides[n] ?? booster.portfolio_image_url;
                })()}
                alt={`Booster ${booster.name} – profilbillede`}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <button
                onClick={() => toggleFavorite(booster.id)}
                className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                aria-label={favorites.has(booster.id) ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
              >
                <Heart
                  className={`h-5 w-5 ${
                    favorites.has(booster.id)
                      ? 'fill-red-500 text-red-500'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
              {!booster.is_available && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary">Ikke tilgængelig</Badge>
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {booster.name}
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{booster.rating}</span>
                  <span className="text-muted-foreground">({booster.review_count})</span>
                </div>
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {booster.specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {booster.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {booster.years_experience} år
                  </div>
                </div>
                {booster.name.toLowerCase().includes('anna g') && (
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap leading-none">
                          <Bike className="h-3 w-3 text-muted-foreground" aria-label="Kører ud" />
                          <span className="leading-none">Udkørende</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Kører ud</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap leading-none">
                          <Store className="h-3 w-3 text-muted-foreground" aria-label="Salon tilgængelig" />
                          <span className="leading-none">Salon</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Salon tilgængelig</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {booster.bio}
              </p>
              
              {/* Availability indicator */}
              {availability.has(booster.id) && (
                <div className="mb-4 p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {availability.get(booster.id)!.availableSlots > 0 ? (
                        <>
                          <span className="text-foreground font-medium">
                            {availability.get(booster.id)!.availableSlots} ledige tider
                          </span>
                          {' '}denne uge
                        </>
                      ) : (
                        'Ingen ledige tider denne uge'
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Link to={(() => { const n = booster.name.toLowerCase(); return n.includes('anna g') ? '/stylist/anna-g' : (n.includes('angelica') || n.includes('angelika')) ? '/stylist/angelica' : `/stylist/${booster.id}`; })()} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      Se profil
                    </Button>
                  </Link>
                  <Link to={`/booking?booster=${booster.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Book nu
                    </Button>
                  </Link>
                </div>
                <Link to={`/book/${booster.id}?view=calendar`} className="block">
                  <Button size="sm" variant="secondary" className="w-full">
                    Se ledige tider
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBoosters.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">Ingen Boosters fundet</h3>
          <p className="text-muted-foreground">
            Prøv at justere dine søgekriterier
          </p>
        </div>
      )}
    </div>
  );
};

export default Stylists;