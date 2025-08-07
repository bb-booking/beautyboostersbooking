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
      // Services based on BeautyBoosters website
      const mockServices = [
        {
          id: '1',
          name: 'Makeup Styling (1 person)',
          description: 'Professionel makeup styling til enhver lejlighed',
          price: 1999,
          duration: 1,
          category: 'Makeup',
          difficulty: 'Begynder'
        },
        {
          id: '2',
          name: 'Hårstyling / håropsætning (1 person)',
          description: 'Professionel hårstyling eller opsætning',
          price: 1999,
          duration: 1,
          category: 'Hår',
          difficulty: 'Begynder'
        },
        {
          id: '3',
          name: 'Makeup & Hårstyling (1 person)',
          description: 'Makeup & Hårstyling - hvilket look drømmer du om til dit næste event?',
          price: 2999,
          duration: 1.5,
          category: 'Kombineret',
          difficulty: 'Mellem'
        },
        {
          id: '4',
          name: 'Spraytan (1 person)',
          description: 'Skræddersyet spraytan med high-end væske som er lugtfri og giver naturlige nuancer',
          price: 499,
          duration: 0.5,
          category: 'Solning',
          difficulty: 'Begynder'
        },
        {
          id: '5',
          name: 'Konfirmationsstyling - Makeup OG Hårstyling',
          description: 'Lad os stå for stylingen på din store dag. Professionel makeup artist direkte til døren',
          price: 2999,
          duration: 1.5,
          category: 'Konfirmation',
          difficulty: 'Mellem'
        },
        {
          id: '6',
          name: 'Brudestyling - Hår & Makeup (uden prøvestyling)',
          description: 'Lad os style dig til dit bryllup og give dig det bedste udgangspunkt for den perfekte dag',
          price: 4999,
          duration: 3,
          category: 'Bryllup',
          difficulty: 'Ekspert'
        },
        {
          id: '7',
          name: 'Brudestyling - Hår & Makeup (inkl. prøvestyling)',
          description: 'Professionel brudestyling med prøvestyling. Bliv den smukkeste udgave af dig selv',
          price: 6499,
          duration: 4.5,
          category: 'Bryllup',
          difficulty: 'Ekspert'
        },
        {
          id: '8',
          name: '1:1 Makeup Session',
          description: 'Lær at lægge den perfekte makeup af en professionel makeupartist',
          price: 2499,
          duration: 1.5,
          category: 'Undervisning',
          difficulty: 'Begynder'
        },
        {
          id: '9',
          name: 'The Beauty Bar (makeup kursus)',
          description: 'Makeup kursus på 3 timer for op til 10 personer. Lær både hverdags- og gå-i-byen look',
          price: 4499,
          duration: 3,
          category: 'Undervisning',
          difficulty: 'Mellem'
        },
        {
          id: '10',
          name: 'Makeup Artist til Touch Up (3 timer)',
          description: 'Makeup artist til rådighed i 3 timer - du bestemmer hvordan tiden fordeles',
          price: 4499,
          duration: 3,
          category: 'Event',
          difficulty: 'Mellem'
        },
        {
          id: '11',
          name: 'Ansigtsmaling til børn',
          description: 'Sjov ansigtsmaling til børn til events og fester',
          price: 4499,
          duration: 3,
          category: 'Børn',
          difficulty: 'Begynder'
        },
        {
          id: '12',
          name: 'Makeup Artist til Shoot/Event/Film/TV',
          description: 'Professionel makeup artist til dit næste projekt - op til tre timer',
          price: 4499,
          duration: 3,
          category: 'Professionelt',
          difficulty: 'Ekspert'
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
              <SelectItem value="Kombineret">Kombineret</SelectItem>
              <SelectItem value="Solning">Solning</SelectItem>
              <SelectItem value="Konfirmation">Konfirmation</SelectItem>
              <SelectItem value="Bryllup">Bryllup</SelectItem>
              <SelectItem value="Undervisning">Undervisning</SelectItem>
              <SelectItem value="Event">Event</SelectItem>
              <SelectItem value="Børn">Børn</SelectItem>
              <SelectItem value="Professionelt">Professionelt</SelectItem>
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