import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bell
} from "lucide-react";
import { Helmet } from "react-helmet-async";

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

export default function BoosterJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    fetchAvailableJobs();
    fetchRequests();
    
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
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error("Kunne ikke hente ledige jobs");
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching booking requests:', error);
      toast.error('Kunne ikke hente booking anmodninger');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'reject') => {
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

      if (error) throw error;

      if (data.success) {
        toast.success(data.auto_assigned ? "🎉 Job tildelt!" : "Ansøgning sendt", {
          description: data.message
        });
        fetchAvailableJobs();
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast.error("Kunne ikke sende ansøgning");
    }
  };

  const totalPendingItems = requests.length + jobs.length;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Jobs - BeautyBoosters</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">Anmodninger og ledige jobs</p>
        </div>
        {totalPendingItems > 0 && (
          <Badge variant="default" className="text-sm">
            {totalPendingItems} {totalPendingItems === 1 ? 'job' : 'jobs'}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
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
            <span className="hidden sm:inline">Ledige jobs</span>
            <span className="sm:hidden">Ledige</span>
            {jobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {jobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

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
    </div>
  );
}
