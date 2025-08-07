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
  difficulty: string;
  onClick: () => void;
}

const ServiceCard = ({ 
  name, 
  description, 
  price, 
  duration, 
  category, 
  difficulty,
  onClick 
}: ServiceCardProps) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'begynder': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'mellem': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'ekspert': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {duration} timer
          </div>
          <Badge className={getDifficultyColor(difficulty)}>
            {difficulty}
          </Badge>
        </div>
        
        <div className="flex items-center text-lg font-semibold text-primary">
          <DollarSign className="h-5 w-5 mr-1" />
          {price} DKK
        </div>
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