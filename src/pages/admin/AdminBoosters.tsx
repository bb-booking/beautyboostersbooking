import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Filter,
  Send,
  CheckCircle,
  Calendar
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booster Management</h2>
        <div className="flex items-center space-x-2">
          {selectedBoosters.length > 0 && (
            <>
              <Badge variant="outline">
                {selectedBoosters.length} valgt
              </Badge>
              <Dialog open={showSendJobDialog} onOpenChange={setShowSendJobDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
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

      <div className="grid gap-4">
        {filteredBoosters.map((booster) => (
          <Card key={booster.id} className={`cursor-pointer transition-all ${selectedBoosters.includes(booster.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
            <CardContent className="p-6" onClick={() => toggleBoosterSelection(booster.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Checkbox 
                    checked={selectedBoosters.includes(booster.id)}
                    onChange={() => toggleBoosterSelection(booster.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{booster.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={booster.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {booster.is_available ? 'Tilgængelig' : 'Ikke tilgængelig'}
                        </Badge>
                        {selectedBoosters.includes(booster.id) && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{booster.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{booster.rating}/5</span>
                          <span className="text-muted-foreground">({booster.review_count} anmeldelser)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{booster.years_experience} års erfaring</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Specialer:</p>
                        <div className="flex flex-wrap gap-1">
                          {booster.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {booster.bio && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">{booster.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
};

export default AdminBoosters;