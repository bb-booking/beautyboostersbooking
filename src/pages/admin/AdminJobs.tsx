import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  Users,
  Filter,
  Search,
  Eye,
  Edit,
  CheckCircle
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description?: string;
  service_type: string;
  location: string;
  required_skills: string[];
  hourly_rate: number;
  date_needed: string;
  time_needed?: string;
  duration_hours?: number;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_type: 'privat' | 'virksomhed';
  boosters_needed: number;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_booster_id?: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  clientType: 'privat' | 'virksomhed';
  category: string;
}

interface BoosterProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  is_available: boolean;
}

const AdminJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [boosters, setBoosters] = useState<BoosterProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    service_type: "",
    location: "",
    required_skills: [] as string[],
    hourly_rate: 0,
    date_needed: "",
    time_needed: "",
    duration_hours: 0,
    client_name: "",
    client_email: "",
    client_phone: "",
    client_type: "privat" as 'privat' | 'virksomhed',
    boosters_needed: 1
  });

  // Calculate BeautyBoosters cut and booster earnings
  const calculateEarnings = (price: number, clientType: 'privat' | 'virksomhed') => {
    const priceAfterTax = clientType === 'privat' ? price * 0.8 : price; // 20% VAT only for private
    const beautyBoostersCut = priceAfterTax * 0.4; // 40% to BeautyBoosters
    const boosterEarnings = priceAfterTax - beautyBoostersCut;
    
    return {
      priceAfterTax,
      beautyBoostersCut,
      boosterEarnings
    };
  };

  const skillOptions = [
    "Bryllupsmakeup",
    "Fotografering",
    "SFX",
    "Hår styling",
    "Ansigtsbehandling",
    "Fashion makeup",
    "Editorial makeup"
  ];

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
    fetchJobs();
    fetchBoosters();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    // Hardcoded services matching the ones from Services.tsx
    const allServices: Service[] = [
      // Private services
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
      
      // Business services
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

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, client_type, boosters_needed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as Job[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Fejl ved hentning af jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoosters = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_profiles')
        .select('id, name, location, specialties, is_available');

      if (error) throw error;
      setBoosters(data || []);
    } catch (error) {
      console.error('Error fetching boosters:', error);
    }
  };

  const createJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          ...newJob,
          created_by: 'admin'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Job oprettet og sendt til relevante boosters!');
      setShowCreateDialog(false);
      setNewJob({
        title: "",
        description: "",
        service_type: "",
        location: "",
        required_skills: [],
        hourly_rate: 0,
        date_needed: "",
        time_needed: "",
        duration_hours: 0,
        client_name: "",
        client_email: "",
        client_phone: "",
        client_type: "privat",
        boosters_needed: 1
      });
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Fejl ved oprettelse af job');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Åben';
      case 'assigned': return 'Tildelt';
      case 'in_progress': return 'I gang';
      case 'completed': return 'Afsluttet';
      case 'cancelled': return 'Aflyst';
      default: return status;
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const addSkill = (skill: string) => {
    if (!newJob.required_skills.includes(skill)) {
      setNewJob(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setNewJob(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skill)
    }));
  };

  const getEligibleBoosters = (job: Job) => {
    return boosters.filter(booster => 
      booster.location === job.location &&
      booster.is_available &&
      (job.required_skills.length === 0 || 
       job.required_skills.some(skill => booster.specialties.includes(skill)))
    ).length;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Job Management</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
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
        <h2 className="text-2xl font-bold">Job Management</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Opret Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Opret nyt job</DialogTitle>
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
                  <Label htmlFor="boosters_needed">Antal boosters *</Label>
                  <Input
                    id="boosters_needed"
                    type="number"
                    min="1"
                    value={newJob.boosters_needed}
                    onChange={(e) => setNewJob(prev => ({ ...prev, boosters_needed: parseInt(e.target.value) || 1 }))}
                    placeholder="1"
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

              <div className="grid md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="hourly_rate">Pris (DKK) *</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={newJob.hourly_rate}
                    onChange={(e) => setNewJob(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))}
                    placeholder="1999"
                  />
                  {newJob.hourly_rate > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      {(() => {
                        const earnings = calculateEarnings(newJob.hourly_rate, newJob.client_type);
                        return (
                          <>
                            <div>BeautyBoosters: {Math.round(earnings.beautyBoostersCut)} DKK (40%)</div>
                            <div>Booster: {Math.round(earnings.boosterEarnings)} DKK</div>
                            {newJob.client_type === 'privat' && (
                              <div className="text-orange-600">Inkl. 20% moms</div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
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
                  <Label htmlFor="duration_hours">Varighed (timer)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    value={newJob.duration_hours}
                    onChange={(e) => setNewJob(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 0 }))}
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <Label>Krævede færdigheder</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newJob.required_skills.map(skill => (
                    <Badge key={skill} variant="outline" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                      {skill} ✕
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tilføj færdighed" />
                  </SelectTrigger>
                  <SelectContent>
                    {skillOptions.filter(skill => !newJob.required_skills.includes(skill)).map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="client_name">Klient navn</Label>
                  <Input
                    id="client_name"
                    value={newJob.client_name}
                    onChange={(e) => setNewJob(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Anna Hansen"
                  />
                </div>
                <div>
                  <Label htmlFor="client_email">Klient email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={newJob.client_email}
                    onChange={(e) => setNewJob(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="anna@email.dk"
                  />
                </div>
                <div>
                  <Label htmlFor="client_phone">Klient telefon</Label>
                  <Input
                    id="client_phone"
                    value={newJob.client_phone}
                    onChange={(e) => setNewJob(prev => ({ ...prev, client_phone: e.target.value }))}
                    placeholder="+45 12 34 56 78"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuller
                </Button>
                <Button onClick={createJob} disabled={!newJob.title || !newJob.service_type || !newJob.location || !newJob.date_needed || !newJob.hourly_rate}>
                  Opret & Send til Boosters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søg efter jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrer efter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle jobs</SelectItem>
            <SelectItem value="open">Åbne</SelectItem>
            <SelectItem value="assigned">Tildelte</SelectItem>
            <SelectItem value="in_progress">I gang</SelectItem>
            <SelectItem value="completed">Afsluttede</SelectItem>
            <SelectItem value="cancelled">Aflyste</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="outline">
          {filteredJobs.length} jobs
        </Badge>
      </div>

      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(job.status)}>
                    {getStatusText(job.status)}
                  </Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {getEligibleBoosters(job)} boosters
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">SERVICE & LOKATION</p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{job.service_type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{job.hourly_rate} DKK</span>
                      <span className="text-xs text-muted-foreground">
                        ({job.client_type === 'privat' ? 'inkl. moms' : 'ex. moms'})
                      </span>
                    </div>
                    {job.boosters_needed && job.boosters_needed > 1 && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{job.boosters_needed} boosters søges</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">TIDSPUNKT</p>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(job.date_needed).toLocaleDateString('da-DK')}</span>
                      {job.time_needed && (
                        <>
                          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                          <span>{job.time_needed}</span>
                        </>
                      )}
                    </div>
                    {job.duration_hours && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{job.duration_hours} timer</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {job.required_skills.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Krævede færdigheder:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.required_skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.description && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              )}

              {job.client_name && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Klient:</strong> {job.client_name}
                    {job.client_phone && ` • ${job.client_phone}`}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Oprettet: {new Date(job.created_at).toLocaleDateString('da-DK')}
                </p>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Se ansøgninger
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Rediger
                  </Button>
                  {job.status === 'open' && (
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Tildel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Ingen jobs fundet</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Ingen jobs matcher dine søgekriterier"
                : "Der er ingen jobs oprettet endnu"
              }
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Opret det første job
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminJobs;