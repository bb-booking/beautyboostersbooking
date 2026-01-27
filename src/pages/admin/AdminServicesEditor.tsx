import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Plus, Edit, Trash2, Image as ImageIcon, Loader2, ArrowLeft, Clock, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ServiceData {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  clientType: 'privat' | 'virksomhed';
  isInquiry?: boolean;
  hasExtraHours?: boolean;
  extraHourPrice?: number;
  image?: string;
  groupPricing?: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
  active: boolean;
}

const defaultPrivatCategories = [
  "Makeup & Hår",
  "Spraytan",
  "Konfirmation",
  "Bryllup",
  "Makeup Kurser",
  "Event",
  "Børn"
];

const defaultVirksomhedCategories = [
  "Shoot/reklame",
  "Specialister til projekt",
  "Makeup / styling til Event"
];

const defaultServices: ServiceData[] = [
  // Privat services
  { id: '1', name: 'Makeup Styling', description: 'Professionel makeup styling til enhver lejlighed', price: 1999, duration: 1, category: 'Makeup & Hår', clientType: 'privat', image: '/images/services/makeup-styling.png', groupPricing: { 1: 1999, 2: 2999, 3: 3999, 4: 4899 }, active: true },
  { id: '2', name: 'Hårstyling / håropsætning', description: 'Professionel hårstyling eller opsætning', price: 1999, duration: 1, category: 'Makeup & Hår', clientType: 'privat', image: '/images/services/haarstyling.png', groupPricing: { 1: 1999, 2: 2999, 3: 3999, 4: 4899 }, active: true },
  { id: '3', name: 'Makeup & Hårstyling', description: 'Makeup & Hårstyling - hvilket look drømmer du om til dit næste event?', price: 2999, duration: 1.5, category: 'Makeup & Hår', clientType: 'privat', image: '/images/services/makeup-styling.png', groupPricing: { 1: 2999, 2: 4999, 3: 6499, 4: 7999 }, active: true },
  { id: '4', name: 'Spraytan', description: 'Skræddersyet spraytan med high-end væske som er lugtfri og giver naturlige nuancer (Kun København og Roskilde + omegn)', price: 499, duration: 0.5, category: 'Spraytan', clientType: 'privat', image: '/images/services/spraytan.png', groupPricing: { 1: 499, 2: 799, 3: 1099, 4: 1399 }, active: true },
  { id: '5', name: 'Konfirmationsstyling - Makeup OG Hårstyling', description: 'Lad os stå for stylingen på din store dag. Professionel makeup artist direkte til døren', price: 2999, duration: 1.5, category: 'Konfirmation', clientType: 'privat', image: '/images/services/konfirmation.png', groupPricing: { 1: 2999, 2: 4999, 3: 6499, 4: 7999 }, active: true },
  { id: '6', name: 'Brudestyling - Makeup Styling', description: 'Professionel makeup styling til bruden', price: 2999, duration: 2, category: 'Bryllup', clientType: 'privat', image: '/images/services/brudestyling.png', active: true },
  { id: '7', name: 'Brudestyling - Hårstyling', description: 'Professionel hårstyling til bruden', price: 2999, duration: 2, category: 'Bryllup', clientType: 'privat', image: '/images/services/brudestyling.png', active: true },
  { id: '8', name: 'Brudestyling - Hår & Makeup (uden prøvestyling)', description: 'Komplet hår og makeup styling til bruden uden prøvestyling', price: 4999, duration: 3, category: 'Bryllup', clientType: 'privat', image: '/images/services/brudestyling.png', active: true },
  { id: '9', name: 'Brudestyling - Hår & Makeup (inkl. prøvestyling)', description: 'Komplet hår og makeup styling til bruden med prøvestyling', price: 6499, duration: 4.5, category: 'Bryllup', clientType: 'privat', image: '/images/services/brudestyling.png', active: true },
  { id: '10', name: 'Brudestyling Premium - Makeup og Hårstyling (Makeup Artist i op til 8 timer)', description: 'Premium brudestyling med makeup artist til rådighed i op til 8 timer', price: 8999, duration: 8, category: 'Bryllup', clientType: 'privat', image: '/images/services/brudestyling.png', active: true },
  { id: '11', name: 'Brudepigestyling - Makeup & Hår (1 person)', description: 'Makeup og hårstyling til brudepige', price: 2999, duration: 1.5, category: 'Bryllup', clientType: 'privat', groupPricing: { 1: 2999, 2: 4999, 3: 6499, 4: 7999 }, active: true },
  { id: '12', name: 'Brudepigestyling - Makeup & Hår (2 personer)', description: 'Makeup og hårstyling til 2 brudepiger', price: 4999, duration: 2.5, category: 'Bryllup', clientType: 'privat', groupPricing: { 1: 2999, 2: 4999, 3: 6499, 4: 7999 }, active: true },
  { id: '13', name: 'Brudestyling Hår & Makeup + Hår og Makeup til 1 person (mor, brudepige, gæst)', description: 'Brudestyling plus styling til én ekstra person', price: 7499, duration: 4, category: 'Bryllup', clientType: 'privat', active: true },
  { id: '14', name: '1:1 Makeup Session', description: 'Lær at lægge den perfekte makeup af en professionel makeupartist', price: 2499, duration: 1.5, category: 'Makeup Kurser', clientType: 'privat', image: '/images/services/makeup-session.png', active: true },
  { id: '15', name: 'The Beauty Bar (makeup kursus)', description: 'Makeup kursus på 3 timer for op til 12 personer', price: 4499, duration: 3, category: 'Makeup Kurser', clientType: 'privat', image: '/images/services/beauty-bar.png', active: true },
  { id: '16', name: 'Makeup Artist til Touch Up (3 timer)', description: 'Makeup artist til rådighed i 3 timer - mulighed for ekstra timer', price: 4499, duration: 3, category: 'Event', clientType: 'privat', image: '/images/services/event-touchup.png', active: true },
  { id: '17', name: 'Ansigtsmaling til børn', description: 'Sjov ansigtsmaling til børn til events og fester', price: 4499, duration: 3, category: 'Børn', clientType: 'privat', image: '/images/services/ansigtsmaling-boern.png', active: true },
  // Virksomhed services
  { id: '20', name: 'Makeup & Hårstyling til Shoot/Reklamefilm', description: 'Professionel makeup & hårstyling til shoot, reklamefilm mv.', price: 4499, duration: 3, category: 'Shoot/reklame', clientType: 'virksomhed', groupPricing: { 1: 4499, 2: 8999, 3: 13499, 4: 17999 }, hasExtraHours: true, extraHourPrice: 1000, active: true },
  { id: '21', name: 'Key Makeup Artist til projekt', description: 'Erfaren makeup artist til store projekter', price: 0, duration: 0, category: 'Specialister til projekt', clientType: 'virksomhed', isInquiry: true, active: true },
  { id: '22', name: 'Makeup Assistent til projekt', description: 'Dygtig makeup assistent til dit projekt', price: 0, duration: 0, category: 'Specialister til projekt', clientType: 'virksomhed', isInquiry: true, active: true },
  { id: '23', name: 'SFX Expert', description: 'Specialist i special effects makeup', price: 0, duration: 0, category: 'Specialister til projekt', clientType: 'virksomhed', isInquiry: true, active: true },
  { id: '24', name: 'Parykdesign', description: 'Professionel parykdesigner til dit projekt', price: 0, duration: 0, category: 'Specialister til projekt', clientType: 'virksomhed', isInquiry: true, active: true },
  { id: '25', name: 'MUA til Film/TV', description: 'Makeup artist specialiseret i film og TV produktion', price: 0, duration: 0, category: 'Specialister til projekt', clientType: 'virksomhed', isInquiry: true, active: true },
  { id: '26', name: 'Event Makeup Services', description: 'Omfattende event makeup services', price: 0, duration: 0, category: 'Makeup / styling til Event', clientType: 'virksomhed', isInquiry: true, active: true },
];

