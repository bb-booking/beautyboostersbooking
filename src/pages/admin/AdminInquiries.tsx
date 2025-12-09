import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { Mail, Phone, Building, Calendar, MapPin, Users, DollarSign } from "lucide-react";

interface Inquiry {
  id: string;
  service_id: string | null;
  navn: string;
  email: string;
  telefon: string;
  virksomhed: string | null;
  projekt_type: string | null;
  start_dato: string | null;
  slut_dato: string | null;
  lokation: string | null;
  antal_personer: number | null;
  budget: string | null;
  beskrivelse: string;
  specielle_krav: string | null;
  status: string;
  created_at: string;
}

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching inquiries:", error);
        toast.error("Kunne ikke hente forespørgsler");
        return;
      }

      setInquiries(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Der opstod en fejl");
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        console.error("Error updating inquiry:", error);
        toast.error("Kunne ikke opdatere status");
        return;
      }

      setInquiries(prev => 
        prev.map(inquiry => 
          inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
        )
      );

      toast.success("Status opdateret");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Der opstod en fejl");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Ny";
      case "contacted": return "Kontaktet";
      case "in_progress": return "I gang";
      case "completed": return "Afsluttet";
      case "rejected": return "Afvist";
      default: return status;
    }
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    if (filter === "all") return true;
    return inquiry.status === filter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Forespørgsler</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold">Forespørgsler</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer efter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle forespørgsler</SelectItem>
            <SelectItem value="new">Nye</SelectItem>
            <SelectItem value="contacted">Kontaktet</SelectItem>
            <SelectItem value="in_progress">I gang</SelectItem>
            <SelectItem value="completed">Afsluttet</SelectItem>
            <SelectItem value="rejected">Afvist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredInquiries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {filter === "all" ? "Ingen forespørgsler endnu" : `Ingen ${getStatusText(filter).toLowerCase()} forespørgsler`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-lg">{inquiry.navn}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusColor(inquiry.status)}>
                      {getStatusText(inquiry.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(inquiry.created_at), "dd MMM yyyy", { locale: da })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${inquiry.email}`} className="text-foreground hover:underline">
                        {inquiry.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${inquiry.telefon}`} className="text-foreground hover:underline">
                        {inquiry.telefon}
                      </a>
                    </div>
                    {inquiry.virksomhed && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{inquiry.virksomhed}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {inquiry.projekt_type && (
                      <div className="text-sm">
                        <span className="font-medium">Type:</span> {inquiry.projekt_type}
                      </div>
                    )}
                    {inquiry.start_dato && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(inquiry.start_dato), "dd MMM yyyy", { locale: da })}</span>
                        {inquiry.slut_dato && (
                          <span>- {format(new Date(inquiry.slut_dato), "dd MMM yyyy", { locale: da })}</span>
                        )}
                      </div>
                    )}
                    {inquiry.lokation && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{inquiry.lokation}</span>
                      </div>
                    )}
                    {inquiry.antal_personer && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{inquiry.antal_personer} personer</span>
                      </div>
                    )}
                    {inquiry.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{inquiry.budget}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Beskrivelse:</span>
                    <p className="text-sm text-muted-foreground mt-1">{inquiry.beskrivelse}</p>
                  </div>
                  {inquiry.specielle_krav && (
                    <div>
                      <span className="font-medium text-sm">Specielle krav:</span>
                      <p className="text-sm text-muted-foreground mt-1">{inquiry.specielle_krav}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    value={inquiry.status}
                    onValueChange={(value) => updateInquiryStatus(inquiry.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Ny</SelectItem>
                      <SelectItem value="contacted">Kontaktet</SelectItem>
                      <SelectItem value="in_progress">I gang</SelectItem>
                      <SelectItem value="completed">Afsluttet</SelectItem>
                      <SelectItem value="rejected">Afvist</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="ml-auto space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${inquiry.email}?subject=Re: Din forespørgsel til Beauty Boosters`}>
                        Send email
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${inquiry.telefon}`}>Ring op</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminInquiries;