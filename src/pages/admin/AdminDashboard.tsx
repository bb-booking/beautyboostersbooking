import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Users, Calendar, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalInquiries: number;
  newInquiries: number;
  totalBookers: number;
  totalBookings: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInquiries: 0,
    newInquiries: 0,
    totalBookers: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch inquiries stats
        const { data: inquiries } = await supabase
          .from("inquiries")
          .select("status");
        
        // Fetch boosters count
        const { data: boosters } = await supabase
          .from("booster_profiles")
          .select("id");

        const totalInquiries = inquiries?.length || 0;
        const newInquiries = inquiries?.filter(i => i.status === "new").length || 0;
        const totalBookers = boosters?.length || 0;

        setStats({
          totalInquiries,
          newInquiries,
          totalBookers,
          totalBookings: 0, // Will be implemented when bookings table exists
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Nye forespørgsler",
      value: stats.newInquiries,
      icon: MessageSquare,
      color: "text-blue-600",
      badge: "new",
    },
    {
      title: "Total forespørgsler",
      value: stats.totalInquiries,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Aktive boosters",
      value: stats.totalBookers,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Bookinger i dag",
      value: stats.totalBookings,
      icon: Calendar,
      color: "text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
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
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Velkommen til Beauty Boosters admin panel
        </p>
      </div>

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seneste aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nylige forespørgsler og bookinger vil blive vist her
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hurtig navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Tjek nye forespørgsler i Forespørgsler sektionen
            </p>
            <p className="text-sm text-muted-foreground">
              • Administrer boosters i Boosters sektionen
            </p>
            <p className="text-sm text-muted-foreground">
              • Se dagens bookinger i Bookinger
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;