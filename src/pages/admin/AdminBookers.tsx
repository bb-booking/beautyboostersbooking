import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BoosterProfile {
  id: string;
  name: string;
  specialties: string[];
  bio?: string;
  review_count?: number;
  portfolio_image_url?: string;
  years_experience?: number;
  is_available?: boolean;
  location: string;
  hourly_rate: number;
  rating?: number;
  created_at: string;
}

const AdminBookers = () => {
  const [boosters, setBoosters] = useState<BoosterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBoosters();
  }, []);

  const fetchBoosters = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoosters(data || []);
    } catch (error) {
      console.error('Error fetching boosters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBoosters = boosters.filter(booster =>
    booster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booster.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booster.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Beauty Boosters</h2>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Beauty Boosters</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tilføj Booster
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søg efter boosters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredBoosters.length} boosters
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredBoosters.map((booster) => (
          <Card key={booster.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={booster.portfolio_image_url} />
                    <AvatarFallback>
                      {booster.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{booster.name}</h3>
                      <Badge 
                        variant={booster.is_available ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {booster.is_available ? "Tilgængelig" : "Ikke tilgængelig"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{booster.rating?.toFixed(1) || "5.0"}</span>
                        <span>({booster.review_count || 0} anmeldelser)</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{booster.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{booster.years_experience || 1} års erfaring</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{booster.hourly_rate} DKK/time</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {booster.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    
                    {booster.bio && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {booster.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Se
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Rediger
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Slet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredBoosters.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Ingen boosters fundet</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `Ingen boosters matcher søgningen "${searchTerm}"`
                : "Der er ingen boosters tilføjet endnu"
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tilføj den første booster
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBookers;