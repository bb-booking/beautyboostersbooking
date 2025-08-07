import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ServiceCard from "@/components/services/ServiceCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  difficulty: string;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, categoryFilter, difficultyFilter]);

  const fetchServices = async () => {
    try {
      // Mock data until database is set up
      const mockServices = [
        {
          id: '1',
          name: 'Bryllup Makeup',
          description: 'Professionel bryllup makeup med langvarig finish',
          price: 1500,
          duration: 2,
          category: 'Makeup',
          difficulty: 'Ekspert'
        },
        {
          id: '2', 
          name: 'Fest Hår',
          description: 'Elegant opsætning til fest og galla',
          price: 800,
          duration: 1.5,
          category: 'Hår',
          difficulty: 'Mellem'
        }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(service => service.category === categoryFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter(service => service.difficulty === difficultyFilter);
    }

    setFilteredServices(filtered);
  };

  const handleServiceClick = (serviceId: string) => {
    // Navigate to booking page or open booking modal
    console.log('Book service:', serviceId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Beauty Services</h1>
        <p className="text-muted-foreground mb-6">
          Vælg den beauty-behandling der passer bedst til din anledning
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søg efter services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorier</SelectItem>
              <SelectItem value="Makeup">Makeup</SelectItem>
              <SelectItem value="Hår">Hår</SelectItem>
              <SelectItem value="Negle">Negle</SelectItem>
              <SelectItem value="Bryn & Vipper">Bryn & Vipper</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sværhedsgrad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Niveauer</SelectItem>
              <SelectItem value="Begynder">Begynder</SelectItem>
              <SelectItem value="Mellem">Mellem</SelectItem>
              <SelectItem value="Ekspert">Ekspert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            {...service}
            onClick={() => handleServiceClick(service.id)}
          />
        ))}
      </div>

      {filteredServices.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Ingen services matcher dine søgekriterier
          </p>
        </div>
      )}
    </div>
  );
};

export default Services;