import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock, MapPin, Star, Users, Calendar } from "lucide-react";
import { Helmet } from "react-helmet-async";

// Popular services for quick booking
const popularServices = [
  {
    id: '1',
    name: 'Makeup Styling',
    description: 'Professionel makeup styling til enhver lejlighed',
    price: 1999,
    duration: 1,
    category: 'Makeup & Hår',
    clientType: 'privat' as const,
    image: '/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png'
  },
  {
    id: '3',
    name: 'Makeup & Hårstyling',
    description: 'Komplet styling med makeup og hår',
    price: 2999,
    duration: 1.5,
    category: 'Makeup & Hår',
    clientType: 'privat' as const,
    image: '/lovable-uploads/9f3e9a28-fd85-46b8-97b7-c5c0156f24e8.png'
  },
  {
    id: '8',
    name: 'Brudestyling - Hår & Makeup',
    description: 'Komplet brudestyling uden prøvestyling',
    price: 4999,
    duration: 3,
    category: 'Bryllup - Brudestyling',
    clientType: 'privat' as const,
    image: '/lovable-uploads/4c3ba182-2244-4915-9847-fa861cb7f917.png'
  },
  {
    id: '20',
    name: 'Shoot/Reklame Styling',
    description: 'Professionel styling til shoots og reklamer',
    price: 4499,
    duration: 3,
    category: 'Shoot/reklame',
    clientType: 'virksomhed' as const,
    image: '/lovable-uploads/9d4d8a1b-6699-4473-850c-11d43e2547c4.png'
  }
];

const areas = [
  'København', 'Frederiksberg', 'Nordsjælland', 
  'Aarhus', 'Aalborg', 'Odense'
];

const BookingLanding = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string>('');
  const [clientType, setClientType] = useState<'privat' | 'virksomhed'>('privat');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [address, setAddress] = useState('');

  const filteredServices = popularServices.filter(service => service.clientType === clientType);

  const handleQuickBook = (serviceId: string) => {
    // Store minimal booking details for seamless flow
    const bookingDetails = {
      serviceId,
      area: selectedArea,
      address: address || 'Til bekræftelse ved booking'
    };
    
    sessionStorage.setItem('quickBooking', JSON.stringify(bookingDetails));
    
    if (address && selectedArea) {
      // Go directly to booking if we have location
      navigate(`/booking?service=${serviceId}&quick=true`);
    } else {
      // Go to address page first
      navigate(`/address?service=${serviceId}&quick=true`);
    }
  };

  const handleViewAllServices = () => {
    // Store client type for services page
    sessionStorage.setItem('selectedClientType', clientType);
    navigate('/services');
  };

  return (
    <>
      <Helmet>
        <title>Book beauty service til døren - BeautyBoosters</title>
        <meta name="description" content="Book en professionel beauty artist direkte til døren. Makeup, hår, spraytan og meget mere. Hurtig og nem booking." />
        <link rel="canonical" href={`${window.location.origin}/book`} />
        <meta property="og:title" content="Book beauty service til døren - BeautyBoosters" />
        <meta property="og:description" content="Book en professionel beauty artist direkte til døren. Makeup, hår, spraytan og meget mere." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-subtle">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-primary py-20">
          <div className="container mx-auto px-4">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Beauty til døren
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Book din professionelle beauty artist på under 2 minutter
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Star className="h-4 w-4 mr-1" />
                  4.9 stjerner
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Users className="h-4 w-4 mr-1" />
                  500+ boosters
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <MapPin className="h-4 w-4 mr-1" />
                  Hele Danmark
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Booking Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-elegant">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl md:text-3xl mb-2">
                    Book nu - helt enkelt
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Vælg din service og book på under 2 minutter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Jeg booker som</Label>
                    <RadioGroup value={clientType} onValueChange={(value: 'privat' | 'virksomhed') => setClientType(value)} className="flex gap-8">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="privat" id="privat" />
                        <Label htmlFor="privat" className="text-base">Privat</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="virksomhed" id="virksomhed" />
                        <Label htmlFor="virksomhed" className="text-base">Virksomhed</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Location Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="area" className="text-base font-medium">Område</Label>
                      <Select value={selectedArea} onValueChange={setSelectedArea}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg område" />
                        </SelectTrigger>
                        <SelectContent>
                          {areas.map(area => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-base font-medium">Adresse (valgfri)</Label>
                      <Input
                        id="address"
                        placeholder="Indtast adresse"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Popular Services Grid */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Populære services</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredServices.map((service) => (
                        <Card key={service.id} className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-primary/20">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <img 
                                src={service.image} 
                                alt={service.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm leading-tight mb-1">
                                  {service.name}
                                </h4>
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {service.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {service.duration}h
                                  </div>
                                  <div className="text-sm font-semibold">
                                    {service.price.toLocaleString()} kr
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleQuickBook(service.id)}
                              className="w-full mt-3"
                              size="sm"
                            >
                              Book nu
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* View All Services Button */}
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={handleViewAllServices}
                      className="w-full md:w-auto"
                    >
                      Se alle services
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Hvorfor vælge BeautyBoosters?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Vi gør det nemt at få professionel beauty behandling derhjemme
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Hurtig booking</h3>
                <p className="text-muted-foreground">
                  Book på under 2 minutter - helt uden telefon opkald
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Professionelle artister</h3>
                <p className="text-muted-foreground">
                  Alle vores boosters er uddannede og erfarne professionelle
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Til døren</h3>
                <p className="text-muted-foreground">
                  Vi kommer til dig - derhjemme, på kontoret eller event lokation
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BookingLanding;