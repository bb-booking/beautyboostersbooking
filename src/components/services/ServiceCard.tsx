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
  groupPricing?: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
  maxPeople?: number;
  onClick: () => void;
}

const ServiceCard = ({ 
  id,
  name, 
  description, 
  price, 
  duration, 
  category, 
  groupPricing,
  maxPeople,
  onClick 
}: ServiceCardProps) => {
  const { addToCart } = useCart();
  const [people, setPeople] = useState(1);
  const [boosters, setBoosters] = useState(1);

  const calculatePrice = () => {
    if (!groupPricing) return price * boosters;
    
    // Logic: If people <= boosters, use group pricing for people
    // If people > boosters, use individual pricing per person
    if (people <= boosters) {
      return (groupPricing[people as keyof typeof groupPricing] || price) * boosters;
    } else {
      return price * people;
    }
  };

  const calculateDuration = () => {
    return duration * Math.max(people, boosters);
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
    if (!maxPeople || people < maxPeople) {
      setPeople(prev => prev + 1);
    }
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
                  disabled={maxPeople ? people >= maxPeople : false}
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
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {calculateDuration()} timer
          </div>
          {maxPeople && (
            <Badge variant="outline">
              Op til {maxPeople} personer
            </Badge>
          )}
        </div>
        
        <div className="text-lg font-semibold text-primary">
          {calculatePrice()} DKK
        </div>
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleAddToCart}
        >
          Læg i kurv
        </Button>
        <Button 
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={handleBookNow}
        >
          Book Nu
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;