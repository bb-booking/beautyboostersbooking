import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Sparkles, Users, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { boosterImageOverrides } from "@/data/boosterImages";
import { supabase } from "@/integrations/supabase/client";

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
  bookingId?: string;
  bookingDate?: string;
  bookingTime?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
}

// Same pricing as booking flow - matches AVAILABLE_SERVICES in booking
const AVAILABLE_SERVICES = [
  { id: 'konfirmation-makeup-haar', name: 'Konfirmation - Makeup & Hår', basePrice: 2999, category: 'Konfirmation' },
  { id: 'konfirmation-makeup', name: 'Konfirmation - Kun Makeup', basePrice: 1699, category: 'Konfirmation' },
  { id: 'konfirmation-haar', name: 'Konfirmation - Kun Hår', basePrice: 1499, category: 'Konfirmation' },
  { id: 'bryllup-brud', name: 'Bryllup - Brudestyling', basePrice: 3499, category: 'Bryllup' },
  { id: 'bryllup-gaest', name: 'Bryllup - Gæstemakeup', basePrice: 1299, category: 'Bryllup' },
  { id: 'bryllup-brudepige', name: 'Bryllup - Brudepige', basePrice: 1499, category: 'Bryllup' },
  { id: 'makeup-styling', name: 'Makeup Styling', basePrice: 899, category: 'Makeup' },
  { id: 'hair-styling', name: 'Hår Styling', basePrice: 799, category: 'Hår' },
  { id: 'event-makeup', name: 'Event Makeup', basePrice: 999, category: 'Event' },
  { id: 'sfx-makeup', name: 'SFX Makeup', basePrice: 1299, category: 'Special' },
  { id: 'spray-tan', name: 'Spray Tan', basePrice: 499, category: 'Krop' },
  { id: 'negle', name: 'Negle', basePrice: 399, category: 'Beauty' },
];

