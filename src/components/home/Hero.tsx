import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import heroFallback from "@/assets/beauty-hero-final.png";

const Hero = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);

  // Check if address exists in bookingDetails (from LocationBubble)
  useEffect(() => {
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
    
    // Re-check periodically in case LocationBubble updates it
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

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const handleBookNow = () => {
    // If we have an address saved, go directly to services
    if (hasAddress) {
      navigate('/services');
      return;
    }
    
    // Otherwise, trigger the LocationBubble dialog by dispatching a custom event
    // or navigate to services where they can set address
    window.dispatchEvent(new CustomEvent('openLocationDialog'));
    
    // Fallback: navigate to services anyway - user can set address there or via header
    setTimeout(() => {
      navigate('/services');
    }, 100);
  };

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        poster={heroFallback}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>

      {/* Fallback background - always visible, video overlays when loaded */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroFallback})` }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Large Brand Typography */}
        <h1 className="font-inter text-white leading-none tracking-tight animate-fade-in">
          <span 
            className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light"
            style={{ 
              fontWeight: 200,
              letterSpacing: '0.02em'
            }}
          >
            BEAUTYBOOSTERS
          </span>
        </h1>

        {/* Tagline */}
        <p className="mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl text-white/90 font-medium tracking-wide animate-fade-in" style={{ animationDelay: '0.2s' }}>
          PROFESSIONELLE ARTISTER TIL DØREN
        </p>

        {/* CTA Button */}
        <div className="mt-10 md:mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button 
            onClick={handleBookNow}
            size="lg"
            className="h-14 px-10 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm transition-all duration-300 hover:scale-105"
          >
            Book nu
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 md:mt-16 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/70 text-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span>4.9/5 stjerner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>500+ artister</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span>Hele Danmark</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/70 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
