import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star, TrendingUp, MessageSquare, Calendar, Reply } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  serviceType: string;
  verified: boolean;
  replied: boolean;
  reply?: string;
  replyDate?: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  pendingReplies: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function BoosterReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    pendingReplies: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");

  // Mock data
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: '1',
        clientName: 'Sarah Jensen',
        rating: 5,
        comment: 'Anna gjorde et fantastisk job til mit bryllup! Hun var professionel, venlig og jeg følte mig så smuk. Kan varmt anbefales!',
        date: '2024-12-05',
        serviceType: 'Bryllup',
        verified: true,
        replied: true,
        reply: 'Tusind tak for de fine ord, Sarah! Det var en fornøjelse at være en del af jeres store dag. Held og lykke fremover! 💕',
        replyDate: '2024-12-06'
      },
      {
        id: '2',
        clientName: 'Mette Christensen',
        rating: 5,
        comment: 'Perfekt makeup til vores fotoshoot. Anna forstod præcis hvad vi havde brug for og leverede over forventning.',
        date: '2024-12-01',
        serviceType: 'Fotoshoot',
        verified: true,
        replied: false
      },
      {
        id: '3',
        clientName: 'Laura Andersen',
        rating: 4,
        comment: 'Rigtig godt arbejde! Makeup holdt hele dagen og så naturligt ud. Kommer gerne igen.',
        date: '2024-11-28',
        serviceType: 'Event',
        verified: true,
        replied: false
      },
      {
        id: '4',
        clientName: 'Camilla Nielsen',
        rating: 5,
        comment: 'Anna er så dygtig! Hun lyttede til mine ønsker og skabte præcis det look jeg drømte om.',
        date: '2024-11-20',
        serviceType: 'Konfirmation',
        verified: true,
        replied: true,
        reply: 'Mange tak Camilla! Glæder mig til at se dig igen! ✨',
        replyDate: '2024-11-21'
      },
      {
        id: '5',
        clientName: 'Maja Hansen',
        rating: 4,
        comment: 'Meget tilfreds med resultatet. Professionel tilgang og god kommunikation gennem hele processen.',
        date: '2024-11-15',
        serviceType: 'Bryllup',
        verified: true,
        replied: false
      }
    ];

    const pendingCount = mockReviews.filter(r => !r.replied).length;
    const mockStats: ReviewStats = {
      averageRating: 4.6,
      totalReviews: 5,
      pendingReplies: pendingCount,
      ratingDistribution: { 5: 4, 4: 1, 3: 0, 2: 0, 1: 0 }
    };

    setReviews(mockReviews);
    setStats(mockStats);
  }, []);

  const handleOpenReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.reply || "");
    setReplyDialogOpen(true);
  };

  const handleSendReply = () => {
    if (!selectedReview || !replyText.trim()) return;

    setReviews(prev => prev.map(r => 
      r.id === selectedReview.id 
        ? { ...r, replied: true, reply: replyText, replyDate: new Date().toISOString().split('T')[0] }
        : r
    ));

    setStats(prev => ({
      ...prev,
      pendingReplies: prev.pendingReplies - (selectedReview.replied ? 0 : 1)
    }));

    toast.success("Svar sendt til kunden");
    setReplyDialogOpen(false);
    setReplyText("");
    setSelectedReview(null);
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`
              ${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}
              ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            `}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    return stats.totalReviews > 0 ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100 : 0;
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      <Helmet>
        <title>Anmeldelser - BeautyBoosters</title>
      </Helmet>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Anmeldelser</h1>
        <p className="text-sm text-muted-foreground">Se hvad kunder siger</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-lg sm:text-2xl font-bold">{stats.averageRating}</span>
            </div>
            {renderStars(Math.round(stats.averageRating), 'sm')}
            <p className="text-xs text-muted-foreground mt-1">Gennemsnit</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg sm:text-2xl font-bold">{stats.totalReviews}</span>
            </div>
            <p className="text-xs text-muted-foreground">I alt</p>
          </CardContent>
        </Card>

        <Card className={stats.pendingReplies > 0 ? "border-orange-300 dark:border-orange-800" : ""}>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Reply className="h-4 w-4 text-orange-500" />
              <span className="text-lg sm:text-2xl font-bold text-orange-600">{stats.pendingReplies}</span>
            </div>
            <p className="text-xs text-muted-foreground">Afventer</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-lg sm:text-2xl font-bold text-green-600">
                {Math.round(getRatingPercentage(5) + getRatingPercentage(4))}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Positive</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Bedømmelsesfordeling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const percentage = getRatingPercentage(rating);
              const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16">
                    {count} ({Math.round(percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Alle anmeldelser</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen anmeldelser endnu</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className={`border-b last:border-b-0 pb-4 last:pb-0 ${!review.replied ? 'bg-orange-50/50 dark:bg-orange-950/20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 rounded-lg' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0 hidden sm:flex">
                      <AvatarFallback className="text-sm">
                        {review.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm">{review.clientName}</h4>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">Verificeret</Badge>
                            )}
                            {!review.replied && (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Afventer</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {renderStars(review.rating)}
                            <Badge variant="outline" className="text-xs">{review.serviceType}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.date).toLocaleDateString('da-DK')}
                          </span>
                          <Button 
                            variant={review.replied ? "ghost" : "default"} 
                            size="sm"
                            onClick={() => handleOpenReply(review)}
                            className="text-xs"
                          >
                            <Reply className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">{review.replied ? "Rediger" : "Besvar"}</span>
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">"{review.comment}"</p>

                      {review.replied && review.reply && (
                        <div className="ml-4 border-l-2 border-primary pl-4 mt-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">Dit svar</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.replyDate!).toLocaleDateString('da-DK')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.replied ? "Rediger svar" : "Besvar anmeldelse"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{selectedReview.clientName}</span>
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm">"{selectedReview.comment}"</p>
              </div>

              <div>
                <Textarea
                  placeholder="Skriv dit svar til kunden..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Dit svar vil være synligt for alle, der ser anmeldelsen
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Annuller
            </Button>
            <Button onClick={handleSendReply} disabled={!replyText.trim()}>
              Send svar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}