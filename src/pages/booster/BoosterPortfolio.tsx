import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PortfolioImageManager, type PortfolioImage } from "@/components/portfolio/PortfolioImageManager";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoosterPortfolio() {
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [boosterId, setBoosterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoosterProfile();
  }, []);

  const fetchBoosterProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Fejl", description: "Du skal være logget ind", variant: "destructive" });
        return;
      }

      // Get booster profile by user_id
      const { data: boosterProfile, error: profileError } = await supabase
        .from('booster_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!boosterProfile) {
        toast({ title: "Fejl", description: "Kunne ikke finde din booster profil", variant: "destructive" });
        setLoading(false);
        return;
      }

      setBoosterId(boosterProfile.id);
      await fetchPortfolioImages(boosterProfile.id);
    } catch (error: any) {
      console.error('Error fetching booster profile:', error);
      toast({ title: "Fejl", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioImages = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('booster_portfolio_images')
        .select('*')
        .eq('booster_id', id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPortfolioImages(data || []);
    } catch (error: any) {
      console.error('Error fetching portfolio images:', error);
    }
  };

  const handleImagesChange = () => {
    if (boosterId) {
      fetchPortfolioImages(boosterId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!boosterId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            Kunne ikke finde din booster profil. Kontakt support hvis problemet fortsætter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Vis dine arbejder frem for kunderne</p>
      </div>

      <PortfolioImageManager
        boosterId={boosterId}
        images={portfolioImages}
        onImagesChange={handleImagesChange}
        isAdmin={false}
      />
    </div>
  );
}
