import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Zap, Users, Search, MapPin, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const [searchData, setSearchData] = useState({
    service: "",
    location: "Nuværende lokation",
    date: "",
    time: ""
  });

  // Prefill with tomorrow's date and next whole hour
  useEffect(() => {
    setSearchData((prev) => {
      if (prev.date && prev.time) return prev;

      const now = new Date();

      // Tomorrow's date in yyyy-mm-dd for native date input
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      const dateISO = `${yyyy}-${mm}-${dd}`;

      // Next whole hour as HH:MM
      const nextHour = new Date(now);
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(nextHour.getHours() + 1);
      const hh = String(nextHour.getHours()).padStart(2, "0");
      const timeStr = `${hh}:00`;

      return {
        ...prev,
        date: prev.date || dateISO,
        time: prev.time || timeStr,
      };
    });
  }, []);

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

  const handleDateIconClick = () => {
    dateInputRef.current?.showPicker();
  };

  const handleTimeIconClick = () => {
    timeInputRef.current?.showPicker();
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
        <Card className="max-w-5xl mx-auto mb-12 bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            {/* All fields in one row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Service Selection */}
              <div className="md:col-span-3">
                <label className="text-sm font-medium text-left block mb-2">Service</label>
                <Select value={searchData.service} onValueChange={(value) => setSearchData(prev => ({...prev, service: value}))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Vælg service" />
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

              {/* Location */}
              <div className="md:col-span-3">
                <label className="text-sm font-medium text-left block mb-2">Lokation</label>
                <div className="relative">
                  <Input
                    placeholder=""
                    value={searchData.location}
                    onChange={(e) => setSearchData(prev => ({...prev, location: e.target.value}))}
                    className="h-9 text-foreground"
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
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-left block mb-2">dato</label>
                <div className="relative">
                  <Input
                    ref={dateInputRef}
                    type="date"
                    value={searchData.date}
                    onChange={(e) => setSearchData(prev => ({...prev, date: e.target.value}))}
                    className="pr-8 text-sm h-9 appearance-none"
                    style={{ colorScheme: 'light' }}
                  />
                  <button
                    type="button"
                    onClick={handleDateIconClick}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Calendar className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              {/* Time with clickable clock icon */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-left block mb-2">Tidspunkt</label>
                <div className="relative">
                  <Input
                    ref={timeInputRef}
                    type="time"
                    value={searchData.time}
                    onChange={(e) => setSearchData(prev => ({...prev, time: e.target.value}))}
                    className="pr-8 text-sm h-9"
                  />
                  <button
                    type="button"
                    onClick={handleTimeIconClick}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Clock className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-2">
                <Button 
                  size="sm" 
                  className="w-full h-9" 
                  onClick={handleSearch}
                >
                  <Search className="mr-1 h-3 w-3" />
                  Søg
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-6">
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