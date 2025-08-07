import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ServiceCard from "@/components/services/ServiceCard";
import CartFooter from "@/components/cart/CartFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  groupPricing?: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [clientType, setClientType] = useState("privat");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, categoryFilter, clientType]);

  const fetchServices = async () => {
    try {
      // Services based on BeautyBoosters website
      const mockServices = [
        {
          id: '1',
          name: 'Makeup Styling',
          description: 'Professionel makeup styling til enhver lejlighed',
          price: 1999,
          duration: 1,
          category: 'Makeup',
          groupPricing: { 1: 1999, 2: 2999, 3: 3999, 4: 4899 }
        },
        {
          id: '2',
          name: 'Hårstyling / håropsætning',
          description: 'Professionel hårstyling eller opsætning',
          price: 1999,
          duration: 1,
          category: 'Hår',
          groupPricing: { 1: 1999, 2: 2999, 3: 3999, 4: 4899 }
        },
        {
          id: '3',
          name: 'Makeup & Hårstyling',
          description: 'Makeup & Hårstyling - hvilket look drømmer du om til dit næste event?',
          price: 2999,
          duration: 1.5,
          category: 'Kombineret',
          groupPricing: { 1: 2999, 2: 4999, 3: 6499, 4: 7999 }
        },
        {
          id: '4',
          name: 'Spraytan',
          description: 'Skræddersyet spraytan med high-end væske som er lugtfri og giver naturlige nuancer',
          price: 499,
          duration: 0.5,
          category: 'Solning',
          groupPricing: { 1: 499, 2: 799, 3: 1099, 4: 1399 }
        },
        {
          id: '5',
          name: 'Konfirmationsstyling - Makeup OG Hårstyling',
          description: 'Lad os stå for stylingen på din store dag. Professionel makeup artist direkte til døren',
          price: 2999,
          duration: 1.5,
          category: 'Konfirmation',
          groupPricing: { 1: 2999, 2: 4999, 3: 6499, 4: 7999 }
        },
        {
          id: '6',
          name: 'Brudestyling - Hår & Makeup (uden prøvestyling)',
          description: 'Lad os style dig til dit bryllup og give dig det bedste udgangspunkt for den perfekte dag',
          price: 4999,
          duration: 3,
          category: 'Bryllup'
        },
        {
          id: '7',
          name: 'Brudestyling - Hår & Makeup (inkl. prøvestyling)',
          description: 'Professionel brudestyling med prøvestyling. Bliv den smukkeste udgave af dig selv',
          price: 6499,
          duration: 4.5,
          category: 'Bryllup'
        },
        {
          id: '8',
          name: '1:1 Makeup Session',
          description: 'Lær at lægge den perfekte makeup af en professionel makeupartist',
          price: 2499,
          duration: 1.5,
          category: 'Undervisning'
        },
        {
          id: '9',
          name: 'The Beauty Bar (makeup kursus)',
          description: 'Makeup kursus på 3 timer for op til 10 personer. Lær både hverdags- og gå-i-byen look',
          price: 4499,
          duration: 3,
          category: 'Undervisning'
        },
        {
          id: '10',
          name: 'Makeup Artist til Touch Up (3 timer)',
          description: 'Makeup artist til rådighed i 3 timer - du bestemmer hvordan tiden fordeles',
          price: 4499,
          duration: 3,
          category: 'Event'
        },
        {
          id: '11',
          name: 'Ansigtsmaling til børn',
          description: 'Sjov ansigtsmaling til børn til events og fester',
          price: 4499,
          duration: 3,
          category: 'Børn'
        },
        {
          id: '12',
          name: 'Makeup Artist til Shoot/Event/Film/TV',
          description: 'Professionel makeup artist til dit næste projekt - op til tre timer',
          price: 4499,
          duration: 3,
          category: 'Professionelt'
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
    <>
      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Vælg Service</h1>
          <p className="text-muted-foreground mb-6">
            Vælg den beauty-behandling der passer bedst til din anledning
          </p>
          
          <div className="mb-6">
            <RadioGroup value={clientType} onValueChange={setClientType} className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="privat" id="privat" />
                <Label htmlFor="privat" className="text-sm font-medium">Privat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="virksomhed" id="virksomhed" />
                <Label htmlFor="virksomhed" className="text-sm font-medium">Virksomhed</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søg efter services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Alle" },
                { value: "Makeup", label: "Makeup" },
                { value: "Hår", label: "Hår" },
                { value: "Kombineret", label: "Kombineret" },
                { value: "Solning", label: "Solning" },
                { value: "Konfirmation", label: "Konfirmation" },
                { value: "Bryllup", label: "Bryllup" },
                { value: "Undervisning", label: "Undervisning" },
                { value: "Event", label: "Event" },
                { value: "Børn", label: "Børn" },
                { value: "Professionelt", label: "Professionelt" }
              ].map((category) => (
                <Button
                  key={category.value}
                  variant={categoryFilter === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(category.value)}
                  className={`${categoryFilter === category.value 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card text-foreground hover:bg-primary/20 border-primary/30"
                  } transition-all duration-200`}
                >
                  {category.label}
                </Button>
              ))}
            </div>
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
      
      <CartFooter />
    </>
  );
};

export default Services;