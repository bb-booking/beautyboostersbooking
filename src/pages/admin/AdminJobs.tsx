import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Plus, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon,
  Users,
  Filter,
  Search,
  Eye,
  Edit,
  CheckCircle,
  MessageSquare,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import JobChat from "@/components/job/JobChat";
import InvoiceCreator from "@/components/invoice/InvoiceCreator";
import AssignBoostersDialog, { BoosterOption } from "@/components/boosters/AssignBoostersDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

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
  assigned_boosters?: Array<{
    id: string;
    booster_id: string;
    booster_name: string;
    portfolio_image_url?: string | null;
    location?: string | null;
    rating?: number | null;
    specialties?: string[];
  }>;
}

interface Service {
  id: string;
  name: string;
  price: number;
  clientType: 'privat' | 'virksomhed';
  category: string;
  durationMinutes: number;
}

interface JobService {
  service_id: string;
  service_name: string;
  service_price: number;
  people_count: number;
}

interface CompetenceTag {
  id: string;
  name: string;
  category: string;
}

interface BoosterProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  is_available: boolean;
  portfolio_image_url?: string | null;
  rating?: number | null;
}

const AdminJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [boosters, setBoosters] = useState<BoosterProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [competenceTags, setCompetenceTags] = useState<CompetenceTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedJobForChat, setSelectedJobForChat] = useState<string | null>(null);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<Job | null>(null);
  const [selectedJobForAssign, setSelectedJobForAssign] = useState<Job | null>(null);
  const [showBoosterSelectionStep, setShowBoosterSelectionStep] = useState(false);
  const [selectedBoostersForNotification, setSelectedBoostersForNotification] = useState<Set<string>>(new Set());

  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    location: "",
    date_needed: undefined as Date | undefined,
    time_needed: "",
    duration_hours: 0,
    client_name: "",
    client_type: "privat" as 'privat' | 'virksomhed',
    boosters_needed: 1,
    selectedServices: [] as JobService[],
    selectedCompetenceTags: [] as string[]
  });
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  
  // Address autocomplete
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Time options (every 30 minutes from 6:00 to 22:00)
  const timeOptions = Array.from({ length: 33 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6;
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Calculate total price from all selected services
  const calculateTotalPrice = () => {
    return newJob.selectedServices.reduce((total, service) => {
      return total + (service.service_price * service.people_count);
    }, 0);
  };

  // Calculate total duration from all selected services (in hours)
  const calculateTotalDuration = () => {
    const totalMinutes = newJob.selectedServices.reduce((total, service) => {
      const serviceData = services.find(s => s.id === service.service_id);
      if (!serviceData) return total;
      return total + (serviceData.durationMinutes * service.people_count);
    }, 0);
    return Math.ceil(totalMinutes / 60); // Convert to hours, round up
  };

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
    fetchCompetenceTags();
  }, []);

  const fetchServices = async () => {
    // Hardcoded services matching the ones from Services.tsx with duration
    const allServices: Service[] = [
      // Private services
      { id: '1', name: 'Makeup Styling', price: 1999, clientType: 'privat', category: 'Makeup & Hår', durationMinutes: 60 },
      { id: '2', name: 'Hårstyling / håropsætning', price: 1999, clientType: 'privat', category: 'Makeup & Hår', durationMinutes: 60 },
      { id: '3', name: 'Makeup & Hårstyling', price: 2999, clientType: 'privat', category: 'Makeup & Hår', durationMinutes: 90 },
      { id: '4', name: 'Spraytan', price: 499, clientType: 'privat', category: 'Spraytan', durationMinutes: 30 },
      { id: '5', name: 'Konfirmationsstyling - Makeup OG Hårstyling', price: 2999, clientType: 'privat', category: 'Konfirmation', durationMinutes: 90 },
      { id: '6', name: 'Brudestyling - Hår & Makeup (uden prøvestyling)', price: 4999, clientType: 'privat', category: 'Bryllup - Brudestyling', durationMinutes: 120 },
      { id: '7', name: 'Brudestyling - Hår & Makeup (inkl. prøvestyling)', price: 6499, clientType: 'privat', category: 'Bryllup - Brudestyling', durationMinutes: 180 },
      { id: '8', name: '1:1 Makeup Session', price: 2499, clientType: 'privat', category: 'Makeup Kurser', durationMinutes: 120 },
      { id: '9', name: 'The Beauty Bar (makeup kursus)', price: 4499, clientType: 'privat', category: 'Makeup Kurser', durationMinutes: 180 },
      { id: '10', name: 'Makeup Artist til Touch Up (3 timer)', price: 4499, clientType: 'privat', category: 'Event', durationMinutes: 180 },
      { id: '11', name: 'Ansigtsmaling til børn', price: 4499, clientType: 'privat', category: 'Børn', durationMinutes: 120 },
      
      // Business services
      { id: '20', name: 'Makeup & Hårstyling til Shoot/Reklamefilm', price: 4499, clientType: 'virksomhed', category: 'Shoot/reklame', durationMinutes: 180 },
      { id: '21', name: 'Key Makeup Artist til projekt', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt', durationMinutes: 480 },
      { id: '22', name: 'Makeup Assistent til projekt', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt', durationMinutes: 480 },
      { id: '23', name: 'SFX Expert', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt', durationMinutes: 240 },
      { id: '24', name: 'Parykdesign', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt', durationMinutes: 360 },
      { id: '25', name: 'MUA til Film/TV', price: 0, clientType: 'virksomhed', category: 'Specialister til projekt', durationMinutes: 480 },
      { id: '26', name: 'Event Makeup Services', price: 0, clientType: 'virksomhed', category: 'Makeup / styling til Event', durationMinutes: 240 }
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

  const fetchJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, client_type, boosters_needed')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch assigned boosters for each job with full profile info
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('job_booster_assignments')
        .select(`
          id,
          job_id,
          booster_id,
          booster_profiles (
            name,
            portfolio_image_url,
            location,
            rating,
            specialties
          )
        `);

      if (assignmentsError) throw assignmentsError;

      // Combine jobs with their assigned boosters
      const jobsWithBoosters = (jobsData || []).map(job => ({
        ...job,
        assigned_boosters: (assignmentsData || [])
          .filter((assignment: any) => assignment.job_id === job.id)
          .map((assignment: any) => ({
            id: assignment.id,
            booster_id: assignment.booster_id,
            booster_name: assignment.booster_profiles?.name || 'Unknown',
            portfolio_image_url: assignment.booster_profiles?.portfolio_image_url,
            location: assignment.booster_profiles?.location,
            rating: assignment.booster_profiles?.rating,
            specialties: assignment.booster_profiles?.specialties || []
          }))
      }));

      setJobs(jobsWithBoosters as Job[]);
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
        .select('id, name, location, specialties, is_available, portfolio_image_url, rating');

      if (error) throw error;
      setBoosters(data || []);
    } catch (error) {
      console.error('Error fetching boosters:', error);
    }
  };

  const proceedToBoosterSelection = () => {
    // Validate required fields before showing booster selection
    if (!newJob.location || !newJob.date_needed || newJob.selectedServices.length === 0) {
      toast.error('Udfyld venligst lokation, dato og mindst én service');
      return;
    }
    
    // Get eligible boosters and pre-select them all
    const eligible = getEligibleBoostersForJob();
    setSelectedBoostersForNotification(new Set(eligible.map(b => b.id)));
    setShowBoosterSelectionStep(true);
  };

  const getEligibleBoostersForJob = () => {
    return boosters.filter(booster => {
      // Check location match
      const locationMatch = booster.location.toLowerCase().includes(newJob.location.toLowerCase()) || 
                           newJob.location.toLowerCase().includes(booster.location.toLowerCase());
      
      const isAvailable = booster.is_available;
      
      // Check if booster has required skills (if any are specified)
      const hasRequiredSkills = newJob.selectedCompetenceTags.length === 0 || 
                               newJob.selectedCompetenceTags.some(tagId => {
                                 const tag = competenceTags.find(t => t.id === tagId);
                                 return tag && booster.specialties.includes(tag.name);
                               });
      
      return locationMatch && isAvailable && hasRequiredSkills;
    });
  };

  const toggleBoosterSelection = (boosterId: string) => {
    setSelectedBoostersForNotification(prev => {
      const newSet = new Set(prev);
      if (newSet.has(boosterId)) {
        newSet.delete(boosterId);
      } else {
        newSet.add(boosterId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const eligible = getEligibleBoostersForJob();
    if (selectedBoostersForNotification.size === eligible.length) {
      // Deselect all
      setSelectedBoostersForNotification(new Set());
    } else {
      // Select all
      setSelectedBoostersForNotification(new Set(eligible.map(b => b.id)));
    }
  };

  const createJobAndNotifyBoosters = async () => {
    try {
      const totalPrice = calculateTotalPrice();
      const totalDuration = calculateTotalDuration();
      const serviceTypes = newJob.selectedServices.map(s => s.service_name).join(', ');
      
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert([{
          title: newJob.title,
          description: newJob.description,
          service_type: serviceTypes,
          location: newJob.location,
          required_skills: newJob.selectedCompetenceTags,
          hourly_rate: totalPrice,
          date_needed: newJob.date_needed ? format(newJob.date_needed, 'yyyy-MM-dd') : null,
          time_needed: newJob.time_needed,
          duration_hours: totalDuration,
          client_name: newJob.client_name,
          client_type: newJob.client_type,
          boosters_needed: newJob.boosters_needed,
          created_by: 'admin'
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      // Insert job services
      if (newJob.selectedServices.length > 0) {
        const { error: servicesError } = await supabase
          .from('job_services')
          .insert(
            newJob.selectedServices.map(service => ({
              job_id: jobData.id,
              service_id: service.service_id,
              service_name: service.service_name,
              service_price: service.service_price,
              people_count: service.people_count
            }))
          );

        if (servicesError) throw servicesError;
      }

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

      // Send notifications to selected boosters
      if (selectedBoostersForNotification.size > 0) {
        const notificationMessage = `Service: ${serviceTypes} | Lokation: ${newJob.location} | Dato: ${newJob.date_needed ? format(newJob.date_needed, 'dd-MM-yyyy') : 'TBA'}${newJob.time_needed ? ` kl. ${newJob.time_needed}` : ''} | Pris: ${totalPrice} DKK${newJob.client_type === 'privat' ? ' (inkl. moms)' : ' (ex. moms)'}${newJob.boosters_needed > 1 ? ` | ${newJob.boosters_needed} boosters søges` : ''}`;

        const notifications = Array.from(selectedBoostersForNotification).map(boosterId => ({
          recipient_id: boosterId,
          job_id: jobData.id,
          title: `Nyt job tilgængeligt: ${newJob.title}`,
          message: notificationMessage,
          type: 'job_notification'
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) throw notifError;
      }

      toast.success(`Job oprettet og sendt til ${selectedBoostersForNotification.size} booster(s)!`);
      setShowCreateDialog(false);
      setShowBoosterSelectionStep(false);
      setNewJob({
        title: "",
        description: "",
        location: "",
        date_needed: undefined,
        time_needed: "",
        duration_hours: 0,
        client_name: "",
        client_type: "privat",
        boosters_needed: 1,
        selectedServices: [],
        selectedCompetenceTags: []
      });
      setSelectedBoostersForNotification(new Set());
      setAddressQuery("");
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Fejl ved oprettelse af job');
    }
  };

  const updateJob = async () => {
    if (!selectedJobForEdit) return;
    
    try {
      const totalPrice = calculateTotalPrice();
      const totalDuration = calculateTotalDuration();
      const serviceTypes = newJob.selectedServices.map(s => s.service_name).join(', ');
      
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          title: newJob.title,
          description: newJob.description,
          service_type: serviceTypes,
          location: newJob.location,
          required_skills: newJob.selectedCompetenceTags,
          hourly_rate: totalPrice,
          date_needed: newJob.date_needed ? format(newJob.date_needed, 'yyyy-MM-dd') : null,
          time_needed: newJob.time_needed,
          duration_hours: totalDuration,
          client_name: newJob.client_name,
          client_type: newJob.client_type,
          boosters_needed: newJob.boosters_needed
        })
        .eq('id', selectedJobForEdit.id);

      if (jobError) throw jobError;

      // Delete old services and competence tags
      await supabase.from('job_services').delete().eq('job_id', selectedJobForEdit.id);
      await supabase.from('job_competence_tags').delete().eq('job_id', selectedJobForEdit.id);

      // Insert updated services
      if (newJob.selectedServices.length > 0) {
        const { error: servicesError } = await supabase
          .from('job_services')
          .insert(
            newJob.selectedServices.map(service => ({
              job_id: selectedJobForEdit.id,
              service_id: service.service_id,
              service_name: service.service_name,
              service_price: service.service_price,
              people_count: service.people_count
            }))
          );

        if (servicesError) throw servicesError;
      }

      // Insert updated competence tags
      if (newJob.selectedCompetenceTags.length > 0) {
        const { error: tagsError } = await supabase
          .from('job_competence_tags')
          .insert(
            newJob.selectedCompetenceTags.map(tagId => ({
              job_id: selectedJobForEdit.id,
              competence_tag_id: tagId
            }))
          );

        if (tagsError) throw tagsError;
      }

      toast.success('Job opdateret!');
      setSelectedJobForEdit(null);
      resetForm();
      fetchJobs();
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Fejl ved opdatering af job');
    }
  };

  const handleEditJob = (job: Job) => {
    setSelectedJobForEdit(job);
    setNewJob({
      title: job.title,
      description: job.description || "",
      location: job.location,
      date_needed: job.date_needed ? new Date(job.date_needed) : undefined,
      time_needed: job.time_needed || "",
      duration_hours: job.duration_hours || 0,
      client_name: job.client_name || "",
      client_type: job.client_type,
      boosters_needed: job.boosters_needed,
      selectedServices: [],
      selectedCompetenceTags: job.required_skills
    });
    setAddressQuery(job.location);
  };

  const handleAssignBoosters = async (boosters: BoosterOption[]) => {
    if (!selectedJobForAssign || boosters.length === 0) return;
    
    try {
      // Add new booster assignments
      const { error: insertError } = await supabase
        .from('job_booster_assignments')
        .insert(
          boosters.map(booster => ({
            job_id: selectedJobForAssign.id,
            booster_id: booster.id,
            assigned_by: 'admin'
          }))
        );

      if (insertError) throw insertError;

      // Update job status if all boosters are assigned
      const currentAssignedCount = (selectedJobForAssign.assigned_boosters?.length || 0) + boosters.length;
      if (currentAssignedCount >= selectedJobForAssign.boosters_needed) {
        await supabase
          .from('jobs')
          .update({ status: 'assigned' })
          .eq('id', selectedJobForAssign.id);
      }

      toast.success(`${boosters.length} booster(s) tildelt til job!`);
      setSelectedJobForAssign(null);
      fetchJobs();
    } catch (error) {
      console.error('Error assigning boosters:', error);
      toast.error('Fejl ved tildeling af boosters');
    }
  };

  const handleRemoveBooster = async (jobId: string, assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('job_booster_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Booster fjernet');
      fetchJobs();
    } catch (error) {
      console.error('Error removing booster:', error);
      toast.error('Fejl ved fjernelse af booster');
    }
  };

  const resetForm = () => {
    setNewJob({
      title: "",
      description: "",
      location: "",
      date_needed: undefined,
      time_needed: "",
      duration_hours: 0,
      client_name: "",
      client_type: "privat",
      boosters_needed: 1,
      selectedServices: [],
      selectedCompetenceTags: []
    });
    setAddressQuery("");
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setShowBoosterSelectionStep(false);
    setSelectedBoostersForNotification(new Set());
  };

  const addService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service && !newJob.selectedServices.find(s => s.service_id === serviceId)) {
      setNewJob(prev => ({
        ...prev,
        selectedServices: [...prev.selectedServices, {
          service_id: service.id,
          service_name: service.name,
          service_price: service.price,
          people_count: 1
        }]
      }));
    }
  };

  const removeService = (serviceId: string) => {
    setNewJob(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.service_id !== serviceId)
    }));
  };

  const updateServicePeopleCount = (serviceId: string, count: number) => {
    setNewJob(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s => 
        s.service_id === serviceId ? { ...s, people_count: Math.max(1, count) } : s
      )
    }));
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

  const generateJobTitle = async () => {
    if (newJob.selectedServices.length === 0 || !newJob.location) {
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-job-title', {
        body: {
          services: newJob.selectedServices,
          location: newJob.location,
          clientType: newJob.client_type
        }
      });

      if (error) throw error;
      
      if (data?.title) {
        setNewJob(prev => ({ ...prev, title: data.title }));
      }
    } catch (error) {
      console.error('Error generating job title:', error);
      toast.error('Kunne ikke generere job titel');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // Auto-generate title when services or location change
  useEffect(() => {
    if (newJob.selectedServices.length > 0 && newJob.location) {
      generateJobTitle();
    }
  }, [newJob.selectedServices, newJob.location, newJob.client_type]);

  // Address autocomplete
  useEffect(() => {
    const q = addressQuery.trim();
    if (q.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(q)}&type=adresse&fuzzy=true&per_side=8`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        const opts = (Array.isArray(data) ? data : [])
          .map((d: any) => d.tekst || d.forslagstekst || d.adressebetegnelse)
          .filter(Boolean);
        setAddressSuggestions(opts);
        setShowAddressSuggestions(true);
      } catch {}
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [addressQuery]);

  const selectAddress = (suggestion: string) => {
    setAddressQuery(suggestion);
    setNewJob(prev => ({ ...prev, location: suggestion }));
    setShowAddressSuggestions(false);
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

  const getEligibleBoosters = (job: Job) => {
    return boosters.filter(booster => {
      // Check location - allow partial match (e.g., "København" matches "København N")
      const locationMatch = booster.location.toLowerCase().includes(job.location.toLowerCase()) || 
                           job.location.toLowerCase().includes(booster.location.toLowerCase());
      
      const isAvailable = booster.is_available;
      
      const hasRequiredSkills = job.required_skills.length === 0 || 
                               job.required_skills.some(skill => booster.specialties.includes(skill));
      
      return locationMatch && isAvailable && hasRequiredSkills;
    }).length;
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

  // Example notification message
  const exampleNotification = `Nyt job tilgængeligt: Bryllupsstyling for Anna

Service: Makeup & Hårstyling, Spraytan | Lokation: København | Dato: 2024-06-15 kl. 14:00 | Pris: 3498 DKK (inkl. moms) | 2 boosters søges

Eksempel på notifikation som booster vil modtage.`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Job Management</h2>
        <Dialog open={showCreateDialog || !!selectedJobForEdit} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setSelectedJobForEdit(null);
            resetForm();
          } else if (!selectedJobForEdit) {
            setShowCreateDialog(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Opret Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedJobForEdit ? 'Rediger job' : 'Opret nyt job'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
                <Label>Tilføj services *</Label>
                <div className="space-y-3">
                  {newJob.selectedServices.map((service, index) => (
                    <div key={service.service_id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{service.service_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {service.service_price} DKK
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Antal personer:</Label>
                        <Input
                          type="number"
                          min="1"
                          value={service.people_count}
                          onChange={(e) => updateServicePeopleCount(service.service_id, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeService(service.service_id)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  
                  <Select onValueChange={addService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tilføj service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services
                        .filter(service => 
                          service.clientType === newJob.client_type && 
                          !newJob.selectedServices.find(s => s.service_id === service.id)
                        )
                        .map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - {service.price > 0 ? `${service.price} DKK` : 'Tilbud'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Job titel (auto-genereret)</Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={newJob.title}
                    onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={isGeneratingTitle ? "Genererer titel..." : "Vælg services og lokation først"}
                    disabled={isGeneratingTitle}
                  />
                  {isGeneratingTitle && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
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
                  <div className="relative">
                    <Input
                      id="location"
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value);
                        setShowAddressSuggestions(true);
                      }}
                      onFocus={() => addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                      placeholder="Start at taste adresse..."
                    />
                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                            onClick={() => selectAddress(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="client_name">Klient navn</Label>
                  <Input
                    id="client_name"
                    value={newJob.client_name}
                    onChange={(e) => setNewJob(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Anna Hansen"
                  />
                </div>
              </div>

              {newJob.selectedServices.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">Prisberegning</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total pris:</span>
                      <span className="font-medium">{calculateTotalPrice()} DKK</span>
                    </div>
                    {(() => {
                      const totalPrice = calculateTotalPrice();
                      const earnings = calculateEarnings(totalPrice, newJob.client_type);
                      return (
                        <>
                          <div className="flex justify-between text-muted-foreground">
                            <span>BeautyBoosters (40%):</span>
                            <span>{Math.round(earnings.beautyBoostersCut)} DKK</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Booster indtjening:</span>
                            <span>{Math.round(earnings.boosterEarnings)} DKK</span>
                          </div>
                          {newJob.client_type === 'privat' && (
                            <div className="text-xs text-orange-600">*Inkl. 20% moms</div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date_needed">Dato *</Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newJob.date_needed && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newJob.date_needed ? format(newJob.date_needed, "PPP") : <span>Vælg dato</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newJob.date_needed}
                        onSelect={(date) => {
                          setNewJob(prev => ({ ...prev, date_needed: date }));
                          setDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="time_needed">Tidspunkt</Label>
                  <Select value={newJob.time_needed} onValueChange={(value) => setNewJob(prev => ({ ...prev, time_needed: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg tidspunkt" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration_hours">Varighed (auto-beregnet)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    value={calculateTotalDuration()}
                    disabled
                    className="bg-muted"
                  />
                </div>
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

              {!showBoosterSelectionStep ? (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Label className="text-sm font-medium text-blue-900">Eksempel på booster notifikation:</Label>
                    <div className="mt-2 text-sm text-blue-800 font-mono whitespace-pre-line">
                      {exampleNotification}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setShowCreateDialog(false);
                      setSelectedJobForEdit(null);
                      resetForm();
                    }}>
                      Annuller
                    </Button>
                    <Button 
                      onClick={selectedJobForEdit ? updateJob : proceedToBoosterSelection} 
                      disabled={!newJob.title || !newJob.location || !newJob.date_needed || newJob.selectedServices.length === 0}
                    >
                      {selectedJobForEdit ? 'Gem ændringer' : 'Vælg boosters →'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Vælg boosters til notifikation</h3>
                      <Badge variant="secondary">
                        {selectedBoostersForNotification.size} valgt
                      </Badge>
                    </div>
                    
                    {getEligibleBoostersForJob().length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        Ingen boosters matcher kriterierne for dette job
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-3 p-3 rounded-lg border bg-accent/50 cursor-pointer font-medium">
                          <Checkbox
                            checked={selectedBoostersForNotification.size === getEligibleBoostersForJob().length && getEligibleBoostersForJob().length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                          <span>Vælg alle ({getEligibleBoostersForJob().length})</span>
                        </label>
                        
                        <ScrollArea className="h-96">
                          <div className="space-y-2 pr-4">
                            {getEligibleBoostersForJob().map((booster) => (
                              <label
                                key={booster.id}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                              >
                                <Checkbox
                                  checked={selectedBoostersForNotification.has(booster.id)}
                                  onCheckedChange={() => toggleBoosterSelection(booster.id)}
                                />
                                <img
                                  src={booster.portfolio_image_url || "/placeholder.svg"}
                                  alt={booster.name}
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{booster.name}</span>
                                    {typeof booster.rating === 'number' && (
                                      <span className="text-xs text-muted-foreground">{booster.rating.toFixed(1)}★</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{booster.location}</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {booster.specialties.slice(0, 4).map((specialty) => (
                                      <Badge key={specialty} variant="outline" className="text-[10px] h-4 px-1">
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowBoosterSelectionStep(false)}>
                      ← Tilbage
                    </Button>
                    <Button 
                      onClick={createJobAndNotifyBoosters}
                      disabled={selectedBoostersForNotification.size === 0}
                    >
                      Opret job & Send til {selectedBoostersForNotification.size} booster(s)
                    </Button>
                  </div>
                </>
              )}
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
                  {job.assigned_boosters && job.assigned_boosters.length > 0 ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {job.assigned_boosters.length}/{job.boosters_needed} tildelt
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {getEligibleBoosters(job)} tilgængelige
                    </Badge>
                  )}
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
                      <span className="font-medium">{job.hourly_rate} DKK</span>
                      <span className="text-xs text-muted-foreground">
                        ({job.client_type === 'privat' ? 'inkl. moms' : 'ex. moms'})
                      </span>
                    </div>
                    {job.assigned_boosters && job.assigned_boosters.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Tildelte boosters:</span>
                          {job.assigned_boosters.length < job.boosters_needed && (
                            <span className="text-sm text-orange-600">
                              Mangler {job.boosters_needed - job.assigned_boosters.length} mere
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {job.assigned_boosters.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={assignment.portfolio_image_url || "/placeholder.svg"}
                                  alt={assignment.booster_name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-green-700">{assignment.booster_name}</span>
                                    {typeof assignment.rating === 'number' && (
                                      <span className="text-xs text-green-600">{assignment.rating.toFixed(1)}★</span>
                                    )}
                                  </div>
                                  {assignment.location && (
                                    <div className="text-xs text-muted-foreground">{assignment.location}</div>
                                  )}
                                  {assignment.specialties && assignment.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {assignment.specialties.slice(0, 3).map((specialty) => (
                                        <Badge key={specialty} variant="outline" className="text-[10px] h-4 px-1">
                                          {specialty}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveBooster(job.id, assignment.id);
                                }}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {job.assigned_boosters.length < job.boosters_needed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForAssign(job);
                            }}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tilføj flere boosters
                          </Button>
                        )}
                      </div>
                    ) : (
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
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
                  <Button variant="outline" size="sm" onClick={() => setSelectedJobForChat(job.id)}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                  {job.client_type === 'virksomhed' && (
                    <InvoiceCreator 
                      job={job} 
                      onInvoiceSent={() => fetchJobs()} 
                    />
                  )}
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Se ansøgninger
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditJob(job)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Rediger
                  </Button>
                  {job.status === 'open' && (
                    <Button size="sm" onClick={() => setSelectedJobForAssign(job)}>
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

      {/* Chat Dialog */}
      {selectedJobForChat && (
        <Dialog open={!!selectedJobForChat} onOpenChange={() => setSelectedJobForChat(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Job Chat - {jobs.find(j => j.id === selectedJobForChat)?.title}</DialogTitle>
            </DialogHeader>
            <JobChat 
              jobId={selectedJobForChat} 
              userType="admin" 
              userName="Admin"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Boosters Dialog */}
      {selectedJobForAssign && (
        <AssignBoostersDialog
          open={!!selectedJobForAssign}
          onOpenChange={(open) => !open && setSelectedJobForAssign(null)}
          alreadyAssignedIds={selectedJobForAssign.assigned_boosters?.map(b => b.booster_id) || []}
          date={selectedJobForAssign.date_needed}
          time={selectedJobForAssign.time_needed}
          serviceCategory={selectedJobForAssign.service_type}
          desiredCount={selectedJobForAssign.boosters_needed - (selectedJobForAssign.assigned_boosters?.length || 0)}
          onAutoAssign={handleAssignBoosters}
          onConfirm={handleAssignBoosters}
        />
      )}
    </div>
  );
};

export default AdminJobs;