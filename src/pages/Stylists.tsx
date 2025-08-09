import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock } from "lucide-react";

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

const Stylists = () => {
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [filteredBoosters, setFilteredBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  useEffect(() => {
    fetchBoosters();
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
    } catch (error) {
      console.error('Error fetching boosters:', error);
    } finally {
      setLoading(false);
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
              <img
                src={(() => {
                  const n = booster.name.toLowerCase();
                  const overrides: Record<string, string> = {
                    'anna g': '/lovable-uploads/0af9a841-777c-4b12-b3af-7203257907e4.png',
                    'angelica': '/lovable-uploads/angelica-profile.png',
                    'angelika': '/lovable-uploads/angelica-profile.png',
                    'ann-katrine': '/lovable-uploads/profiles/ann-katrine.png',
                    'ann katrine': '/lovable-uploads/profiles/ann-katrine.png',
                    'bela': '/lovable-uploads/profiles/bela.png',
                    'carla sofie f': '/lovable-uploads/profiles/carla-sofie-f.png',
                    'clara alma': '/lovable-uploads/profiles/clara-alma.png',
                    'darun': '/lovable-uploads/profiles/darun.png',
                  };
                  return overrides[n] ?? booster.portfolio_image_url;
                })()}
                alt={`Booster ${booster.name} – profilbillede`}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              {!booster.is_available && (
                <div className="absolute top-2 right-2">
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {booster.bio}
              </p>
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