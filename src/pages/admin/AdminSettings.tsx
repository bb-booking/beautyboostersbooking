import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, Settings, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const defaultSettings = {
  companyName: "Beauty Boosters",
  companyEmail: "hello@beautybooters.dk",
  companyPhone: "+45 71 78 65 75",
  companyAddress: "København, Danmark",
  companyDescription: "Danmarks bedste makeup artister og stylister til alle anledninger.",
  emailNotifications: true,
  autoConfirmBookings: false,
  allowOnlinePayments: true,
  businessHours: {
    weekdays: "09:00 - 18:00",
    weekends: "10:00 - 16:00"
  },
  bookingPolicy: "Bookinger kan aflyses op til 24 timer før aftalt tid.",
  cancellationFee: "25",
  socialLinks: {
    instagram: "@beautybooters",
    facebook: "Beauty Boosters",
    tiktok: "@beautybooters"
  }
};

const AdminSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("key, value")
        .eq("key", "general_settings")
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as typeof defaultSettings) });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // First check if setting exists
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("key", "general_settings")
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from("admin_settings")
          .update({ value: JSON.parse(JSON.stringify(settings)) })
          .eq("key", "general_settings");
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from("admin_settings")
          .insert([{ key: "general_settings", value: JSON.parse(JSON.stringify(settings)) }]);
        error = result.error;
      }

      if (error) throw error;
      toast.success("Indstillinger gemt!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Fejl ved gemning af indstillinger");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    setSettings(prev => {
      const parentObj = prev[parent as keyof typeof prev] as Record<string, any>;
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [key]: value
        }
      };
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2 shrink-0" />
          Indstillinger
        </h2>
        <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2 shrink-0" />
          {isLoading ? "Gemmer..." : "Gem ændringer"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Virksomhedsinformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Virksomhedsnavn</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => updateSetting("companyName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => updateSetting("companyEmail", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyPhone">Telefon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) => updateSetting("companyPhone", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="companyAddress">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => updateSetting("companyAddress", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="companyDescription">Beskrivelse</Label>
              <Textarea
                id="companyDescription"
                value={settings.companyDescription}
                onChange={(e) => updateSetting("companyDescription", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Forretningsindstillinger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email notifikationer</Label>
                  <p className="text-sm text-muted-foreground">
                    Modtag emails ved nye bookinger og forespørgsler
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoConfirmBookings">Auto-bekræft bookinger</Label>
                  <p className="text-sm text-muted-foreground">
                    Bekræft automatisk nye bookinger
                  </p>
                </div>
                <Switch
                  id="autoConfirmBookings"
                  checked={settings.autoConfirmBookings}
                  onCheckedChange={(checked) => updateSetting("autoConfirmBookings", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowOnlinePayments">Online betalinger</Label>
                  <p className="text-sm text-muted-foreground">
                    Tillad kunder at betale online
                  </p>
                </div>
                <Switch
                  id="allowOnlinePayments"
                  checked={settings.allowOnlinePayments}
                  onCheckedChange={(checked) => updateSetting("allowOnlinePayments", checked)}
                />
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weekdayHours">Åbningstider (hverdage)</Label>
                <Input
                  id="weekdayHours"
                  value={settings.businessHours.weekdays}
                  onChange={(e) => updateNestedSetting("businessHours", "weekdays", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="weekendHours">Åbningstider (weekend)</Label>
                <Input
                  id="weekendHours"
                  value={settings.businessHours.weekends}
                  onChange={(e) => updateNestedSetting("businessHours", "weekends", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Booking politikker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bookingPolicy">Aflysningspolitik</Label>
              <Textarea
                id="bookingPolicy"
                value={settings.bookingPolicy}
                onChange={(e) => updateSetting("bookingPolicy", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cancellationFee">Aflysningsgebyr (%)</Label>
              <Input
                id="cancellationFee"
                type="number"
                value={settings.cancellationFee}
                onChange={(e) => updateSetting("cancellationFee", e.target.value)}
                className="max-w-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Services & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Services og priser</span>
              <Button variant="outline" asChild>
                <Link to="/admin/services-editor">
                  Rediger alle services →
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Administrer alle services, priser, varigheder og billeder fra den dedikerede services editor.
            </p>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>Sociale medier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={settings.socialLinks.instagram}
                  onChange={(e) => updateNestedSetting("socialLinks", "instagram", e.target.value)}
                  placeholder="@brugernavn"
                />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={settings.socialLinks.facebook}
                  onChange={(e) => updateNestedSetting("socialLinks", "facebook", e.target.value)}
                  placeholder="Side navn"
                />
              </div>
              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={settings.socialLinks.tiktok}
                  onChange={(e) => updateNestedSetting("socialLinks", "tiktok", e.target.value)}
                  placeholder="@brugernavn"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;