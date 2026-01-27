import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const skillCategories = [
  {
    category: "Makeup",
    skills: ["Makeupstyling", "Bryllup", "Konfirmation", "Film/TV", "SFX", "Teater", "Events", "Makeup Kursus"]
  },
  {
    category: "Hår",
    skills: ["Hårstyling", "Paryk", "Frisør"]
  },
  {
    category: "Øvrige",
    skills: ["Negle", "Spraytan"]
  }
];

export default function BoosterSkills() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Mock initial data
  useEffect(() => {
    setSelectedSkills(["Makeupstyling", "Bryllup", "Hårstyling", "Events"]);
  }, []);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleSaveSkills = () => {
    toast({
      title: "Kompetencer opdateret",
      description: `Du har valgt ${selectedSkills.length} kompetencer`,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Kompetencer</h1>
        <p className="text-sm text-muted-foreground">
          Vælg de kompetencer du mestrer
        </p>
      </div>

      <div className="grid gap-6">
        {skillCategories.map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {category.skills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <div
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`
                        cursor-pointer rounded-md border-2 p-3 text-center transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary text-primary-foreground shadow-md' 
                          : 'border-border hover:border-primary hover:bg-accent'
                        }
                      `}
                    >
                      <span className="text-sm font-medium">{skill}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valgte kompetencer</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSkills.length === 0 ? (
            <p className="text-muted-foreground">Ingen kompetencer valgt endnu</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSkills.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                    <span className="ml-1 text-xs">×</span>
                  </Badge>
                ))}
              </div>
              <Button onClick={handleSaveSkills} className="w-full sm:w-auto">
                Gem kompetencer
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}