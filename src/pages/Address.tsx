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

  useEffect(() => {
    // Check if geolocation is supported and has permission
    if ("geolocation" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setHasLocationPermission(result.state === "granted");
      });
    }
  }, []);

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
          // Use reverse geocoding to get address from coordinates
          // For demo purposes, we'll simulate this with a mock address
          const mockAddress = {
            street: "Københavnsgade 15",
            city: "København N",
            postalCode: "2200",
            coordinates: { lat: latitude, lng: longitude }
          };
          
          setAddress(mockAddress);
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

    // Save address to session storage for use in booking
    sessionStorage.setItem("selectedAddress", JSON.stringify(address));
    
    // Navigate to booking with service ID
    navigate(`/booking?service=${serviceId}`);
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
          Fortsæt til booking
        </Button>
      </div>
    </div>
  );
};

export default Address;