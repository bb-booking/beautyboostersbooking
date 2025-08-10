import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const serviceTags = [
  "Makeupstyling", "Hårstyling", "Bryllup", "Konfirmation",
  "Film/TV", "SFX", "Paryk", "Teater", "Frisør", "Negle",
  "Events", "Makeup Kursus", "Spraytan"
];

const days = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

type OpeningHour = { enabled: boolean; from: string; to: string };

export default function SalonSignup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const total = 4;

  const [company, setCompany] = useState({
    company_name: "",
    cvr: "",
    industry: "",
    employees_count: 1,
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    zip: "",
  });

  const [services, setServices] = useState<string[]>([]);
  const [hours, setHours] = useState<Record<string, OpeningHour>>(
    Object.fromEntries(days.map(d => [d, { enabled: d !== "Søn", from: "10:00", to: "18:00" }]))
  );
  const [account, setAccount] = useState({ email: "", password: "" });

  const lookupCvr = async () => {
    if (!company.cvr) {
      toast({ title: "Mangler CVR", description: "Indtast et CVR-nummer" });
      return;
    }
    try {
      const res = await fetch(`https://cvrapi.dk/api?search=${company.cvr}&country=dk`);
      if (!res.ok) throw new Error("CVR opslag fejlede");
      const data = await res.json();
      setCompany(prev => ({
        ...prev,
        company_name: data?.name || prev.company_name,
        address: data?.address || prev.address,
        city: data?.city || prev.city,
        zip: data?.zipcode?.toString?.() || prev.zip,
        email: prev.email,
        phone: prev.phone,
        industry: data?.industrydesc || prev.industry,
      }));
      toast({ title: "CVR fundet", description: data?.name || "" });
    } catch (e: any) {
      toast({ title: "CVR ikke fundet", description: e.message, variant: "destructive" });
    }
  };

  const toggleService = (s: string) =>
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toOpeningHoursJson = () => {
    const result: Record<string, any> = {};
    for (const d of days) {
      const v = hours[d];
      result[d] = v.enabled ? { from: v.from, to: v.to } : null;
    }
    return result;
  };

  const submit = async () => {
    try {
      const redirectUrl = `${window.location.origin}/salon/login`;
      const { error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      localStorage.setItem('pending_role', 'salon');
      localStorage.setItem('pending_salon_profile', JSON.stringify({
        ...company,
        services,
        opening_hours: toOpeningHoursJson(),
        onboarding_complete: true,
      }));
      toast({ title: "Salon oprettet", description: "Tjek din e-mail for at bekræfte kontoen." });
      navigate("/salon/login");
    } catch (e: any) {
      toast({ title: "Fejl", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 space-y-6">
      <Helmet>
        <title>Opret Salon – Beauty Boosters</title>
        <meta name="description" content="Opret din salon på Beauty Boosters. Firmaoplysninger, services og åbningstider – færdiggør senere hvis ønsket." />
        <link rel="canonical" href={`${window.location.origin}/salon-signup`} />
      </Helmet>
      <h1 className="text-3xl font-bold">Opret Salon</h1>

      {/* Step 1: Firmaoplysninger */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Firmaoplysninger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CVR</Label>
                <div className="flex gap-2">
                  <Input value={company.cvr} onChange={(e) => setCompany({ ...company, cvr: e.target.value })} placeholder="12345678" />
                  <Button type="button" variant="outline" onClick={lookupCvr}>Slå op</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Firmanavn</Label>
                <Input value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Branche</Label>
                <Input value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Antal medarbejdere</Label>
                <Input type="number" min={1} value={company.employees_count} onChange={(e) => setCompany({ ...company, employees_count: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Salon e-mail</Label>
                <Input type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Adresse</Label>
                <div className="grid md:grid-cols-3 gap-3">
                  <Input placeholder="Adresse" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                  <Input placeholder="By" value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })} />
                  <Input placeholder="Postnr" value={company.zip} onChange={(e) => setCompany({ ...company, zip: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setStep(2)}>Fortsæt</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Vælg de services jeres salon tilbyder. Du kan udfylde senere.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {serviceTags.map(tag => (
                <Badge key={tag} variant={services.includes(tag) ? "default" : "outline"} className="cursor-pointer p-3 justify-center" onClick={() => toggleService(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Tilbage</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setServices([]); setStep(3); }}>Udfyld senere</Button>
                <Button onClick={() => setStep(3)}>Fortsæt</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Åbningstider */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Åbningstider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Angiv jeres åbningstider. Du kan udfylde senere.</p>
            <div className="space-y-3">
              {days.map((d) => (
                <div key={d} className="flex items-center gap-3">
                  <Label className="w-10">{d}</Label>
                  <input type="checkbox" checked={hours[d].enabled} onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], enabled: e.target.checked } })} />
                  <Input type="time" className="w-36" value={hours[d].from} onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], from: e.target.value } })} disabled={!hours[d].enabled} />
                  <span>-</span>
                  <Input type="time" className="w-36" value={hours[d].to} onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], to: e.target.value } })} disabled={!hours[d].enabled} />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Tilbage</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(4)}>Udfyld senere</Button>
                <Button onClick={() => setStep(4)}>Fortsæt</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Konto */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Opret konto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Login e-mail</Label>
                <Input type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Adgangskode</Label>
                <Input type="password" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>Tilbage</Button>
              <Button onClick={submit}>Opret Salon</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
