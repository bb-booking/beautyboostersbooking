import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

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

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  postal_code: string;
  city: string;
  is_default: boolean;
}

interface LocationBubbleProps {
  onLocationChange?: (address: string, postalCode: string, city: string) => void;
  initialAddress?: string;
}

export const LocationBubble = ({ onLocationChange, initialAddress }: LocationBubbleProps) => {
  const [currentAddress, setCurrentAddress] = useState<string>(initialAddress || "");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [manualPostalCode, setManualPostalCode] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleAddressInputChange = (value: string) => {
    setManualAddress(value);
    fetchSuggestions(value);
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.adresse;
    const streetAddress = `${addr.vejnavn} ${addr.husnr}${addr.etage ? ', ' + addr.etage + '.' : ''}${addr.dør ? ' ' + addr.dør : ''}`;
    
    setManualAddress(streetAddress);
    setManualPostalCode(addr.postnr);
    setManualCity(addr.postnrnavn);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    checkAuthAndLoadAddress();
  }, []);

  const checkAuthAndLoadAddress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);

    if (user) {
      // Fetch saved addresses
      const { data: addresses } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (addresses && addresses.length > 0) {
        setSavedAddresses(addresses);
        // Set default address
        const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
        const fullAddress = `${defaultAddr.address}, ${defaultAddr.postal_code} ${defaultAddr.city}`;
        setCurrentAddress(fullAddress);
        onLocationChange?.(defaultAddr.address, defaultAddr.postal_code, defaultAddr.city);
        return;
      }
    }

    // If no saved address, try geolocation
    tryGeolocation();
  };

  const tryGeolocation = () => {
    if (!navigator.geolocation) return;

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocode using a free service
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.address) {
            const road = data.address.road || data.address.pedestrian || "";
            const houseNumber = data.address.house_number || "";
            const postcode = data.address.postcode || "";
            const city = data.address.city || data.address.town || data.address.village || "";
            
            const address = `${road} ${houseNumber}`.trim();
            const fullAddress = `${address}, ${postcode} ${city}`;
            
            setCurrentAddress(fullAddress);
            onLocationChange?.(address, postcode, city);
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLoadingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const selectSavedAddress = (address: SavedAddress) => {
    const fullAddress = `${address.address}, ${address.postal_code} ${address.city}`;
    setCurrentAddress(fullAddress);
    onLocationChange?.(address.address, address.postal_code, address.city);
    setDialogOpen(false);
  };

  const handleManualAddressSubmit = () => {
    if (!manualAddress || !manualPostalCode || !manualCity) {
      toast.error("Udfyld venligst alle felter");
      return;
    }
    const fullAddress = `${manualAddress}, ${manualPostalCode} ${manualCity}`;
    setCurrentAddress(fullAddress);
    onLocationChange?.(manualAddress, manualPostalCode, manualCity);
    setDialogOpen(false);
    setManualAddress("");
    setManualPostalCode("");
    setManualCity("");
  };

  const handleUseCurrentLocation = () => {
    tryGeolocation();
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors border border-border text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-foreground">
            {loadingLocation ? (
              "Finder lokation..."
            ) : currentAddress ? (
              <>Lokation: <span className="font-medium">{currentAddress}</span></>
            ) : (
              "Vælg lokation"
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vælg leveringsadresse</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Use current location button */}
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleUseCurrentLocation}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Brug nuværende lokation
          </Button>

          {/* Saved addresses */}
          {savedAddresses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Gemte adresser</Label>
              <RadioGroup>
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectSavedAddress(addr)}
                  >
                    <RadioGroupItem value={addr.id} id={addr.id} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{addr.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {addr.address}, {addr.postal_code} {addr.city}
                      </p>
                    </div>
                    {addr.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Standard
                      </span>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Manual address entry */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">Indtast ny adresse</Label>
            <div className="relative">
              <Input
                placeholder="Adresse (f.eks. Vestergade 12)"
                value={manualAddress}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion.tekst}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Postnummer"
                value={manualPostalCode}
                onChange={(e) => setManualPostalCode(e.target.value)}
              />
              <Input
                placeholder="By"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
              />
            </div>
            <Button onClick={handleManualAddressSubmit} className="w-full">
              Brug denne adresse
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
