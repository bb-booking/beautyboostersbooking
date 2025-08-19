import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
  password: string;
  phone: string;
  address: string;
  workRadius: number;
  primaryTransport: string;
  education: Education[];
  yearsExperience: number;
  portfolioLinks: string;
  contractAccepted: boolean;
}

const skillOptions = [
  "Makeupstyling", "Hårstyling", "Bryllup", "Konfirmation", 
  "Film/TV", "SFX", "Paryk", "Teater", "Frisør", "Negle", 
  "Events", "Makeup Kursus", "Spraytan"
];

const transportOptions = [
  "Cykel", "Offentlig transport", "Bil", "Flere forskellige"
];

const BoosterSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;
  
  const [formData, setFormData] = useState<FormData>({
    skills: [],
    businessType: '',
    cvrNumber: '',
    cprNumber: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    workRadius: 50,
    primaryTransport: '',
    education: [],
    yearsExperience: 1,
    portfolioLinks: '',
    contractAccepted: false
  });

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
    if (!formData.contractAccepted) {
      toast({
        title: "Kontrakt skal accepteres",
        description: "Du skal acceptere kontrakten for at fortsætte.",
        variant: "destructive"
      });
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/booster/login`;
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { emailRedirectTo: redirectUrl }
      });
      if (error) throw error;

      // Markér at brugeren skal have booster-rolle ved første login
      localStorage.setItem('pending_role', 'booster');

      toast({
        title: "Ansøgning sendt!",
        description: "Tjek din e-mail for at bekræfte din konto."
      });
      navigate("/booster/login");
    } catch (e: any) {
      toast({ title: "Fejl ved oprettelse", description: e.message, variant: "destructive" });
    }
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1: return formData.skills.length > 0;
      case 2: return formData.businessType && (
        (formData.businessType === 'cvr' && formData.cvrNumber) ||
        (formData.businessType === 'cpr' && formData.cprNumber)
      );
      case 3: return formData.name && formData.email && formData.phone;
      case 4: return formData.address && formData.workRadius > 0;
      case 5: return formData.primaryTransport;
      case 6: return formData.yearsExperience > 0; // Erfaring krævet, uddannelser er valgfrie
      case 7: return formData.contractAccepted;
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
              <h2 className="text-2xl font-bold mb-2">Dine kompetencer</h2>
              <p className="text-muted-foreground">Vælg de services du tilbyder</p>
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
              <h2 className="text-2xl font-bold mb-2">Forretningstype</h2>
              <p className="text-muted-foreground">Er du selvstændig eller ansat?</p>
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
                  <p className="text-sm text-muted-foreground">Du har egen virksomhed</p>
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
                  <p className="text-sm text-muted-foreground">Du modtager løn som ansat</p>
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
              <h2 className="text-2xl font-bold mb-2">Kontaktoplysninger</h2>
              <p className="text-muted-foreground">Indtast dine personlige oplysninger</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fulde navn</Label>
                <Input
                  id="name"
                  placeholder="Dit fulde navn"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.dk"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Dit telefonnummer"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Adgangskode</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Vælg en adgangskode"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Arbejdsområde</h2>
              <p className="text-muted-foreground">Hvor vil du gerne arbejde?</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  placeholder="Din adresse"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Køreradius (km)</Label>
                <div className="space-y-2">
                  <Input
                    id="radius"
                    type="number"
                    min="1"
                    max="200"
                    value={formData.workRadius}
                    onChange={(e) => setFormData(prev => ({ ...prev, workRadius: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Hvor langt vil du køre fra din adresse? ({formData.workRadius} km)
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Transport</h2>
              <p className="text-muted-foreground">Hvad er dit primære transportmiddel?</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vi bruger denne information til at beregne rejsetid mellem kunder og optimere din kalender.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {transportOptions.map((transport) => (
                  <Badge
                    key={transport}
                    variant={formData.primaryTransport === transport ? "default" : "outline"}
                    className="cursor-pointer p-3 text-center justify-center hover:bg-primary/20"
                    onClick={() => setFormData(prev => ({ ...prev, primaryTransport: transport }))}
                  >
                    {transport}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Uddannelse og erfaring</h2>
              <p className="text-muted-foreground">Fortæl os om din baggrund</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Hvor mange års erfaring har du?</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Uddannelser og certificeringer (valgfri)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addEducation}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tilføj uddannelse
                  </Button>
                </div>
                
                {formData.education.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Ingen uddannelser tilføjet endnu.</p>
                    <p className="text-sm mt-2">Klik "Tilføj uddannelse" for at tilføje din baggrund eller certificeringer.</p>
                  </div>
                )}

                {formData.education.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Uddannelse {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
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
                        {edu.isAutodidact ? 'Beskrivelse af erfaring' : 'Afgangsår eller periode'}
                      </Label>
                      <Input
                        id={`year-${index}`}
                        placeholder={edu.isAutodidact ? 'Fx. Selvlært gennem tutorials og praksis siden 2020' : 'Fx. 2022 eller 2020-2022'}
                        value={edu.year}
                        onChange={(e) => updateEducation(index, 'year', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Portfolio Links Section */}
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label htmlFor="portfolioLinks">Portfolio og sociale medier</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tilføj links til dit arbejde så vi kan se dine færdigheder (Instagram, Facebook, hjemmeside, etc.)
                  </p>
                </div>
                <Textarea
                  id="portfolioLinks"
                  placeholder="Skriv din ig/fb/web/link til portfolio"
                  value={formData.portfolioLinks}
                  onChange={(e) => setFormData(prev => ({ ...prev, portfolioLinks: e.target.value }))}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Kontrakt</h2>
              <p className="text-muted-foreground">Læs og accepter vores kontrakt</p>
            </div>
            
            <div className="border rounded-lg p-4 h-80 overflow-y-auto bg-muted/50">
              <h3 className="font-semibold mb-2">BeautyBoosters Samarbejdsaftale</h3>
              <div className="text-xs text-muted-foreground mb-4">
                <p><strong>PARTER:</strong></p>
                <p>BeautyBoosters ApS, CVR-nr. 40884505</p>
                <p>Studiestræde 31C, 1455 København</p>
                <p>Kontakt: Louise Bencard, +4571786575, louise@beautyboosters.dk</p>
                <br />
                <p><strong>LEVERANDØR:</strong></p>
                <p>Navn: {formData.name}</p>
                <p>Email: {formData.email}</p>
                <p>Telefon: {formData.phone}</p>
                <p>Adresse: {formData.address}</p>
                <p>{formData.businessType === 'cvr' ? `CVR-nummer: ${formData.cvrNumber}` : `CPR-nummer: ${formData.cprNumber}`}</p>
                <p>Primært transportmiddel: {formData.primaryTransport}</p>
                <p>Års erfaring: {formData.yearsExperience}</p>
                {formData.education.length > 0 && (
                  <div>
                    <p><strong>Uddannelser:</strong></p>
                    {formData.education.map((edu, index) => (
                      <p key={index}>
                        {edu.isAutodidact ? 'Autodidakt' : edu.school} - {edu.year}
                      </p>
                    ))}
                  </div>
                )}
                <br />
                <p><strong>Aftale indgået:</strong> {new Date().toLocaleDateString('da-DK')}</p>
              </div>
              
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold">Væsentlige bestemmelser:</h4>
                  
                  <p><strong>1. Services og transport:</strong> Du udfører beauty services på kunders adresser. Du vælger selv transportmiddel (cykel, offentlig transport, bil) og betaler alle omkostninger forbundet hermed. Du er ansvarlig for at møde rettidigt og skal tage højde for parkering, billet eller pendlerkort.</p>
                  
                  <p><strong>2. Kørselsgebyr og radius:</strong> Kunder udenfor din valgte køreradius kan ikke lave øjeblikkelige bookinger, men skal sende forespørgsler. Der kan blive pålagt kørselsgebyr for kunder udenfor din radius efter aftale.</p>
                  
                  <p><strong>3. Bøder og afgifter:</strong> Hvis du får parkerings- eller transportbøder under udførelse af opgaver, er det BeautyBoosters økonomisk uvedkommende. Du bærer selv alle risici forbundet med dit valgte transportmiddel.</p>
                  
                  <p><strong>4. Betaling:</strong> Du får 60% af totalbeløbet uden moms. Udbetaling sker månedligt som {formData.businessType === 'cvr' ? 'faktura (send senest d. 28.)' : 'B-indkomst via lønseddel'}. Ved utilfredshed hvor kunden ikke betaler grundet bevist forsømmelighed, modtager du ikke løn.</p>
                  
                  <p><strong>5. Forsikring og ansvar:</strong> Du skal have gyldig ansvars-, ulykke- og arbejdsskadeforsikring. Ved tab eller tyveri af udstyr udleveret af BeautyBoosters skal dette dækkes af din forsikring. Du hæfter personligt hvis du ikke er forsikret.</p>
                  
                  <p><strong>6. Professionalisme:</strong> Lever høj kvalitet og engagement. Ved utilfredshed kan behandling kræves genudført gratis. Ved utilfredsstillende udførelse forbeholder BeautyBoosters sig ret til at opsige samarbejdet øjeblikkeligt.</p>
                  
                  <p><strong>7. Konkurrenceklausul:</strong> Du må ikke kontakte BeautyBoosters' kunder direkte, dele kontaktoplysninger eller opfordre til direkte booking. Dette gælder alle kunder du har arbejdet for gennem BeautyBoosters. Overtrædelse fører til øjeblikkelig opsigelse og bod på kr. 10.000 pr. kunde.</p>
                  
                  <p><strong>8. Sociale medier:</strong> Tag @beautyboostersdk når du poster om opgaver fra BeautyBoosters. Kunder må gerne skrive "Lavet af [dit navn] fra @beautyboostersdk" når de tagger dig. Du må ikke opfordre kunder til at tagge dig direkte.</p>
                  
                  <p><strong>9. Sygdom og afbud:</strong> Meld afbud senest kl. 08.00 eller 2 timer før første kunde på tlf. 71786575. Ved gentagne forsinkelser forbeholder BeautyBoosters sig ret til at ophøre samarbejdet. Du har ikke ret til løn under sygdom.</p>
                  
                  <p><strong>10. Misligholdelse:</strong> Ved væsentlig eller gentagen misligholdelse kan aftalen ophæves efter skriftligt påkrav med 10 dages afhjælpningsfrist. Hver part kan kræve erstatning for direkte dokumenterbare tab.</p>
                  
                  <p><strong>11. Opsigelse:</strong> Begge parter kan opsige med løbende måned plus en måned. Opsigelse sker skriftligt via e-mail.</p>
                  
                  <p><strong>12. Databeskyttelse:</strong> Du samtykker til at BeautyBoosters håndterer dine persondata i henhold til databeskyttelsesloven. Dette inkluderer navn, adresse, e-mail, telefon, bank- og CPR/CVR-information.</p>
                  
                  <p><strong>13. Tvister:</strong> Afgøres ved danske domstole efter dansk ret.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contract"
                checked={formData.contractAccepted}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, contractAccepted: checked as boolean }))
                }
              />
              <Label htmlFor="contract" className="text-sm">
                Jeg har læst og accepterer kontrakten
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Bliv BeautyBooster</CardTitle>
              <span className="text-sm text-muted-foreground">
                Trin {currentStep} af {totalSteps}
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="w-full" />
          </CardHeader>
          
          <CardContent>
            {renderStep()}
            
            <div className="flex justify-between pt-6">
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
                  disabled={!canProceedFromStep(currentStep)}
                >
                  Send ansøgning
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BoosterSignup;