export function AddServiceToBookingDialog({
  open,
  onOpenChange,
  existingServices,
  boosters,
  onSave,
  bookingId,
  bookingDate,
  bookingTime,
  customerName,
  customerEmail,
  customerPhone,
  address
}: AddServiceToBookingDialogProps) {
  const [services, setServices] = useState<ServiceEntry[]>(existingServices);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // If existingServices is empty but we have some data, initialize with one service
      if (existingServices.length === 0) {
        setServices([{
          id: `service-${Date.now()}`,
          service_id: '',
          service_name: '',
          service_price: 0,
          people_count: 1,
        }]);
      } else {
        setServices(existingServices);
      }
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

  const removeBooster = (index: number) => {
    setServices(services.map((s, i) => 
      i === index 
        ? { ...s, booster_id: undefined, booster_name: undefined }
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

  const handleSave = async () => {
    // Validate all services have been selected
    const invalidServices = services.filter(s => !s.service_id);
    if (invalidServices.length > 0) {
      toast.error("Vælg venligst en service for alle felter");
      return;
    }

    setIsSaving(true);
    
    try {
      // Get all unique boosters assigned (for team display)
      const teamBoosters = services
        .filter(s => s.booster_name)
        .map(s => s.booster_name!)
        .filter((name, idx, arr) => arr.indexOf(name) === idx);

      // Build notes object with all booking data
      const notesData = {
        services: services.map(s => ({
          service_id: s.service_id,
          service_name: s.service_name,
          service_price: s.service_price,
          people_count: s.people_count,
          booster_id: s.booster_id,
          booster_name: s.booster_name
        })),
        team_boosters: teamBoosters,
        total_price: totalPrice,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        address: address
      };

      // If we have a booking ID, update the booster_availability notes
      if (bookingId) {
        const { error } = await supabase
          .from('booster_availability')
          .update({ 
            notes: JSON.stringify(notesData)
          })
          .eq('id', bookingId);

        if (error) throw error;
      }

      // Call the onSave callback
      onSave(services);
      onOpenChange(false);
      toast.success("Services opdateret");
    } catch (error) {
      console.error('Error saving services:', error);
      toast.error("Kunne ikke gemme services");
    } finally {
      setIsSaving(false);
    }
  };

  const totalPrice = services.reduce((sum, s) => sum + s.service_price, 0);
  const totalPeople = services.reduce((sum, s) => sum + s.people_count, 0);

  // Get all unique boosters assigned (for team display)
  const teamBoosters = services
    .filter(s => s.booster_name)
    .map(s => ({ id: s.booster_id, name: s.booster_name! }))
    .filter((b, idx, arr) => arr.findIndex(x => x.id === b.id) === idx);

  const getBoosterImage = (boosterName?: string) => {
    if (!boosterName) return null;
    const booster = boosters.find(b => b.name === boosterName);
    if (!booster) return null;
    return boosterImageOverrides[booster.name] || booster.portfolio_image_url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Services & Team
          </DialogTitle>
          <DialogDescription>
            Administrer services og tildel boosters til denne booking
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Customer info header */}
          {customerName && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">{customerName}</p>
              {bookingDate && bookingTime && (
                <p className="text-sm text-muted-foreground">
                  {new Date(bookingDate).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })} kl. {bookingTime?.slice(0, 5)}
                </p>
              )}
              {address && (
                <p className="text-sm text-muted-foreground">{address}</p>
              )}
            </div>
          )}

          {/* Team overview - shown if multiple boosters */}
          {teamBoosters.length > 1 && (
            <div className="p-3 border rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Team ({teamBoosters.length} boosters)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {teamBoosters.map((booster, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-background rounded-full pl-1 pr-3 py-1">
                    <Avatar className="h-6 w-6">
                      {getBoosterImage(booster.name) && (
                        <AvatarImage src={getBoosterImage(booster.name)!} alt={booster.name} />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {booster.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">{booster.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services list */}
          <div className="space-y-3">
            {services.map((service, index) => (
              <ServiceItem
                key={service.id}
                service={service}
                index={index}
                boosters={boosters}
                totalServices={services.length}
                onUpdateService={updateService}
                onUpdateBooster={updateBooster}
                onRemoveBooster={removeBooster}
                onRemoveService={removeService}
                getBoosterImage={getBoosterImage}
              />
            ))}
          </div>

          {/* Add service button */}
          <Button 
            variant="outline" 
            className="w-full gap-2 border-dashed" 
            onClick={addNewService}
          >
            <Plus className="h-4 w-4" />
            Tilføj service
          </Button>

          {/* Summary & actions */}
          <div className="border-t pt-4 space-y-4">
            {/* Summary grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{services.length}</p>
                <p className="text-xs text-muted-foreground">Services</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-foreground">{totalPeople}</p>
                <p className="text-xs text-muted-foreground">Personer</p>
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{totalPrice.toLocaleString('da-DK')} kr</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuller
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Gem ændringer
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Separate component for each service item to keep code clean
function ServiceItem({
  service,
  index,
  boosters,
  totalServices,
  onUpdateService,
  onUpdateBooster,
  onRemoveBooster,
  onRemoveService,
  getBoosterImage
}: {
  service: ServiceEntry;
  index: number;
  boosters: BoosterProfile[];
  totalServices: number;
  onUpdateService: (index: number, updates: Partial<ServiceEntry>) => void;
  onUpdateBooster: (index: number, boosterId: string) => void;
  onRemoveBooster: (index: number) => void;
  onRemoveService: (index: number) => void;
  getBoosterImage: (name?: string) => string | null;
}) {
  return (
    <div className="p-4 border rounded-lg space-y-3 bg-background">
      {/* Service header with delete */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-muted">
          Service {index + 1}
        </Badge>
        <div className="flex items-center gap-2">
          {service.service_price > 0 && (
            <Badge variant="secondary">
              {service.service_price.toLocaleString('da-DK')} kr
            </Badge>
          )}
          {totalServices > 1 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemoveService(index)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Service selection and count */}
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Service</Label>
          <Select 
            value={service.service_id} 
            onValueChange={(value) => onUpdateService(index, { service_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vælg service..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(
                AVAILABLE_SERVICES.reduce((acc, s) => {
                  if (!acc[s.category]) acc[s.category] = [];
                  acc[s.category].push(s);
                  return acc;
                }, {} as Record<string, typeof AVAILABLE_SERVICES>)
              ).map(([category, categoryServices]) => (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {category}
                  </div>
                  {categoryServices.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span>{s.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {s.basePrice.toLocaleString('da-DK')} kr
                      </span>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Antal
          </Label>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => onUpdateService(index, { people_count: Math.max(1, service.people_count - 1) })}
              disabled={service.people_count <= 1}
            >
              -
            </Button>
            <div className="h-9 w-10 flex items-center justify-center border-y bg-background text-sm font-medium">
              {service.people_count}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => onUpdateService(index, { people_count: service.people_count + 1 })}
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Booster assignment */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Tildelt booster</Label>
        
        {service.booster_name ? (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {getBoosterImage(service.booster_name) && (
                  <AvatarImage src={getBoosterImage(service.booster_name)!} alt={service.booster_name} />
                )}
                <AvatarFallback className="text-xs">
                  {service.booster_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-sm font-medium text-foreground">{service.booster_name}</span>
                {boosters.find(b => b.name === service.booster_name)?.location && (
                  <p className="text-xs text-muted-foreground">
                    {boosters.find(b => b.name === service.booster_name)?.location}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-xs"
              onClick={() => onRemoveBooster(index)}
            >
              Skift
            </Button>
          </div>
        ) : (
          <Select 
            value={service.booster_id || ''} 
            onValueChange={(value) => onUpdateBooster(index, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vælg booster..." />
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
        )}
      </div>
    </div>
  );
}
