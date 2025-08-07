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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  skills: string[];
  businessType: 'cvr' | 'cpr' | '';
  cvrNumber: string;
  cprNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  workRadius: number;
  contractAccepted: boolean;
}

const skillOptions = [
  "Makeupstyling", "Hårstyling", "Bryllup", "Konfirmation", 
  "Film/TV", "SFX", "Paryk", "Teater", "Frisør", "Negle", 
  "Events", "Makeup Kursus", "Spraytan"
];

const BoosterSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
    workRadius: 50,
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

  const handleSubmit = () => {
    if (!formData.contractAccepted) {
      toast({
        title: "Kontrakt skal accepteres",
        description: "Du skal acceptere kontrakten for at fortsætte.",
        variant: "destructive"
      });
      return;
    }

    // Here you would submit the form data
    toast({
      title: "Ansøgning sendt!",
      description: "Vi tager kontakt til dig inden for 2 hverdage.",
    });
    
    navigate("/");
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
      case 5: return formData.contractAccepted;
      default: return false;
    }
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
                  placeholder="12 34 56 78"
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
                <br />
                <p><strong>Aftale indgået:</strong> {new Date().toLocaleDateString('da-DK')}</p>
              </div>
              
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold">Hovepunkter:</h4>
                  <p><strong>1. Services:</strong> Du udfører beauty services på kunders adresser. Du er ansvarlig for transport og at møde rettidigt.</p>
                  
                  <p><strong>2. Betaling:</strong> Du får 60% af totalbeløbet uden moms. Udbetaling sker månedligt som {formData.businessType === 'cvr' ? 'faktura (send senest d. 28.)' : 'B-indkomst via lønseddel'}.</p>
                  
                  <p><strong>3. Forsikring:</strong> Du skal have gyldig ansvars- og arbejdsskadeforsikring.</p>
                  
                  <p><strong>4. Professionalisme:</strong> Lever høj kvalitet. Ved utilfredshed kan behandling kræves genudført gratis.</p>
                  
                  <p><strong>5. Konkurrence:</strong> Du må ikke kontakte BeautyBoosters' kunder direkte eller opfordre til direkte booking. Overtrædelse fører til øjeblikkelig opsigelse og bod på kr. 10.000 pr. kunde.</p>
                  
                  <p><strong>6. Sociale medier:</strong> Tag @beautyboostersdk når du poster om opgaver fra BeautyBoosters.</p>
                  
                  <p><strong>7. Sygdom:</strong> Meld afbud senest kl. 08.00 eller 2 timer før første kunde på tlf. 71786575.</p>
                  
                  <p><strong>8. Opsigelse:</strong> Begge parter kan opsige med løbende måned plus en måned.</p>
                  
                  <p><strong>9. Databeskyttelse:</strong> Du samtykker til at BeautyBoosters håndterer dine persondata i henhold til databeskyttelsesloven.</p>
                  
                  <p><strong>10. Tvister:</strong> Afgøres ved danske domstole efter dansk ret.</p>
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