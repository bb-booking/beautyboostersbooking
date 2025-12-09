import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  User, 
  Camera,
  Tag,
  TrendingUp,
  Clock,
  Star,
  Reply
} from "lucide-react";

interface BoosterStats {
  availableJobs: number;
  completedJobs: number;
  totalEarnings: number;
  newMessages: number;
  averageRating: number;
  reviewCount: number;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  serviceName: string;
  replied: boolean;
}

const BoosterDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<BoosterStats>({
    availableJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    newMessages: 0,
    averageRating: 0,
    reviewCount: 0,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch available jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "open");

        // Fetch completed jobs (example - would need booster_id filter)
        const { data: completedJobs } = await supabase
          .from("jobs")
          .select("*")
          .eq("status", "completed");

        // Fetch unread messages (example)
        const { data: messages } = await supabase
          .from("job_communications")
          .select("*")
          .is("read_at", null);

        // Fetch booster reviews
        const { data: reviewsData } = await supabase
          .from("booking_reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        const avgRating = reviewsData?.length 
          ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length 
          : 4.8;

        setStats({
          availableJobs: jobs?.length || 0,
          completedJobs: completedJobs?.length || 0,
          totalEarnings: 15750,
          newMessages: messages?.length || 0,
          averageRating: avgRating,
          reviewCount: reviewsData?.length || 12,
        });

        // Set mock reviews for display
        setReviews([
          {
            id: "1",
            customerName: "Sarah M.",
            rating: 5,
            comment: "Fantastisk makeup til mit bryllup! Anna var professionel og super dygtig.",
            date: "2024-12-05",
            serviceName: "Bryllupsmakeup",
            replied: true,
          },
          {
            id: "2",
            customerName: "Louise K.",
            rating: 5,
            comment: "Perfekt til vores firmafest. Alle var super glade!",
            date: "2024-12-01",
            serviceName: "Event makeup",
            replied: false,
          },
          {
            id: "3",
            customerName: "Mette J.",
            rating: 4,
            comment: "God service og flot resultat. Kom til tiden.",
            date: "2024-11-28",
            serviceName: "Makeup Styling",
            replied: false,
          },
        ]);
      } catch (error) {
        console.error("Error fetching booster stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Ledige jobs",
      value: stats.availableJobs,
      icon: Clock,
      color: "text-blue-600",
      badge: stats.availableJobs > 0 ? "nye" : undefined,
      action: () => navigate("/booster/jobs"),
    },
    {
      title: "Afsluttede jobs",
      value: stats.completedJobs,
      icon: TrendingUp,
      color: "text-green-600",
      action: () => navigate("/booster/jobs?status=completed"),
    },
    {
      title: "Total indtjening",
      value: `${stats.totalEarnings.toLocaleString()} kr`,
      icon: DollarSign,
      color: "text-purple-600",
      action: () => navigate("/booster/finance"),
    },
    {
      title: "Nye beskeder",
      value: stats.newMessages,
      icon: MessageSquare,
      color: "text-orange-600",
      badge: stats.newMessages > 0 ? "ulæst" : undefined,
      action: () => navigate("/booster/messages"),
    },
  ];

  const quickActions = [
    {
      title: "Min kalender",
      description: "Administrer tilgængelighed",
      icon: Calendar,
      color: "text-blue-600",
      action: () => navigate("/booster"),
    },
    {
      title: "Portfolio",
      description: "Upload arbejdseksempler",
      icon: Camera,
      color: "text-green-600",
      action: () => navigate("/booster/portfolio"),
    },
    {
      title: "Kompetencer",
      description: "Opdater dine skills",
      icon: Tag,
      color: "text-purple-600",
      action: () => navigate("/booster/skills"),
    },
    {
      title: "Min profil",
      description: "Rediger om mig sektion",
      icon: User,
      color: "text-orange-600",
      action: () => navigate("/booster/profile"),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Mit Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mit Dashboard</h2>
        <p className="text-muted-foreground">
          Velkommen tilbage til Beauty Boosters
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
            onClick={stat.action}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {stat.badge}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="text-center pb-2">
              <action.icon className={`h-8 w-8 mx-auto ${action.color}`} />
              <CardTitle className="text-lg">{action.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {action.description}
              </p>
              <Button variant="outline" size="sm" onClick={action.action}>
                Åbn
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Seneste aktivitet</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/booster/jobs")}>
              Se alle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => navigate("/booster/jobs")}
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm">Nyt job tilgængeligt: "Bryllupsmakeup København"</p>
              </div>
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => navigate("/booster/finance")}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">Job afsluttet: "Fotoshoot Aarhus" - 1.200 kr</p>
              </div>
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                onClick={() => navigate("/booster/messages")}
              >
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-sm">Ny besked fra kunde Sarah</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Denne uge</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/booster")}>
              Kalender
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
              onClick={() => navigate("/booster")}
            >
              <span className="text-sm text-muted-foreground">Bookede timer:</span>
              <span className="font-semibold">12 timer</span>
            </div>
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
              onClick={() => navigate("/booster/finance")}
            >
              <span className="text-sm text-muted-foreground">Forventet indtjening:</span>
              <span className="font-semibold">3.600 kr</span>
            </div>
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
              onClick={() => navigate("/booster")}
            >
              <span className="text-sm text-muted-foreground">Tilgængelige slots:</span>
              <span className="font-semibold">8 timer</span>
            </div>
            <Button className="w-full mt-4" onClick={() => navigate("/booster")}>
              Se fuld kalender
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Booking Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Afventende anmodninger</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/booster/requests")}>
            Se alle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Ingen afventende anmodninger</p>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Mine anmeldelser</CardTitle>
            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-semibold text-sm">{stats.averageRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({stats.reviewCount})</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/booster/reviews")}>
            Se alle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div 
                  key={review.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.customerName}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {review.serviceName} • {new Date(review.date).toLocaleDateString('da-DK')}
                      </p>
                    </div>
                    {review.replied ? (
                      <Badge variant="secondary" className="text-xs">
                        Besvaret
                      </Badge>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => navigate("/booster/reviews")}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Besvar
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">"{review.comment}"</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ingen anmeldelser endnu</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BoosterDashboard;