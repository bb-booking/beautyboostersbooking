import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, MapPin, Briefcase, Forward, User } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminUser {
  id: string;
  email: string;
  name?: string;
}

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
  assigned_to_admin_id?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
}

// Mock data for demo
const mockApplications: BoosterApplication[] = [
  {
    id: "mock-1",
    name: "Sofia Jensen",
    email: "sofia@example.com",
    phone: "+45 20 12 34 56",
    skills: ["Bryllupsmakeup", "Hår styling", "Airbrush"],
    city: "København",
    years_experience: 5,
    portfolio_links: "https://instagram.com/sofiamakeup",
    status: "pending",
    created_at: new Date().toISOString(),
    education: [{ school: "Makeup Artist Academy", year: "2019" }],
    business_type: "cvr"
  },
  {
    id: "mock-2",
    name: "Emma Nielsen",
    email: "emma@example.com",
    phone: "+45 30 45 67 89",
    skills: ["SFX Makeup", "Teater makeup", "Film/TV"],
    city: "Aarhus",
    years_experience: 3,
    portfolio_links: "https://emmasfx.dk",
    status: "pending",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    education: [{ school: "Den Danske Filmskole", year: "2021" }],
    business_type: "b-income"
  },
  {
    id: "mock-3",
    name: "Laura Andersen",
    email: "laura@example.com",
    phone: "+45 40 78 90 12",
    skills: ["Event makeup", "Photoshoot", "Naturlig makeup"],
    city: "Odense",
    years_experience: 2,
    portfolio_links: null,
    status: "pending",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    education: [{ school: "Autodidakt", year: "2022", isAutodidact: true }],
    business_type: "cvr"
  }
];

