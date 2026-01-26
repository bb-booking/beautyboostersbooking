import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Upload, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    setImages(existingImages);
  }, [existingImages]);

  const uploadToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = bookingId ? `${bookingId}/${fileName}` : `temp/${fileName}`;

    const { data, error } = await supabase.storage
      .from('booking-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('booking-images')
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  };

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
        
        // Upload to Supabase storage
        const imageUrl = await uploadToStorage(file);
        
        if (imageUrl) {
          newImages.push(imageUrl);
        } else {
          toast.error(`Kunne ikke uploade ${file.name}`);
        }
      }
      
      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        toast.success(`${newImages.length} billede(r) uploadet`);
      }
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
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ImagePlus className="h-5 w-5" />
            Inspirationsbilleder
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload billeder af det look du ønsker, så din booster kan forberede sig.
          </p>
          
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
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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
                    alt={`Inspiration ${index + 1}`} 
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
              <p className="text-foreground">Ingen billeder tilføjet endnu</p>
              <p className="text-sm">Upload inspirationsbilleder til din styling</p>
            </div>
          )}
          
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

// Inline image upload component for embedding in forms
interface InlineImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  bookingId?: string;
}

export function InlineImageUpload({ images, onImagesChange, bookingId }: InlineImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToStorage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = bookingId ? `${bookingId}/${fileName}` : `temp/${fileName}`;

    const { data, error } = await supabase.storage
      .from('booking-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('booking-images')
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    
    try {
      const newImages: string[] = [];
      
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} er for stor (max 5MB)`);
          continue;
        }
        
        const imageUrl = await uploadToStorage(file);
        if (imageUrl) newImages.push(imageUrl);
      }
      
      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} billede(r) uploadet`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Kunne ikke uploade billeder');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Inspirationsbilleder (valgfrit)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= 5}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImagePlus className="h-4 w-4 mr-2" />}
          {uploading ? 'Uploader...' : 'Tilføj billeder'}
        </Button>
      </div>
      
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, index) => (
            <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border group">
              <img src={img} alt={`Inspiration ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Upload op til 5 billeder som inspiration til din booster (max 5MB pr. billede)
      </p>
    </div>
  );
}