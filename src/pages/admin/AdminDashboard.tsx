import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  AlertCircle,
  Star,
  CalendarClock,
  PiggyBank,
  FileText,
  Clock,
  Send,
  ExternalLink
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays, addMonths } from "date-fns";
import { da } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";

interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeBookings: number;
  pendingBookings: number;
  activeBoosters: number;
  newInquiries: number;
  unpaidInvoices: number;
  unreadMessages: number;
  pendingReviews: number;
  b2cBookings: number;
  b2bBookings: number;
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

interface StatusUpdate {
  id: string;
  type: 'vat' | 'invoice' | 'payout' | 'job' | 'inquiry' | 'message' | 'review' | 'application';
  title: string;
  description: string;
  urgent: boolean;
  action?: string;
  actionPath?: string;
}

interface Review {
  id: string;
  customerName: string;
  boosterName: string;
  rating: number;
  comment: string;
  date: string;
  replied: boolean;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeBookings: 0,
    pendingBookings: 0,
    activeBoosters: 0,
    newInquiries: 0,
    unpaidInvoices: 0,
    unreadMessages: 0,
    pendingReviews: 0,
    b2cBookings: 0,
    b2bBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<RecentInquiry[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
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

        // Fetch conversations for unread messages
        const { data: conversations } = await supabase
          .from("conversations")
          .select("unread_admin_count");

        // Fetch reviews
        const { data: reviews } = await supabase
          .from("booking_reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        // Calculate stats
        const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;
        const monthlyRevenue = bookings?.filter(b => {
          const bookingDate = new Date(b.created_at);
          return bookingDate >= startOfMonthDate && bookingDate <= endOfMonthDate;
        }).reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;

        const activeBookings = bookings?.filter(b => 
          b.status === 'confirmed' && new Date(b.booking_date) >= today
        ).length || 0;

        // B2C bookings (from bookings table) and B2B (from jobs table with client_type='virksomhed')
        const pendingBookings = jobs?.filter(j => j.status === 'open').length || 0;
        const b2cBookings = bookings?.length || 0;
        const b2bBookings = jobs?.filter(j => j.client_type === 'virksomhed').length || 0;
        
        const activeBoosters = boosters?.filter(b => b.is_available).length || 0;
        const newInquiries = inquiries?.filter(i => i.status === 'new').length || 0;
        const unpaidInvoices = invoices?.filter(i => i.status === 'draft' || i.status === 'sent').length || 0;
        const unreadMessages = conversations?.reduce((sum, c) => sum + (c.unread_admin_count || 0), 0) || 0;

        // Mock fallback data matching finance page (monthly: 289.000 kr, 48 bookings)
        setStats({
          totalRevenue: totalRevenue || 1852000,
          monthlyRevenue: monthlyRevenue || 289000,
          activeBookings: activeBookings || 12,
          pendingBookings: pendingBookings || 3,
          activeBoosters: activeBoosters || 4,
          newInquiries: newInquiries || 2,
          unpaidInvoices: unpaidInvoices || 1,
          unreadMessages: unreadMessages || 0,
          pendingReviews: reviews?.length || 2,
          b2cBookings: b2cBookings || 42,
          b2bBookings: b2bBookings || 6,
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

        // Mock recent reviews
        setRecentReviews([
          { id: '1', customerName: 'Sarah M.', boosterName: 'Anna K.', rating: 5, comment: 'Fantastisk makeup!', date: '2024-12-05', replied: false },
          { id: '2', customerName: 'Louise K.', boosterName: 'My Phung', rating: 4, comment: 'Meget professionel', date: '2024-12-03', replied: true },
        ]);

        // Fetch booster applications
        const { data: boosterApplications } = await supabase
          .from("booster_applications")
          .select("id")
          .eq("status", "pending");

        // Fallback to 3 if no data (mock for demo)
        const pendingApplications = boosterApplications?.length || 3;

        // Generate status updates - only show 3 key items
        const updates: StatusUpdate[] = [];

        // 1. Pending bookings (ventende tildeling)
        updates.push({
          id: 'pending-bookings',
          type: 'job',
          title: `${pendingBookings} ventende bookings`,
          description: 'Bookings der mangler at blive tildelt boosters',
          urgent: pendingBookings > 0,
          action: 'Se bookings',
          actionPath: '/admin/bookings'
        });

        // 2. Booster applications
        updates.push({
          id: 'booster-applications',
          type: 'application',
          title: `${pendingApplications} nye booster ansøgninger`,
          description: 'Ansøgninger der venter på godkendelse',
          urgent: pendingApplications > 0,
          action: 'Se ansøgninger',
          actionPath: '/admin/booster-applications'
        });

        // 3. VAT deadline - Q4 2025 skal indberettes inden 1. marts 2026
        const nextVATDeadline = new Date(2026, 2, 1); // March 1, 2026
        const daysUntilVAT = differenceInDays(nextVATDeadline, today);
        updates.push({
          id: 'vat-deadline',
          type: 'vat',
          title: 'Næste moms deadline',
          description: `Q4 2025 moms skal indberettes inden ${format(nextVATDeadline, "d. MMMM yyyy", { locale: da })} (${daysUntilVAT} dage)`,
          urgent: daysUntilVAT <= 14,
          action: 'Se økonomi',
          actionPath: '/admin/finance'
        });

        setStatusUpdates(updates);

        // Revenue data for last 6 months - with mock fallback matching finance page
        const monthsData = [];
        const mockRevenueData = [
          { month: 'Jul', revenue: 245000 },
          { month: 'Aug', revenue: 312000 },
          { month: 'Sep', revenue: 298000 },
          { month: 'Okt', revenue: 361000 },
          { month: 'Nov', revenue: 347000 },
          { month: 'Dec', revenue: 289000 }
        ];
        
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
            revenue: monthRevenue || mockRevenueData[5 - i]?.revenue || 0,
          });
        }
        setRevenueData(monthsData.length > 0 && monthsData.some(m => m.revenue > 0) ? monthsData : mockRevenueData);

        // Services popularity - with mock fallback
        const serviceCount: Record<string, number> = {};
        bookings?.forEach(b => {
          const service = b.service_name || 'Ukendt';
          serviceCount[service] = (serviceCount[service] || 0) + 1;
        });

        const servicesArray = Object.entries(serviceCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Mock services data if no real data
        const mockServicesData = [
          { name: 'Makeup Styling', count: 18 },
          { name: 'Hår Styling', count: 14 },
          { name: 'Bryllup', count: 8 },
          { name: 'Event Makeup', count: 5 },
          { name: 'Spraytan', count: 3 },
        ];
        
        setServicesData(servicesArray.length > 0 ? servicesArray : mockServicesData);

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
      link: "/admin/finance",
    },
    {
      title: "Aktive bookings",
      value: stats.activeBookings,
      icon: Calendar,
      color: "text-blue-600",
      link: "/admin/bookings",
    },
    {
      title: "Ventende tildeling",
      value: stats.pendingBookings,
      icon: Clock,
      color: "text-orange-600",
      link: "/admin/bookings",
    },
    {
      title: "Aktive boosters",
      value: stats.activeBoosters,
      icon: Users,
      color: "text-purple-600",
      link: "/admin/boosters",
    },
    {
      title: "Nye forespørgsler",
      value: stats.newInquiries,
      icon: MessageSquare,
      color: "text-pink-600",
      badge: stats.newInquiries > 0 ? "kræver handling" : undefined,
      link: "/admin/inquiries",
    },
    {
      title: "Ubetalte fakturaer",
      value: stats.unpaidInvoices,
      icon: AlertCircle,
      color: "text-red-600",
      link: "/admin/finance",
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

      {/* STATUS UPDATES - Always show 3 key items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <CardTitle>Statusopdateringer</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusUpdates.map((update) => (
                <div 
                  key={update.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    update.urgent 
                      ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {update.type === 'vat' && <PiggyBank className={`h-5 w-5 ${update.urgent ? 'text-orange-600' : 'text-muted-foreground'}`} />}
                    {update.type === 'invoice' && <FileText className={`h-5 w-5 ${update.urgent ? 'text-orange-600' : 'text-muted-foreground'}`} />}
                    {update.type === 'job' && <Briefcase className={`h-5 w-5 ${update.urgent ? 'text-orange-600' : 'text-blue-600'}`} />}
                    {update.type === 'application' && <Users className={`h-5 w-5 ${update.urgent ? 'text-orange-600' : 'text-purple-600'}`} />}
                    {update.type === 'inquiry' && <MessageSquare className={`h-5 w-5 ${update.urgent ? 'text-orange-600' : 'text-pink-600'}`} />}
                    {update.type === 'message' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                    {update.type === 'review' && <Star className="h-5 w-5 text-yellow-500" />}
                    <div>
                      <p className="font-medium text-sm">{update.title}</p>
                      <p className="text-xs text-muted-foreground">{update.description}</p>
                    </div>
                  </div>
                  {update.action && (
                    <Button size="sm" variant="outline" onClick={() => navigate(update.actionPath!)}>
                      {update.action}
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Link key={index} to={stat.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
          </Link>
        ))}
      </div>

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <CardTitle>Seneste anmeldelser</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/boosters")}>
              Se alle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div key={review.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{review.customerName}</span>
                      <span className="text-muted-foreground text-xs">→</span>
                      <span className="text-sm">{review.boosterName}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                  </div>
                  {!review.replied && (
                    <Badge variant="secondary" className="text-xs">Afventer svar</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Omsætning - Sidste 6 måneder</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  width={60}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
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
              <BarChart data={servicesData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs - Prioritized by action needed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Seneste jobs</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/jobs")}>
            Se alle
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Jobs requiring action first */}
            {[
              ...recentJobs.filter(j => j.status === 'open'),
              ...recentJobs.filter(j => j.status !== 'open')
            ].slice(0, 6).length === 0 && recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full">Ingen jobs endnu</p>
            ) : (
              [...recentJobs.filter(j => j.status === 'open').map(job => ({
                id: job.id,
                type: 'job' as const,
                title: job.title,
                subtitle: `${job.boosters_needed > 1 ? `${job.boosters_needed} boosters søges` : '1 booster'}`,
                date: job.date_needed,
                status: job.status,
                urgent: true
              })),
              ...recentJobs.filter(j => j.status !== 'open').map(job => ({
                id: job.id,
                type: 'job' as const,
                title: job.title,
                subtitle: `${job.boosters_needed > 1 ? `${job.boosters_needed} boosters` : '1 booster'}`,
                date: job.date_needed,
                status: job.status,
                urgent: false
              })),
              ...recentBookings.filter(b => b.status === 'pending_payment' || b.status === 'confirmed').map(booking => ({
                id: booking.id,
                type: 'booking' as const,
                title: booking.customer_name || 'Kunde',
                subtitle: booking.service_name,
                date: booking.booking_date,
                status: booking.status,
                amount: booking.amount,
                urgent: booking.status === 'pending_payment'
              }))
              ].slice(0, 6).map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-lg border ${
                    item.urgent 
                      ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <Badge 
                      variant={getStatusBadge(item.status).variant} 
                      className={`text-xs ml-2 shrink-0 ${item.urgent ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : ''}`}
                    >
                      {item.urgent ? 'Kræver handling' : getStatusBadge(item.status).label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{format(new Date(item.date), 'd. MMM yyyy', { locale: da })}</span>
                    {'amount' in item && item.amount && (
                      <span className="font-medium text-foreground">{item.amount.toLocaleString('da-DK')} kr</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Inquiries */}
      {recentInquiries.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Seneste forespørgsler</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/jobs")}>
              Se alle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recentInquiries.slice(0, 3).map((inquiry) => (
                <div 
                  key={inquiry.id} 
                  className={`p-3 rounded-lg border ${
                    inquiry.status === 'new' 
                      ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' 
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inquiry.navn}</p>
                      <p className="text-xs text-muted-foreground truncate">{inquiry.service_id}</p>
                    </div>
                    <Badge 
                      variant={getStatusBadge(inquiry.status).variant} 
                      className={`text-xs ml-2 shrink-0 ${inquiry.status === 'new' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : ''}`}
                    >
                      {inquiry.status === 'new' ? 'Ny' : getStatusBadge(inquiry.status).label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(inquiry.created_at), 'd. MMM yyyy', { locale: da })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items - Legacy block */}
      {(stats.pendingBookings > 0 || stats.newInquiries > 0 || stats.unpaidInvoices > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Handlingspunkter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.pendingBookings > 0 && (
                <p className="text-sm">
                  • <span className="font-medium">{stats.pendingBookings} ventende bookings</span> mangler at blive tildelt boosters
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
