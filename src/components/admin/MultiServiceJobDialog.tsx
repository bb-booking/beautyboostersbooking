import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, User, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  serviceType: string;
  boosterId: string;
  boosterName: string;
}

interface MultiServiceJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boosters: BoosterProfile[];
  initialBoosterId?: string;
  initialTime?: string;
  initialDate?: Date;
  onJobCreated: () => void;
}

const privateServices = ["Bryllup", "Makeup", "Hår", "Negle", "Spraytan", "Styling", "Bryn & Vipper"];
const businessServices = ["Film/TV", "Teater", "Event", "Reklame", "Fotoshoot", "Fashion", "Messe"];

export const MultiServiceJobDialog = ({
  open,
  onOpenChange,
  boosters,
  initialBoosterId = "",
  initialTime = "09:00",
  initialDate = new Date(),
  onJobCreated
}: MultiServiceJobDialogProps) => {
  // Form state
  const [clientType, setClientType] = useState<'privat' | 'virksomhed'>('privat');
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [location, setLocation] = useState("");
  const [jobDate, setJobDate] = useState<Date>(initialDate);
  const [startTime, setStartTime] = useState(initialTime);
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("500");
  const [title, setTitle] = useState("");
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // Multi-service state
  const [services, setServices] = useState<ServiceEntry[]>([
    { id: crypto.randomUUID(), serviceType: "", boosterId: initialBoosterId, boosterName: "" }
  ]);

  // Customer autocomplete
  const [existingCustomers, setExistingCustomers] = useState<{ name: string; email: string | null; phone: string | null; location: string | null }[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<typeof existingCustomers>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientType('privat');
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setLocation("");
      setJobDate(initialDate);
      setStartTime(initialTime);
      setDuration("60");
      setPrice("500");
      setTitle("");
      setServices([
        { id: crypto.randomUUID(), serviceType: "", boosterId: initialBoosterId, boosterName: getBoosterName(initialBoosterId) }
      ]);
      fetchExistingCustomers();
    }
  }, [open, initialBoosterId, initialTime, initialDate]);

  const getBoosterName = (boosterId: string) => {
    return boosters.find(b => b.id === boosterId)?.name || "";
  };

  const getBoosterImage = (booster: BoosterProfile) => {
    if (booster.portfolio_image_url) return booster.portfolio_image_url;
    const nameLower = booster.name.toLowerCase();
    return boosterImageOverrides[nameLower] || boosterImageOverrides[nameLower.split(' ')[0]] || null;
  };

  const fetchExistingCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('client_name, client_email, client_phone, location')
        .not('client_name', 'is', null);

      if (error) throw error;

      const mapped = (data || []).map(c => ({
        name: c.client_name || '',
        email: c.client_email,
        phone: c.client_phone,
        location: c.location
      }));
      
      const uniqueCustomers = Array.from(
        new Map(mapped.filter(c => c.name).map(c => [c.name, c])).values()
      );

      setExistingCustomers(uniqueCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCustomerSearch = (searchValue: string) => {
    setClientName(searchValue);
    if (searchValue.length >= 2) {
      const filtered = existingCustomers.filter(c =>
        c.name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setCustomerSuggestions(filtered);
      setShowCustomerSuggestions(true);
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  };

  const selectCustomer = (customer: typeof existingCustomers[0]) => {
    setClientName(customer.name);
    if (customer.email) setClientEmail(customer.email);
    if (customer.phone) setClientPhone(customer.phone);
    if (customer.location) setLocation(customer.location);
    setShowCustomerSuggestions(false);
    setCustomerSuggestions([]);
  };

  const generateJobTitle = async () => {
    if (!clientName || services.filter(s => s.serviceType).length === 0) return;
    
    setIsGeneratingTitle(true);
    try {
      const servicesList = services.filter(s => s.serviceType).map(s => ({ service_name: s.serviceType }));
      
      const { data, error } = await supabase.functions.invoke('generate-job-title', {
        body: {
          services: servicesList,
          location: location,
          clientType: clientType
        }
      });

      if (!error && data?.title) {
        setTitle(data.title);
      } else {
        // Fallback: simple title
        const serviceNames = services.filter(s => s.serviceType).map(s => s.serviceType).join(', ');
        setTitle(`${serviceNames} - ${clientName}`);
      }
    } catch (err) {
      const serviceNames = services.filter(s => s.serviceType).map(s => s.serviceType).join(', ');
      setTitle(`${serviceNames} - ${clientName}`);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Auto-generate title when services or client changes
  useEffect(() => {
    if (clientName && services.some(s => s.serviceType) && open) {
      const timer = setTimeout(() => {
        generateJobTitle();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [services, clientName, location, open]);

  const addService = () => {
    setServices(prev => [
      ...prev,
      { id: crypto.randomUUID(), serviceType: "", boosterId: "", boosterName: "" }
    ]);
  };

  const removeService = (id: string) => {
    if (services.length <= 1) return;
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const updateService = (id: string, field: keyof ServiceEntry, value: string) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        if (field === 'boosterId') {
          return { ...s, boosterId: value, boosterName: getBoosterName(value) };
        }
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleCreateJob = async () => {
    if (!title || !clientName) {
      toast.error('Udfyld titel og kundenavn');
      return;
    }

    const validServices = services.filter(s => s.serviceType && s.boosterId);
    if (validServices.length === 0) {
      toast.error('Tilføj mindst én service med en booster');
      return;
    }

    const endMinutes = timeToMinutes(startTime) + parseInt(duration);
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    try {
      // Create the job with the first booster as assigned (for backwards compatibility)
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          title: title,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          service_type: validServices.map(s => s.serviceType).join(', '),
          location: location,
          client_type: clientType,
          date_needed: format(jobDate, 'yyyy-MM-dd'),
          time_needed: startTime,
          hourly_rate: parseInt(price) || 500,
          status: 'assigned',
          assigned_booster_id: validServices[0].boosterId,
          boosters_needed: validServices.length,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create job_services entries for each service
      const jobServicesData = validServices.map(s => ({
        job_id: jobData.id,
        service_id: s.serviceType.toLowerCase().replace(/\s+/g, '-'),
        service_name: s.serviceType,
        service_price: parseInt(price) / validServices.length,
        people_count: 1
      }));

      const { error: servicesError } = await supabase
        .from('job_services')
        .insert(jobServicesData);

      if (servicesError) {
        console.error('Error creating job services:', servicesError);
      }

      // Create booster assignments for each unique booster
      const uniqueBoosterIds = [...new Set(validServices.map(s => s.boosterId))];
      
      const assignmentsData = uniqueBoosterIds.map(boosterId => ({
        job_id: jobData.id,
        booster_id: boosterId,
        assigned_by: 'admin'
      }));

      const { error: assignError } = await supabase
        .from('job_booster_assignments')
        .insert(assignmentsData);

      if (assignError) {
        console.error('Error creating booster assignments:', assignError);
      }

      // Create availability entries for each booster
      for (const boosterId of uniqueBoosterIds) {
        const { error: availError } = await supabase
          .from('booster_availability')
          .insert({
            booster_id: boosterId,
            date: format(jobDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            status: 'busy',
            job_id: jobData.id,
          });

        if (availError) {
          console.error('Error creating availability for booster:', boosterId, availError);
        }
      }

      toast.success(`Job oprettet med ${validServices.length} services og ${uniqueBoosterIds.length} boosters`);
      onOpenChange(false);
      onJobCreated();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Kunne ikke oprette job');
    }
  };

  function timeToMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  const availableServices = clientType === 'privat' ? privateServices : businessServices;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setShowCustomerSuggestions(false);
        setCustomerSuggestions([]);
      }
    }}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Opret job med flere services</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <div className="space-y-4 py-4">
            {/* Customer Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kundetype</Label>
                <Select 
                  value={clientType} 
                  onValueChange={(v) => {
                    setClientType(v as 'privat' | 'virksomhed');
                    // Reset services when type changes
                    setServices([{ id: crypto.randomUUID(), serviceType: "", boosterId: services[0]?.boosterId || "", boosterName: services[0]?.boosterName || "" }]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privat">Privat</SelectItem>
                    <SelectItem value="virksomhed">Virksomhed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Titel
                  {isGeneratingTitle && (
                    <span className="text-xs text-muted-foreground animate-pulse">Genererer...</span>
                  )}
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Auto-genereres"
                />
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label>Kundenavn</Label>
                <Input
                  value={clientName}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  onFocus={() => {
                    if (customerSuggestions.length > 0) setShowCustomerSuggestions(true);
                  }}
                  placeholder="Søg eksisterende eller indtast ny"
                />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {customerSuggestions.map((customer, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        onClick={() => selectCustomer(customer)}
                      >
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{customer.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Vesterbrogade 1, 1620 København"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+45 12 34 56 78"
                />
              </div>
            </div>

            {/* Date, Time, Duration, Price */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Dato</Label>
                <Input
                  type="date"
                  value={format(jobDate, 'yyyy-MM-dd')}
                  onChange={(e) => setJobDate(new Date(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Starttid</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Varighed</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 time</SelectItem>
                    <SelectItem value="90">1,5 time</SelectItem>
                    <SelectItem value="120">2 timer</SelectItem>
                    <SelectItem value="180">3 timer</SelectItem>
                    <SelectItem value="240">4 timer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pris (kr)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                />
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Services & Boosters
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tilføj service
                </Button>
              </div>

              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={service.id} className="p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="shrink-0">
                        Service {index + 1}
                      </Badge>
                      {services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                          className="h-6 w-6 p-0 ml-auto text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Service type</Label>
                        <Select
                          value={service.serviceType}
                          onValueChange={(v) => updateService(service.id, 'serviceType', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Vælg service" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableServices.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Tildel booster</Label>
                        <Select
                          value={service.boosterId}
                          onValueChange={(v) => updateService(service.id, 'boosterId', v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Vælg booster" />
                          </SelectTrigger>
                          <SelectContent>
                            {boosters.map(b => (
                              <SelectItem key={b.id} value={b.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={getBoosterImage(b) || undefined} />
                                    <AvatarFallback className="text-[8px]">
                                      {b.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{b.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {service.boosterId && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Avatar className="h-5 w-5 ring-1 ring-green-500">
                          <AvatarImage src={getBoosterImage(boosters.find(b => b.id === service.boosterId)!) || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {service.boosterName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{service.boosterName}</span>
                        <Badge variant="secondary" className="text-[10px] h-4">
                          {boosters.find(b => b.id === service.boosterId)?.location}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              {services.filter(s => s.serviceType && s.boosterId).length > 0 && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <div className="text-sm font-medium mb-2">Oversigt</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>Services: {services.filter(s => s.serviceType).map(s => s.serviceType).join(', ')}</div>
                    <div>
                      Boosters: {[...new Set(services.filter(s => s.boosterName).map(s => s.boosterName))].join(', ')}
                    </div>
                    <div>Samlet pris: {price} kr</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuller
          </Button>
          <Button onClick={handleCreateJob}>
            Opret job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
