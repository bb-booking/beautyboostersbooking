import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Clock } from "lucide-react";
import { useCart, CartItem } from "@/contexts/CartContext";
import { toast } from "sonner";

interface UpsellService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  badge?: string;
}

interface UpsellServicesProps {
  currentCategory?: string;
  excludeIds?: string[];
}

// Service definitions for upselling
const ALL_SERVICES: UpsellService[] = [
  { id: '4', name: 'Spraytan', description: 'Naturlig glød til din styling', price: 499, duration: 0.5, category: 'Spraytan', badge: 'Populært tilvalg' },
  { id: '1', name: 'Makeup Styling', description: 'Professionel makeup til enhver lejlighed', price: 1999, duration: 1, category: 'Makeup & Hår' },
  { id: '2', name: 'Hårstyling', description: 'Professionel hårstyling eller opsætning', price: 1999, duration: 1, category: 'Makeup & Hår' },
  { id: '3', name: 'Makeup & Hårstyling', description: 'Komplet styling - spar penge!', price: 2999, duration: 1.5, category: 'Makeup & Hår', badge: 'Bedste værdi' },
  { id: '14', name: '1:1 Makeup Session', description: 'Lær teknikkerne fra en pro', price: 2499, duration: 1.5, category: 'Makeup Kurser' },
];

// Define related services mapping
const RELATED_SERVICES: Record<string, string[]> = {
  '1': ['4', '2', '3'],      // Makeup → Spraytan, Hår, Combo
  '2': ['4', '1', '3'],      // Hår → Spraytan, Makeup, Combo
  '3': ['4', '14'],          // Combo → Spraytan, Course
  '4': ['1', '2', '3'],      // Spraytan → Makeup, Hår, Combo
  '5': ['4', '1', '2'],      // Konfirmation → extras
  '6': ['4', '7', '11'],     // Bryllup makeup → Spraytan, Hår, Brudepige
  '7': ['4', '6', '11'],     // Bryllup hår → Spraytan, Makeup, Brudepige
  '8': ['4', '11'],          // Bryllup komplet → Spraytan, Brudepige
  '14': ['1', '3'],          // Makeup course → actual services
  '16': ['4'],               // Event → Spraytan
  '17': ['4'],               // Børn → Spraytan
  '20': ['4'],               // Shoot → Spraytan
};

export const UpsellServices = ({ currentCategory, excludeIds = [] }: UpsellServicesProps) => {
  const { items, addToCart } = useCart();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  
  // Get IDs of services already in cart
  const cartServiceIds = items.map(item => item.id.split('-')[0]);
  
  // Find related services based on what's in cart
  const getRelatedServices = (): UpsellService[] => {
    const relatedIds = new Set<string>();
    
    cartServiceIds.forEach(id => {
      const related = RELATED_SERVICES[id] || [];
      related.forEach(relId => relatedIds.add(relId));
    });
    
    // Filter out services already in cart or excluded
    return ALL_SERVICES.filter(service => 
      relatedIds.has(service.id) && 
      !cartServiceIds.includes(service.id) &&
      !excludeIds.includes(service.id) &&
      !addedIds.has(service.id)
    ).slice(0, 3); // Show max 3 upsells
  };

  const relatedServices = getRelatedServices();

  const handleAddService = (service: UpsellService) => {
    addToCart({
      id: service.id,
      name: service.name,
      description: service.description,
      basePrice: service.price,
      duration: service.duration,
      category: service.category,
      people: 1,
      boosters: 1,
      finalPrice: service.price,
      totalDuration: service.duration
    });
    
    setAddedIds(prev => new Set(prev).add(service.id));
    toast.success(`${service.name} tilføjet til din booking!`);
  };

  if (relatedServices.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Tilføj til din booking</span>
        </div>
        
        <div className="space-y-3">
          {relatedServices.map((service) => (
            <div 
              key={service.id}
              className="flex items-center justify-between gap-3 p-3 bg-background/80 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{service.name}</span>
                  {service.badge && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                      {service.badge}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{service.price} DKK</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.duration} {service.duration === 1 ? 'time' : 'timer'}
                  </span>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-8 px-3 border-primary/30 hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleAddService(service)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Tilføj
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
