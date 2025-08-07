import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, DollarSign } from "lucide-react";

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
  name, 
  description, 
  price, 
  duration, 
  category, 
  groupPricing,
  maxPeople,
  onClick 
}: ServiceCardProps) => {

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="secondary">{category}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {duration} timer
          </div>
          {maxPeople && (
            <Badge variant="outline">
              Op til {maxPeople} personer
            </Badge>
          )}
        </div>
        
        {groupPricing ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Priser (DKK):</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(groupPricing).map(([people, cost]) => (
                <div key={people} className="flex justify-between">
                  <span className="text-muted-foreground">{people} person{parseInt(people) > 1 ? 'er' : ''}:</span>
                  <span className="font-medium">{cost} DKK</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center text-lg font-semibold text-primary">
            <DollarSign className="h-5 w-5 mr-1" />
            {price} DKK
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button className="w-full">
          Book Nu
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;