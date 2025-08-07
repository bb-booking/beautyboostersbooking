import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BoosterSettings {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string | null;

  // Financial Info
  accountType: 'cpr' | 'cvr';
  cprNumber: string;
  cvrNumber: string;
  accountNumber: string;
  regNumber: string;

  // Notification Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  jobAlerts: boolean;
  marketingEmails: boolean;

  // Privacy
  profileVisible: boolean;
  showRating: boolean;
}

export default function BoosterSettings() {
  const [settings, setSettings] = useState<BoosterSettings>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: null,
    accountType: 'cpr',
    cprNumber: "",
    cvrNumber: "",
    accountNumber: "",
    regNumber: "",
    emailNotifications: true,
    smsNotifications: true,
    jobAlerts: true,
    marketingEmails: false,
    profileVisible: true,
    showRating: true,
  });

  // Mock initial data
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      firstName: "Anna",
      lastName: "Nielsen",
      email: "anna.nielsen@example.com",
      phone: "+45 12 34 56 78",
      accountNumber: "1234567890",
      regNumber: "1234",
      cprNumber: "123456-7890"
    }));
  }, []);

  const handleSave = () => {
    toast({
      title: "Indstillinger gemt",
      description: "Dine indstillinger er blevet opdateret",
    });
  };

  const handleImageUpload = () => {
    toast({
      title: "Upload profilbillede",
      description: "Vælg et nyt profilbillede fra din enhed",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Slet konto",
      description: "Kontakt admin for at slette din konto permanent",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Indstillinger</h1>
        <p className="text-muted-foreground">Administrer din profil og kontooplysninger</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profiloplysninger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={settings.profileImage || ""} />
                <AvatarFallback className="text-lg">
                  {settings.firstName.charAt(0)}{settings.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" onClick={handleImageUpload}>
                  <Camera className="h-4 w-4 mr-2" />
                  Skift billede
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG eller GIF. Max 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Fornavn</Label>
                <Input
                  id="firstName"
                  value={settings.firstName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    firstName: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Efternavn</Label>
                <Input
                  id="lastName"
                  value={settings.lastName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    lastName: e.target.value
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  phone: e.target.value
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Økonomi & Betaling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kontotype</Label>
              <Select
                value={settings.accountType}
                onValueChange={(value: 'cpr' | 'cvr') => setSettings(prev => ({
                  ...prev,
                  accountType: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpr">CPR (B-lønnet)</SelectItem>
                  <SelectItem value="cvr">CVR (Selvstændig)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.accountType === 'cpr' ? (
              <div>
                <Label htmlFor="cprNumber">CPR-nummer</Label>
                <Input
                  id="cprNumber"
                  placeholder="123456-7890"
                  value={settings.cprNumber}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cprNumber: e.target.value
                  }))}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="cvrNumber">CVR-nummer</Label>
                <Input
                  id="cvrNumber"
                  placeholder="12345678"
                  value={settings.cvrNumber}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cvrNumber: e.target.value
                  }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="regNumber">Registreringsnummer</Label>
                <Input
                  id="regNumber"
                  placeholder="1234"
                  value={settings.regNumber}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    regNumber: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Kontonummer</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={settings.accountNumber}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    accountNumber: e.target.value
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notifikationer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>E-mail notifikationer</Label>
                <p className="text-sm text-muted-foreground">
                  Modtag vigtige opdateringer via e-mail
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  emailNotifications: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS notifikationer</Label>
                <p className="text-sm text-muted-foreground">
                  Modtag jobalarmer og påmindelser via SMS
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  smsNotifications: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Job alarmer</Label>
                <p className="text-sm text-muted-foreground">
                  Få besked når nye jobs matcher dine kompetencer
                </p>
              </div>
              <Switch
                checked={settings.jobAlerts}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  jobAlerts: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Marketing e-mails</Label>
                <p className="text-sm text-muted-foreground">
                  Modtag nyheder og tilbud fra Beauty Boosters
                </p>
              </div>
              <Switch
                checked={settings.marketingEmails}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  marketingEmails: checked
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privatliv</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Synlig profil</Label>
                <p className="text-sm text-muted-foreground">
                  Gør din profil synlig for kunder
                </p>
              </div>
              <Switch
                checked={settings.profileVisible}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  profileVisible: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Vis bedømmelse</Label>
                <p className="text-sm text-muted-foreground">
                  Vis din bedømmelse på din profil
                </p>
              </div>
              <Switch
                checked={settings.showRating}
                onCheckedChange={(checked) => setSettings(prev => ({
                  ...prev,
                  showRating: checked
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Farlig zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Slet konto</Label>
                <p className="text-sm text-muted-foreground">
                  Permanent sletning af din konto og alle data
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Slet konto
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Gem indstillinger
          </Button>
        </div>
      </div>
    </div>
  );
}