export default function AdminBoosterApplications() {
  const [applications, setApplications] = useState<BoosterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<BoosterApplication | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; applicationId: string | null }>({
    open: false,
    applicationId: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; applicationId: string | null }>({
    open: false,
    applicationId: null,
  });
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('booster_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Combine real data with mock data for demo
      const realData = data || [];
      const combinedData = [...realData, ...mockApplications.filter(m => 
        !realData.some(r => r.id === m.id)
      )];
      setApplications(combinedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Show mock data on error
      setApplications(mockApplications);
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

  const fetchAdmins = async () => {
    try {
      // Get all users with admin role
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      // Get booster profiles with matching user_ids for names
      const adminUserIds = adminRoles?.map(r => r.user_id) || [];
      const { data: boosterProfiles } = await supabase
        .from('booster_profiles')
        .select('id, name, email')
        .in('id', adminUserIds);

      const adminList: AdminUser[] = adminUserIds.map(userId => {
        const profile = boosterProfiles?.find(p => p.id === userId);
        return {
          id: userId,
          email: profile?.email || 'Admin',
          name: profile?.name || undefined
        };
      });

      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const handleAssign = async () => {
    if (!assignDialog.applicationId || !selectedAdminId) return;

    setProcessingId(assignDialog.applicationId);
    try {
      const { error } = await supabase
        .from('booster_applications')
        .update({
          assigned_to_admin_id: selectedAdminId,
          assigned_at: new Date().toISOString(),
          assigned_by: currentUserId
        })
        .eq('id', assignDialog.applicationId);

      if (error) throw error;

      const assignedAdmin = admins.find(a => a.id === selectedAdminId);
      toast({
        title: "Videresendt",
        description: `Ansøgningen er videresendt til ${assignedAdmin?.name || assignedAdmin?.email || 'admin'}`,
      });

      setAssignDialog({ open: false, applicationId: null });
      setSelectedAdminId("");
      fetchApplications();
    } catch (error) {
      console.error('Error assigning application:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke videresende ansøgning",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getAdminName = (adminId: string | null | undefined) => {
    if (!adminId) return null;
    const admin = admins.find(a => a.id === adminId);
    return admin?.name || admin?.email || 'Admin';
  };

  useEffect(() => {
    fetchApplications();
    fetchAdmins();
    fetchCurrentUser();
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
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pendingApplications.map((app) => (
                      <div key={app.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          {/* Quick view info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-foreground">{app.name}</span>
                              <Badge variant="outline" className="text-xs">Ny</Badge>
                              {app.assigned_to_admin_id && (
                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Tildelt: {getAdminName(app.assigned_to_admin_id)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {app.city || "Ikke angivet"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {app.years_experience} års erfaring
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {app.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {app.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{app.skills.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(app)}
                            >
                              Åben ansøgning
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(app.id)}
                              disabled={processingId === app.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRejectDialog({ open: true, applicationId: app.id })}
                              disabled={processingId === app.id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAssignDialog({ open: true, applicationId: app.id })}
                              disabled={processingId === app.id}
                              title="Videresend til anden admin"
                            >
                              <Forward className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {processedApplications.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tidligere ansøgninger</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {processedApplications.map((app) => (
                      <div key={app.id} className="p-4 opacity-60">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{app.name}</span>
                              <Badge variant={app.status === 'approved' ? 'default' : 'destructive'} className="text-xs">
                                {app.status === 'approved' ? 'Godkendt' : 'Afvist'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {app.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedApplication(app)}
                          >
                            Se detaljer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedApplication?.name}</DialogTitle>
            <DialogDescription>
              Ansøgning modtaget {selectedApplication && new Date(selectedApplication.created_at).toLocaleDateString('da-DK')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{selectedApplication.phone || "Ikke angivet"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lokation</p>
                  <p className="font-medium">{selectedApplication.city || "Ikke angivet"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Erfaring</p>
                  <p className="font-medium">{selectedApplication.years_experience} år</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Virksomhedstype</p>
                  <p className="font-medium">{selectedApplication.business_type === 'cvr' ? 'CVR (selvstændig)' : 'B-indkomst'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Kompetencer</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              {selectedApplication.education && Array.isArray(selectedApplication.education) && selectedApplication.education.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Uddannelse</p>
                  <div className="space-y-1">
                    {selectedApplication.education.map((edu: any, idx: number) => (
                      <p key={idx} className="text-sm">
                        {edu.school} ({edu.year}){edu.isAutodidact && " - Autodidakt"}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplication.portfolio_links && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Portfolio</p>
                  <a 
                    href={selectedApplication.portfolio_links} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline text-sm"
                  >
                    {selectedApplication.portfolio_links}
                  </a>
                </div>
              )}
            </div>
          )}

          {selectedApplication?.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                onClick={() => {
                  handleApprove(selectedApplication.id);
                  setSelectedApplication(null);
                }}
                disabled={processingId === selectedApplication.id}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Godkend
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setRejectDialog({ open: true, applicationId: selectedApplication.id });
                  setSelectedApplication(null);
                }}
                disabled={processingId === selectedApplication.id}
              >
                <X className="h-4 w-4 mr-2" />
                Afvis
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignDialog({ open: true, applicationId: selectedApplication.id });
                  setSelectedApplication(null);
                }}
                disabled={processingId === selectedApplication.id}
              >
                <Forward className="h-4 w-4 mr-2" />
                Videresend
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

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

      {/* Assign to Admin Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => {
        setAssignDialog({ open, applicationId: open ? assignDialog.applicationId : null });
        if (!open) setSelectedAdminId("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Videresend ansøgning</DialogTitle>
            <DialogDescription>
              Vælg hvilken admin der skal tage stilling til denne ansøgning.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg en admin" />
              </SelectTrigger>
              <SelectContent>
                {admins
                  .filter(admin => admin.id !== currentUserId)
                  .map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {(admin.name || admin.email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{admin.name || admin.email}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {admins.filter(a => a.id !== currentUserId).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Der er ingen andre admins at videresende til.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, applicationId: null })}>
              Annuller
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedAdminId || processingId !== null}
            >
              <Forward className="h-4 w-4 mr-2" />
              Videresend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
