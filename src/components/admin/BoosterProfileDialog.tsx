import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, MapPin, Calendar, Phone, Mail, Briefcase, Pencil, Trash2, Save, X, Upload, Heart, ExternalLink } from "lucide-react";
import { PortfolioImageManager, type PortfolioImage } from "@/components/portfolio/PortfolioImageManager";

interface BoosterProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  hourly_rate: number;
  rating: number;
  review_count: number;
  years_experience: number;
  is_available: boolean;
  bio?: string;
  portfolio_image_url?: string | null;
  email?: string | null;
  phone?: string | null;
  employment_type?: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  booking: {
    service_name: string;
    customer_name: string | null;
  } | null;
}

interface BoosterProfileDialogProps {
  booster: BoosterProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoosterUpdated?: () => void;
  onBoosterDeleted?: () => void;
}

const skillOptions = [
  "Makeupstyling", "Hårstyling", "Bryllup", "Konfirmation", 
  "Film/TV", "SFX", "Paryk", "Teater", "Frisør", "Negle", 
  "Events", "Makeup Kursus", "Spraytan", "Makeup artist"
];

export const BoosterProfileDialog = ({ 
  booster, 
  open, 
  onOpenChange, 
  onBoosterUpdated,
  onBoosterDeleted 
}: BoosterProfileDialogProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    specialties: [] as string[],
    years_experience: 0,
    hourly_rate: 0,
    is_available: true,
    employment_type: "freelancer",
    portfolio_image_url: ""
  });

  useEffect(() => {
    if (booster && open) {
      fetchReviews(booster.id);
      fetchFavoritesCount(booster.id);
      fetchPortfolioImages(booster.id);
      setEditForm({
        name: booster.name || "",
        email: booster.email || "",
        phone: booster.phone || "",
        location: booster.location || "",
        bio: booster.bio || "",
        specialties: booster.specialties || [],
        years_experience: booster.years_experience || 0,
        hourly_rate: booster.hourly_rate || 0,
        is_available: booster.is_available ?? true,
        employment_type: booster.employment_type || "freelancer",
        portfolio_image_url: booster.portfolio_image_url || ""
      });
      setIsEditing(false);
    }
  }, [booster, open]);

  const fetchPortfolioImages = async (boosterId: string) => {
    try {
      const { data, error } = await supabase
        .from('booster_portfolio_images')
        .select('*')
        .eq('booster_id', boosterId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPortfolioImages(data || []);
    } catch (error) {
      console.error('Error fetching portfolio images:', error);
    }
  };

  const fetchFavoritesCount = async (boosterId: string) => {
    try {
      const { count, error } = await supabase
        .from('customer_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('booster_id', boosterId);

      if (error) throw error;
      setFavoritesCount(count || 0);
    } catch (error) {
      console.error('Error fetching favorites count:', error);
    }
  };

  const fetchReviews = async (boosterId: string) => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('booking_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          booking:bookings(service_name, customer_name)
        `)
        .eq('booster_id', boosterId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !booster) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Billedet må maks være 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${booster.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('booster-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('booster-avatars')
        .getPublicUrl(fileName);

      setEditForm(prev => ({ ...prev, portfolio_image_url: publicUrl }));
      toast.success("Billede uploadet");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Kunne ikke uploade billede: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!booster) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('booster_profiles')
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          location: editForm.location,
          bio: editForm.bio,
          specialties: editForm.specialties,
          years_experience: editForm.years_experience,
          hourly_rate: editForm.hourly_rate,
          is_available: editForm.is_available,
          employment_type: editForm.employment_type,
          portfolio_image_url: editForm.portfolio_image_url
        })
        .eq('id', booster.id);

      if (error) throw error;

      toast.success("Booster opdateret");
      setIsEditing(false);
      onBoosterUpdated?.();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error("Kunne ikke gemme: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!booster) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('booster_profiles')
        .delete()
        .eq('id', booster.id);

      if (error) throw error;

      toast.success("Booster slettet");
      onOpenChange(false);
      onBoosterDeleted?.();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error("Kunne ikke slette: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setEditForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
      />
    ));
  };

  if (!booster) return null;

  const displayData = isEditing ? editForm : {
    ...booster,
    portfolio_image_url: booster.portfolio_image_url || ""
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Booster Profil</DialogTitle>
              <DialogDescription>
                {isEditing ? "Rediger boosterens oplysninger" : "Se fuld profil, kompetencer og anmeldelser"}
              </DialogDescription>
            </div>
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Annuller
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? "Gemmer..." : "Gem"}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6">
            {/* Header with photo and basic info */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={displayData.portfolio_image_url || undefined} alt={displayData.name} />
                    <AvatarFallback className="text-2xl">
                      {displayData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="flex items-center gap-2 mt-3">
                    <Switch
                      checked={editForm.is_available}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_available: checked }))}
                    />
                    <span className="text-sm">{editForm.is_available ? 'Tilgængelig' : 'Ikke tilgængelig'}</span>
                  </div>
                ) : (
                  <Badge 
                    className={`mt-3 ${displayData.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {displayData.is_available ? 'Tilgængelig' : 'Ikke tilgængelig'}
                  </Badge>
                )}
              </div>

              <div className="flex-1 space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Navn</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Lokation</Label>
                      <Input
                        id="location"
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="F.eks. København, Aarhus..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="years">Års erfaring</Label>
                        <Input
                          id="years"
                          type="number"
                          min="0"
                          value={editForm.years_experience}
                          onChange={(e) => setEditForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="employment">Ansættelsestype</Label>
                        <Select
                          value={editForm.employment_type}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, employment_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="freelancer">Freelancer (B-lønnet)</SelectItem>
                            <SelectItem value="cvr">CVR-lønnet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-foreground">{displayData.name}</h2>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/stylists/${booster.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Gå til profil
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{displayData.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{displayData.years_experience} års erfaring</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-foreground font-medium">{booster.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-muted-foreground">({booster.review_count || 0} anmeldelser)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        <span className="text-foreground font-medium">{favoritesCount}</span>
                        <span className="text-muted-foreground">favoritter</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">
                      {displayData.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{displayData.email}</span>
                        </div>
                      )}
                      {displayData.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{displayData.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{booster.employment_type === 'cvr' ? 'CVR-lønnet' : 'Freelancer (B-lønnet)'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            <Separator />
            <div>
              <h3 className="font-semibold text-foreground mb-2">Om {displayData.name}</h3>
              {isEditing ? (
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Skriv en beskrivelse af boosteren..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {displayData.bio || "Ingen beskrivelse endnu"}
                </p>
              )}
            </div>

            {/* Specialties/Competencies */}
            <Separator />
            <div>
              <h3 className="font-semibold text-foreground mb-3">Kompetencer & Specialer</h3>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <Badge
                      key={skill}
                      variant={editForm.specialties.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => toggleSpecialty(skill)}
                    >
                      {skill}
                      {editForm.specialties.includes(skill) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <>
                  {(displayData.specialties?.length || 0) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {displayData.specialties?.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen specialer registreret</p>
                  )}
                </>
              )}
            </div>

            {/* Portfolio Section */}
            <Separator />
            <PortfolioImageManager
              boosterId={booster.id}
              images={portfolioImages}
              onImagesChange={() => fetchPortfolioImages(booster.id)}
              isAdmin={true}
            />

            {/* Reviews - only show when not editing */}
            {!isEditing && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    Anmeldelser ({reviews.length})
                  </h3>
                  
                  {loadingReviews ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-muted rounded-lg p-4 h-24" />
                      ))}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex">{renderStars(review.rating)}</div>
                              <span className="text-sm font-medium text-foreground">{review.rating}/5</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          
                          {review.booking && (
                            <div className="text-sm text-muted-foreground mb-2">
                              <span className="font-medium">{review.booking.service_name}</span>
                              {review.booking.customer_name && (
                                <span> • {review.booking.customer_name}</span>
                              )}
                            </div>
                          )}
                          
                          {review.comment && (
                            <p className="text-sm text-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-muted/30 rounded-lg">
                      <Star className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Ingen anmeldelser endnu</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with action buttons */}
        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <div className="flex w-full justify-between items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Slet booster
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dette vil permanent slette {booster.name} fra systemet. Denne handling kan ikke fortrydes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Sletter..." : "Slet booster"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Rediger
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
