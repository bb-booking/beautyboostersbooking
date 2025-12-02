import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/contexts/CartContext";

interface BookingSummaryProps {
  items: CartItem[];
  onRemoveItem?: (id: string) => void;
  totalPrice: number;
  totalDuration: number;
}

export const BookingSummary = ({ items, onRemoveItem, totalPrice, totalDuration }: BookingSummaryProps) => {
  if (items.length === 0) return null;

  const totalBoosters = items.reduce((sum, item) => sum + item.boosters, 0);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Din booking oversigt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service items */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="bg-background p-4 rounded-lg border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Service {index + 1}
                    </Badge>
                    <Badge className="text-xs bg-primary">
                      {item.category}
                    </Badge>
                  </div>
                  <h4 className="font-semibold mb-1 text-sm">{item.name}</h4>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{item.people} {item.people === 1 ? 'person' : 'personer'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="font-medium text-primary">
                        {item.boosters} {item.boosters === 1 ? 'booster' : 'boosters'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.totalDuration} {item.totalDuration === 1 ? 'time' : 'timer'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className="font-bold text-base whitespace-nowrap">
                    {item.finalPrice.toLocaleString()} DKK
                  </span>
                  {onRemoveItem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Antal services:</span>
            <span className="font-medium">{items.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Boosters i alt:</span>
            <span className="font-medium text-primary">{totalBoosters}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Samlet varighed:</span>
            <span className="font-medium">{totalDuration} timer</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">I alt:</span>
            <span className="font-bold text-xl">{totalPrice.toLocaleString()} DKK</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