const AdminServicesEditor = () => {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingService, setEditingService] = useState<ServiceData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'privat' | 'virksomhed'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .eq("key", "services_config")
        .maybeSingle();

      if (error) throw error;

      if (data?.value && Array.isArray(data.value)) {
        setServices(data.value as unknown as ServiceData[]);
      } else {
        // Load defaults
        setServices(defaultServices);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices(defaultServices);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("key", "services_config")
        .maybeSingle();

      let error;
      if (existing) {
        const result = await supabase
          .from("admin_settings")
          .update({ value: JSON.parse(JSON.stringify(services)) })
          .eq("key", "services_config");
        error = result.error;
      } else {
        const result = await supabase
          .from("admin_settings")
          .insert([{ key: "services_config", value: JSON.parse(JSON.stringify(services)) }]);
        error = result.error;
      }

      if (error) throw error;
      toast.success("Services gemt!");
    } catch (error) {
      console.error("Error saving services:", error);
      toast.error("Fejl ved gemning af services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = () => {
    const newService: ServiceData = {
      id: `new-${Date.now()}`,
      name: "",
      description: "",
      price: 0,
      duration: 1,
      category: defaultPrivatCategories[0],
      clientType: "privat",
      active: true,
    };
    setEditingService(newService);
    setIsDialogOpen(true);
  };

  const handleEditService = (service: ServiceData) => {
    setEditingService({ ...service });
    setIsDialogOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    setDeleteConfirmId(serviceId);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setServices(prev => prev.filter(s => s.id !== deleteConfirmId));
      toast.success("Service slettet");
      setDeleteConfirmId(null);
    }
  };

  const handleSaveService = () => {
    if (!editingService) return;
    if (!editingService.name.trim()) {
      toast.error("Navn er påkrævet");
      return;
    }

    setServices(prev => {
      const exists = prev.find(s => s.id === editingService.id);
      if (exists) {
        return prev.map(s => s.id === editingService.id ? editingService : s);
      } else {
        return [...prev, editingService];
      }
    });
    setIsDialogOpen(false);
    setEditingService(null);
    toast.success("Service opdateret");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Kun billeder er tilladt");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Billede må max være 5MB");
      return;
    }

    try {
      const fileName = `services/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("booking-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("booking-images")
        .getPublicUrl(fileName);

      setEditingService(prev => prev ? { ...prev, image: urlData.publicUrl } : null);
      toast.success("Billede uploadet");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Fejl ved upload af billede");
    }
  };

  const filteredServices = services.filter(s => {
    if (filterType === 'all') return true;
    return s.clientType === filterType;
  });

  const categorizedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceData[]>);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">Services Editor</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddService}>
            <Plus className="h-4 w-4 mr-2" />
            Tilføj service
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Gemmer..." : "Gem alle ændringer"}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('all')}
        >
          Alle ({services.length})
        </Button>
        <Button
          variant={filterType === 'privat' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('privat')}
        >
          Privat ({services.filter(s => s.clientType === 'privat').length})
        </Button>
        <Button
          variant={filterType === 'virksomhed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterType('virksomhed')}
        >
          Virksomhed ({services.filter(s => s.clientType === 'virksomhed').length})
        </Button>
      </div>

      {/* Services by category */}
      <div className="space-y-6">
        {Object.entries(categorizedServices).map(([category, categoryServices]) => (
          <Card key={category}>
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{category}</span>
                <Badge variant="secondary">{categoryServices.length} services</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryServices.map((service) => (
                <div
                  key={service.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    !service.active ? 'opacity-50 bg-muted' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {service.image && (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-12 h-12 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{service.name}</span>
                        {service.isInquiry && (
                          <Badge variant="outline" className="text-xs shrink-0">Forespørgsel</Badge>
                        )}
                        {!service.active && (
                          <Badge variant="secondary" className="text-xs shrink-0">Inaktiv</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{service.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {service.duration}t
                      </div>
                      <div className="font-medium">
                        {service.price > 0 ? `${service.price.toLocaleString('da-DK')} kr` : '-'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService?.id.startsWith('new-') ? 'Opret service' : 'Rediger service'}
            </DialogTitle>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    placeholder="Service navn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientType">Kundetype</Label>
                  <Select
                    value={editingService.clientType}
                    onValueChange={(value: 'privat' | 'virksomhed') => setEditingService({
                      ...editingService,
                      clientType: value,
                      category: value === 'privat' ? defaultPrivatCategories[0] : defaultVirksomhedCategories[0]
                    })}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  placeholder="Beskrivelse af service"
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={editingService.category}
                    onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingService.clientType === 'privat' ? defaultPrivatCategories : defaultVirksomhedCategories).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Pris (kr)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Varighed (timer)</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({ ...editingService, duration: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Group pricing */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Gruppepriser (valgfrit)
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num}>
                      <Label className="text-xs text-muted-foreground">{num} pers.</Label>
                      <Input
                        type="number"
                        placeholder="-"
                        value={editingService.groupPricing?.[num as 1|2|3|4] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingService({
                            ...editingService,
                            groupPricing: {
                              ...editingService.groupPricing,
                              [num]: val
                            } as { 1: number; 2: number; 3: number; 4: number }
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label>Billede</Label>
                <div className="flex items-center gap-4">
                  {editingService.image && (
                    <img
                      src={editingService.image}
                      alt="Preview"
                      className="w-20 h-20 rounded object-cover"
                    />
                  )}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {editingService.image ? 'Skift billede' : 'Upload billede'}
                    </Button>
                    {editingService.image && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="ml-2"
                        onClick={() => setEditingService({ ...editingService, image: undefined })}
                      >
                        Fjern
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aktiv</Label>
                    <p className="text-sm text-muted-foreground">Vis service på booking siden</p>
                  </div>
                  <Switch
                    checked={editingService.active}
                    onCheckedChange={(checked) => setEditingService({ ...editingService, active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Er forespørgsel</Label>
                    <p className="text-sm text-muted-foreground">Kunder sender forespørgsel i stedet for direkte booking</p>
                  </div>
                  <Switch
                    checked={editingService.isInquiry || false}
                    onCheckedChange={(checked) => setEditingService({ ...editingService, isInquiry: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Har ekstra timer</Label>
                    <p className="text-sm text-muted-foreground">Tillad tilkøb af ekstra timer</p>
                  </div>
                  <Switch
                    checked={editingService.hasExtraHours || false}
                    onCheckedChange={(checked) => setEditingService({ ...editingService, hasExtraHours: checked })}
                  />
                </div>
                {editingService.hasExtraHours && (
                  <div className="space-y-2">
                    <Label htmlFor="extraHourPrice">Pris pr. ekstra time (kr)</Label>
                    <Input
                      id="extraHourPrice"
                      type="number"
                      value={editingService.extraHourPrice || 1000}
                      onChange={(e) => setEditingService({ ...editingService, extraHourPrice: parseInt(e.target.value) || 0 })}
                      className="max-w-32"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuller</Button>
            <Button onClick={handleSaveService}>Gem service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet service</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette denne service? Denne handling kan ikke fortrydes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Slet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminServicesEditor;
