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
  Clock
} from "lucide-react";

interface BoosterStats {
  availableJobs: number;
  completedJobs: number;
  totalEarnings: number;
  newMessages: number;
}

const BoosterDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<BoosterStats>({
    availableJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    newMessages: 0,
  });
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

        setStats({
          availableJobs: jobs?.length || 0,
          completedJobs: completedJobs?.length || 0,
          totalEarnings: 15750, // Example - would calculate from actual jobs
          newMessages: messages?.length || 0,
        });
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
      badge: "nye",
    },
    {
      title: "Afsluttede jobs",
      value: stats.completedJobs,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Total indtjening",
      value: `${stats.totalEarnings.toLocaleString()} kr`,
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Nye beskeder",
      value: stats.newMessages,
      icon: MessageSquare,
      color: "text-orange-600",
      badge: stats.newMessages > 0 ? "ulæst" : undefined,
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
          <Card key={index}>
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
          <CardHeader>
            <CardTitle>Seneste aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm">Nyt job tilgængeligt: "Bryllupsmakeup København"</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm">Job afsluttet: "Fotoshoot Aarhus" - 1.200 kr</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-sm">Ny besked fra kunde Sarah</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Denne uge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Bookede timer:</span>
              <span className="font-semibold">12 timer</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Forventet indtjening:</span>
              <span className="font-semibold">3.600 kr</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tilgængelige slots:</span>
              <span className="font-semibold">8 timer</span>
            </div>
            <Button className="w-full mt-4" onClick={() => navigate("/booster")}>
              Se fuld kalender
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BoosterDashboard;