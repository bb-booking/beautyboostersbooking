import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Users, Calendar, TrendingUp, DollarSign, Briefcase, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { da } from "date-fns/locale";

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeBookings: number;
  openJobs: number;
  activeBoosters: number;
  newInquiries: number;
  unpaidInvoices: number;
}

interface RecentBooking {
  id: string;
  customer_name: string;
  service_name: string;
  booking_date: string;
  amount: number;
  status: string;
}

interface RecentJob {
  id: string;
  title: string;
  date_needed: string;
  status: string;
  boosters_needed: number;
}

interface RecentInquiry {
  id: string;
  navn: string;
  service_id: string;
  created_at: string;
  status: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeBookings: 0,
    openJobs: 0,
    activeBoosters: 0,
    newInquiries: 0,
    unpaidInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [servicesData, setServicesData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        const startOfMonthDate = startOfMonth(today);
        const endOfMonthDate = endOfMonth(today);

        // Fetch bookings
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });

        // Fetch jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("*")
          .order("created_at", { ascending: false });

        // Fetch inquiries
        const { data: inquiries } = await supabase
          .from("inquiries")
          .select("*")
          .order("created_at", { ascending: false });
        
        // Fetch boosters
        const { data: boosters } = await supabase
          .from("booster_profiles")
          .select("id, is_available");

        // Fetch invoices
        const { data: invoices } = await supabase
          .from("invoices")
          .select("*");

        // Calculate stats
        const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;
        const monthlyRevenue = bookings?.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate >= startOfMonthDate && bookingDate <= endOfMonthDate;
        }).reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;

        const activeBookings = bookings?.filter(b => 
          b.status === 'confirmed' && new Date(b.booking_date) >= today
        ).length || 0;

        const openJobs = jobs?.filter(j => j.status === 'open').length || 0;
        const activeBoosters = boosters?.filter(b => b.is_available).length || 0;
        const newInquiries = inquiries?.filter(i => i.status === 'new').length || 0;
        const unpaidInvoices = invoices?.filter(i => i.status === 'draft' || i.status === 'sent').length || 0;

        setStats({
          totalRevenue,
          monthlyRevenue,
          activeBookings,
          openJobs,
          activeBoosters,
          newInquiries,
          unpaidInvoices,
        });

        // Recent bookings (last 5)
        setRecentBookings(bookings?.slice(0, 5).map(b => ({
          id: b.id,
          customer_name: b.customer_name || b.customer_email,
          service_name: b.service_name,
          booking_date: b.booking_date,
          amount: Number(b.amount),
          status: b.status,
        })) || []);

        // Recent jobs (last 5)
        setRecentJobs(jobs?.slice(0, 5).map(j => ({
          id: j.id,
          title: j.title,
          date_needed: j.date_needed,
          status: j.status,
          boosters_needed: j.boosters_needed,
        })) || []);

        // Recent inquiries (last 5)
        setRecentInquiries(inquiries?.slice(0, 5).map(i => ({
          id: i.id,
          navn: i.navn,
          service_id: i.service_id || 'Ikke angivet',
          created_at: i.created_at,
          status: i.status,
        })) || []);

        // Revenue data for last 6 months
        const monthsData = [];
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(today, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          
          const monthRevenue = bookings?.filter(b => {
            const bookingDate = new Date(b.created_at);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
          }).reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;

          monthsData.push({
            month: format(monthDate, 'MMM', { locale: da }),
            revenue: monthRevenue,
          });
        }
        setRevenueData(monthsData);

        // Services popularity
        const serviceCount: Record<string, number> = {};
        bookings?.forEach(b => {
          const service = b.service_name || 'Ukendt';
          serviceCount[service] = (serviceCount[service] || 0) + 1;
        });

        const servicesArray = Object.entries(serviceCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setServicesData(servicesArray);

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
      title: "Månedlig omsætning",
      value: `${stats.monthlyRevenue.toLocaleString('da-DK')} kr`,
      icon: DollarSign,
      color: "text-green-600",
      badge: "denne måned",
    },
    {
      title: "Aktive bookings",
      value: stats.activeBookings,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Åbne jobs",
      value: stats.openJobs,
      icon: Briefcase,
      color: "text-orange-600",
    },
    {
      title: "Aktive boosters",
      value: stats.activeBoosters,
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Nye forespørgsler",
      value: stats.newInquiries,
      icon: MessageSquare,
      color: "text-pink-600",
      badge: stats.newInquiries > 0 ? "kræver handling" : undefined,
    },
    {
      title: "Ubetalte fakturaer",
      value: stats.unpaidInvoices,
      icon: AlertCircle,
      color: "text-red-600",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      'confirmed': { variant: 'default', label: 'Bekræftet' },
      'pending_payment': { variant: 'secondary', label: 'Afventer betaling' },
      'cancelled': { variant: 'destructive', label: 'Annulleret' },
      'open': { variant: 'secondary', label: 'Åben' },
      'assigned': { variant: 'default', label: 'Tildelt' },
      'completed': { variant: 'outline', label: 'Afsluttet' },
      'new': { variant: 'default', label: 'Ny' },
      'contacted': { variant: 'secondary', label: 'Kontaktet' },
      'closed': { variant: 'outline', label: 'Lukket' },
    };
    return statusMap[status] || { variant: 'secondary', label: status };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Velkommen til Beauty Boosters admin panel
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Omsætning - Sidste 6 måneder</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `${Number(value).toLocaleString('da-DK')} kr`}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Populære services</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seneste bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen bookings endnu</p>
              ) : (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex justify-between items-start border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{booking.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.service_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.booking_date), 'd. MMM', { locale: da })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{booking.amount.toLocaleString('da-DK')} kr</p>
                      <Badge variant={getStatusBadge(booking.status).variant} className="text-xs mt-1">
                        {getStatusBadge(booking.status).label}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seneste jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen jobs endnu</p>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="border-b pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(job.date_needed), 'd. MMM', { locale: da })}
                        </p>
                      </div>
                      <Badge variant={getStatusBadge(job.status).variant} className="text-xs">
                        {getStatusBadge(job.status).label}
                      </Badge>
                    </div>
                    {job.boosters_needed > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.boosters_needed} boosters søges
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seneste forespørgsler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen forespørgsler endnu</p>
              ) : (
                recentInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="border-b pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{inquiry.navn}</p>
                        <p className="text-xs text-muted-foreground">{inquiry.service_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(inquiry.created_at), 'd. MMM', { locale: da })}
                        </p>
                      </div>
                      <Badge variant={getStatusBadge(inquiry.status).variant} className="text-xs">
                        {getStatusBadge(inquiry.status).label}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {(stats.openJobs > 0 || stats.newInquiries > 0 || stats.unpaidInvoices > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Handlingspunkter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.openJobs > 0 && (
                <p className="text-sm">
                  • <span className="font-medium">{stats.openJobs} åbne jobs</span> mangler at blive tildelt boosters
                </p>
              )}
              {stats.newInquiries > 0 && (
                <p className="text-sm">
                  • <span className="font-medium">{stats.newInquiries} nye forespørgsler</span> venter på svar
                </p>
              )}
              {stats.unpaidInvoices > 0 && (
                <p className="text-sm">
                  • <span className="font-medium">{stats.unpaidInvoices} ubetalte fakturaer</span> kræver opfølgning
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;