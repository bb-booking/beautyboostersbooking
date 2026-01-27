import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Trash2, FileText, Download, ExternalLink, BookOpen, Calendar, CheckCircle2, Loader2, Unlink, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";

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

  // Calendar integration state
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [googleCalendarEmail, setGoogleCalendarEmail] = useState<string | null>(null);
  const [appleCalendarConnected, setAppleCalendarConnected] = useState(false);
  const [appleCalendarEmail, setAppleCalendarEmail] = useState<string | null>(null);
  const [outlookCalendarConnected, setOutlookCalendarConnected] = useState(false);
  const [outlookCalendarEmail, setOutlookCalendarEmail] = useState<string | null>(null);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [connectingCalendarType, setConnectingCalendarType] = useState<'google' | 'apple' | 'outlook' | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boosterProfileId, setBoosterProfileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Fetch existing profile data from database
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('booster_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Fejl ved hentning af profil",
            description: error.message,
            variant: "destructive"
          });
        }

        if (profile) {
          setBoosterProfileId(profile.id);
          // Split name into first and last name
          const nameParts = (profile.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          setSettings(prev => ({
            ...prev,
            firstName,
            lastName,
            email: profile.email || user.email || '',
            phone: profile.phone || '',
            profileImage: profile.portfolio_image_url || null,
          }));
        } else {
          // No profile exists, use auth user email
          setSettings(prev => ({
            ...prev,
            email: user.email || '',
          }));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Ikke logget ind",
          description: "Log ind for at gemme indstillinger.",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      const fullName = `${settings.firstName} ${settings.lastName}`.trim();
      
      const updateData = {
        name: fullName,
        email: settings.email,
        phone: settings.phone,
        updated_at: new Date().toISOString(),
      };

      if (boosterProfileId) {
        // Update existing profile
        const { error } = await supabase
          .from('booster_profiles')
          .update(updateData)
          .eq('id', boosterProfileId);

        if (error) throw error;
      } else {
        // Create new profile if it doesn't exist
        const { data: newProfile, error } = await supabase
          .from('booster_profiles')
          .insert({
            ...updateData,
            user_id: user.id,
            location: 'København', // Default location
          })
          .select()
          .single();

        if (error) throw error;
        if (newProfile) {
          setBoosterProfileId(newProfile.id);
        }
      }

      toast({
        title: "Indstillinger gemt",
        description: "Dine profiloplysninger er blevet opdateret.",
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Fejl ved gemning",
        description: error.message || "Kunne ikke gemme indstillinger. Prøv igen.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Ugyldig filtype",
        description: "Vælg venligst en JPG, PNG eller GIF fil.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Filen er for stor",
        description: "Maksimal filstørrelse er 2MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Ikke logget ind",
          description: "Log ind for at uploade profilbillede.",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('booster-avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('booster-avatars')
        .getPublicUrl(fileName);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('booster_profiles')
        .update({ portfolio_image_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSettings(prev => ({ ...prev, profileImage: publicUrl }));
      
      toast({
        title: "Billede uploadet",
        description: "Dit profilbillede er blevet opdateret.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fejlede",
        description: error.message || "Kunne ikke uploade billede. Prøv igen.",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Slet konto",
      description: "Kontakt admin for at slette din konto permanent",
      variant: "destructive"
    });
  };

  const handleConnectCalendar = async (type: 'google' | 'apple' | 'outlook') => {
    setIsConnectingCalendar(true);
    setConnectingCalendarType(type);
    
    try {
      const functionNames: Record<string, string> = {
        google: 'google-calendar-auth',
        apple: 'apple-calendar-auth',
        outlook: 'outlook-calendar-auth'
      };
      const calendarNames: Record<string, string> = {
        google: 'Google',
        apple: 'Apple',
        outlook: 'Outlook'
      };
      
      const functionName = functionNames[type];
      const calendarName = calendarNames[type];
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'get_auth_url' }
      });
      
      if (error) {
        toast({
          title: `${calendarName} Kalender integration`,
          description: `${calendarName} integration er ved at blive konfigureret. Prøv igen senere.`,
          variant: "destructive"
        });
        return;
      }
      
      if (data?.authUrl) {
        window.open(data.authUrl, `${type}-auth`, 'width=500,height=600');
      }
    } catch (err) {
      toast({
        title: "Fejl",
        description: "Kunne ikke oprette forbindelse. Prøv igen senere.",
        variant: "destructive"
      });
    } finally {
      setIsConnectingCalendar(false);
      setConnectingCalendarType(null);
    }
  };

  const handleDisconnectCalendar = async (type: 'google' | 'apple' | 'outlook') => {
    try {
      const functionNames: Record<string, string> = {
        google: 'google-calendar-auth',
        apple: 'apple-calendar-auth',
        outlook: 'outlook-calendar-auth'
      };
      const calendarNames: Record<string, string> = {
        google: 'Google',
        apple: 'Apple',
        outlook: 'Outlook'
      };
      
      const functionName = functionNames[type];
      const calendarName = calendarNames[type];
      
      await supabase.functions.invoke(functionName, {
        body: { action: 'disconnect' }
      });
      
      if (type === 'google') {
        setGoogleCalendarConnected(false);
        setGoogleCalendarEmail(null);
      } else if (type === 'apple') {
        setAppleCalendarConnected(false);
        setAppleCalendarEmail(null);
      } else if (type === 'outlook') {
        setOutlookCalendarConnected(false);
        setOutlookCalendarEmail(null);
      }
      
      toast({
        title: "Kalender afbrudt",
        description: `Din ${calendarName} Kalender er nu afbrudt fra Beauty Boosters`,
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
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Indstillinger</h1>
        <p className="text-sm text-muted-foreground">Administrer din konto</p>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button variant="outline" onClick={handleImageButtonClick} disabled={uploadingImage}>
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {uploadingImage ? "Uploader..." : "Skift billede"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG eller GIF. Max 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kalender Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Forbind din private kalender for automatisk at blokere tidspunkter hvor du er optaget. 
              Dette forhindrer dobbeltbookinger og holder din kalender synkroniseret.
            </p>

            {/* Google Calendar */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Google Kalender</h4>
                  <p className="text-sm text-muted-foreground">Gmail, Google Workspace</p>
                </div>
                {googleCalendarConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Forbundet
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDisconnectCalendar('google')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnectCalendar('google')}
                    disabled={isConnectingCalendar && connectingCalendarType === 'google'}
                  >
                    {isConnectingCalendar && connectingCalendarType === 'google' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Forbind'
                    )}
                  </Button>
                )}
              </div>
              {googleCalendarConnected && googleCalendarEmail && (
                <p className="text-xs text-muted-foreground pl-13">
                  Forbundet: {googleCalendarEmail}
                </p>
              )}
            </div>

            {/* Apple/iCloud Calendar */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Apple Kalender</h4>
                  <p className="text-sm text-muted-foreground">iCloud, iPhone, Mac</p>
                </div>
                {appleCalendarConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Forbundet
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDisconnectCalendar('apple')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnectCalendar('apple')}
                    disabled={isConnectingCalendar && connectingCalendarType === 'apple'}
                  >
                    {isConnectingCalendar && connectingCalendarType === 'apple' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Forbind'
                    )}
                  </Button>
                )}
              </div>
              {appleCalendarConnected && appleCalendarEmail && (
                <p className="text-xs text-muted-foreground pl-13">
                  Forbundet: {appleCalendarEmail}
                </p>
              )}
            </div>

            {/* Outlook/Microsoft 365 Calendar */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0078D4]/10 flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M21.17 2.06h-8.7v4.65L17.34 9 21.17 6.71zm-10.7 0H2.76A.76.76 0 0 0 2 2.83v8.7a.76.76 0 0 0 .76.76h7.71zm10.7 5.64L17.34 10.28l-4.87-2.28v4.71l8.7-4.58c.12-.06.2-.18.2-.32zM12.47 12.47v8.7a.76.76 0 0 0 .76.76h7.94a.76.76 0 0 0 .76-.76V14zm-10.7 0H2v8.7c0 .42.34.76.76.76h7.71v-9.46zm10.7-2.18v-4.65L8.5 8 12.47 10.29z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Outlook Kalender</h4>
                  <p className="text-sm text-muted-foreground">Microsoft 365, Outlook.com</p>
                </div>
                {outlookCalendarConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Forbundet
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDisconnectCalendar('outlook')}
                      className="text-destructive hover:text-destructive"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnectCalendar('outlook')}
                    disabled={isConnectingCalendar && connectingCalendarType === 'outlook'}
                  >
                    {isConnectingCalendar && connectingCalendarType === 'outlook' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Forbind'
                    )}
                  </Button>
                )}
              </div>
              {outlookCalendarConnected && outlookCalendarEmail && (
                <p className="text-xs text-muted-foreground pl-13">
                  Forbundet: {outlookCalendarEmail}
                </p>
              )}
            </div>

            {/* Info section */}
            {(googleCalendarConnected || appleCalendarConnected || outlookCalendarConnected) ? (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Sådan virker det:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Private aftaler blokerer automatisk booking-tider</li>
                  <li>Kunder kan stadig sende forespørgsler til blokerede tider</li>
                  <li>Du kan manuelt acceptere eller afvise forespørgsler</li>
                  <li>Synkronisering sker automatisk hver time</li>
                </ul>
                {lastSyncTime && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Sidst synkroniseret: {lastSyncTime}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Fordele ved at forbinde:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Undgå dobbeltbookinger automatisk</li>
                  <li>Din private kalender forbliver privat</li>
                  <li>Fleksibilitet til at acceptere hasteforespørgsler</li>
                  <li>Synkroniserer i realtid</li>
                </ul>
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
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Gemmer..." : "Gem indstillinger"}
          </Button>
        </div>
      </div>
    </div>
  );
}