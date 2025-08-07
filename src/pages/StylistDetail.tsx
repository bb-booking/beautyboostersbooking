import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Clock, ArrowLeft, Calendar, DollarSign } from "lucide-react";

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

const StylistDetail = () => {
  const { id } = useParams();
  const [booster, setBooster] = useState<Booster | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBooster();
    }
  }, [id]);

  const fetchBooster = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
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
          <p className="text-muted-foreground">
            Den Booster du leder efter eksisterer ikke.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/stylists" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Tilbage til Boosters
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <img
            src={booster.portfolio_image_url}
            alt={booster.name}
            className="w-full h-96 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">{booster.name}</h1>
              {!booster.is_available && (
                <Badge variant="secondary">Ikke tilgængelig</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-6 text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{booster.rating}</span>
                <span>({booster.review_count} anmeldelser)</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {booster.location}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {booster.years_experience} års erfaring
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {booster.specialties.map((specialty) => (
                <Badge key={specialty} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Om {booster.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {booster.bio}
              </p>
            </CardContent>
          </Card>


          <div className="space-y-3">
            <Link 
              to={`/book/${booster.id}`} 
              className={`w-full ${!booster.is_available ? 'pointer-events-none' : ''}`}
            >
              <Button 
                className="w-full" 
                size="lg"
                disabled={!booster.is_available}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {booster.is_available ? 'Book Nu' : 'Ikke Tilgængelig'}
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full" size="lg">
              Send Besked
            </Button>
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Portfolio</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Portfolio billede {i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Anmeldelser</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">A{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Anonym bruger</span>
                      <div className="flex">
                        {[...Array(5)].map((_, starI) => (
                          <Star key={starI} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fantastisk oplevelse! {booster.name} var meget professionel og resultatet var bedre end forventet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StylistDetail;