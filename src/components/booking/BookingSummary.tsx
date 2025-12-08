import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Users, Clock, X, Sparkles } from "lucide-react";
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
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Din booking</h3>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Service items */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              className="relative bg-gradient-to-br from-background to-muted/30 p-4 rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge 
                      variant="outline" 
                      className="text-xs font-medium bg-background/80 border-border"
                    >
                      Service {index + 1}
                    </Badge>
                    <Badge className="text-xs font-medium bg-primary/90 hover:bg-primary">
                      {item.category}
                    </Badge>
                  </div>
                  
                  {/* Service name */}
                  <h4 className="font-semibold text-base mb-3 leading-tight">
                    {item.name}
                  </h4>
                  
                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{item.people} {item.people === 1 ? 'person' : 'personer'}</span>
                    </div>
                    <span className="text-muted-foreground/30">•</span>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium text-primary">
                        {item.boosters} {item.boosters === 1 ? 'booster' : 'boosters'}
                      </span>
                    </div>
                    <span className="text-muted-foreground/30">•</span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{item.totalDuration} {item.totalDuration === 1 ? 'time' : 'timer'}</span>
                    </div>
                  </div>
                </div>

                {/* Price and remove */}
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-bold text-lg whitespace-nowrap">
                    {item.finalPrice.toLocaleString('da-DK')} <span className="text-sm font-semibold text-muted-foreground">DKK</span>
                  </span>
                  {onRemoveItem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
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

        {/* Summary section */}
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Antal services</span>
            <span className="font-medium">{items.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Boosters i alt</span>
            <span className="font-semibold text-primary">{totalBoosters}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Samlet varighed</span>
            <span className="font-medium">{totalDuration} {totalDuration === 1 ? 'time' : 'timer'}</span>
          </div>
          
          {/* Total price */}
          <div className="flex justify-between items-center pt-3 border-t border-border/50">
            <span className="font-semibold text-base">I alt</span>
            <div className="text-right">
              <span className="font-bold text-2xl">{totalPrice.toLocaleString('da-DK')}</span>
              <span className="text-sm font-semibold text-muted-foreground ml-1">DKK</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
