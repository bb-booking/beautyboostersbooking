import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const danishCities = [
  "København", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", 
  "Kolding", "Horsens", "Vejle", "Roskilde", "Herning", "Silkeborg",
  "Næstved", "Fredericia", "Viborg", "Køge", "Holstebro", "Taastrup"
];

const educationOptions = [
  "Kosmetolog",
  "Makeup Artist certificering",
  "Frisøruddannelsen", 
  "Beauty Therapy",
  "SFX Makeup",
  "Teatersminke",
  "Autodidakt",
  "Anden uddannelse"
];

export default function BoosterProfile() {
  const [profile, setProfile] = useState({
    yearsExperience: 3,
    education: ["Kosmetolog"],
    bio: "",
    coverageAreas: ["København", "Frederiksberg"],
    travelDistance: 50,
    acceptsTravel: true
  });

  // Mock initial data
  useEffect(() => {
    setProfile({
      yearsExperience: 5,
      education: ["Kosmetolog", "Makeup Artist certificering"],
      bio: "Jeg er en passioneret makeup artist med speciale i bryllup og events. Jeg elsker at fremhæve folks naturlige skønhed og skabe looks der får dem til at føle sig selvsikre og smukke.",
      coverageAreas: ["København", "Frederiksberg", "Gentofte"],
      travelDistance: 75,
      acceptsTravel: true
    });
  }, []);

  const handleSave = () => {
    toast({
      title: "Profil opdateret",
      description: "Dine profiloplysninger er blevet gemt",
    });
  };

  const handleAreaToggle = (area: string) => {
    setProfile(prev => ({
      ...prev,
      coverageAreas: prev.coverageAreas.includes(area)
        ? prev.coverageAreas.filter(a => a !== area)
        : [...prev.coverageAreas, area]
    }));
  };

  const handleEducationToggle = (education: string) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.includes(education)
        ? prev.education.filter(e => e !== education)
        : [...prev.education, education]
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Om mig</h1>
        <p className="text-sm text-muted-foreground">Fortæl kunder om dig</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Erfaring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="experience">Antal års erfaring</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                value={profile.yearsExperience}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  yearsExperience: parseInt(e.target.value) || 0
                }))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uddannelse & Certificeringer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {educationOptions.map((education) => (
                <div 
                  key={education}
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => handleEducationToggle(education)}
                >
                  <Checkbox 
                    checked={profile.education.includes(education)}
                    onChange={() => {}}
                  />
                  <Label className="cursor-pointer text-sm">{education}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Om mig</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="bio">Fortæl om dig selv</Label>
            <Textarea
              id="bio"
              placeholder="Skriv en kort beskrivelse af dig selv, din stil og hvad du brænder for..."
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                bio: e.target.value
              }))}
              className="mt-1 min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Denne tekst vil blive vist på din profil til potentielle kunder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geografisk dækning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Områder du dækker</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {danishCities.map((city) => (
                  <div 
                    key={city}
                    className="flex items-center space-x-2 cursor-pointer"
                    onClick={() => handleAreaToggle(city)}
                  >
                    <Checkbox 
                      checked={profile.coverageAreas.includes(city)}
                      onChange={() => {}}
                    />
                    <Label className="cursor-pointer text-sm">{city}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="travel-distance">Max kørselsdistance (km)</Label>
              <Input
                id="travel-distance"
                type="number"
                min="0"
                max="200"
                value={profile.travelDistance}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  travelDistance: parseInt(e.target.value) || 0
                }))}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={profile.acceptsTravel}
                onCheckedChange={(checked) => setProfile(prev => ({
                  ...prev,
                  acceptsTravel: checked as boolean
                }))}
              />
              <Label>Jeg accepterer kørselstillæg for afstande over 25 km</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Gem ændringer
          </Button>
        </div>
      </div>
    </div>
  );
}