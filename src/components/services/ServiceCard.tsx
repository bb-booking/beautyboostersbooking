import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
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

const ServiceCard = ({ 
  id,
  name, 
  description, 
  price, 
  duration, 
  category, 
  isInquiry,
  hasExtraHours,
  extraHourPrice,
  groupPricing,
  onClick 
}: ServiceCardProps) => {
  const { addToCart } = useCart();
  const [boosters, setBoosters] = useState(1);
  const [extraHours, setExtraHours] = useState(0);

  const calculatePrice = () => {
    if (isInquiry) return 0;
    
    let basePrice = price * boosters;
    
    // Add extra hours cost
    if (hasExtraHours && extraHours > 0 && extraHourPrice) {
      basePrice += extraHours * extraHourPrice * boosters;
    }
    
    return basePrice;
  };

  const calculateDuration = () => {
    return (duration + extraHours) * boosters;
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
      people: 1,
      boosters,
      finalPrice: calculatePrice(),
      totalDuration: calculateDuration(),
      groupPricing
    });
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const incrementBoosters = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBoosters(prev => prev + 1);
  };

  const decrementBoosters = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (boosters > 1) {
      setBoosters(prev => prev - 1);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{category}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        {/* Boosters and Extra Hours selectors */}
        {!isInquiry && (
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Antal boosters:</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={decrementBoosters}
                  disabled={boosters <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{boosters}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={incrementBoosters}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Extra hours selector - only show for services with extra hours */}
            {hasExtraHours && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ekstra timer:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExtraHours(prev => Math.max(0, prev - 1));
                    }}
                    disabled={extraHours <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{extraHours}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
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
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {isInquiry ? "Tilpasset varighed" : `${calculateDuration()} timer`}
          </div>
        </div>
        
        <div className="text-lg font-semibold text-foreground">
          {isInquiry ? "Send forespørgsel" : `${calculatePrice()} DKK`}
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        {isInquiry ? (
          <Button 
            className="w-full"
            onClick={handleBookNow}
          >
            Send forespørgsel
          </Button>
        ) : (
          <>
            <Button 
              className="flex-1"
              onClick={handleAddToCart}
            >
              Læg i kurv
            </Button>
            <Button 
              className="flex-1"
              onClick={handleBookNow}
            >
              Book Nu
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;