import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Trash2, FileText, Download, ExternalLink, BookOpen, Calendar, CheckCircle2, Loader2, Unlink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  // Google Calendar integration state
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState<string | null>(null);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

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

  const handleConnectGoogleCalendar = async () => {
    setIsConnectingCalendar(true);
    
    try {
      // Check if Google OAuth is configured
      const { data, error } = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'get_auth_url' }
      });
      
      if (error) {
        // If the edge function doesn't exist yet, show a helpful message
        toast({
          title: "Google Kalender integration",
          description: "Google OAuth er ved at blive konfigureret. Prøv igen senere.",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.authUrl) {
        // Open OAuth flow in a popup
        window.open(data.authUrl, 'google-auth', 'width=500,height=600');
      }
    } catch (err) {
      toast({
        title: "Fejl",
        description: "Kunne ikke oprette forbindelse til Google. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      // Call edge function to revoke access
      await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'disconnect' }
      });
      
      setGoogleCalendarConnected(false);
      setGoogleCalendarEmail(null);
      setLastSyncTime(null);
      
      toast({
        title: "Kalender afbrudt",
        description: "Din Google Kalender er nu afbrudt fra Beauty Boosters",
      });
    } catch (err) {
      toast({
        title: "Fejl",
        description: "Kunne ikke afbryde forbindelsen. Prøv igen.",
        variant: "destructive"
      });
    }
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

        {/* Google Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Kalender Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Forbind din private Google Kalender for automatisk at blokere tidspunkter hvor du er optaget. 
              Dette forhindrer dobbeltbookinger og holder din kalender synkroniseret.
            </p>
            
            {googleCalendarConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-700 dark:text-green-400">Kalender forbundet</p>
                    <p className="text-sm text-green-600 dark:text-green-500">{googleCalendarEmail}</p>
                    {lastSyncTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sidst synkroniseret: {lastSyncTime}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDisconnectGoogleCalendar}
                    className="text-destructive hover:text-destructive"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Afbryd
                  </Button>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Sådan virker det:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Private aftaler blokerer automatisk booking-tider</li>
                    <li>Kunder kan stadig sende forespørgsler til blokerede tider</li>
                    <li>Du kan manuelt acceptere eller afvise forespørgsler</li>
                    <li>Synkronisering sker automatisk hver time</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={handleConnectGoogleCalendar}
                  disabled={isConnectingCalendar}
                  className="w-full sm:w-auto"
                >
                  {isConnectingCalendar ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Forbinder...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Forbind Google Kalender
                    </>
                  )}
                </Button>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Fordele ved at forbinde:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Undgå dobbeltbookinger automatisk</li>
                    <li>Din private kalender forbliver privat</li>
                    <li>Fleksibilitet til at acceptere hasteforespørgsler</li>
                    <li>Synkroniserer i realtid</li>
                  </ul>
                </div>
              </div>
            )}
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

        {/* Documents & Agreements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumenter & Aftaler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Samarbejdsaftale</p>
                  <p className="text-sm text-muted-foreground">Din kontrakt med Beauty Boosters</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Underskrevet
                </Badge>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Personalehåndbog</p>
                  <p className="text-sm text-muted-foreground">Retningslinjer og procedurer</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  Opdateret dec 2024
                </Badge>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">GDPR & Databehandling</p>
                  <p className="text-sm text-muted-foreground">Privatlivspolitik og databehandlingsaftale</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Accepteret
                </Badge>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
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