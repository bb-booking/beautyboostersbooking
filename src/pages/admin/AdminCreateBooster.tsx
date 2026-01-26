import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Plus, X, Mail, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Education {
  school: string;
  year: string;
  isAutodidact: boolean;
}

interface FormData {
  skills: string[];
  businessType: 'cvr' | 'cpr' | '';
  cvrNumber: string;
  cprNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  workRadius: number;
  primaryTransport: string;
  education: Education[];
  yearsExperience: number;
  portfolioLinks: string;
}

const skillOptions = [
  "Makeupstyling", "Hårstyling", "Bryllup", "Konfirmation", 
  "Film/TV", "SFX", "Paryk", "Teater", "Frisør", "Negle", 
  "Events", "Makeup Kursus", "Spraytan"
];

const AdminCreateBooster = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState<FormData>({
    skills: [],
    businessType: '',
    cvrNumber: '',
    cprNumber: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    latitude: null,
    longitude: null,
    workRadius: 50,
    primaryTransport: '',
    education: [],
    yearsExperience: 1,
    portfolioLinks: ''
  });

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Create the booster application with status 'pending_contract'
      const { error: appError } = await supabase
        .from('booster_applications')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          skills: formData.skills,
          business_type: formData.businessType,
          cvr_number: formData.cvrNumber || null,
          cpr_number: formData.cprNumber || null,
          address: formData.address,
          city: formData.city,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          work_radius: formData.workRadius,
          primary_transport: null,
          education: formData.education as any,
          years_experience: formData.yearsExperience,
          portfolio_links: formData.portfolioLinks,
          status: 'pending_contract'
        }]);

      if (appError) {
        console.error('Error creating booster application:', appError);
        throw new Error('Kunne ikke oprette booster: ' + appError.message);
      }

      // Send contract email to the booster
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: formData.email,
          subject: 'Din BeautyBoosters kontrakt venter på underskrift',
          html: `
            <h1>Velkommen til BeautyBoosters, ${formData.name}!</h1>
            <p>Din profil er blevet oprettet af en administrator.</p>
            <p>For at afslutte din tilmelding skal du:</p>
            <ol>
              <li>Klik på linket nedenfor for at oprette din adgangskode</li>
              <li>Log ind og underskriv din kontrakt</li>
            </ol>
            <p><a href="${window.location.origin}/booster/login" style="display: inline-block; background-color: #c9a87c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log ind og underskriv</a></p>
            <p>Hvis du har spørgsmål, kontakt os på louise@beautyboosters.dk</p>
            <p>Med venlig hilsen,<br/>BeautyBoosters teamet</p>
          `
        }
      });

      if (emailError) {
        console.error('Error sending contract email:', emailError);
        toast.error("Booster oprettet, men e-mail kunne ikke sendes. Kontakt boosteren manuelt.");
      } else {
        toast.success(`Booster oprettet! En e-mail med kontraktlink er sendt til ${formData.email}`);
      }
      
      navigate("/admin/boosters");
    } catch (e: any) {
      setIsSubmitting(false);
      console.error('Submission error:', e);
      toast.error(e.message || "Fejl ved oprettelse");
    }
  };

  const searchAddresses = async (query: string) => {
    if (query.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=5`
      );
      
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      address: value,
      postalCode: '',
      city: '',
      latitude: null,
      longitude: null
    }));

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchAddresses(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  const selectAddress = (suggestion: any) => {
    const addr = suggestion.adresse;
    const streetAddress = `${addr.vejnavn} ${addr.husnr}${addr.etage ? ', ' + addr.etage + '.' : ''}${addr.dør ? ' ' + addr.dør : ''}`;
    
    setFormData(prev => ({
      ...prev,
      address: streetAddress,
      postalCode: addr.postnr,
      city: addr.postnrnavn,
      latitude: 55.6761,
      longitude: 12.5683,
    }));

    setShowSuggestions(false);
    setAddressSuggestions([]);

    toast.success(`Adresse valgt: ${addr.postnr} ${addr.postnrnavn}`);
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1: return formData.skills.length > 0;
      case 2: return formData.businessType && (
        (formData.businessType === 'cvr' && formData.cvrNumber) ||
        (formData.businessType === 'cpr' && formData.cprNumber)
      );
      case 3: return formData.name && formData.email && formData.phone;
      case 4: return formData.address && formData.postalCode && formData.latitude !== null && formData.workRadius > 0;
      case 5: return formData.yearsExperience >= 0;
      default: return false;
    }
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', year: '', isAutodidact: false }]
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Boosterens kompetencer</h2>
              <p className="text-muted-foreground">Vælg de services boosteren tilbyder</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {skillOptions.map((skill) => (
                <Badge
                  key={skill}
                  variant={formData.skills.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer p-3 text-center justify-center hover:bg-primary/20"
                  onClick={() => handleSkillToggle(skill)}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Forretningstype</h2>
              <p className="text-muted-foreground">Er boosteren selvstændig eller ansat?</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent"
                   onClick={() => setFormData(prev => ({ ...prev, businessType: 'cvr' }))}>
                <input 
                  type="radio" 
                  checked={formData.businessType === 'cvr'}
                  onChange={() => setFormData(prev => ({ ...prev, businessType: 'cvr' }))}
                />
                <div>
                  <Label className="font-medium">Selvstændig (CVR)</Label>
                  <p className="text-sm text-muted-foreground">Har egen virksomhed</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent"
                   onClick={() => setFormData(prev => ({ ...prev, businessType: 'cpr' }))}>
                <input 
                  type="radio" 
                  checked={formData.businessType === 'cpr'}
                  onChange={() => setFormData(prev => ({ ...prev, businessType: 'cpr' }))}
                />
                <div>
                  <Label className="font-medium">B-lønnet (CPR)</Label>
                  <p className="text-sm text-muted-foreground">Modtager løn som ansat</p>
                </div>
              </div>

              {formData.businessType === 'cvr' && (
                <div className="space-y-2">
                  <Label htmlFor="cvr">CVR nummer</Label>
                  <Input
                    id="cvr"
                    placeholder="12345678"
                    value={formData.cvrNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, cvrNumber: e.target.value }))}
                  />
                </div>
              )}

              {formData.businessType === 'cpr' && (
                <div className="space-y-2">
                  <Label htmlFor="cpr">CPR nummer</Label>
                  <Input
                    id="cpr"
                    placeholder="123456-7890"
                    value={formData.cprNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, cprNumber: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Kontaktoplysninger</h2>
              <p className="text-muted-foreground">Indtast boosterens oplysninger</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fulde navn *</Label>
                <Input
                  id="name"
                  placeholder="Boosterens fulde navn"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="booster@email.dk"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Kontrakten sendes til denne email
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Telefonnummer"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Arbejdsområde</h2>
              <p className="text-muted-foreground">Hvor vil boosteren arbejde?</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <div className="relative">
                  <Input
                    id="address"
                    placeholder="Begynd at skrive adressen..."
                    value={formData.address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full p-3 text-left hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectAddress(suggestion)}
                        >
                          <p className="text-sm font-medium">{suggestion.tekst}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formData.postalCode && formData.latitude && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    {formData.postalCode} {formData.city}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Køreradius (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.workRadius}
                  onChange={(e) => setFormData(prev => ({ ...prev, workRadius: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-sm text-muted-foreground">
                  Hvor langt vil boosteren køre? ({formData.workRadius} km)
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Uddannelse og erfaring</h2>
              <p className="text-muted-foreground">Boosterens baggrund</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Års erfaring</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Uddannelser</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tilføj
                  </Button>
                </div>

                {formData.education.map((edu, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Uddannelse {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`autodidact-${index}`}
                        checked={edu.isAutodidact}
                        onCheckedChange={(checked) => 
                          updateEducation(index, 'isAutodidact', checked as boolean)
                        }
                      />
                      <Label htmlFor={`autodidact-${index}`} className="text-sm">
                        Autodidakt/selvlært
                      </Label>
                    </div>

                    {!edu.isAutodidact && (
                      <div className="space-y-2">
                        <Label htmlFor={`school-${index}`}>Skole/institution</Label>
                        <Input
                          id={`school-${index}`}
                          placeholder="Fx. Copenhagen Beauty School"
                          value={edu.school}
                          onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`year-${index}`}>
                        {edu.isAutodidact ? 'Beskrivelse' : 'Afgangsår'}
                      </Label>
                      <Input
                        id={`year-${index}`}
                        placeholder={edu.isAutodidact ? 'Selvlært siden 2020' : '2022'}
                        value={edu.year}
                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label htmlFor="portfolioLinks">Portfolio og sociale medier</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Links til boosterens arbejde
                  </p>
                </div>
                <Textarea
                  id="portfolioLinks"
                  placeholder="Instagram, Facebook, hjemmeside, etc."
                  value={formData.portfolioLinks}
                  onChange={(e) => setFormData(prev => ({ ...prev, portfolioLinks: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Kontrakt sendes via e-mail</p>
                      <p className="text-sm text-muted-foreground">
                        Når du klikker "Opret og send kontrakt", modtager boosteren en e-mail 
                        med et link til at logge ind og underskrive kontrakten.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/boosters")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Opret ny Booster</h1>
          <p className="text-muted-foreground">Trin {currentStep} af {totalSteps}</p>
        </div>
      </div>

      <Progress value={(currentStep / totalSteps) * 100} className="w-full" />

      <Card>
        <CardContent className="pt-6">
          {renderStep()}
          
          <div className="flex justify-between pt-6 mt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Tilbage
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                onClick={handleNext}
                disabled={!canProceedFromStep(currentStep)}
              >
                Næste
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!canProceedFromStep(currentStep) || isSubmitting}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isSubmitting ? "Opretter..." : "Opret og send kontrakt"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCreateBooster;
