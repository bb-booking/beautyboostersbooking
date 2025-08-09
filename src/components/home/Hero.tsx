import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Zap, Users, Search, MapPin, Star, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import PopularServices from "@/components/home/PopularServices";
import heroFallback from "@/assets/makeup-hair-hero.jpg";

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
  const HERO_VIDEO = "https://drive.google.com/uc?export=download&id=19IQTmUI4U-2X_w5Q6wLUeX_zoZ299L99";
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
      <section className="relative isolate min-h-[70vh] md:min-h-[80vh] flex items-center py-16 md:py-24">
        {/* Background image with gradient overlay */}
        <img
          src="/lovable-uploads/d79f43b5-733d-495c-94fa-23af4820ffda.png"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = heroFallback; }}
          alt="Makeup artist på arbejde – book beauty stylist til døren"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        {/* Background video (desktop) */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover hidden md:block"
          muted
          playsInline
          autoPlay
          preload="metadata"
          aria-label="Stemningsvideo af makeup artist – BeautyBoosters"
          poster="/lovable-uploads/d79f43b5-733d-495c-94fa-23af4820ffda.png"
          onLoadedMetadata={(e) => { try { const v = e.currentTarget; v.currentTime = VIDEO_START; v.play().catch(() => {}); } catch {} }}
          onTimeUpdate={(e) => { const v = e.currentTarget; if (v.currentTime >= VIDEO_END) { v.currentTime = VIDEO_START; v.play().catch(() => {}); } }}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl text-left">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight animate-fade-in">
              Book professionelle beauty‑stylister – direkte til din dør
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground animate-fade-in">
              Fra brudestyling til events. Find en certificeret stylist tæt på dig.
            </p>
          </div>

          {/* Search Widget */}
          <Card className="mt-6 md:mt-8 max-w-3xl bg-card/80 backdrop-blur-md border-border/50 shadow-xl animate-enter">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-left block mb-2">Lokation</label>
                  <div className="relative">
                    <Input
                      placeholder="Søg adresse (f.eks. Husumgade 1, 2200 København N)"
                      value={searchData.location}
                      onChange={(e) => setSearchData(prev => ({...prev, location: e.target.value}))}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 120)}
                      className="h-10 text-foreground"
                    />
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="sm:w-auto"
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

                  <Button className="w-full sm:flex-1" onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" />
                    Vælg service
                  </Button>
                </div>

                {/* Quick filters */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {["Bryllup - Brudestyling", "Makeup & Hår", "Spraytan", "Event"].map((label) => (
                    <Button
                      key={label}
                      variant="outline"
                      size="sm"
                      className="rounded-full hover-scale"
                      onClick={() => navigate('/services')}
                      aria-label={`Se ${label}`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 4.9/5 kundetilfredshed</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Certificerede stylister</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> DK‑dækkende</div>
          </div>

          {/* Secondary CTA */}
          <div className="mt-10">
            <Button variant="outline" size="lg" className="text-lg px-8 py-3" asChild>
              <Link to="/booster-signup">
                <Users className="mr-2 h-5 w-5" />
                Bliv Booster
              </Link>
            </Button>
          </div>

          {/* Popular Services */}
          <div className="mt-12">
            <PopularServices />
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mt-10">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Hurtig Booking</h3>
              <p className="text-muted-foreground">Book din beauty‑specialist på få minutter</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Professionelle Stylister</h3>
              <p className="text-muted-foreground">Certificerede og erfarne beauty‑specialister</p>
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