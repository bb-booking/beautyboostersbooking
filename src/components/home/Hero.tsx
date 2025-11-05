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
import beautyHeroNoBg from "@/assets/beauty-hero-transparent.png";

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
      <section className="relative isolate min-h-[70vh] md:min-h-[80vh] flex items-center py-16 md:py-24 overflow-hidden bg-background">
        
        {/* Hero image with no background - positioned with eyes above search field */}
        <img
          src={beautyHeroNoBg}
          alt="Professionel makeup artist – BeautyBoosters"
          className="absolute left-1/2 -translate-x-1/2 top-0 h-auto w-full max-w-md md:max-w-2xl object-contain pointer-events-none z-0"
          loading="eager"
          style={{ transform: 'translate(-50%, -15%)' }}
        />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl leading-tight tracking-wide animate-fade-in mx-auto max-w-3xl sm:whitespace-nowrap font-semibold">
              Professionelle artister direkte til døren.
            </h1>
            <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground animate-fade-in w-fit mx-auto tracking-tight">
              Book udkørende artister i hele Danmark.
            </p>
          </div>

          {/* Search Widget */}
          <Card className="mt-6 md:mt-8 max-w-3xl mx-auto bg-card/80 backdrop-blur-md border-border/50 shadow-xl animate-enter">
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


          {/* Secondary CTA */}
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-4 sm:px-0">
            <Button variant="outline" size="lg" className="h-12 text-base sm:text-lg px-6 sm:px-8 py-3" asChild>
              <Link to="/booster-signup">
                <Users className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                Bliv Booster
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 text-base sm:text-lg px-6 sm:px-8 py-3" asChild>
              <a href="tel:+4571786575">
                <Phone className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                Ring til os
              </a>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto mt-8 sm:mt-6 px-4 sm:px-0">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-normal mb-2">Hurtig Booking</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Book din beauty‑specialist på få minutter</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-normal mb-2">Professionelle Artister</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Certificerede og erfarne beauty‑specialister</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-normal mb-2">Fleksible Tider</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Find artister der passer din tidsplan</p>
            </div>
          </div>

          {/* Popular Services */}
          <div className="mt-12">
            <PopularServices />
          </div>
        </div>
      </section>
  );
};

export default Hero;