import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Camera, Upload, X, Edit, Trash2, Plus, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PortfolioImage {
  id: string;
  image_url: string;
  description: string | null;
  role: string | null;
  project_type: string | null;
  created_at: string;
  sort_order: number | null;
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

interface PortfolioImageManagerProps {
  boosterId: string;
  images: PortfolioImage[];
  onImagesChange: () => void;
  isAdmin?: boolean;
}

export function PortfolioImageManager({ 
  boosterId, 
  images, 
  onImagesChange,
  isAdmin = false 
}: PortfolioImageManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newImage, setNewImage] = useState({
    description: "",
    role: "",
    project_type: "",
    imageFile: null as File | null,
    previewUrl: ""
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Billedet må maks være 5MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setNewImage(prev => ({ ...prev, imageFile: file, previewUrl }));
  };

  const handleUpload = async () => {
    if (!newImage.imageFile) {
      toast.error("Vælg venligst et billede");
      return;
    }

    setIsUploading(true);
    try {
      // Get current user for folder path
      const { data: { user } } = await supabase.auth.getUser();
      const folderPath = isAdmin ? `admin/${boosterId}` : user?.id || boosterId;
      
      const fileExt = newImage.imageFile.name.split('.').pop();
      const fileName = `${folderPath}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('booster-portfolio')
        .upload(fileName, newImage.imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('booster-portfolio')
        .getPublicUrl(fileName);

      // Insert into database
      const { error: insertError } = await supabase
        .from('booster_portfolio_images')
        .insert({
          booster_id: boosterId,
          image_url: publicUrl,
          description: newImage.description || null,
          role: newImage.role || null,
          project_type: newImage.project_type || null,
          sort_order: images.length
        });

      if (insertError) throw insertError;

      toast.success("Billede tilføjet til portfolio");
      setNewImage({ description: "", role: "", project_type: "", imageFile: null, previewUrl: "" });
      setIsAddDialogOpen(false);
      onImagesChange();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Kunne ikke uploade billede: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('booster_portfolio_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast.success("Billede slettet");
      onImagesChange();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error("Kunne ikke slette billede: " + error.message);
    }
  };

  const handleInstagramSync = () => {
    toast.info("Instagram synkronisering kommer snart!");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h3 className="font-semibold text-foreground">Portfolio</h3>
          <p className="text-sm text-muted-foreground">{images.length} billeder</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleInstagramSync}>
            <Instagram className="h-4 w-4 mr-1" />
            Synk
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tilføj
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tilføj til portfolio</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Billede</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {newImage.previewUrl ? (
                    <div className="mt-2 relative">
                      <img 
                        src={newImage.previewUrl} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => setNewImage(prev => ({ ...prev, imageFile: null, previewUrl: "" }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Klik for at vælge billede
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Beskrivelse (valgfrit)</Label>
                  <Textarea 
                    id="description"
                    placeholder="Beskriv projektet eller looket..."
                    value={newImage.description}
                    onChange={(e) => setNewImage(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Din rolle (valgfrit)</Label>
                  <Select 
                    value={newImage.role} 
                    onValueChange={(value) => setNewImage(prev => ({ ...prev, role: value }))}
                  >
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
                  <Label>Projekttype (valgfrit)</Label>
                  <Select 
                    value={newImage.project_type}
                    onValueChange={(value) => setNewImage(prev => ({ ...prev, project_type: value }))}
                  >
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
                    onClick={handleUpload} 
                    className="flex-1"
                    disabled={isUploading || !newImage.imageFile}
                  >
                    {isUploading ? "Uploader..." : "Tilføj til portfolio"}
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

      {images.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-1">Ingen portfolio billeder endnu</p>
            <p className="text-sm text-muted-foreground">
              Tilføj billeder for at vise dine bedste arbejder
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square overflow-hidden rounded-lg">
                <img 
                  src={image.image_url} 
                  alt={image.description || "Portfolio billede"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              
              {/* Overlay with delete button */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Slet billede?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Er du sikker på at du vil slette dette billede fra din portfolio?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuller</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(image.id)}>
                        Slet
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Info badges */}
              {(image.role || image.project_type) && (
                <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                  {image.role && (
                    <Badge variant="secondary" className="text-xs bg-background/80">
                      {image.role}
                    </Badge>
                  )}
                  {image.project_type && (
                    <Badge variant="outline" className="text-xs bg-background/80">
                      {image.project_type}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
