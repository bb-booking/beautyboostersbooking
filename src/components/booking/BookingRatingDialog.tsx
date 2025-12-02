import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BookingRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  boosterId: string;
  boosterName: string;
  onSuccess: () => void;
}

export const BookingRatingDialog = ({
  open,
  onOpenChange,
  bookingId,
  boosterId,
  boosterName,
  onSuccess
}: BookingRatingDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Vælg venligst en bedømmelse");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('booking_reviews')
        .insert([{
          booking_id: bookingId,
          user_id: session.user.id,
          booster_id: boosterId,
          rating,
          comment: comment.trim() || null
        }]);

      if (error) throw error;

      toast.success("Tak for din bedømmelse!");
      onSuccess();
      onOpenChange(false);
      setRating(0);
      setComment("");
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      if (error.code === '23505') {
        toast.error("Du har allerede bedømt denne booking");
      } else {
        toast.error("Kunne ikke gemme bedømmelse");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bedøm {boosterName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Hvordan var din oplevelse?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm font-medium mt-2">
                {rating === 1 && "Skuffende"}
                {rating === 2 && "Under middel"}
                {rating === 3 && "Middel"}
                {rating === 4 && "God"}
                {rating === 5 && "Fremragende"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Kommentar (valgfrit)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Del din oplevelse med andre..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/500 tegn
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full"
          >
            {submitting ? "Sender..." : "Send bedømmelse"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
