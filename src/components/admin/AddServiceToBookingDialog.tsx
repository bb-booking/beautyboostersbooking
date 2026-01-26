import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { boosterImageOverrides } from "@/data/boosterImages";

interface BoosterProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  is_available: boolean;
  portfolio_image_url?: string;
}

interface ServiceEntry {
  id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  people_count: number;
  booster_id?: string;
  booster_name?: string;
}

interface AddServiceToBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingServices: ServiceEntry[];
  boosters: BoosterProfile[];
  onSave: (services: ServiceEntry[]) => void;
  bookingDate?: string;
  bookingTime?: string;
  customerName?: string;
}

const AVAILABLE_SERVICES = [
  { id: 'konfirmation-makeup-haar', name: 'Konfirmationsstyling - Makeup OG Hårstyling', basePrice: 2999 },
  { id: 'konfirmation-makeup', name: 'Konfirmationsstyling - Kun Makeup', basePrice: 1699 },
  { id: 'konfirmation-haar', name: 'Konfirmationsstyling - Kun Hårstyling', basePrice: 1499 },
  { id: 'bryllup-brud', name: 'Bryllup - Brudestyling', basePrice: 3499 },
  { id: 'bryllup-gaest', name: 'Bryllup - Gæstemakeup', basePrice: 1299 },
  { id: 'makeup-styling', name: 'Makeup Styling', basePrice: 899 },
  { id: 'hair-styling', name: 'Hår Styling', basePrice: 799 },
  { id: 'event-makeup', name: 'Event makeup', basePrice: 999 },
  { id: 'sfx-makeup', name: 'SFX Makeup', basePrice: 1299 },
  { id: 'spray-tan', name: 'Spray Tan', basePrice: 499 },
  { id: 'negle', name: 'Negle', basePrice: 399 },
];

export function AddServiceToBookingDialog({
  open,
  onOpenChange,
  existingServices,
  boosters,
  onSave,
  bookingDate,
  bookingTime,
  customerName
}: AddServiceToBookingDialogProps) {
  const [services, setServices] = useState<ServiceEntry[]>(existingServices);

  useEffect(() => {
    if (open) {
      setServices(existingServices);
    }
  }, [open, existingServices]);

  const addNewService = () => {
    const newService: ServiceEntry = {
      id: `service-${Date.now()}`,
      service_id: '',
      service_name: '',
      service_price: 0,
      people_count: 1,
    };
    setServices([...services, newService]);
  };

  const updateService = (index: number, updates: Partial<ServiceEntry>) => {
    setServices(services.map((s, i) => {
      if (i !== index) return s;
      
      // If service_id is being updated, also update name and price
      if (updates.service_id) {
        const serviceInfo = AVAILABLE_SERVICES.find(avail => avail.id === updates.service_id);
        if (serviceInfo) {
          return {
            ...s,
            ...updates,
            service_name: serviceInfo.name,
            service_price: serviceInfo.basePrice * (updates.people_count || s.people_count)
          };
        }
      }
      
      // If people_count is being updated, recalculate price
      if (updates.people_count !== undefined) {
        const serviceInfo = AVAILABLE_SERVICES.find(avail => avail.id === s.service_id);
        if (serviceInfo) {
          return {
            ...s,
            ...updates,
            service_price: serviceInfo.basePrice * updates.people_count
          };
        }
      }
      
      return { ...s, ...updates };
    }));
  };

  const updateBooster = (index: number, boosterId: string) => {
    const booster = boosters.find(b => b.id === boosterId);
    setServices(services.map((s, i) => 
      i === index 
        ? { ...s, booster_id: boosterId, booster_name: booster?.name }
        : s
    ));
  };

  const removeService = (index: number) => {
    if (services.length <= 1) {
      toast.error("Der skal være mindst én service");
      return;
    }
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validate all services have been selected
    const invalidServices = services.filter(s => !s.service_id);
    if (invalidServices.length > 0) {
      toast.error("Vælg venligst en service for alle felter");
      return;
    }
    onSave(services);
    onOpenChange(false);
    toast.success("Services opdateret");
  };

  const totalPrice = services.reduce((sum, s) => sum + s.service_price, 0);

  const getBoosterImage = (boosterName?: string) => {
    if (!boosterName) return null;
    const booster = boosters.find(b => b.name === boosterName);
    if (!booster) return null;
    return boosterImageOverrides[booster.name] || booster.portfolio_image_url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Services & Boosters
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add service button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={addNewService} className="gap-2">
              <Plus className="h-4 w-4" />
              Tilføj service
            </Button>
          </div>

          {/* Services list */}
          <div className="space-y-4">
            {services.map((service, index) => {
              const serviceInfo = AVAILABLE_SERVICES.find(s => s.id === service.service_id);
              
              return (
                <div key={service.id} className="p-4 border rounded-lg space-y-4 bg-muted/30">
                  {/* Service header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-background">
                        Service {index + 1}
                      </Badge>
                      {service.service_price > 0 && (
                        <Badge variant="secondary">
                          {service.service_price.toLocaleString('da-DK')} kr
                        </Badge>
                      )}
                    </div>
                    {services.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeService(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Service selection and people count */}
                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Vælg service</Label>
                      <Select 
                        value={service.service_id} 
                        onValueChange={(value) => updateService(index, { service_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_SERVICES.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} - {s.basePrice.toLocaleString('da-DK')} kr
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Antal
                      </Label>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => updateService(index, { people_count: Math.max(1, service.people_count - 1) })}
                          disabled={service.people_count <= 1}
                        >
                          -
                        </Button>
                        <div className="w-12 h-10 flex items-center justify-center border rounded-md bg-background">
                          {service.people_count}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => updateService(index, { people_count: service.people_count + 1 })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Booster selection */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Tildel booster</Label>
                    <Select 
                      value={service.booster_id || ''} 
                      onValueChange={(value) => updateBooster(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg booster...">
                          {service.booster_name && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {getBoosterImage(service.booster_name) && (
                                  <AvatarImage src={getBoosterImage(service.booster_name)!} alt={service.booster_name} />
                                )}
                                <AvatarFallback className="text-xs">
                                  {service.booster_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{service.booster_name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {boosters.map(booster => {
                          const imageUrl = boosterImageOverrides[booster.name] || booster.portfolio_image_url;
                          return (
                            <SelectItem key={booster.id} value={booster.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  {imageUrl && <AvatarImage src={imageUrl} alt={booster.name} />}
                                  <AvatarFallback className="text-xs">
                                    {booster.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{booster.name}</span>
                                <Badge variant="outline" className="ml-auto text-xs">
                                  {booster.location}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Show assigned booster with avatar */}
                    {service.booster_name && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Avatar className="h-8 w-8">
                          {getBoosterImage(service.booster_name) && (
                            <AvatarImage src={getBoosterImage(service.booster_name)!} alt={service.booster_name} />
                          )}
                          <AvatarFallback className="text-xs">
                            {service.booster_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{service.booster_name}</span>
                        {boosters.find(b => b.name === service.booster_name)?.location && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {boosters.find(b => b.name === service.booster_name)?.location}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total and actions */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">
                {totalPrice.toLocaleString('da-DK')} kr
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuller
              </Button>
              <Button onClick={handleSave}>
                Gem ændringer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
