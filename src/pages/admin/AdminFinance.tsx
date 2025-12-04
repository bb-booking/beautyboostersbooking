import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Briefcase,
  Download,
  Filter
} from "lucide-react";

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  completedJobs: number;
  averageJobValue: number;
  topEarningBoosters: Array<{
    name: string;
    earnings: number;
    jobs_completed: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    jobs: number;
  }>;
}

const AdminFinance = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    completedJobs: 0,
    averageJobValue: 0,
    topEarningBoosters: [],
    revenueByMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("3months");

  useEffect(() => {
    fetchFinancialStats();
  }, [selectedPeriod]);

  const fetchFinancialStats = async () => {
    try {
      // Fetch completed jobs for revenue calculation
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          hourly_rate,
          duration_hours,
          status,
          created_at,
          assigned_booster_id,
          booster_profiles!jobs_assigned_booster_id_fkey(name)
        `)
        .eq('status', 'completed');

      if (jobsError) throw jobsError;

      // Calculate basic stats
      const completedJobs = jobs?.length || 0;
      const totalRevenue = jobs?.reduce((sum, job) => {
        return sum + (job.hourly_rate * (job.duration_hours || 1));
      }, 0) || 0;

      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const monthlyJobs = jobs?.filter(job => 
        new Date(job.created_at) >= thirtyDaysAgo
      ) || [];
      
      const monthlyRevenue = monthlyJobs.reduce((sum, job) => {
        return sum + (job.hourly_rate * (job.duration_hours || 1));
      }, 0);

      const averageJobValue = completedJobs > 0 ? totalRevenue / completedJobs : 0;

      // Calculate top earning boosters
      const boosterEarnings = new Map();
      jobs?.forEach(job => {
        if (job.assigned_booster_id && job.booster_profiles) {
          const boosterId = job.assigned_booster_id;
          // Handle both single object and array cases
          const boosterName = Array.isArray(job.booster_profiles) 
            ? job.booster_profiles[0]?.name 
            : (job.booster_profiles as any)?.name;
          const jobEarning = job.hourly_rate * (job.duration_hours || 1);
          
          if (!boosterEarnings.has(boosterId)) {
            boosterEarnings.set(boosterId, {
              name: boosterName || 'Unknown',
              earnings: 0,
              jobs_completed: 0
            });
          }
          
          const current = boosterEarnings.get(boosterId);
          current.earnings += jobEarning;
          current.jobs_completed += 1;
        }
      });

      const topEarningBoosters = Array.from(boosterEarnings.values())
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 5);

      // Generate mock revenue by month data for demo
      const revenueByMonth = [
        { month: 'Jan', revenue: 45000, jobs: 12 },
        { month: 'Feb', revenue: 52000, jobs: 15 },
        { month: 'Mar', revenue: 38000, jobs: 10 },
        { month: 'Apr', revenue: 61000, jobs: 18 },
        { month: 'Maj', revenue: 47000, jobs: 13 },
        { month: 'Jun', revenue: 58000, jobs: 16 }
      ];

      setStats({
        totalRevenue,
        monthlyRevenue,
        completedJobs,
        averageJobValue,
        topEarningBoosters,
        revenueByMonth
      });

    } catch (error) {
      console.error('Error fetching financial stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Økonomi</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const previousMonthRevenue = 45000; // Mock data - should come from actual calculation
  const revenueGrowth = calculateGrowth(stats.monthlyRevenue, previousMonthRevenue);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold">Økonomi</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Sidste måned</SelectItem>
              <SelectItem value="3months">Sidste 3 måneder</SelectItem>
              <SelectItem value="6months">Sidste 6 måneder</SelectItem>
              <SelectItem value="1year">Sidste år</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2 shrink-0" />
            Eksporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total omsætning
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Alle afsluttede jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Månedlig omsætning
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="flex items-center text-xs">
              {revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={revenueGrowth > 0 ? "text-green-600" : "text-red-600"}>
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">fra sidste måned</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Afsluttede jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Siden lancering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gennemsnitlig job værdi
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageJobValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per afsluttet job
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Omsætning per måned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.revenueByMonth.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-sm font-medium">{month.month}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(month.revenue / Math.max(...stats.revenueByMonth.map(m => m.revenue))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(month.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{month.jobs} jobs</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Earning Boosters */}
        <Card>
          <CardHeader>
            <CardTitle>Top boosters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topEarningBoosters.length > 0 ? (
                stats.topEarningBoosters.map((booster, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{booster.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {booster.jobs_completed} jobs afsluttet
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(booster.earnings)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Ingen data tilgængelig endnu</p>
                  <p className="text-sm text-muted-foreground">
                    Data vil vises når jobs er afsluttet
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Økonomisk oversigt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">INDTÆGTER</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Total omsætning</span>
                  <span className="font-medium">{formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Denne måned</span>
                  <span className="font-medium">{formatCurrency(stats.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Gennemsnit per job</span>
                  <span className="font-medium">{formatCurrency(stats.averageJobValue)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">JOBS</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Afsluttede jobs</span>
                  <span className="font-medium">{stats.completedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Aktive boosters</span>
                  <span className="font-medium">{stats.topEarningBoosters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Denne måned</span>
                  <span className="font-medium">
                    {stats.revenueByMonth[stats.revenueByMonth.length - 1]?.jobs || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">VÆKST</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Månedlig vækst</span>
                  <span className={`font-medium ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Trend</span>
                  <Badge variant={revenueGrowth > 0 ? "default" : "secondary"}>
                    {revenueGrowth > 0 ? 'Opadgående' : 'Stabil'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinance;