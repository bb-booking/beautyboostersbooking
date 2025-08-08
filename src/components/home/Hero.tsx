import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Zap, Users, Search, MapPin, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    service: "",
    location: "",
    date: "",
    time: ""
  });

  const handleSearch = () => {
    if (searchData.service.trim()) {
      const params = new URLSearchParams();
      if (searchData.service) params.set('search', searchData.service);
      navigate(`/services?${params.toString()}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <section className="relative py-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-xl md:text-2xl font-bold mb-6 text-foreground">
          Book professionelle makeup artister og stylister direkte til døren
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Få den perfekte styling til dit næste event
        </p>
        
        {/* Quick Search Widget */}
        <Card className="max-w-4xl mx-auto mb-12 bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Behandling</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Makeup, spraytan, hår..."
                    value={searchData.service}
                    onChange={(e) => setSearchData(prev => ({...prev, service: e.target.value}))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Lokation</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="København, Aalborg..."
                    value={searchData.location}
                    onChange={(e) => setSearchData(prev => ({...prev, location: e.target.value}))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Dato</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={searchData.date}
                    onChange={(e) => setSearchData(prev => ({...prev, date: e.target.value}))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Tidspunkt</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={searchData.time}
                    onChange={(e) => setSearchData(prev => ({...prev, time: e.target.value}))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-6">
              <Button size="lg" className="text-lg px-8 py-3 w-full md:w-auto" onClick={handleSearch}>
                <Search className="mr-2 h-5 w-5" />
                Søg behandlinger
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3 w-full md:w-auto" asChild>
                <Link to="/services">
                  Se alle services
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Secondary CTA */}
        <div className="mb-12">
          <Button variant="outline" size="lg" className="text-lg px-8 py-3" asChild>
            <Link to="/booster-signup">
              <Users className="mr-2 h-5 w-5" />
              Bliv Booster
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Hurtig Booking</h3>
            <p className="text-muted-foreground">Book din beauty-specialist på få minutter</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Professionelle Stylister</h3>
            <p className="text-muted-foreground">Certificerede og erfarne beauty-specialister</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fleksible Tider</h3>
            <p className="text-muted-foreground">Find stylister der passer din tidsplan</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;