import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import heroFallback from "@/assets/beauty-hero-final.png";
import { Input } from "@/components/ui/input";

interface AddressSuggestion {
  tekst: string;
  adresse: {
    vejnavn: string;
    husnr: string;
    etage?: string;
    dør?: string;
    postnr: string;
    postnrnavn: string;
  };
}

const Hero = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Check if user is logged in and if address exists
  useEffect(() => {
    const checkAuth = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();

    const checkAddress = () => {
      try {
        const stored = sessionStorage.getItem("bookingDetails");
        if (stored) {
          const details = JSON.parse(stored);
          if (details.location?.address && details.location?.postalCode && details.location?.city) {
            setHasAddress(true);
            return;
          }
        }
      } catch {}
      setHasAddress(false);
    };

    checkAddress();
    const interval = setInterval(checkAddress, 1000);
    return () => clearInterval(interval);
  }, []);

  // Video loop settings
  const VIDEO_START = 0;
  const VIDEO_END = 12;
  const HERO_VIDEO = "/videos/hero.mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= VIDEO_END) {
        video.currentTime = VIDEO_START;
      }
    };

    const playVideo = async () => {
      try {
        await video.play();
        setVideoLoaded(true);
      } catch {
        // Autoplay blocked
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("canplay", playVideo);
    
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("canplay", playVideo);
    };
  }, []);

  // Fetch address suggestions from DAWA API
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=5`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setSuggestions([]);
    }
  };

  const handleAddressInputChange = (value: string) => {
    setAddressInput(value);
    fetchSuggestions(value);
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.adresse;
    const streetAddress = `${addr.vejnavn} ${addr.husnr}${addr.etage ? ', ' + addr.etage + '.' : ''}${addr.dør ? ' ' + addr.dør : ''}`;
    
    // Save to sessionStorage
    const location = {
      address: streetAddress,
      postalCode: addr.postnr,
      city: addr.postnrnavn
    };
    
    try {
      const stored = sessionStorage.getItem("bookingDetails");
      const details = stored ? JSON.parse(stored) : {};
      details.location = location;
      sessionStorage.setItem("bookingDetails", JSON.stringify(details));
    } catch {}
    
    setAddressInput(suggestion.tekst);
    setSuggestions([]);
    setShowSuggestions(false);
    setHasAddress(true);
    
    // Navigate to services
    navigate('/services');
  };

  const handleBookNow = () => {
    if (hasAddress) {
      navigate('/services');
      return;
    }
    
    window.dispatchEvent(new CustomEvent('openLocationDialog'));
    setTimeout(() => {
      navigate('/services');
    }, 100);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.trim()) {
      navigate('/services');
    }
  };

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-[1] ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Light overlay for readability - shows when video is loaded */}
      {videoLoaded && <div className="absolute inset-0 bg-white/60 z-[2]" />}

      {/* Fallback image - shows when video not loaded */}
      {!videoLoaded && (
        <img
          src={heroFallback}
          alt="Professionel makeup artist – BeautyBoosters"
          className="absolute pointer-events-none z-0"
          style={{ 
            top: '50%',
            right: '0',
            transform: 'translateY(-50%) scale(0.9)',
            transformOrigin: 'center right',
            maxWidth: 'none',
            width: 'auto',
            height: '90%'
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Logo/Brand Typography - smaller and black */}
        <h1 className="font-sans leading-none tracking-tight animate-fade-in">
          <span 
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground"
            style={{ 
              letterSpacing: '-0.02em'
            }}
          >
            BEAUTYBOOSTERS
          </span>
        </h1>

        {/* Tagline */}
        <p className="mt-4 md:mt-6 text-base sm:text-lg md:text-xl font-semibold tracking-wide animate-fade-in text-foreground/80" style={{ animationDelay: '0.2s' }}>
          PROFESSIONELLE ARTISTER TIL DØREN
        </p>

        {/* Address Search - shown for non-logged in users without address */}
        {!isLoggedIn && !hasAddress && (
          <div className="mt-8 md:mt-10 animate-fade-in max-w-md mx-auto" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Indtast din adresse..."
                  value={addressInput}
                  onChange={(e) => handleAddressInputChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="h-14 pl-12 pr-14 text-base rounded-full border-2 border-foreground/20 bg-background/95 shadow-lg focus:border-primary"
                />
                <Button 
                  type="submit"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {suggestion.tekst}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}

        {/* CTA Button - shown for logged in users or those with address */}
        {(isLoggedIn || hasAddress) && (
          <div className="mt-10 md:mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              onClick={handleBookNow}
              size="lg"
              className="h-14 px-10 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              Book nu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Trust indicators */}
        <div className="mt-12 md:mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm animate-fade-in text-foreground/60" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="font-medium">4.9/5 stjerner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="font-medium">500+ artister</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="font-medium">Hele Danmark</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-foreground/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
