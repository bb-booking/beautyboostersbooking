import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Address {
  street: string;
  city: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const Address = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("service");
  
  const [address, setAddress] = useState<Address>({
    street: "",
    city: "",
    postalCode: ""
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Autocomplete state
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Check if geolocation is supported and has permission
    if ("geolocation" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setHasLocationPermission(result.state === "granted");
      });
    }
  }, []);

  // Parse "Husumgade 1, 2200 København N" -> fields
  const parseAddressFromText = (text: string) => {
    const m = text.match(/^(.*?),\s*(\d{4})\s+(.+)$/);
    if (m) {
      return { street: m[1], postalCode: m[2], city: m[3] };
    }
    return null;
  };

  // Autocomplete using Dataforsyningen after 3+ chars
  useEffect(() => {
    const q = addressQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(q)}&type=adresse&fuzzy=true&per_side=8`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        const opts = (Array.isArray(data) ? data : [])
          .map((d: any) => d.tekst || d.forslagstekst || d.adressebetegnelse)
          .filter(Boolean);
        setSuggestions(opts);
        setShowSuggestions(true);
      } catch {}
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [addressQuery]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Din browser understøtter ikke lokationsdeling");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding using Dataforsyningen with graceful fallbacks
          let street = "";
          let postalCode = "";
          let city = "";

          const tryReverse = async () => {
            const endpoints = [
              `https://api.dataforsyningen.dk/adresser/reverse?x=${longitude}&y=${latitude}&struktur=mini`,
              `https://api.dataforsyningen.dk/adgangsadresser/reverse?x=${longitude}&y=${latitude}&struktur=mini`,
              `https://api.dataforsyningen.dk/adresser?cirkel=${longitude},${latitude},50&per_side=1&struktur=mini`,
            ];
            for (const url of endpoints) {
              try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                const d = Array.isArray(data) ? data[0] : data;
                if (!d) continue;
                const vej = d.vejnavn || d.vejstykke?.navn || d.adgangsadresse?.vejstykke?.navn || "";
                const husnr = d.husnr || d.adgangsadresse?.husnr || "";
                street = [vej, husnr].filter(Boolean).join(" ").trim();
                postalCode = d.postnr || d.postnummer?.nr || d.adgangsadresse?.postnr || "";
                city = d.postnrnavn || d.postnummer?.navn || d.adgangsadresse?.postnummernavn || "";
                if (street && postalCode && city) return true;
              } catch {}
            }
            return false;
          };

          const ok = await tryReverse();
          if (!ok) {
            // Fallback to OpenStreetMap Nominatim
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            const j = await res.json();
            const a = j?.address || {};
            street = [a.road, a.house_number].filter(Boolean).join(" ");
            postalCode = a.postcode || "";
            city = a.city || a.town || a.village || "";
          }

          if (!street) throw new Error("No address resolved");

          const resolved = {
            street,
            city,
            postalCode,
            coordinates: { lat: latitude, lng: longitude },
          };

          setAddress(resolved);
          setAddressQuery(`${street}, ${postalCode} ${city}`);
          setHasLocationPermission(true);
          toast.success("Adresse fundet automatisk!");
          
        } catch (error) {
          console.error("Error with reverse geocoding:", error);
          toast.error("Kunne ikke finde adresse fra din lokation");
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = "Kunne ikke få din lokation";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Tilladelse til lokation blev nægtet";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Lokation ikke tilgængelig";
            break;
          case error.TIMEOUT:
            errorMessage = "Timeout ved lokationshentning";
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isAddressValid = () => {
    return address.street.trim() && address.city.trim() && address.postalCode.trim();
  };

  const handleContinue = () => {
    if (!isAddressValid()) {
      toast.error("Udfyld venligst alle adressefelter");
      return;
    }

    // Save booking details in the format expected by booking page
    const bookingDetails = {
      serviceId: serviceId,
      location: {
        address: address.street,
        postalCode: address.postalCode,
        city: address.city
      }
    };
    
    sessionStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));
    
    // Navigate to next step: if service chosen earlier -> booking, otherwise -> services
    const nextUrl = serviceId ? `/booking?service=${serviceId}` : "/services";
    navigate(nextUrl);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link to="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Tilbage til services
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hvor skal vi komme?</h1>
          <p className="text-muted-foreground">
            Angiv din adresse så vi kan finde den bedste makeup artist i dit område
          </p>
        </div>

        {/* Current Location Option */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Brug nuværende lokation
            </CardTitle>
            <CardDescription>
              Tillad lokationsdeling for at finde din adresse automatisk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              variant="outline"
              className="w-full"
            >
              {isLoadingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Finder din lokation...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  {hasLocationPermission ? "Opdater lokation" : "Tillad lokation"}
                </>
              )}
            </Button>
            
            {address.coordinates && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                  <div className="text-sm">
                    <div className="font-medium">{address.street}</div>
                    <div className="text-muted-foreground">{address.postalCode} {address.city}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">eller</span>
          </div>
        </div>

        {/* Manual Address Input */}
        <Card>
          <CardHeader>
            <CardTitle>Indtast adresse manuelt</CardTitle>
            <CardDescription>
              Udfyld dine adresseoplysninger nedenfor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Label htmlFor="searchAddress">Søg adresse (auto-udfyld)</Label>
              <Input
                id="searchAddress"
                placeholder="F.eks. Husumgade 1, 2200 København N"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              />
              {showSuggestions && addressQuery.trim().length >= 3 && (
                <div className="absolute mt-1 left-0 right-0 bg-background border rounded-md shadow z-50 max-h-56 overflow-auto">
                  {suggestions.slice(0, 8).map((opt) => (
                    <div
                      key={opt}
                      className="px-3 py-2 hover:bg-accent cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const parsed = parseAddressFromText(opt);
                        if (parsed) {
                          setAddress({
                            street: parsed.street,
                            postalCode: parsed.postalCode,
                            city: parsed.city,
                          });
                        }
                        setAddressQuery(opt);
                        setShowSuggestions(false);
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="street">Gade og nummer *</Label>
              <Input
                id="street"
                placeholder="F.eks. Københavnsgade 15"
                value={address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postnummer *</Label>
                <Input
                  id="postalCode"
                  placeholder="F.eks. 2200"
                  value={address.postalCode}
                  onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="city">By *</Label>
                <Input
                  id="city"
                  placeholder="F.eks. København N"
                  value={address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleContinue}
          className="w-full" 
          size="lg"
          disabled={!isAddressValid()}
        >
          {serviceId ? "Fortsæt til booking" : "Fortsæt til services"}
        </Button>
      </div>
    </div>
  );
};

export default Address;