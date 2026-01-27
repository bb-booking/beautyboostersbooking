import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { 
  MapPin, 
  Clock, 
  Users, 
  Check, 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Briefcase,
  Bell,
  Smartphone,
  CalendarCheck,
  HandHelping
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { PushNotificationMockup } from "@/components/booster/PushNotificationMockup";

interface Job {
  id: string;
  title: string;
  service_type: string;
  location: string;
  date_needed: string;
  time_needed: string | null;
  hourly_rate: number;
  duration_hours: number | null;
  boosters_needed: number;
  required_skills: string[];
  description: string | null;
  client_type: string;
  status: string;
}

interface UpcomingJob {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  job_id: string | null;
}

interface BookingRequest {
  id: string;
  booking_id: string;
  created_at: string;
  expires_at: string;
  status: string;
  bookings: {
    id: string;
    booking_date: string;
    booking_time: string;
    duration_hours: number;
    service_name: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    location: string;
    special_requests?: string;
    amount: number;
  };
}

// Mock data for demonstration
const mockUpcomingJobs: UpcomingJob[] = [
  {
    id: 'mock-upcoming-1',
    date: format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    start_time: '10:00:00',
    end_time: '14:00:00',
    status: 'booked',
    notes: JSON.stringify({ 
      service: 'Bryllupsmakeup', 
      customer_name: 'Louise Hansen', 
      address: 'Østerbrogade 45, 2100 København Ø',
      client_type: 'privat',
      price: 2400
    }),
    job_id: 'job-1'
  },
  {
    id: 'mock-upcoming-2',
    date: format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    start_time: '08:00:00',
    end_time: '16:00:00',
    status: 'booked',
    notes: JSON.stringify({ 
      service: 'Film/TV Produktion', 
      customer_name: 'TV2 Danmark', 
      address: 'Teglholmsgade 26, 2450 København SV',
      client_type: 'virksomhed',
      price: 4800
    }),
    job_id: 'job-2'
  },
  {
    id: 'mock-upcoming-3',
    date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    start_time: '14:00:00',
    end_time: '17:00:00',
    status: 'booked',
    notes: JSON.stringify({ 
      service: 'Makeup Styling', 
      customer_name: 'Emma Petersen', 
      address: 'Nørrebrogade 112, 2200 København N',
      client_type: 'privat',
      price: 1800
    }),
    job_id: 'job-3'
  }
];

const mockRequests: BookingRequest[] = [
  {
    id: 'mock-req-1',
    booking_id: 'booking-1',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    bookings: {
      id: 'booking-1',
      booking_date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      booking_time: '11:00',
      duration_hours: 2,
      service_name: 'Hår Styling',
      customer_name: 'Sofie Larsen',
      customer_email: 'sofie@email.dk',
      customer_phone: '+45 12 34 56 78',
      location: 'Vesterbrogade 89, 1620 København V',
      special_requests: 'Ønsker naturligt look til firmafest',
      amount: 1200
    }
  },
  {
    id: 'mock-req-2',
    booking_id: 'booking-2',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    bookings: {
      id: 'booking-2',
      booking_date: format(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      booking_time: '09:00',
      duration_hours: 6,
      service_name: 'Event Makeup',
      customer_name: 'Nordic Fashion Week',
      customer_email: 'booking@nordicfashion.dk',
      customer_phone: '+45 33 44 55 66',
      location: 'Bella Center, Center Boulevard 5, 2300 København S',
      special_requests: '8 modeller til modeshow',
      amount: 7200
    }
  }
];

const mockAvailableJobs: Job[] = [
  {
    id: 'mock-job-1',
    title: 'Anna Jensen - Bryllup',
    service_type: 'Bryllup',
    location: 'Frederiksberg Slot, 2000 Frederiksberg',
    date_needed: format(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    time_needed: '08:00',
    hourly_rate: 600,
    duration_hours: 5,
    boosters_needed: 2,
    required_skills: ['Bryllupsmakeup', 'Hår styling'],
    description: 'Bryllup med 2 brudepiger. Ønsker naturligt og elegant look.',
    client_type: 'privat',
    status: 'open'
  },
  {
    id: 'mock-job-2',
    title: 'DR - Teaterproduktion',
    service_type: 'Teater',
    location: 'DR Byen, Emil Holms Kanal 20, 0999 København C',
    date_needed: format(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    time_needed: '07:00',
    hourly_rate: 650,
    duration_hours: 10,
    boosters_needed: 3,
    required_skills: ['SFX', 'Teater makeup'],
    description: 'Historisk drama - periodespecifik makeup for 15 skuespillere',
    client_type: 'virksomhed',
    status: 'open'
  },
  {
    id: 'mock-job-3',
    title: 'Maria Nielsen - Fotoshoot',
    service_type: 'Reklame/Fotoshoot',
    location: 'Studiestræde 14, 1455 København K',
    date_needed: format(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    time_needed: '10:00',
    hourly_rate: 550,
    duration_hours: 4,
    boosters_needed: 1,
    required_skills: ['Makeup Styling'],
    description: 'Professionelt portræt til LinkedIn og hjemmeside',
    client_type: 'privat',
    status: 'open'
  },
  {
    id: 'mock-job-4',
    title: 'Zalando - Kampagne',
    service_type: 'Reklame/Fotoshoot',
    location: 'Islands Brygge 43, 2300 København S',
    date_needed: format(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    time_needed: '08:00',
    hourly_rate: 700,
    duration_hours: 8,
    boosters_needed: 4,
    required_skills: ['Fashion makeup', 'Hår styling'],
    description: 'Forårskampagne med 12 modeller - naturligt skandinavisk look',
    client_type: 'virksomhed',
    status: 'open'
  }
];

export default function BoosterJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showPushDemo, setShowPushDemo] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [selectedJobForRelease, setSelectedJobForRelease] = useState<UpcomingJob | null>(null);
  const [releaseReason, setReleaseReason] = useState('');

  useEffect(() => {
    fetchAvailableJobs();
    fetchRequests();
    fetchUpcomingJobs();
    
    // Set up realtime subscription for booking requests
    const channel = supabase
      .channel('booking-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booster_booking_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAvailableJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Use mock data if no real data
      setJobs(data && data.length > 0 ? data : mockAvailableJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fall back to mock data on error
      setJobs(mockAvailableJobs);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Use mock data if not logged in
        setRequests(mockRequests);
        setLoadingRequests(false);
        return;
      }

      const { data, error } = await supabase
        .from('booster_booking_requests')
        .select(`
          id,
          booking_id,
          created_at,
          expires_at,
          status,
          bookings (
            id,
            booking_date,
            booking_time,
            duration_hours,
            service_name,
            customer_name,
            customer_email,
            customer_phone,
            location,
            special_requests,
            amount
          )
        `)
        .eq('booster_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Use mock data if no real data
      setRequests(data && data.length > 0 ? data : mockRequests);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      // Fall back to mock data on error
      setRequests(mockRequests);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchUpcomingJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Use mock data if not logged in
        setUpcomingJobs(mockUpcomingJobs);
        setLoadingUpcoming(false);
        return;
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('booster_availability')
        .select('id, date, start_time, end_time, status, notes, job_id')
        .eq('booster_id', user.id)
        .eq('status', 'booked')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      // Use mock data if no real data
      setUpcomingJobs(data && data.length > 0 ? data : mockUpcomingJobs);
    } catch (error) {
      console.error('Error fetching upcoming jobs:', error);
      // Fall back to mock data on error
      setUpcomingJobs(mockUpcomingJobs);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  const handleReleaseJob = async () => {
    if (!selectedJobForRelease) return;
    
    setProcessing(selectedJobForRelease.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Ikke logget ind');

      const { data, error } = await supabase.functions.invoke('release-job', {
        body: {
          bookingId: selectedJobForRelease.job_id || selectedJobForRelease.id,
          boosterId: user.id,
          reason: releaseReason
        }
      });

      if (error) throw error;

      toast.success('Job frigivet', {
        description: 'Jobbet er nu tilgængeligt for andre boosters'
      });
      
      setReleaseDialogOpen(false);
      setSelectedJobForRelease(null);
      setReleaseReason('');
      fetchUpcomingJobs();
    } catch (error: any) {
      console.error('Error releasing job:', error);
      toast.error(error.message || 'Kunne ikke frigive job');
    } finally {
      setProcessing(null);
    }
  };

  const parseNotes = (notes: string | null): { service?: string; customer_name?: string; address?: string; client_type?: string; price?: number } => {
    try {
      return notes ? JSON.parse(notes) : {};
    } catch {
      return {};
    }
  };

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'reject') => {
    // Check if this is mock data - don't process mock IDs
    if (requestId.startsWith('mock-')) {
      toast.info('Dette er demo-data. Log ind og modtag rigtige booking-anmodninger.');
      return;
    }
    
    setProcessing(requestId);
    try {
      const status = action === 'accept' ? 'accepted' : 'rejected';
      
      const { error } = await supabase
        .from('booster_booking_requests')
        .update({
          status,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      if (action === 'accept') {
        toast.success('Booking accepteret! Den er nu tilføjet til din kalender.');
      } else {
        toast.success('Booking afvist');
      }

      fetchRequests();
    } catch (error: any) {
      console.error('Error handling booking response:', error);
      toast.error(error.message || 'Der opstod en fejl');
    } finally {
      setProcessing(null);
    }
  };

  const handleApplyForJob = async (jobId: string) => {
    // Check if this is mock data - don't process mock IDs
    if (jobId.startsWith('mock-')) {
      toast.info('Dette er demo-data. Log ind og ansøg om rigtige jobs.');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Du skal være logget ind for at ansøge");
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-job-application', {
        body: {
          job_id: jobId,
          booster_id: user.id,
          message: 'Jeg er interesseret i dette job.'
        }
      });

      // Handle edge function error responses (they return data even on 400 status)
      if (error) {
        // Try to parse the error context for the actual message
        const errorData = (error as any).context;
        if (errorData?.message) {
          toast.info(errorData.message);
        } else {
          toast.error("Kunne ikke sende ansøgning");
        }
        return;
      }

      if (data?.success) {
        toast.success(data.auto_assigned ? "🎉 Job tildelt!" : "Ansøgning sendt", {
          description: data.message
        });
        fetchAvailableJobs();
      } else if (data?.message) {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error("Kunne ikke sende ansøgning");
    }
  };

  const totalPendingItems = requests.length + jobs.length;

  return (
    <div className="space-y-6 max-w-5xl">
      <Helmet>
        <title>Jobs - BeautyBoosters</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">Anmodninger og ledige jobs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowPushDemo(true)}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Demo Push</span>
            <span className="sm:hidden">Demo</span>
          </Button>
          {totalPendingItems > 0 && (
            <Badge variant="default" className="text-sm">
              {totalPendingItems} {totalPendingItems === 1 ? 'job' : 'jobs'}
            </Badge>
          )}
        </div>
      </div>

      {/* Push Notification Mockup for Investor Demo */}
      <PushNotificationMockup
        isVisible={showPushDemo}
        onClose={() => setShowPushDemo(false)}
        onAccept={() => {
          console.log("Demo: Job accepted");
        }}
        onReject={() => {
          console.log("Demo: Job rejected");
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Kommende</span>
            <span className="sm:hidden">Kom.</span>
            {upcomingJobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {upcomingJobs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Anmodninger</span>
            <span className="sm:hidden">Anm.</span>
            {requests.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Ledige</span>
            <span className="sm:hidden">Ledige</span>
            {jobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {jobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Jobs Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {loadingUpcoming ? (
            <div className="grid gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium">Ingen kommende jobs</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Dine accepterede jobs vises her
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingJobs.map((job) => {
                const meta = parseNotes(job.notes);
                const isVirksomhed = meta.client_type === 'virksomhed';
                
                return (
                  <Card key={job.id} className="overflow-hidden">
                    <div className={`h-1.5 ${isVirksomhed ? 'bg-purple-400' : 'bg-pink-400'}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-xl truncate">
                            {meta.service || 'Booking'}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {format(new Date(job.date), 'EEE d. MMM', { locale: da })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>{job.start_time.slice(0, 5)} - {job.end_time.slice(0, 5)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge variant={isVirksomhed ? 'default' : 'secondary'}>
                            {isVirksomhed ? 'B2B' : 'Privat'}
                          </Badge>
                          {meta.price && (
                            <span className="font-semibold text-primary">
                              {meta.price.toLocaleString('da-DK')} kr
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            {meta.customer_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{meta.customer_name}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {meta.address && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{meta.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedJobForRelease(job);
                              setReleaseDialogOpen(true);
                            }}
                            className="flex-1 text-destructive hover:text-destructive"
                          >
                            <HandHelping className="h-5 w-5 mr-2" />
                            Frigiv job
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Booking Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {loadingRequests ? (
            <div className="grid gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium">Ingen booking anmodninger</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nye anmodninger fra kunder vises her
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => {
                const booking = request.bookings;
                const isExpired = new Date(request.expires_at) < new Date();
                
                return (
                  <Card key={request.id} className={`overflow-hidden ${isExpired ? 'opacity-60' : ''}`}>
                    <CardHeader className="bg-primary/5 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg sm:text-xl mb-2 truncate">
                            {booking.service_name}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {format(new Date(booking.booking_date), 'EEE d. MMM', { locale: da })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>{booking.booking_time.slice(0, 5)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge className="text-base whitespace-nowrap">
                            {booking.amount} DKK
                          </Badge>
                          {isExpired && <Badge variant="secondary">Udløbet</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{booking.customer_name}</span>
                            </div>
                            {booking.customer_phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <a href={`tel:${booking.customer_phone}`} className="hover:underline truncate">
                                  {booking.customer_phone}
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{booking.location}</span>
                            </div>
                          </div>
                        </div>

                        {booking.special_requests && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Ønsker:</p>
                            <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
                          </div>
                        )}

                        {!isExpired && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                              onClick={() => handleRequestResponse(request.id, 'accept')}
                              disabled={processing === request.id}
                              className="flex-1"
                              size="lg"
                            >
                              <Check className="h-5 w-5 mr-2" />
                              Acceptér
                            </Button>
                            <Button
                              onClick={() => handleRequestResponse(request.id, 'reject')}
                              disabled={processing === request.id}
                              variant="outline"
                              className="flex-1"
                              size="lg"
                            >
                              <X className="h-5 w-5 mr-2" />
                              Afvis
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Available Jobs Tab */}
        <TabsContent value="available" className="space-y-4">
          {loadingJobs ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium">Ingen ledige jobs</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Jobs der matcher dine kompetencer vises her
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg sm:text-xl truncate">{job.title}</CardTitle>
                        <Badge variant="secondary" className="mt-2">
                          {job.service_type}
                        </Badge>
                      </div>
                      <Badge variant={job.client_type === 'erhverv' || job.client_type === 'virksomhed' ? 'default' : 'outline'} className="flex-shrink-0">
                        {job.client_type === 'erhverv' || job.client_type === 'virksomhed' ? 'B2B' : 'Privat'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">
                          {format(new Date(job.date_needed), 'd. MMM', { locale: da })}
                          {job.time_needed && ` ${job.time_needed.slice(0, 5)}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{job.boosters_needed} booster{job.boosters_needed > 1 ? 'e' : ''}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{job.hourly_rate} DKK</span>
                      </div>
                    </div>

                    {job.required_skills && job.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {job.required_skills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.required_skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.required_skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={() => handleApplyForJob(job.id)}
                        className="w-full sm:w-auto"
                      >
                        Ansøg om job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Release Job Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Frigiv job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Er du sikker på at du vil frigive dette job? Det vil blive tilbudt til andre boosters.
            </p>
            {selectedJobForRelease && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{parseNotes(selectedJobForRelease.notes).service || 'Booking'}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedJobForRelease.date), 'EEEE d. MMMM', { locale: da })} kl. {selectedJobForRelease.start_time.slice(0, 5)}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="release-reason">Årsag til frigivelse</Label>
              <Textarea
                id="release-reason"
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                placeholder="Beskriv hvorfor du frigiver jobbet..."
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setReleaseDialogOpen(false);
                  setSelectedJobForRelease(null);
                  setReleaseReason('');
                }}
                className="flex-1"
              >
                Annuller
              </Button>
              <Button 
                onClick={handleReleaseJob}
                disabled={processing === selectedJobForRelease?.id}
                variant="destructive"
                className="flex-1"
              >
                <HandHelping className="h-4 w-4 mr-2" />
                Frigiv
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
