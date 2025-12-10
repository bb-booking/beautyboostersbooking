import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus, Minus, Sparkles, Scissors, Sun, Heart, GraduationCap, PartyPopper, Baby, Camera, Users, Palette } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  clientType: 'privat' | 'virksomhed';
  isInquiry?: boolean;
  hasExtraHours?: boolean;
  extraHourPrice?: number;
  groupPricing?: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
  onClick: () => void;
}

// Category colors and icons mapping
const categoryConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  "Makeup & Hår": { color: "text-pink-700", bgColor: "bg-pink-50 border-pink-200", icon: Sparkles },
  "Spraytan": { color: "text-amber-700", bgColor: "bg-amber-50 border-amber-200", icon: Sun },
  "Konfirmation": { color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200", icon: GraduationCap },
  "Bryllup - Brudestyling": { color: "text-rose-700", bgColor: "bg-rose-50 border-rose-200", icon: Heart },
  "Makeup Kurser": { color: "text-indigo-700", bgColor: "bg-indigo-50 border-indigo-200", icon: Palette },
  "Event": { color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", icon: PartyPopper },
  "Børn": { color: "text-sky-700", bgColor: "bg-sky-50 border-sky-200", icon: Baby },
  "Shoot/reklame": { color: "text-violet-700", bgColor: "bg-violet-50 border-violet-200", icon: Camera },
  "Specialister til projekt": { color: "text-teal-700", bgColor: "bg-teal-50 border-teal-200", icon: Users },
  "Makeup / styling til Event": { color: "text-fuchsia-700", bgColor: "bg-fuchsia-50 border-fuchsia-200", icon: PartyPopper },
};

const formatPrice = (price: number) => {
  return price.toLocaleString('da-DK') + ' kr';
};

const ServiceCard = ({ 
  id,
  name, 
  description, 
  price, 
  duration, 
  category,
  clientType, 
  isInquiry,
  hasExtraHours,
  extraHourPrice,
  groupPricing,
  onClick 
}: ServiceCardProps) => {
  const { addToCart } = useCart();
  const [people, setPeople] = useState(1);
  const [boosters, setBoosters] = useState(1);
  const [extraHours, setExtraHours] = useState(0);

  const config = categoryConfig[category] || { color: "text-gray-700", bgColor: "bg-gray-50 border-gray-200", icon: Sparkles };
  const CategoryIcon = config.icon;

  const calculatePrice = () => {
    if (isInquiry) return 0;
    
    let basePrice;
    
    if (clientType === "virksomhed") {
      basePrice = price * boosters;
    } else {
      if (groupPricing && people <= 4) {
        basePrice = groupPricing[people as keyof typeof groupPricing];
      } else {
        basePrice = price * people;
      }
      
      if (boosters > 1) {
        basePrice += (boosters - 1) * 999;
      }
    }
    
    if (hasExtraHours && extraHours > 0 && extraHourPrice) {
      basePrice += extraHours * extraHourPrice * boosters;
    }
    
    return basePrice;
  };

  const calculateDuration = () => {
    const baseDuration = duration + extraHours;
    
    if (clientType === "virksomhed") {
      return baseDuration;
    } else {
      const rounds = Math.ceil(people / boosters);
      return baseDuration * rounds;
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id,
      name,
      description,
      basePrice: price,
      duration,
      category,
      people: clientType === "virksomhed" ? 1 : people,
      boosters,
      finalPrice: calculatePrice(),
      totalDuration: calculateDuration(),
      groupPricing
    });
    toast.success(`${name} lagt i kurv ✨`);
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sessionStorage.setItem('selectedCounts', JSON.stringify({ people, boosters, extraHours }));
    } catch {}
    addToCart({
      id,
      name,
      description,
      basePrice: price,
      duration,
      category,
      people: clientType === "virksomhed" ? 1 : people,
      boosters,
      finalPrice: calculatePrice(),
      totalDuration: calculateDuration(),
      groupPricing
    });
    onClick();
  };

  const incrementBoosters = (e: React.MouseEvent) => {
    e.stopPropagation();
    const maxBoosters = clientType === "virksomhed" ? 20 : people;
    if (boosters < maxBoosters) {
      setBoosters(prev => prev + 1);
    }
  };

  const decrementBoosters = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (boosters > 1) {
      setBoosters(prev => prev - 1);
    }
  };

  return (
    <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md overflow-hidden">
      {/* Category Header */}
      <div className={`px-4 py-2.5 ${config.bgColor} border-b flex items-center gap-2`}>
        <CategoryIcon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>
          {category}
        </span>
      </div>
      
      <CardContent className="pt-5 pb-4 px-5">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-5 line-clamp-2 leading-relaxed">{description}</p>
        
        {/* Selectors */}
        {!isInquiry && (
          <div className="space-y-3 mb-5">
            {/* People selector */}
            {clientType !== "virksomhed" && (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <span className="text-sm font-medium">Antal personer</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (people > 1) setPeople(prev => prev - 1);
                    }}
                    disabled={people <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-lg">{people}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPeople(prev => prev + 1);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Boosters selector */}
            {(clientType === "virksomhed" || (clientType === "privat" && people > 1)) && (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <span className="text-sm font-medium">Antal boosters</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10"
                    onClick={decrementBoosters}
                    disabled={boosters <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-lg">{boosters}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10"
                    onClick={incrementBoosters}
                    disabled={clientType === "privat" && boosters >= people}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Extra hours selector */}
            {hasExtraHours && (
              <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <span className="text-sm font-medium">Ekstra timer</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExtraHours(prev => Math.max(0, prev - 1));
                    }}
                    disabled={extraHours <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold text-lg">{extraHours}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExtraHours(prev => prev + 1);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Duration and Price */}
        <div className="flex items-center justify-between pt-2 border-t border-muted/50">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1.5" />
            {isInquiry ? "Tilpasset" : `${calculateDuration()} timer`}
          </div>
          <div className="text-xl font-bold text-foreground">
            {isInquiry ? "Forespørgsel" : formatPrice(calculatePrice())}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-5 pb-5 pt-0 gap-3">
        {isInquiry ? (
          <Button 
            className="w-full h-11"
            onClick={handleBookNow}
          >
            Send forespørgsel
          </Button>
        ) : (
          <>
            <Button 
              variant="outline"
              className="flex-1 h-11 hover:bg-muted/50"
              onClick={handleAddToCart}
            >
              Læg i kurv
            </Button>
            <Button 
              className="flex-[1.2] h-11 font-semibold"
              onClick={handleBookNow}
            >
              Book nu
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;