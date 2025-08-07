import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, ShoppingCart, X } from 'lucide-react';

const CartFooter = () => {
  const { items, removeFromCart, getTotalPrice, getTotalDuration, getItemCount } = useCart();

  if (getItemCount() === 0) {
    return null;
  }

  const handleContinue = () => {
    // Navigate to booking page with cart items
    console.log('Continue to booking with items:', items);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-primary backdrop-blur-sm border-t">
      <Card className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
              <span className="font-medium text-primary-foreground">{getItemCount()} service{getItemCount() > 1 ? 's' : ''}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-primary-foreground">
              <Clock className="h-4 w-4" />
              <span>{getTotalDuration()} timer</span>
            </div>
            
            <div className="text-lg font-semibold text-primary-foreground">
              {getTotalPrice()} DKK
            </div>
          </div>
          
          <Button onClick={handleContinue} size="lg" className="bg-primary hover:bg-primary/90">
            Fortsæt til booking
          </Button>
        </div>
        
        {items.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-sm text-primary-foreground space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.name} ({item.people} person{item.people > 1 ? 'er' : ''}, {item.boosters} booster{item.boosters > 1 ? 's' : ''})</span>
                  <div className="flex items-center space-x-2">
                    <span>{item.finalPrice} DKK</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="h-6 w-6 p-0 text-primary-foreground hover:text-destructive hover:bg-primary-foreground/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CartFooter;