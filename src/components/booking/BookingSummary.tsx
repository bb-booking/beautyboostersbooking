import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Users, Clock, X, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

interface BookingSummaryProps {
  items: CartItem[];
  onRemoveItem?: (id: string) => void;
  totalPrice: number;
  totalDuration: number;
}

export const BookingSummary = ({ items, onRemoveItem, totalPrice, totalDuration }: BookingSummaryProps) => {
  const navigate = useNavigate();
  
  if (items.length === 0) return null;

  const totalBoosters = items.reduce((sum, item) => sum + item.boosters, 0);
  const totalPeople = items.reduce((sum, item) => sum + item.people, 0);

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Din booking</h3>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Service items - compact list with quantity */}
        <div className="space-y-2">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between gap-3 bg-background/60 p-3 rounded-lg border border-border/30"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm text-muted-foreground font-medium">{item.people}x</span>
                <span className="font-medium text-sm truncate">{item.name}</span>
              </div>
              {onRemoveItem && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add/remove services button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-sm"
          onClick={() => navigate('/services')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tilføj/fjern services
        </Button>

        {/* Summary - only show totals once */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Personer</span>
            </div>
            <span className="font-medium">{totalPeople}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Boosters</span>
            </div>
            <span className="font-semibold text-foreground">{totalBoosters}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Varighed</span>
            </div>
            <span className="font-medium">{totalDuration} {totalDuration === 1 ? 'time' : 'timer'}</span>
          </div>
          
          {/* Total price */}
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-border/50">
            <span className="font-semibold">I alt</span>
            <div className="text-right">
              <span className="font-bold text-xl">{totalPrice.toLocaleString('da-DK')}</span>
              <span className="text-sm font-medium text-muted-foreground ml-1">DKK</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
