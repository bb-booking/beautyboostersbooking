import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, MapPin, Star, Briefcase, ArrowLeft } from "lucide-react";
import { boosterImageOverrides } from "@/data/boosterImages";

// Helper function to get booster image (same logic as Stylists page)
const getBoosterImage = (name: string, portfolioImageUrl?: string): string => {
  const normalizedName = name.toLowerCase().trim();
  if (boosterImageOverrides[normalizedName]) {
    return boosterImageOverrides[normalizedName];
  }
  return portfolioImageUrl || '/placeholder.svg';
};

interface FavoriteBooster {
  id: string;
  booster_id: string;
  booster_profiles: {
    id: string;
    name: string;
    bio: string;
    location: string;
    specialties: string[];
    rating: number;
    review_count: number;
    portfolio_image_url: string;
    years_experience: number;
  };
}

const CustomerFavorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteBooster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('customer_favorites')
        .select(`
          id,
          booster_id,
          booster_profiles (
            id,
            name,
            bio,
            location,
            specialties,
            rating,
            review_count,
            portfolio_image_url,
            years_experience
          )
        `)
        .eq('user_id', session.user.id);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Kunne ikke hente favoritter');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
      toast.success('Fjernet fra favoritter');
      fetchFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Kunne ikke fjerne favorit');
    }
  };

  const handleBookBooster = (boosterId: string) => {
    sessionStorage.setItem('quickBooking', JSON.stringify({ boosterId }));
    navigate('/services');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customer/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mine favorit boosters</h1>
          <p className="text-muted-foreground mt-1">Book hurtigt med dine foretrukne behandlere</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Ingen favoritter endnu</h3>
            <p className="text-muted-foreground mb-4">
              Tilføj dine foretrukne boosters som favoritter for hurtigere booking
            </p>
            <Button onClick={() => navigate('/stylists')}>
              Find boosters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => {
            const booster = favorite.booster_profiles;
            return (
              <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <img
                      src={getBoosterImage(booster.name, booster.portfolio_image_url)}
                      alt={booster.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={() => handleRemoveFavorite(favorite.id)}
                    >
                      <Heart className="h-5 w-5 fill-primary text-primary" />
                    </Button>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{booster.name}</h3>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{booster.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({booster.review_count || 0} anmeldelser)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    {booster.location}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Briefcase className="h-4 w-4" />
                    {booster.years_experience} års erfaring
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {booster.specialties.slice(0, 3).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleBookBooster(booster.id)}
                  >
                    Book nu
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerFavorites;
