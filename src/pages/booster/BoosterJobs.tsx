import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, Users, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

export default function BoosterJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailableJobs = async () => {
    try {
      // In a real app, this would filter by booster's location and skills
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente ledige jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          booster_id: 'current-booster-id', // Would be from auth context
          message: 'Jeg er interesseret i dette job.'
        });

      if (error) throw error;

      toast({
        title: "Ansøgning sendt",
        description: "Din ansøgning er blevet sendt til kunden",
      });
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke sende ansøgning",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAvailableJobs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ledige Jobs</h1>
          <p className="text-muted-foreground">Jobs der matcher dine kompetencer og lokation</p>
        </div>
        
        <div className="grid gap-6">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ledige Jobs</h1>
        <p className="text-muted-foreground">Jobs der matcher dine kompetencer og lokation</p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Ingen ledige jobs lige nu</p>
            <p className="text-sm text-muted-foreground mt-2">
              Nye jobs der matcher dine kompetencer vil vises her
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      {job.service_type}
                    </Badge>
                  </div>
                  <Badge variant={job.client_type === 'erhverv' ? 'default' : 'outline'}>
                    {job.client_type === 'erhverv' ? 'Erhverv' : 'Privat'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {job.description && (
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(job.date_needed).toLocaleDateString('da-DK')}
                      {job.time_needed && ` kl. ${job.time_needed}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{job.boosters_needed} booster{job.boosters_needed > 1 ? 'e' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{job.hourly_rate} DKK/time</span>
                  </div>
                </div>

                {job.required_skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Påkrævede kompetencer:</p>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
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
    </div>
  );
}