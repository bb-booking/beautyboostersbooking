import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Search, MessageSquare, ArrowLeft, Users } from "lucide-react";
import JobChat from "@/components/job/JobChat";

interface JobWithChat {
  id: string;
  title: string;
  client_name: string | null;
  client_email: string | null;
  date_needed: string;
  status: string;
  message_count: number;
  last_message_at: string | null;
  assigned_boosters: string[];
}

export default function AdminJobChats() {
  const [jobs, setJobs] = useState<JobWithChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJobsWithChats();
  }, []);

  const fetchJobsWithChats = async () => {
    try {
      // Get all jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id, title, client_name, client_email, date_needed, status
        `)
        .order('date_needed', { ascending: false });

      if (jobsError) throw jobsError;

      // Get message counts for each job
      const jobsWithChatInfo = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: messages, error } = await supabase
            .from('job_communications')
            .select('id, created_at')
            .eq('job_id', job.id)
            .order('created_at', { ascending: false });

          const { data: assignments } = await supabase
            .from('job_booster_assignments')
            .select('booster_id')
            .eq('job_id', job.id);

          const { data: boosters } = await supabase
            .from('booster_profiles')
            .select('id, name')
            .in('id', (assignments || []).map(a => a.booster_id));

          return {
            ...job,
            message_count: messages?.length || 0,
            last_message_at: messages?.[0]?.created_at || null,
            assigned_boosters: (boosters || []).map(b => b.name)
          };
        })
      );

      // Filter to only jobs with messages
      const jobsWithMessages = jobsWithChatInfo.filter(j => j.message_count > 0);
      setJobs(jobsWithMessages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
        <h1 className="text-xl sm:text-2xl font-bold">Job Chats</h1>
      </div>
      <p className="text-sm text-muted-foreground">Overvåg kommunikation mellem boosters og kunder</p>

      {/* Mobile: Show either list or chat */}
      <div className="lg:hidden">
        {!selectedJobId ? (
          <Card>
            <CardHeader className="pb-3 px-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søg job..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {loading ? (
                  <div className="p-4 text-sm text-muted-foreground">Indlæser...</div>
                ) : filteredJobs.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Ingen job chats fundet</div>
                ) : (
                  <div className="divide-y">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent active:bg-accent/80 transition-colors"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{job.title}</p>
                            <Badge variant="secondary" className="text-xs px-1.5">{job.message_count}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {job.client_name || job.client_email || 'Ukendt kunde'}
                          </p>
                          {job.assigned_boosters.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              Boosters: {job.assigned_boosters.join(', ')}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.date_needed).toLocaleDateString('da-DK')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedJobId(null)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Tilbage
            </Button>
            <div className="text-sm">
              <p className="font-medium">{selectedJob?.title}</p>
              <p className="text-muted-foreground">{selectedJob?.client_name || selectedJob?.client_email}</p>
              {selectedJob?.assigned_boosters && selectedJob.assigned_boosters.length > 0 && (
                <p className="text-muted-foreground">Boosters: {selectedJob.assigned_boosters.join(', ')}</p>
              )}
            </div>
            <JobChat jobId={selectedJobId} userType="admin" readOnly />
          </div>
        )}
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Job Samtaler</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søg job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">Indlæser...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Ingen job chats fundet</div>
              ) : (
                <div className="divide-y">
                  {filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-accent transition-colors ${
                        selectedJobId === job.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{job.title}</p>
                          <Badge variant="secondary" className="text-xs">{job.message_count}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.client_name || job.client_email || 'Ukendt kunde'}
                        </p>
                        {job.assigned_boosters.length > 0 && (
                          <p className="text-xs text-muted-foreground truncate">
                            Boosters: {job.assigned_boosters.join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.date_needed).toLocaleDateString('da-DK')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="col-span-2">
          {selectedJobId ? (
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">{selectedJob?.title}</p>
                <p className="text-muted-foreground">{selectedJob?.client_name || selectedJob?.client_email}</p>
                {selectedJob?.assigned_boosters && selectedJob.assigned_boosters.length > 0 && (
                  <p className="text-muted-foreground">Boosters: {selectedJob.assigned_boosters.join(', ')}</p>
                )}
              </div>
              <JobChat jobId={selectedJobId} userType="admin" readOnly />
            </div>
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Vælg et job for at se chatten</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
