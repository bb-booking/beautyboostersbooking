import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, MapPin, Mail, Phone, Briefcase } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface BoosterApplication {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skills: string[];
  city: string | null;
  years_experience: number;
  portfolio_links: string | null;
  status: string;
  created_at: string;
  education: any;
  business_type: string | null;
}

export default function AdminBoosterApplications() {
  const [applications, setApplications] = useState<BoosterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; applicationId: string | null }>({
    open: false,
    applicationId: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente ansøgninger",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      const { data, error } = await supabase.functions.invoke('approve-booster-application', {
        body: {
          application_id: applicationId,
          approved: true,
        }
      });

      if (error) throw error;

      toast({
        title: "Godkendt",
        description: data.message || "Booster er blevet godkendt og oprettet",
      });

      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke godkende ansøgning",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.applicationId) return;

    setProcessingId(rejectDialog.applicationId);
    try {
      const { data, error } = await supabase.functions.invoke('approve-booster-application', {
        body: {
          application_id: rejectDialog.applicationId,
          approved: false,
          rejection_reason: rejectionReason || "Opfylder ikke kravene",
        }
      });

      if (error) throw error;

      toast({
        title: "Afvist",
        description: data.message || "Ansøgningen er blevet afvist",
      });

      setRejectDialog({ open: false, applicationId: null });
      setRejectionReason("");
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke afvise ansøgning",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Booster Ansøgninger</h1>
          <p className="text-muted-foreground">Gennemgå og godkend nye Beauty Boosters</p>
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

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const processedApplications = applications.filter(app => app.status !== 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Booster Ansøgninger</h1>
        <p className="text-muted-foreground">
          {pendingApplications.length} ventende ansøgninger
        </p>
      </div>

      {pendingApplications.length === 0 && processedApplications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Ingen ansøgninger endnu</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingApplications.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Ventende ansøgninger</h2>
              {pendingApplications.map((app) => (
                <Card key={app.id} className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{app.name}</CardTitle>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {app.email}
                          </div>
                          {app.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {app.phone}
                            </div>
                          )}
                          {app.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {app.city}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">Ny ansøgning</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Kompetencer:</p>
                      <div className="flex flex-wrap gap-2">
                        {app.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{app.years_experience} års erfaring</span>
                      </div>
                      {app.portfolio_links && (
                        <div>
                          <a 
                            href={app.portfolio_links} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Se portfolio →
                          </a>
                        </div>
                      )}
                    </div>

                    {app.education && Array.isArray(app.education) && app.education.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Uddannelse:</p>
                        <div className="space-y-1">
                          {app.education.map((edu: any, idx: number) => (
                            <div key={idx} className="text-sm text-muted-foreground">
                              {edu.school} ({edu.year})
                              {edu.isAutodidact && " - Autodidakt"}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApprove(app.id)}
                        disabled={processingId === app.id}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Godkend
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setRejectDialog({ open: true, applicationId: app.id })}
                        disabled={processingId === app.id}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Afvis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {processedApplications.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tidligere ansøgninger</h2>
              {processedApplications.map((app) => (
                <Card key={app.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{app.name}</CardTitle>
                      <Badge variant={app.status === 'approved' ? 'default' : 'destructive'}>
                        {app.status === 'approved' ? 'Godkendt' : 'Afvist'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {app.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, applicationId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Afvis ansøgning</DialogTitle>
            <DialogDescription>
              Skriv en begrundelse for afvisningen (valgfri). Ansøgeren vil modtage denne besked.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="F.eks. 'Mangler erfaring med bryllupsmakeup' eller 'Portfolio opfylder ikke vores standarder'"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, applicationId: null })}>
              Annuller
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processingId !== null}>
              Afvis ansøgning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
