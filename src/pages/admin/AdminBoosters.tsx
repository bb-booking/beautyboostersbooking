import React, { useEffect, useState, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BoosterProfileDialog } from "@/components/admin/BoosterProfileDialog";
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Filter,
  Send,
  CheckCircle,
  Calendar,
  UserPlus,
  Pencil,
  Save,
  Phone,
  Mail,
  Eye
} from "lucide-react";

interface BoosterProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  hourly_rate: number;
  rating: number;
  review_count: number;
  years_experience: number;
  is_available: boolean;
  bio?: string;
  portfolio_image_url?: string | null;
  email?: string | null;
  phone?: string | null;
  employment_type?: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  clientType: 'privat' | 'virksomhed';
  category: string;
}

interface CompetenceTag {
  id: string;
  name: string;
  category: string;
}

const AdminBoosters = () => {
  const navigate = useNavigate();
  const [boosterTab, setBoosterTab] = useState<'list' | 'applications'>('list');
  const [boosters, setBoosters] = useState<BoosterProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [competenceTags, setCompetenceTags] = useState<CompetenceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([]);
  const [showSendJobDialog, setShowSendJobDialog] = useState(false);
  
  // Edit booster state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBooster, setEditingBooster] = useState<BoosterProfile | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    specialties: [] as string[],
    years_experience: 0,
    hourly_rate: 0,
    is_available: true,
    employment_type: "freelancer"
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Profile view state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [viewingBooster, setViewingBooster] = useState<BoosterProfile | null>(null);

  const openProfileDialog = (booster: BoosterProfile) => {
    setViewingBooster(booster);
    setProfileDialogOpen(true);
  };

  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    service_type: "",
    location: "",
    date_needed: "",
    time_needed: "",
    duration_hours: 0,
    client_name: "",
    client_type: "privat" as 'privat' | 'virksomhed',
    hourly_rate: 0,
    boosters_needed: 1,
    selectedCompetenceTags: [] as string[]
  });

  const locations = [
    "København",
    "Aarhus", 
    "Odense",
    "Aalborg",
    "Esbjerg",
    "Randers",
    "Kolding",
    "Horsens"
  ];

  useEffect(() => {
    fetchBoosters();
    fetchServices();
    fetchCompetenceTags();
  }, []);

  const fetchBoosters = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setBoosters(data || []);
    } catch (error) {
      console.error('Error fetching boosters:', error);
      toast.error('Fejl ved hentning af boosters');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    // Same services as in AdminJobs.tsx
    const allServices: Service[] = [
      { id: '1', name: 'Makeup Styling', price: 1999, clientType: 'privat', category: 'Makeup & Hår' },
      { id: '2', name: 'Hårstyling / håropsætning', price: 1999, clientType: 'privat', category: 'Makeup & Hår' },
      { id: '3', name: 'Makeup & Hårstyling', price: 2999, clientType: 'privat', category: 'Makeup & Hår' },
      { id: '4', name: 'Spraytan', price: 499, clientType: 'privat', category: 'Spraytan' },
      { id: '5', name: 'Konfirmationsstyling - Makeup OG Hårstyling', price: 2999, clientType: 'privat', category: 'Konfirmation' },
      { id: '6', name: 'Brudestyling - Hår & Makeup (uden prøvestyling)', price: 4999, clientType: 'privat', category: 'Bryllup - Brudestyling' },
      { id: '7', name: 'Brudestyling - Hår & Makeup (inkl. prøvestyling)', price: 6499, clientType: 'privat', category: 'Bryllup - Brudestyling' },
      { id: '8', name: '1:1 Makeup Session', price: 2499, clientType: 'privat', category: 'Makeup Kurser' },
      { id: '9', name: 'The Beauty Bar (makeup kursus)', price: 4499, clientType: 'privat', category: 'Makeup Kurser' },
      { id: '10', name: 'Makeup Artist til Touch Up (3 timer)', price: 4499, clientType: 'privat', category: 'Event' },
      { id: '11', name: 'Ansigtsmaling til børn', price: 4499, clientType: 'privat', category: 'Børn' },
      { id: '20', name: 'Makeup & Hårstyling til Shoot/Reklamefilm', price: 4499, clientType: 'virksomhed', category: 'Shoot/reklame' },
      { id: '21', name: 'Key Makeup Artist til projekt', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt' },
      { id: '22', name: 'Makeup Assistent til projekt', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt' },
      { id: '23', name: 'SFX Expert', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt' },
      { id: '24', name: 'Parykdesign', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt' },
      { id: '25', name: 'MUA til Film/TV', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt' },
      { id: '26', name: 'Event Makeup Services', price: 0, clientType: 'virksomhed', category: 'Makeup / styling til Event' }
    ];
    
    setServices(allServices);
  };

  const fetchCompetenceTags = async () => {
    try {
      const { data, error } = await supabase
        .from('competence_tags')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setCompetenceTags(data || []);
    } catch (error) {
      console.error('Error fetching competence tags:', error);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setNewJob(prev => ({
        ...prev,
        service_type: service.name,
        hourly_rate: service.price,
        client_type: service.clientType
      }));
    }
  };

  const addCompetenceTag = (tagId: string) => {
    if (!newJob.selectedCompetenceTags.includes(tagId)) {
      setNewJob(prev => ({
        ...prev,
        selectedCompetenceTags: [...prev.selectedCompetenceTags, tagId]
      }));
    }
  };

  const removeCompetenceTag = (tagId: string) => {
    setNewJob(prev => ({
      ...prev,
      selectedCompetenceTags: prev.selectedCompetenceTags.filter(id => id !== tagId)
    }));
  };

  const sendJobToSelectedBoosters = async () => {
    try {
      // Create job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert([{
          title: newJob.title,
          description: newJob.description,
          service_type: newJob.service_type,
          location: newJob.location,
          required_skills: newJob.selectedCompetenceTags,
          hourly_rate: newJob.hourly_rate,
          date_needed: newJob.date_needed,
          time_needed: newJob.time_needed,
          duration_hours: newJob.duration_hours,
          client_name: newJob.client_name,
          client_type: newJob.client_type,
          boosters_needed: newJob.boosters_needed,
          created_by: 'admin'
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      // Send notifications to selected boosters
      const notifications = selectedBoosters.map(boosterId => ({
        recipient_id: boosterId,
        job_id: jobData.id,
        title: `Nyt job tilgængeligt: ${newJob.title}`,
        message: `Service: ${newJob.service_type} | Lokation: ${newJob.location} | Dato: ${newJob.date_needed}${newJob.time_needed ? ` kl. ${newJob.time_needed}` : ''} | Pris: ${newJob.hourly_rate} DKK${newJob.client_type === 'privat' ? ' (inkl. moms)' : ' (ex. moms)'}${newJob.boosters_needed > 1 ? ` | ${newJob.boosters_needed} boosters søges` : ''}`,
        type: 'job_notification'
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notificationError) throw notificationError;

      // Insert competence tags
      if (newJob.selectedCompetenceTags.length > 0) {
        const { error: tagsError } = await supabase
          .from('job_competence_tags')
          .insert(
            newJob.selectedCompetenceTags.map(tagId => ({
              job_id: jobData.id,
              competence_tag_id: tagId
            }))
          );

        if (tagsError) throw tagsError;
      }

      toast.success(`Job sendt til ${selectedBoosters.length} udvalgte boosters!`);
      setShowSendJobDialog(false);
      setSelectedBoosters([]);
      setNewJob({
        title: "",
        description: "",
        service_type: "",
        location: "",
        date_needed: "",
        time_needed: "",
        duration_hours: 0,
        client_name: "",
        client_type: "privat",
        hourly_rate: 0,
        boosters_needed: 1,
        selectedCompetenceTags: []
      });
    } catch (error) {
      console.error('Error sending job:', error);
      toast.error('Fejl ved afsendelse af job');
    }
  };

  const toggleBoosterSelection = (boosterId: string) => {
    setSelectedBoosters(prev => 
      prev.includes(boosterId) 
        ? prev.filter(id => id !== boosterId)
        : [...prev, boosterId]
    );
  };

  const selectAllBoosters = () => {
    const visibleBoosterIds = filteredBoosters.map(b => b.id);
    setSelectedBoosters(visibleBoosterIds);
  };

  const clearSelection = () => {
    setSelectedBoosters([]);
  };

  const openEditDialog = (booster: BoosterProfile) => {
    setEditingBooster(booster);
    setEditForm({
      name: booster.name || "",
      email: booster.email || "",
      phone: booster.phone || "",
      location: booster.location || "",
      bio: booster.bio || "",
      specialties: booster.specialties || [],
      years_experience: booster.years_experience || 0,
      hourly_rate: booster.hourly_rate || 0,
      is_available: booster.is_available ?? true,
      employment_type: booster.employment_type || "freelancer"
    });
    setEditDialogOpen(true);
  };

  const handleSaveBooster = async () => {
    if (!editingBooster) return;
    
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('booster_profiles')
        .update({
          name: editForm.name,
          email: editForm.email || null,
          phone: editForm.phone || null,
          location: editForm.location,
          bio: editForm.bio || null,
          specialties: editForm.specialties,
          years_experience: editForm.years_experience,
          hourly_rate: editForm.hourly_rate,
          is_available: editForm.is_available,
          employment_type: editForm.employment_type
        })
        .eq('id', editingBooster.id);

      if (error) throw error;

      // Update local state
      setBoosters(prev => prev.map(b => 
        b.id === editingBooster.id 
          ? { ...b, ...editForm }
          : b
      ));

      toast.success("Booster profil opdateret");
      setEditDialogOpen(false);
      setEditingBooster(null);
    } catch (error: any) {
      console.error('Error updating booster:', error);
      toast.error("Kunne ikke opdatere booster profil");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setEditForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const filteredBoosters = boosters.filter(booster => {
    const matchesSearch = booster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booster.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = locationFilter === "all" || booster.location === locationFilter;
    
    const matchesTag = tagFilter === "all" || booster.specialties.includes(tagFilter);
    
    const matchesAvailability = availabilityFilter === "all" || 
                               (availabilityFilter === "available" && booster.is_available) ||
                               (availabilityFilter === "unavailable" && !booster.is_available);
    
    return matchesSearch && matchesLocation && matchesTag && matchesAvailability;
  });

  const getUniqueSpecialties = () => {
    const allSpecialties = boosters.flatMap(b => b.specialties);
    return [...new Set(allSpecialties)];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Booster Management</h2>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-bold">Boosters</h2>
        </div>
        
        <Tabs value={boosterTab} onValueChange={(v) => setBoosterTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="list">Alle Boosters</TabsTrigger>
            <TabsTrigger value="applications">Ansøgninger</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {boosterTab === 'applications' && (
        <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded" />}>
          {React.createElement(lazy(() => import('./AdminBoosterApplications')))}
        </Suspense>
      )}

      {boosterTab === 'list' && (
        <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/create-booster")}
            className="w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2 shrink-0" />
            Opret Booster
          </Button>
          {selectedBoosters.length > 0 && (
            <>
              <Badge variant="outline" className="shrink-0">
                {selectedBoosters.length} valgt
              </Badge>
              <Dialog open={showSendJobDialog} onOpenChange={setShowSendJobDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-2 shrink-0" />
                    Send Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Send job til {selectedBoosters.length} boosters</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Job titel *</Label>
                        <Input
                          id="title"
                          value={newJob.title}
                          onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="F.eks. Bryllupsmakeup i Aarhus"
                        />
                      </div>
                      <div>
                        <Label htmlFor="client_type">Klient type *</Label>
                        <Select value={newJob.client_type} onValueChange={(value: 'privat' | 'virksomhed') => setNewJob(prev => ({ ...prev, client_type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vælg klient type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="privat">Privat</SelectItem>
                            <SelectItem value="virksomhed">Virksomhed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="service_type">Service *</Label>
                        <Select 
                          value={services.find(s => s.name === newJob.service_type)?.id || ""} 
                          onValueChange={handleServiceChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vælg service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services
                              .filter(service => service.clientType === newJob.client_type)
                              .map(service => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} - {service.price > 0 ? `${service.price} DKK` : 'Tilbud'}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="location">Lokation *</Label>
                        <Select value={newJob.location} onValueChange={(value) => setNewJob(prev => ({ ...prev, location: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vælg lokation" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map(location => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="date_needed">Dato *</Label>
                        <Input
                          id="date_needed"
                          type="date"
                          value={newJob.date_needed}
                          onChange={(e) => setNewJob(prev => ({ ...prev, date_needed: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time_needed">Tidspunkt</Label>
                        <Input
                          id="time_needed"
                          type="time"
                          value={newJob.time_needed}
                          onChange={(e) => setNewJob(prev => ({ ...prev, time_needed: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="boosters_needed">Boosters søges</Label>
                        <Input
                          id="boosters_needed"
                          type="number"
                          min="1"
                          value={newJob.boosters_needed}
                          onChange={(e) => setNewJob(prev => ({ ...prev, boosters_needed: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Beskrivelse</Label>
                      <Textarea
                        id="description"
                        value={newJob.description}
                        onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Beskriv jobbet i detaljer..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Kompetence tags</Label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {newJob.selectedCompetenceTags.map(tagId => {
                          const tag = competenceTags.find(t => t.id === tagId);
                          return tag ? (
                            <Badge key={tagId} variant="outline" className="cursor-pointer" onClick={() => removeCompetenceTag(tagId)}>
                              {tag.name} ✕
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      <Select onValueChange={addCompetenceTag}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tilføj kompetence tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {competenceTags
                            .filter(tag => !newJob.selectedCompetenceTags.includes(tag.id))
                            .map(tag => (
                              <SelectItem key={tag.id} value={tag.id}>
                                <span className="text-xs text-muted-foreground mr-2">{tag.category}:</span>
                                {tag.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setShowSendJobDialog(false)}>
                        Annuller
                      </Button>
                      <Button 
                        onClick={sendJobToSelectedBoosters} 
                        disabled={!newJob.title || !newJob.service_type || !newJob.location || !newJob.date_needed}
                      >
                        Send til {selectedBoosters.length} Boosters
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={clearSelection}>
                Ryd valg
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søg boosters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer efter lokation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle lokationer</SelectItem>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer efter tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle tags</SelectItem>
            {getUniqueSpecialties().map(specialty => (
              <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer efter tilgængelighed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="available">Tilgængelige</SelectItem>
            <SelectItem value="unavailable">Ikke tilgængelige</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {filteredBoosters.length} boosters
          </Badge>
          <Button variant="outline" size="sm" onClick={selectAllBoosters}>
            Vælg alle
          </Button>
        </div>
      </div>

      {/* Grid layout - 3 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBoosters.map((booster) => (
          <Card 
            key={booster.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${selectedBoosters.includes(booster.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
          >
            <CardContent className="p-4">
              {/* Header with checkbox and actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2" onClick={() => toggleBoosterSelection(booster.id)}>
                  <Checkbox 
                    checked={selectedBoosters.includes(booster.id)}
                    onChange={() => toggleBoosterSelection(booster.id)}
                  />
                  {selectedBoosters.includes(booster.id) && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProfileDialog(booster);
                    }}
                    title="Se profil"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(booster);
                    }}
                    title="Rediger"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Profile section - click to view profile */}
              <div 
                className="flex flex-col items-center text-center mb-4" 
                onClick={() => openProfileDialog(booster)}
              >
                <img
                  src={booster.portfolio_image_url || "/placeholder.svg"}
                  alt={booster.name}
                  className="h-20 w-20 rounded-full object-cover mb-3 hover:ring-2 hover:ring-primary transition-all"
                />
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{booster.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{booster.location}</span>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex justify-center mb-3">
                <Badge className={booster.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {booster.is_available ? 'Tilgængelig' : 'Ikke tilgængelig'}
                </Badge>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-4 text-sm mb-3" onClick={() => openProfileDialog(booster)}>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-foreground">{booster.rating}/5</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{booster.years_experience} år</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1 justify-center" onClick={() => openProfileDialog(booster)}>
                {booster.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {booster.specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{booster.specialties.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Booster Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger Booster: {editingBooster?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Navn *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Lokation *</Label>
                <Select 
                  value={editForm.location} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg lokation" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-years">Års erfaring</Label>
                <Input
                  id="edit-years"
                  type="number"
                  min="0"
                  value={editForm.years_experience}
                  onChange={(e) => setEditForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rate">Timepris (DKK)</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  min="0"
                  value={editForm.hourly_rate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-employment">Ansættelsestype</Label>
                <Select 
                  value={editForm.employment_type} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, employment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freelancer">Freelancer (B-indkomst)</SelectItem>
                    <SelectItem value="salaried">Lønmodtager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Specialer</Label>
              <div className="flex flex-wrap gap-2">
                {getUniqueSpecialties().map(specialty => (
                  <Badge
                    key={specialty}
                    variant={editForm.specialties.includes(specialty) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleSpecialty(specialty)}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="edit-available">Tilgængelig for jobs</Label>
                <p className="text-sm text-muted-foreground">Kan modtage nye booking forespørgsler</p>
              </div>
              <Switch
                id="edit-available"
                checked={editForm.is_available}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_available: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleSaveBooster} disabled={savingEdit}>
              <Save className="h-4 w-4 mr-2" />
              {savingEdit ? "Gemmer..." : "Gem ændringer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile View Dialog */}
      <BoosterProfileDialog
        booster={viewingBooster}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onBoosterUpdated={fetchBoosters}
        onBoosterDeleted={fetchBoosters}
      />

      {filteredBoosters.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Ingen boosters fundet</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || locationFilter !== "all" || tagFilter !== "all" || availabilityFilter !== "all"
                ? "Ingen boosters matcher dine søgekriterier"
                : "Der er ingen boosters registreret endnu"
              }
            </p>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  );
};

export default AdminBoosters;