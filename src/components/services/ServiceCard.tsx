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
  const [people, setPeople] = useState(1);
  const [boosters, setBoosters] = useState(1);
  const [extraHours, setExtraHours] = useState(0);

  const calculatePrice = () => {
    if (isInquiry) return 0;
    
    let basePrice = 0;
    
    if (!groupPricing) {
      basePrice = price * boosters;
    } else {
      // New logic: Optimal distribution of people across boosters
      if (people === boosters) {
        // Each person gets their own booster - individual pricing
        basePrice = price * people;
      } else if (boosters === 1) {
        // All people share one booster - group pricing
        const groupPrice = groupPricing[Math.min(people, 4) as keyof typeof groupPricing] || 
                          (price + (people - 1) * Math.floor(price * 0.6));
        basePrice = groupPrice;
      } else {
        // Multiple boosters, fewer than people - optimal distribution
        let totalCost = 0;
        let remainingPeople = people;
        
        for (let i = 0; i < boosters; i++) {
          if (remainingPeople <= 0) break;
          
          // Try to fit as many people as possible on this booster optimally
          let optimalPeopleForThisBooster = 1;
          let bestPrice = price; // price for 1 person
          
          for (let testPeople = 1; testPeople <= Math.min(remainingPeople, 4); testPeople++) {
            const testPrice = groupPricing[testPeople as keyof typeof groupPricing] || 
                             (price + (testPeople - 1) * Math.floor(price * 0.6));
            const pricePerPerson = testPrice / testPeople;
            const currentBestPricePerPerson = bestPrice / optimalPeopleForThisBooster;
            
            if (pricePerPerson <= currentBestPricePerPerson) {
              optimalPeopleForThisBooster = testPeople;
              bestPrice = testPrice;
            }
          }
          
          totalCost += bestPrice;
          remainingPeople -= optimalPeopleForThisBooster;
        }
        
        basePrice = totalCost;
      }
    }
    
    // Add extra hours cost
    if (hasExtraHours && extraHours > 0 && extraHourPrice) {
      basePrice += extraHours * extraHourPrice * boosters;
    }
    
    return basePrice;
  };

  const calculateDuration = () => {
    return (duration + extraHours) * Math.max(people, boosters);
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
      people,
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

  const incrementPeople = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPeople(prev => prev + 1);
  };

  const decrementPeople = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (people > 1) {
      setPeople(prev => prev - 1);
      if (boosters > people - 1) {
        setBoosters(people - 1);
      }
    }
  };

  const incrementBoosters = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (boosters < people) {
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
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{category}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        {/* People selector */}
        {groupPricing && (
          <div className="space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Antal personer:</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={decrementPeople}
                  disabled={people <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{people}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={incrementPeople}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Boosters selector - only show if more than 1 person */}
            {people > 1 && (
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
                    disabled={boosters >= people}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

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