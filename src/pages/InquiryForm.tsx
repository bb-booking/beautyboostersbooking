import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";

const InquiryForm = () => {
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  
  const [formData, setFormData] = useState({
    navn: "",
    email: "",
    telefon: "",
    virksomhed: "",
    projektType: "",
    startDato: "",
    slutDato: "",
    lokation: "",
    antalPersoner: "",
    budget: "",
    beskrivelse: "",
    specialeKrav: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.navn || !formData.email || !formData.telefon || !formData.beskrivelse) {
      toast.error("Udfyld venligst alle påkrævede felter");
      return;
    }

    try {
      // Here you would normally send the data to your backend
      console.log("Inquiry form data:", { serviceId, ...formData });
      
      toast.success("Din forespørgsel er sendt! Vi kontakter dig hurtigst muligt.");
      
      // Reset form
      setFormData({
        navn: "",
        email: "",
        telefon: "",
        virksomhed: "",
        projektType: "",
        startDato: "",
        slutDato: "",
        lokation: "",
        antalPersoner: "",
        budget: "",
        beskrivelse: "",
        specialeKrav: ""
      });
    } catch (error) {
      toast.error("Der opstod en fejl. Prøv igen senere.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link to="/services" className="inline-flex items-center text-primary hover:text-primary/80 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbage til services
        </Link>
        <h1 className="text-3xl font-bold">Send forespørgsel</h1>
        <p className="text-muted-foreground mt-2">
          Udfyld formularen nedenfor, så kontakter vi dig hurtigst muligt med et tilpasset tilbud.
        </p>
        <p className="text-muted-foreground mt-2">
          Hvis det haster, så ring til os på{" "}
          <a href="tel:+4571786575" className="text-primary hover:text-primary/80 underline">
            +45 71 78 65 75
          </a>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projektoplysninger</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Kontaktoplysninger */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kontaktoplysninger</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="navn">Navn *</Label>
                  <Input
                    id="navn"
                    value={formData.navn}
                    onChange={(e) => handleInputChange("navn", e.target.value)}
                    placeholder="Dit fulde navn"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="din@email.dk"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefon">Telefon *</Label>
                  <Input
                    id="telefon"
                    value={formData.telefon}
                    onChange={(e) => handleInputChange("telefon", e.target.value)}
                    placeholder="+45 12 34 56 78"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="virksomhed">Virksomhed</Label>
                  <Input
                    id="virksomhed"
                    value={formData.virksomhed}
                    onChange={(e) => handleInputChange("virksomhed", e.target.value)}
                    placeholder="Virksomhedsnavn (valgfrit)"
                  />
                </div>
              </div>
            </div>

            {/* Projektdetaljer */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Projektdetaljer</h3>
              
              <div>
                <Label htmlFor="projektType">Type projekt</Label>
                <Input
                  id="projektType"
                  value={formData.projektType}
                  onChange={(e) => handleInputChange("projektType", e.target.value)}
                  placeholder="F.eks. reklameshoot, bryllup, event"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDato">Start dato</Label>
                  <Input
                    id="startDato"
                    type="date"
                    value={formData.startDato}
                    onChange={(e) => handleInputChange("startDato", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="slutDato">Slut dato (hvis relevant)</Label>
                  <Input
                    id="slutDato"
                    type="date"
                    value={formData.slutDato}
                    onChange={(e) => handleInputChange("slutDato", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lokation">Lokation</Label>
                  <Input
                    id="lokation"
                    value={formData.lokation}
                    onChange={(e) => handleInputChange("lokation", e.target.value)}
                    placeholder="Adresse eller by"
                  />
                </div>
                <div>
                  <Label htmlFor="antalPersoner">Antal personer der skal styles</Label>
                  <Input
                    id="antalPersoner"
                    type="number"
                    value={formData.antalPersoner}
                    onChange={(e) => handleInputChange("antalPersoner", e.target.value)}
                    placeholder="F.eks. 5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="budget">Budget (valgfrit)</Label>
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  placeholder="F.eks. 15.000-25.000 DKK"
                />
              </div>
            </div>

            {/* Beskrivelse */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Projektbeskrivelse</h3>
              
              <div>
                <Label htmlFor="beskrivelse">Beskriv dit projekt *</Label>
                <Textarea
                  id="beskrivelse"
                  value={formData.beskrivelse}
                  onChange={(e) => handleInputChange("beskrivelse", e.target.value)}
                  placeholder="Fortæl os om dit projekt, hvilken stemning I går efter, om der er specielle krav til makeup/styling, tidslinje osv."
                  rows={5}
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialeKrav">Specielle krav eller ønsker</Label>
                <Textarea
                  id="specialeKrav"
                  value={formData.specialeKrav}
                  onChange={(e) => handleInputChange("specialeKrav", e.target.value)}
                  placeholder="F.eks. allergier, specielle produkter, temaer, SFX behov"
                  rows={3}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Send className="h-4 w-4 mr-2" />
              Send forespørgsel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InquiryForm;