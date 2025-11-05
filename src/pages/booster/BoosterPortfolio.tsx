import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Instagram, X, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PortfolioItem {
  id: string;
  image_url: string;
  description: string;
  role: string;
  project_type: string;
  date: string;
}

const roleOptions = [
  "Makeup Artist",
  "Sminkeassistent", 
  "Key Makeup Artist",
  "Hair Stylist",
  "Nail Artist",
  "SFX Artist",
  "Beauty Consultant"
];

const projectTypes = [
  "Bryllup",
  "Event",
  "Film/TV",
  "Fotoshoot",
  "Teater",
  "Mode",
  "Commercial",
  "Privat"
];

export default function BoosterPortfolio() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockData: PortfolioItem[] = [
      {
        id: "1",
        image_url: "/lovable-uploads/1f1ad539-af97-40fc-9cac-5993cda97139.png",
        description: "Bryllup makeup for Karen & Michael",
        role: "Makeup Artist",
        project_type: "Bryllup",
        date: "2024-01-15"
      },
      {
        id: "2", 
        image_url: "/lovable-uploads/abbb29f7-ab5c-498e-b6d4-df1c1ed999fc.png",
        description: "Editorial shoot for Mode Magazine",
        role: "Key Makeup Artist",
        project_type: "Fotoshoot",
        date: "2024-01-10"
      }
    ];
    setPortfolioItems(mockData);
  }, []);

  const handleAddPortfolioItem = () => {
    toast({
      title: "Billede tilføjet",
      description: "Dit portfolio er blevet opdateret",
    });
    setIsAddDialogOpen(false);
  };

  const handleInstagramSync = () => {
    toast({
      title: "Instagram synkronisering",
      description: "Denne funktion kommer snart - forbind din Instagram konto for automatisk at synkronisere dine bedste billeder",
    });
  };

  const handleImageUpload = () => {
    toast({
      title: "Upload billede",
      description: "Vælg billeder fra din kamerarulle eller computer",
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio</h1>
          <p className="text-muted-foreground">Vis dine bedste arbejder frem</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleInstagramSync} className="w-full sm:w-auto">
            <Instagram className="h-4 w-4 mr-2" />
            Synk Instagram
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Camera className="h-4 w-4 mr-2" />
                Tilføj billede
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tilføj til portfolio</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-upload">Billede</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload fra kamerarulle eller computer
                    </p>
                    <Button variant="outline" onClick={handleImageUpload}>
                      <Upload className="h-4 w-4 mr-2" />
                      Vælg billede
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea 
                    id="description"
                    placeholder="Beskriv projektet eller looket..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Din rolle (valgfrit)</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Vælg din rolle" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project-type">Projekttype (valgfrit)</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Vælg projekttype" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleAddPortfolioItem} 
                    className="flex-1"
                  >
                    Tilføj til portfolio
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Annuller
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {portfolioItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Dit portfolio er tomt</p>
            <p className="text-sm text-muted-foreground">
              Upload billeder eller synkroniser med Instagram for at vise dine bedste arbejder
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={item.image_url} 
                  alt={item.description}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <p className="font-medium text-sm mb-2">{item.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {item.role && (
                    <Badge variant="secondary" className="text-xs">
                      {item.role}
                    </Badge>
                  )}
                  {item.project_type && (
                    <Badge variant="outline" className="text-xs">
                      {item.project_type}
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString('da-DK')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}