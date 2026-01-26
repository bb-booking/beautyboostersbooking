import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Calendar, Phone, Mail, Briefcase, Clock } from "lucide-react";

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
}

export const BoosterProfileDialog = ({ booster, open, onOpenChange }: BoosterProfileDialogProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (booster && open) {
      fetchReviews(booster.id);
    }
  }, [booster, open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Booster Profil</DialogTitle>
          <DialogDescription>
            Se fuld profil, kompetencer og anmeldelser
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Header with photo and basic info */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={booster.portfolio_image_url || undefined} alt={booster.name} />
                  <AvatarFallback className="text-2xl">
                    {booster.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Badge 
                  className={`mt-3 ${booster.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {booster.is_available ? 'Tilgængelig' : 'Ikke tilgængelig'}
                </Badge>
              </div>

              <div className="flex-1 space-y-3">
                <h2 className="text-2xl font-bold text-foreground">{booster.name}</h2>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{booster.location}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{booster.years_experience} års erfaring</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-foreground font-medium">{booster.rating?.toFixed(1) || '5.0'}</span>
                    <span className="text-muted-foreground">({booster.review_count || 0} anmeldelser)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                  {booster.email && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{booster.email}</span>
                    </div>
                  )}
                  {booster.phone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{booster.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{booster.employment_type === 'salaried' ? 'Lønmodtager' : 'Freelancer (B-indkomst)'}</span>
                  </div>
                  {booster.hourly_rate > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{booster.hourly_rate} DKK/time</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {booster.bio && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Om {booster.name}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{booster.bio}</p>
                </div>
              </>
            )}

            {/* Specialties/Competencies */}
            <Separator />
            <div>
              <h3 className="font-semibold text-foreground mb-3">Kompetencer & Specialer</h3>
              {booster.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {booster.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen specialer registreret</p>
              )}
            </div>

            {/* Reviews */}
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
