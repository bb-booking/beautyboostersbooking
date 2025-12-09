import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Upload, Camera } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingImages?: string[];
  onImagesChange: (images: string[]) => void;
  bookingId?: string;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  existingImages = [],
  onImagesChange,
  bookingId
}: ImageUploadDialogProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    
    try {
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} er ikke et billede`);
          continue;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} er for stor (max 5MB)`);
          continue;
        }
        
        // Convert to base64 for preview (in production, upload to storage)
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        newImages.push(base64);
      }
      
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      toast.success(`${newImages.length} billede(r) tilføjet`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Kunne ikke uploade billeder');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  const handleSave = () => {
    onImagesChange(images);
    onOpenChange(false);
    toast.success('Billeder gemt');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Look billeder
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload buttons */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" />
              Vælg billeder
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
              Tag foto
            </Button>
          </div>
          
          {/* Image grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
                  <img 
                    src={img} 
                    alt={`Look ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              <ImagePlus className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Ingen billeder tilføjet endnu</p>
              <p className="text-sm">Upload look-inspiration eller resultater</p>
            </div>
          )}
          
          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            Tilføj billeder af det ønskede look, inspirationsbilleder eller resultater fra behandlingen.
          </p>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuller
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? 'Uploader...' : 'Gem billeder'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
