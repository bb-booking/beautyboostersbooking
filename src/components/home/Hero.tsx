import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Zap, Users, Search, MapPin, Clock, Navigation } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [searchData, setSearchData] = useState({
    service: "",
    location: "",
    date: "",
    time: ""
  });

  const serviceCategories = [
    { value: "all", label: "Alle services" },
    { value: "Makeup & Hår", label: "Makeup & Hår" },
    { value: "Spraytan", label: "Spraytan" },
    { value: "Konfirmation", label: "Konfirmation" },
    { value: "Bryllup - Brudestyling", label: "Bryllup - Brudestyling" },
    { value: "Makeup Kurser", label: "Makeup Kurser" },
    { value: "Event", label: "Event" },
    { value: "Børn", label: "Børn" }
  ];

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo - set mock location
          setSearchData(prev => ({...prev, location: "København N, 2200"}));
        },
        (error) => {
          console.error("Location error:", error);
        }
      );
    }
  };

  const handleDateIconClick = () => {
    dateInputRef.current?.showPicker();
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchData.service && searchData.service !== "all") {
      params.set('category', searchData.service);
    }
    navigate(`/services?${params.toString()}`);
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
              {/* Service Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Service</label>
                <Select value={searchData.service} onValueChange={(value) => setSearchData(prev => ({...prev, service: value}))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vælg service kategori" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Location with Current Location Option */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Lokation</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {!searchData.location && (
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="text-xs text-primary hover:underline whitespace-nowrap"
                      >
                        Nuværende
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder={searchData.location ? "" : "Skriv lokation..."}
                    value={searchData.location}
                    onChange={(e) => setSearchData(prev => ({...prev, location: e.target.value}))}
                    className={`${!searchData.location ? "pl-20" : "pl-10"}`}
                    list="locations"
                  />
                  <datalist id="locations">
                    <option value="København, 1000" />
                    <option value="København N, 2200" />
                    <option value="København S, 2300" />
                    <option value="Frederiksberg, 2000" />
                    <option value="Aalborg, 9000" />
                    <option value="Aarhus, 8000" />
                    <option value="Odense, 5000" />
                  </datalist>
                </div>
              </div>
              
              {/* Date with clickable calendar icon */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Dato</label>
                <div className="relative">
                  <Input
                    ref={dateInputRef}
                    type="date"
                    value={searchData.date}
                    onChange={(e) => setSearchData(prev => ({...prev, date: e.target.value}))}
                    className="pr-10 appearance-none"
                    style={{ colorScheme: 'light' }}
                  />
                  <button
                    type="button"
                    onClick={handleDateIconClick}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Time */}
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