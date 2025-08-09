import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Zap, Users, Search, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import PopularServices from "@/components/home/PopularServices";

const Hero = () => {
  const navigate = useNavigate();
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [searchData, setSearchData] = useState({
    service: "",
    location: "",
    date: "",
    time: ""
  });

  // Fetch real DK addresses after 3+ chars (Dataforsyningen API)
  useEffect(() => {
    const q = searchData.location.trim();
    if (q.length < 3) {
      setLocationOptions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(q)}&type=adresse&fuzzy=true&per_side=8`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        const opts = (Array.isArray(data) ? data : []).map((d: any) => d.tekst || d.forslagstekst || d.adressebetegnelse).filter(Boolean);
        setLocationOptions(opts);
        setShowLocationSuggestions(true);
      } catch (err) {
        // ignore abort/network errors
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [searchData.location]);

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


  const handleSearch = () => {
    // Persist booking context (location + date/time) for later steps
    const loc = searchData.location.trim();
    const match = loc.match(/(\d{4})\s+([^,]+)$/);
    const postalCode = match ? match[1] : "";
    const city = match ? match[2].trim() : "";
    const address = match ? loc.replace(/,?\s*\d{4}\s+[^,]+$/, "").replace(/,\s*$/, "").trim() : loc;

    const bookingDetails = {
      serviceId: "",
      location: { address, postalCode, city },
      date: searchData.date, // yyyy-mm-dd
      time: searchData.time, // HH:MM
    };
    sessionStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));

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

              {/* Location with custom autocomplete */}
              <div className="md:col-span-3">
                <label className="text-sm font-medium text-left block mb-2">Lokation</label>
                <div className="relative">
                  <Input
                    placeholder="Søg adresse"
                    value={searchData.location}
                    onChange={(e) => setSearchData(prev => ({...prev, location: e.target.value}))}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 120)}
                    className="h-9 text-foreground"
                  />
                  {/* Suggestions */}
                  {showLocationSuggestions && searchData.location.trim().length >= 3 && (
                    <div className="absolute mt-1 left-0 right-0 bg-background border rounded-md shadow z-50 max-h-56 overflow-auto">
                      {locationOptions
                        .filter((opt) =>
                          opt.toLowerCase().includes(searchData.location.toLowerCase())
                        )
                        .slice(0, 8)
                        .map((opt) => (
                          <div
                            key={opt}
                            className="px-3 py-2 hover:bg-accent cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSearchData((prev) => ({ ...prev, location: opt }));
                              setShowLocationSuggestions(false);
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Date with clickable calendar icon via Popover */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-left block mb-2">dato</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-between px-3 text-sm font-normal"
                    >
                      <span>
                        {searchData.date
                          ? (() => {
                              const d = new Date(searchData.date);
                              const dd = String(d.getDate()).padStart(2, "0");
                              const mm = String(d.getMonth() + 1).padStart(2, "0");
                              const yy = String(d.getFullYear()).slice(-2);
                              return `${dd}.${mm}.${yy}`;
                            })()
                          : ""}
                      </span>
                      <CalendarIcon className="h-3 w-3 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background border" align="start">
                    <Calendar
                      mode="single"
                      selected={searchData.date ? new Date(searchData.date) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, "0");
                        const dd = String(date.getDate()).padStart(2, "0");
                        setSearchData((prev) => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }));
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time with clickable clock icon via Popover */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-left block mb-2">Tidspunkt</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-full justify-between px-3 text-sm font-normal"
                    >
                      <span>{searchData.time}</span>
                      <Clock className="h-3 w-3 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-1 z-50 bg-background border" align="start">
                    <div className="max-h-48 overflow-y-auto">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const hh = String(i).padStart(2, "0");
                        const t = `${hh}:00`;
                        return (
                          <button
                            key={t}
                            className="w-full text-left px-2 py-1 rounded hover:bg-accent"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSearchData((prev) => ({ ...prev, time: t }));
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
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

        {/* Popular Services moved here */}
        <div className="mt-8">
          <PopularServices />
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-8">
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
              <CalendarIcon className="h-8 w-8 text-primary" />
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