import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  price: number;
  peopleCount: number;
}

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingServices: Service[];
  onServicesChange: (services: Service[]) => void;
}

const AVAILABLE_SERVICES = [
  { id: 'makeup-styling', name: 'Makeup Styling', basePrice: 899 },
  { id: 'hair-styling', name: 'Hår Styling', basePrice: 799 },
  { id: 'bryllup-makeup', name: 'Bryllup makeup', basePrice: 1499 },
  { id: 'event-makeup', name: 'Event makeup', basePrice: 999 },
  { id: 'sfx-makeup', name: 'SFX Makeup', basePrice: 1299 },
  { id: 'tv-produktion', name: 'TV-produktion', basePrice: 1500 },
  { id: 'spray-tan', name: 'Spray Tan', basePrice: 499 },
  { id: 'negle', name: 'Negle', basePrice: 399 },
];

export function AddServiceDialog({
  open,
  onOpenChange,
  existingServices,
  onServicesChange
}: AddServiceDialogProps) {
  const [services, setServices] = useState<Service[]>(existingServices);
  const [selectedService, setSelectedService] = useState('');
  const [peopleCount, setPeopleCount] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  const handleAddService = () => {
    if (!selectedService) return;
    
    const serviceInfo = AVAILABLE_SERVICES.find(s => s.id === selectedService);
    if (!serviceInfo) return;
    
    const newService: Service = {
      id: `${selectedService}-${Date.now()}`,
      name: serviceInfo.name,
      price: customPrice !== null ? customPrice : serviceInfo.basePrice * peopleCount,
      peopleCount
    };
    
    setServices(prev => [...prev, newService]);
    setSelectedService('');
    setPeopleCount(1);
    setCustomPrice(null);
    toast.success(`${serviceInfo.name} tilføjet`);
  };

  const handleRemoveService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = () => {
    onServicesChange(services);
    onOpenChange(false);
    toast.success('Services opdateret');
  };

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Administrer services
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current services */}
          <div>
            <Label className="text-sm font-medium">Nuværende services</Label>
            <div className="mt-2 space-y-2">
              {services.length > 0 ? (
                services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <span className="font-medium">{service.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({service.peopleCount} {service.peopleCount === 1 ? 'person' : 'personer'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{service.price.toLocaleString('da-DK')} kr</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveService(service.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">Ingen services tilføjet</p>
              )}
            </div>
          </div>
          
          {/* Add new service */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Tilføj service</Label>
            <div className="mt-2 space-y-3">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg service..." />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_SERVICES.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.basePrice.toLocaleString('da-DK')} kr/person)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Antal personer</Label>
                  <Input
                    type="number"
                    min={1}
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(Number(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Pris (valgfri)</Label>
                  <Input
                    type="number"
                    placeholder="Auto"
                    value={customPrice ?? ''}
                    onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
              
              <Button
                onClick={handleAddService}
                disabled={!selectedService}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Tilføj service
              </Button>
            </div>
          </div>
          
          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center font-medium">
              <span>Total</span>
              <span className="text-lg">{totalPrice.toLocaleString('da-DK')} kr</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuller
            </Button>
            <Button onClick={handleSave}>
              Gem ændringer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
