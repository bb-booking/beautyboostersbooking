import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Zap, Users, Search, MapPin, Star, ShieldCheck, Phone } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import PopularServices from "@/components/home/PopularServices";
import heroFallback from "@/assets/makeup-hair-hero.jpg";
import beautyHeroNoBg from "@/assets/beauty-hero-final.png";

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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Hero video config (trim loop)
  const VIDEO_START = 0;
  const VIDEO_END = 12; // seconds – adjust if needed
  const HERO_VIDEO = "/videos/hero.mp4";
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  // Check geolocation permission (used for "Brug nuværende lokation")
  useEffect(() => {
    try {
      // @ts-ignore permissions not in all browsers
      if (navigator?.permissions?.query) {
        // @ts-ignore
        navigator.permissions.query({ name: "geolocation" }).then((res: any) => {
          setHasLocationPermission(res.state === "granted");
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Persist location into bookingDetails whenever a valid address is present
  useEffect(() => {
    const loc = searchData.location.trim();
    if (!loc) return;
    const parsed = parseAddressFromText(loc);
    if (!parsed.address || !parsed.postalCode || !parsed.city) return;
    try {
      const stored = sessionStorage.getItem("bookingDetails");
      const details = stored ? JSON.parse(stored) : {};
      details.location = { address: parsed.address, postalCode: parsed.postalCode, city: parsed.city };
      sessionStorage.setItem("bookingDetails", JSON.stringify(details));
    } catch {}
  }, [searchData.location]);


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

  const serviceQuickLinks = [
    { label: "Makeup Styling", search: "Makeup Styling" },
    { label: "Spraytan", category: "Spraytan" },
    { label: "Hårstyling / håropsætning", search: "Hårstyling" },
    { label: "Brudestyling", category: "Bryllup - Brudestyling" },
    { label: "Makeup Kursus", category: "Makeup Kurser" },
    { label: "Event makeup", category: "Event" }
  ];

  // Parse a full address string into parts
  const parseAddressFromText = (text: string) => {
    const m = text.match(/^(.*?),\s*(\d{4})\s+(.+)$/);
    if (m) {
      return { address: m[1].trim(), postalCode: m[2], city: m[3].trim() };
    }
    const m2 = text.match(/(.*)\s+(\d{4})\s+([^,]+)$/);
    if (m2) {
      return { address: m2[1].trim().replace(/,\s*$/, ""), postalCode: m2[2], city: m2[3].trim() };
    }
    return { address: text.trim().replace(/,\s*$/, ""), postalCode: "", city: "" };
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        let street = "", postalCode = "", city = "";
        const endpoints = [
          `https://api.dataforsyningen.dk/adresser/reverse?x=${coords.longitude}&y=${coords.latitude}&struktur=mini`,
          `https://api.dataforsyningen.dk/adgangsadresser/reverse?x=${coords.longitude}&y=${coords.latitude}&struktur=mini`,
        ];
        for (const url of endpoints) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const data = await r.json();
            const d = Array.isArray(data) ? data[0] : data;
            if (!d) continue;
            const vej = d.vejnavn || d.vejstykke?.navn || d.adgangsadresse?.vejstykke?.navn || "";
            const husnr = d.husnr || d.adgangsadresse?.husnr || "";
            street = [vej, husnr].filter(Boolean).join(" ").trim();
            postalCode = d.postnr || d.postnummer?.nr || d.adgangsadresse?.postnr || "";
            city = d.postnrnavn || d.postnummer?.navn || d.adgangsadresse?.postnummernavn || "";
            if (street && postalCode && city) break;
          } catch {}
        }
        if (!street) {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
          const j = await res.json();
          const a = j?.address || {};
          street = [a.road, a.house_number].filter(Boolean).join(" ");
          postalCode = a.postcode || "";
          city = a.city || a.town || a.village || "";
        }
        const full = [street, [postalCode, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        setSearchData(prev => ({ ...prev, location: full }));
        setShowLocationSuggestions(false);
        setHasLocationPermission(true);
      } finally {
        setIsLoadingLocation(false);
      }
    }, () => setIsLoadingLocation(false), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  };

  const handleSearch = () => {
    const loc = searchData.location.trim();
    if (!loc) return;
    const parsed = parseAddressFromText(loc);
    const bookingDetails = {
      serviceId: "",
      location: { address: parsed.address, postalCode: parsed.postalCode, city: parsed.city },
    };
    sessionStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));
    navigate('/services');
  };

  return (
      <section className="relative isolate min-h-[80vh] md:min-h-[85vh] flex items-center py-8 md:py-12 overflow-hidden bg-background">
        
        {/* Dark overlay for mobile - ensures text readability */}
        <div className="absolute inset-0 bg-background/60 md:hidden z-[1]" />
        
        {/* Gradient overlay for desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/30 hidden md:block z-[1]" />
        
        
        {/* Hero image - desktop only: positioned right */}
        <img
          src={beautyHeroNoBg}
          alt="Professionel makeup artist – BeautyBoosters"
          className="absolute pointer-events-none z-0 hidden md:block"
          loading="eager"
          style={{ 
            top: '0cm',
            right: 'calc(-10% - 22cm)',
            transform: 'scale(1.62)',
            transformOrigin: 'center right',
            maxWidth: 'none',
            width: 'auto',
            height: '100%'
          }}
        />
        
        {/* Mobile: centered image as background */}
        <img
          src={beautyHeroNoBg}
          alt="Professionel makeup artist – BeautyBoosters"
          className="absolute pointer-events-none z-0 md:hidden"
          loading="eager"
          style={{ 
            top: 'calc(50% - 2.5cm)',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(1.08)',
            maxWidth: 'none',
            width: 'auto',
            height: '100%',
            opacity: 0.95
          }}
        />

        <div className="container relative z-10 mx-auto px-4 md:px-8 lg:px-12">
          <div className="max-w-2xl text-center md:text-left">

            <h1 className="font-inter text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-snug tracking-tight animate-fade-in text-foreground drop-shadow-sm">
              <span className="font-extrabold block">Professionelle artister</span>
              <span className="font-normal block">direkte til døren</span>
            </h1>

            {/* Search Widget */}
            <Card className="mt-8 md:mt-10 bg-card/98 backdrop-blur-md border-border/50 shadow-xl animate-enter">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-sm font-medium text-left block mb-2">Hvor skal vi komme hen?</label>
                    <div className="relative">
                      <Input
                        placeholder="Skriv adresse (fx. Husumgade 1, 2200 København N)"
                        value={searchData.location}
                        onChange={(e) => { setSearchData(prev => ({...prev, location: e.target.value})); setShowLocationSuggestions(true); }}
                        onFocus={() => setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 120)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                        className="h-10 sm:h-12 text-foreground text-sm sm:text-base"
                      />
                      {showLocationSuggestions && (
                        <div className="absolute mt-1 left-0 right-0 bg-background border rounded-md shadow z-50 max-h-72 overflow-auto">
                          {locationOptions
                            .filter((opt) =>
                              opt.toLowerCase().includes(searchData.location.toLowerCase())
                            )
                            .slice(0, 8)
                            .map((opt) => (
                              <div
                                key={opt}
                                className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
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

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      className="h-10 sm:h-12 text-sm sm:text-base sm:w-auto"
                    >
                      {isLoadingLocation ? (
                        <>
                          <div className="mr-2 h-4 w-4 rounded-full border-2 border-current border-b-transparent animate-spin" />
                          Finder lokation...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 h-4 w-4" />
                          Brug nuværende lokation
                        </>
                      )}
                    </Button>

                    <Button className="h-10 sm:h-12 text-sm sm:text-base w-full sm:flex-1" onClick={handleSearch}>
                      <Search className="mr-2 h-4 w-4" />
                      Vælg service
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
  );
};

export default Hero;