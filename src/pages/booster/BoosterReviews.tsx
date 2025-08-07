import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, MessageSquare, Calendar } from "lucide-react";

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  serviceType: string;
  verified: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
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
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // Mock data
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: '1',
        clientName: 'Sarah Jensen',
        rating: 5,
        comment: 'Anna gjorde et fantastisk job til mit bryllup! Hun var professionel, venlig og jeg følte mig så smuk. Kan varmt anbefales!',
        date: '2024-01-20',
        serviceType: 'Bryllup',
        verified: true
      },
      {
        id: '2',
        clientName: 'Mette Christensen',
        rating: 5,
        comment: 'Perfekt makeup til vores fotoshoot. Anna forstod præcis hvad vi havde brug for og leverede over forventning.',
        date: '2024-01-18',
        serviceType: 'Fotoshoot',
        verified: true
      },
      {
        id: '3',
        clientName: 'Laura Andersen',
        rating: 4,
        comment: 'Rigtig godt arbejde! Makeup holdt hele dagen og så naturligt ud. Kommer gerne igen.',
        date: '2024-01-15',
        serviceType: 'Event',
        verified: true
      },
      {
        id: '4',
        clientName: 'Camilla Nielsen',
        rating: 5,
        comment: 'Anna er så dygtig! Hun lyttede til mine ønsker og skabte præcis det look jeg drømte om.',
        date: '2024-01-10',
        serviceType: 'Konfirmation',
        verified: true
      },
      {
        id: '5',
        clientName: 'Maja Hansen',
        rating: 4,
        comment: 'Meget tilfreds med resultatet. Professionel tilgang og god kommunikation gennem hele processen.',
        date: '2024-01-08',
        serviceType: 'Bryllup',
        verified: true
      }
    ];

    const mockStats: ReviewStats = {
      averageRating: 4.6,
      totalReviews: 5,
      ratingDistribution: { 5: 4, 4: 1, 3: 0, 2: 0, 1: 0 }
    };

    setReviews(mockReviews);
    setStats(mockStats);
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Anmeldelser</h1>
        <p className="text-muted-foreground">Se hvad dine kunder siger om dit arbejde</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl font-bold">{stats.averageRating}</span>
              {renderStars(Math.round(stats.averageRating), 'lg')}
            </div>
            <p className="text-muted-foreground">Gennemsnitlig bedømmelse</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
              <span className="text-3xl font-bold">{stats.totalReviews}</span>
            </div>
            <p className="text-muted-foreground">Anmeldelser i alt</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <span className="text-3xl font-bold text-green-500">
                {Math.round(getRatingPercentage(5) + getRatingPercentage(4))}%
              </span>
            </div>
            <p className="text-muted-foreground">Positive anmeldelser</p>
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
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12">
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
          <CardTitle>Seneste anmeldelser</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Ingen anmeldelser endnu</p>
              <p className="text-sm text-muted-foreground mt-2">
                Dine anmeldelser vil vises her når kunder bedømmer dit arbejde
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {review.clientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{review.clientName}</h4>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">
                                Verificeret
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <Badge variant="outline" className="text-xs">
                              {review.serviceType}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(review.date).toLocaleDateString('da-DK')}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}