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
  Reply,
  Check,
  X,
  MapPin,
  AlertCircle,
  CalendarClock,
  FileText,
  PiggyBank,
  Send,
  ExternalLink
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { differenceInDays, endOfMonth, format } from "date-fns";
import { da } from "date-fns/locale";

interface BoosterStats {
  availableJobs: number;
  completedJobs: number;
  totalEarnings: number;
  newMessages: number;
  averageRating: number;
  reviewCount: number;
  pendingRequests: number;
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

interface BookingRequest {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  time: string;
  location: string;
  amount: number;
}

interface StatusUpdate {
  id: string;
  type: 'invoice' | 'vat' | 'payout' | 'review';
  title: string;
  description: string;
  dueDate?: Date;
  urgent: boolean;
  action?: string;
  actionPath?: string;
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
    pendingRequests: 2,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BookingRequest[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calculate days until month end
  const daysUntilMonthEnd = differenceInDays(endOfMonth(new Date()), new Date());
  const hasCVR = true; // Mock - would come from booster profile

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
          availableJobs: jobs?.length || 1,
          completedJobs: completedJobs?.length || 0,
          totalEarnings: 15750,
          newMessages: messages?.length || 0,
          averageRating: avgRating,
          reviewCount: reviewsData?.length || 12,
          pendingRequests: 2,
        });

        // Set mock pending booking requests
        setPendingRequests([
          {
            id: "req-1",
            serviceName: "Bryllupsmakeup",
            customerName: "Emma Christensen",
            date: "2024-12-14",
            time: "10:00",
            location: "Frederiksberg",
            amount: 2500,
          },
          {
            id: "req-2",
            serviceName: "Event Styling",
            customerName: "Sofie Andersen",
            date: "2024-12-16",
            time: "14:00",
            location: "København K",
            amount: 1800,
          },
        ]);

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

        // Set status updates based on deadlines
        const updates: StatusUpdate[] = [];
        
        // Invoice reminder (end of month)
        if (daysUntilMonthEnd <= 7) {
          updates.push({
            id: 'invoice-reminder',
            type: 'invoice',
            title: 'Send månedsfaktura',
            description: `${daysUntilMonthEnd} dage til månedsslut. Send din faktura for at få udbetaling til tiden.`,
            dueDate: endOfMonth(new Date()),
            urgent: daysUntilMonthEnd <= 3,
            action: 'Send faktura',
            actionPath: '/booster/finance'
          });
        }

        // VAT reminder for CVR holders (mock - would check actual deadlines)
        if (hasCVR) {
          const nextVATDeadline = new Date(2025, 4, 1); // May 1, 2025
          const daysUntilVAT = differenceInDays(nextVATDeadline, new Date());
          if (daysUntilVAT <= 30 && daysUntilVAT > 0) {
            updates.push({
              id: 'vat-reminder',
              type: 'vat',
              title: 'Momsfrist nærmer sig',
              description: `Q1 2025 moms skal indberettes inden ${format(nextVATDeadline, "d. MMMM", { locale: da })}. Læg ca. 14.400 kr til side.`,
              dueDate: nextVATDeadline,
              urgent: daysUntilVAT <= 14,
              action: 'Se økonomi',
              actionPath: '/booster/finance'
            });
          }
        }

        // Pending payout
        updates.push({
          id: 'payout-info',
          type: 'payout',
          title: 'Næste udbetaling',
          description: 'Forventet udbetaling: 43.200 kr d. 1. januar 2026',
          urgent: false,
          action: 'Se detaljer',
          actionPath: '/booster/finance'
        });

        // Unreplied reviews
        const unrepliedReviews = 2; // Mock count
        if (unrepliedReviews > 0) {
          updates.push({
            id: 'review-reply',
            type: 'review',
            title: `${unrepliedReviews} anmeldelser afventer svar`,
            description: 'Besvar kundefeedback for at øge din profil-synlighed.',
            urgent: false,
            action: 'Besvar nu',
            actionPath: '/booster/reviews'
          });
        }

        setStatusUpdates(updates);
      } catch (error) {
        console.error("Error fetching booster stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [daysUntilMonthEnd, hasCVR]);

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
    <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h2 className="text-xl sm:text-2xl font-bold">Mit Dashboard</h2>
        <p className="text-sm text-muted-foreground hidden sm:block">
          Velkommen tilbage
        </p>
      </div>

      {/* STATUS UPDATES - Financial deadlines & notifications */}
      {statusUpdates.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Statusopdateringer</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              {statusUpdates.map((update) => (
                <div 
                  key={update.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 sm:p-3 rounded-lg border ${
                    update.urgent 
                      ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      {update.type === 'invoice' && <FileText className={`h-4 w-4 sm:h-5 sm:w-5 ${update.urgent ? 'text-orange-600' : 'text-muted-foreground'}`} />}
                      {update.type === 'vat' && <PiggyBank className={`h-4 w-4 sm:h-5 sm:w-5 ${update.urgent ? 'text-orange-600' : 'text-muted-foreground'}`} />}
                      {update.type === 'payout' && <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
                      {update.type === 'review' && <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm">{update.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{update.description}</p>
                    </div>
                  </div>
                  {update.action && (
                    <Button size="sm" variant={update.urgent ? "default" : "outline"} onClick={() => navigate(update.actionPath!)} className="w-full sm:w-auto text-xs sm:text-sm flex-shrink-0">
                      {update.action}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACTION REQUIRED SECTION - Booking Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <CardTitle className="text-base sm:text-lg">Booking anmodninger</CardTitle>
              <Badge className="bg-orange-600 text-xs">{pendingRequests.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/booster/jobs")} className="text-xs sm:text-sm px-2">
              Se alle
            </Button>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="p-3 sm:p-4 bg-background rounded-lg border"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm sm:text-base">{request.serviceName}</span>
                        <Badge variant="secondary" className="text-xs">{request.amount} kr</Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">{request.customerName}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {new Date(request.date).toLocaleDateString('da-DK')} kl. {request.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{request.location}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-xs sm:text-sm">
                        <Check className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Acceptér</span>
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate("/booster/messages")} className="text-xs sm:text-sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACTION REQUIRED - Available Jobs */}
      {stats.availableJobs > 0 && (
        <Card 
          className="border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate("/booster/jobs")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle>Ledige jobs</CardTitle>
              <Badge className="bg-blue-600">{stats.availableJobs} nye</Badge>
            </div>
            <Button variant="ghost" size="sm">
              Se jobs →
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Der er {stats.availableJobs} ledige jobs der matcher dine kompetencer. Klik for at se og ansøge.
            </p>
          </CardContent>
        </Card>
      )}

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