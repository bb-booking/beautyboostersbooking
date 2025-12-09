import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Users,
  Briefcase,
  Download,
  Filter,
  PiggyBank,
  FileText,
  Building2,
  AlertTriangle,
  ExternalLink,
  Send,
  CalendarClock,
  Wallet
} from "lucide-react";
import { format, differenceInDays, endOfMonth, addMonths } from "date-fns";
import { da } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface FinancialStats {
  totalRevenue: number;
  monthlyRevenue: number;
  completedJobs: number;
  averageJobValue: number;
  totalSalaryCosts: number;
  vatOwed: number;
  outputVAT: number; // Salgsmoms
  inputVAT: number; // Købsmoms
  taxReserve: number;
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

interface VATDeadline {
  period: string;
  dueDate: Date;
  amount: number;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'paid';
}

interface SalaryEntry {
  id: string;
  boosterName: string;
  period: string;
  grossAmount: number;
  taxDeduction: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'paid';
  paymentDate?: string;
  type: 'b-income' | 'cvr';
}

const AdminFinance = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    completedJobs: 0,
    averageJobValue: 0,
    totalSalaryCosts: 0,
    vatOwed: 0,
    outputVAT: 0,
    inputVAT: 0,
    taxReserve: 0,
    topEarningBoosters: [],
    revenueByMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("3months");
  const [vatDeadlines, setVatDeadlines] = useState<VATDeadline[]>([]);
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);

  // Days until end of month
  const daysUntilMonthEnd = differenceInDays(endOfMonth(new Date()), new Date());

  useEffect(() => {
    fetchFinancialStats();
    calculateVATDeadlines();
    fetchSalaryData();
  }, [selectedPeriod]);

  const calculateVATDeadlines = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Quarterly VAT deadlines for business
    const deadlines: VATDeadline[] = [
      { 
        period: `Q4 ${currentYear} (Okt-Dec)`, 
        dueDate: new Date(currentYear + 1, 2, 1), 
        amount: 145000,
        status: 'upcoming'
      },
      { 
        period: `Q1 ${currentYear + 1} (Jan-Mar)`, 
        dueDate: new Date(currentYear + 1, 5, 1), 
        amount: 0,
        status: 'upcoming'
      },
    ];

    deadlines.forEach(d => {
      const daysUntil = differenceInDays(d.dueDate, now);
      if (daysUntil < 0) d.status = 'paid';
      else if (daysUntil <= 14) d.status = 'due_soon';
    });

    setVatDeadlines(deadlines.filter(d => d.status !== 'paid'));
  };

  const fetchSalaryData = () => {
    // Mock salary data - would come from database
    const mockSalaries: SalaryEntry[] = [
      { id: '1', boosterName: 'Anna K.', period: 'December 2024', grossAmount: 57600, taxDeduction: 14400, netAmount: 43200, status: 'pending', type: 'b-income' },
      { id: '2', boosterName: 'My Phung', period: 'December 2024', grossAmount: 48000, taxDeduction: 12000, netAmount: 36000, status: 'pending', type: 'b-income' },
      { id: '3', boosterName: 'Angelica', period: 'December 2024', grossAmount: 62400, taxDeduction: 0, netAmount: 62400, status: 'approved', type: 'cvr' },
      { id: '4', boosterName: 'Marie S.', period: 'December 2024', grossAmount: 45000, taxDeduction: 0, netAmount: 45000, status: 'pending', type: 'cvr' },
      { id: '5', boosterName: 'Anna K.', period: 'November 2024', grossAmount: 51200, taxDeduction: 12800, netAmount: 38400, status: 'paid', paymentDate: '2024-12-01', type: 'b-income' },
      { id: '6', boosterName: 'My Phung', period: 'November 2024', grossAmount: 44800, taxDeduction: 11200, netAmount: 33600, status: 'paid', paymentDate: '2024-12-01', type: 'b-income' },
      { id: '7', boosterName: 'Angelica', period: 'November 2024', grossAmount: 58000, taxDeduction: 0, netAmount: 58000, status: 'paid', paymentDate: '2024-12-01', type: 'cvr' },
    ];
    setSalaryEntries(mockSalaries);
  };

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

      // Calculate salary costs (mock - 60% of revenue goes to boosters)
      const totalSalaryCosts = totalRevenue * 0.6;
      
      // Calculate VAT - Salgsmoms (output VAT on revenue) and Købsmoms (input VAT on expenses)
      const outputVAT = totalRevenue * 0.25; // 25% salgsmoms
      const inputVAT = totalSalaryCosts * 0.05; // Estimated input VAT from purchases/expenses (mock)
      const vatOwed = outputVAT - inputVAT; // Forventet skyldig moms = salgsmoms - købsmoms
      
      // Tax reserve (estimate 22% corporate tax on profit)
      const profit = totalRevenue - totalSalaryCosts;
      const taxReserve = profit * 0.22;

      // Calculate top earning boosters
      const boosterEarnings = new Map();
      jobs?.forEach(job => {
        if (job.assigned_booster_id && job.booster_profiles) {
          const boosterId = job.assigned_booster_id;
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

      // Generate mock revenue by month data
      const revenueByMonth = [
        { month: 'Jul', revenue: 245000, jobs: 42 },
        { month: 'Aug', revenue: 312000, jobs: 55 },
        { month: 'Sep', revenue: 298000, jobs: 50 },
        { month: 'Okt', revenue: 361000, jobs: 62 },
        { month: 'Nov', revenue: 347000, jobs: 58 },
        { month: 'Dec', revenue: 289000, jobs: 48 }
      ];

      setStats({
        totalRevenue: totalRevenue || 1852000, // Mock fallback
        monthlyRevenue: monthlyRevenue || 289000,
        completedJobs: completedJobs || 315,
        averageJobValue: averageJobValue || 5880,
        totalSalaryCosts: totalSalaryCosts || 1111200,
        outputVAT: outputVAT || 463000, // Salgsmoms
        inputVAT: inputVAT || 55560, // Købsmoms
        vatOwed: vatOwed || 407440, // Forventet skyldig moms
        taxReserve: taxReserve || 162976,
        topEarningBoosters: topEarningBoosters.length > 0 ? topEarningBoosters : [
          { name: 'Anna K.', earnings: 287000, jobs_completed: 48 },
          { name: 'My Phung', earnings: 245000, jobs_completed: 42 },
          { name: 'Angelica', earnings: 312000, jobs_completed: 53 },
        ],
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

  const getVATStatusColor = (status: VATDeadline['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return '';
    }
  };

  const getSalaryStatusColor = (status: SalaryEntry['status']) => {
    switch (status) {
      case 'paid': return 'default';
      case 'approved': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
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

  const previousMonthRevenue = 347000;
  const revenueGrowth = calculateGrowth(stats.monthlyRevenue, previousMonthRevenue);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Økonomi</h2>
          <p className="text-muted-foreground">Beauty Boosters ApS • CVR: 12345678</p>
        </div>
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

      {/* CRITICAL ALERTS */}
      {daysUntilMonthEnd <= 5 && (
        <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CalendarClock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-400">Månedsafslutning nærmer sig</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            {daysUntilMonthEnd} dage til månedsslut. Godkend løn til boosters og send til Danløn.
          </AlertDescription>
        </Alert>
      )}

      {vatDeadlines.some(d => d.status === 'due_soon') && (
        <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <PiggyBank className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">Momsfrist nærmer sig</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {vatDeadlines.find(d => d.status === 'due_soon')?.period} moms skal indberettes snart. Beløb: {formatCurrency(vatDeadlines.find(d => d.status === 'due_soon')?.amount || 0)}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Oversigt</TabsTrigger>
          <TabsTrigger value="vat">Moms & Skat</TabsTrigger>
          <TabsTrigger value="salary">Løn</TabsTrigger>
          <TabsTrigger value="integrations">Integrationer</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total omsætning</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Alle afsluttede jobs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Månedlig omsætning</CardTitle>
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
                <CardTitle className="text-sm font-medium">Afsluttede jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedJobs}</div>
                <p className="text-xs text-muted-foreground">Siden lancering</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gennemsnit per job</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageJobValue)}</div>
                <p className="text-xs text-muted-foreground">Per afsluttet job</p>
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
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Earning Boosters */}
            <Card>
              <CardHeader>
                <CardTitle>Top boosters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topEarningBoosters.map((booster, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium">{booster.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {booster.jobs_completed} jobs
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(booster.earnings)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vat" className="space-y-6">
          {/* VAT & Tax Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Salgsmoms (Output VAT)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.outputVAT)}</div>
                <p className="text-xs text-muted-foreground">25% af omsætning</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Købsmoms (Input VAT)</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">-{formatCurrency(stats.inputVAT)}</div>
                <p className="text-xs text-muted-foreground">Fradragsberettiget moms</p>
              </CardContent>
            </Card>

            <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forventet skyldig moms</CardTitle>
                <PiggyBank className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(stats.vatOwed)}</div>
                <p className="text-xs text-muted-foreground">Salgsmoms - Købsmoms</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Tax Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skat reserve</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.taxReserve)}</div>
                <p className="text-xs text-muted-foreground">22% selskabsskat af profit</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total lønomkostninger</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalSalaryCosts)}</div>
                <p className="text-xs text-muted-foreground">Udbetalt til boosters</p>
              </CardContent>
            </Card>
          </div>

          {/* VAT Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Momsfrister
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vatDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <PiggyBank className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{deadline.period}</p>
                        <p className="text-sm text-muted-foreground">
                          Frist: {format(deadline.dueDate, "d. MMMM yyyy", { locale: da })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(deadline.amount)}</span>
                      <Badge className={getVATStatusColor(deadline.status)}>
                        {deadline.status === 'due_soon' ? 'Snart' : deadline.status === 'upcoming' ? 'Kommende' : deadline.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">UDGIFTER</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Lønomkostninger</span>
                      <span className="font-medium">{formatCurrency(stats.totalSalaryCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Skyldig moms</span>
                      <span className="font-medium">{formatCurrency(stats.vatOwed)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">RESULTAT</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Profit før skat</span>
                      <span className="font-medium text-green-600">{formatCurrency(stats.totalRevenue - stats.totalSalaryCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Skat reserve</span>
                      <span className="font-medium">{formatCurrency(stats.taxReserve)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          {/* B-lønnede Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                B-lønnede
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Åbn Danløn
                </Button>
                <Button size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send til Danløn
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salaryEntries.filter(e => e.type === 'b-income').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Ingen B-lønnede boosters</p>
                ) : (
                  salaryEntries.filter(e => e.type === 'b-income').map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{entry.boosterName}</p>
                          <p className="text-sm text-muted-foreground">{entry.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Brutto</p>
                          <p className="font-medium">{formatCurrency(entry.grossAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">A-skat</p>
                          <p className="font-medium text-red-600">-{formatCurrency(entry.taxDeduction)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Netto</p>
                          <p className="font-medium text-green-600">{formatCurrency(entry.netAmount)}</p>
                        </div>
                        <Badge variant={getSalaryStatusColor(entry.status)}>
                          {entry.status === 'pending' ? 'Afventer' : entry.status === 'approved' ? 'Godkendt' : 'Udbetalt'}
                        </Badge>
                        {entry.status === 'pending' && (
                          <Button size="sm" variant="outline">Godkend</Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* CVR Boosters Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                CVR Boosters (Fakturaer)
              </CardTitle>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Se alle fakturaer
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salaryEntries.filter(e => e.type === 'cvr').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Ingen CVR boosters</p>
                ) : (
                  salaryEntries.filter(e => e.type === 'cvr').map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{entry.boosterName}</p>
                          <p className="text-sm text-muted-foreground">{entry.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Fakturabeløb</p>
                          <p className="font-medium">{formatCurrency(entry.grossAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Moms (25%)</p>
                          <p className="font-medium text-muted-foreground">{formatCurrency(entry.grossAmount * 0.2)}</p>
                        </div>
                        <Badge variant={getSalaryStatusColor(entry.status)}>
                          {entry.status === 'pending' ? 'Afventer' : entry.status === 'approved' ? 'Godkendt' : 'Betalt'}
                        </Badge>
                        {entry.status === 'pending' && (
                          <Button size="sm" variant="outline">Godkend</Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Salary Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">B-lønnede afventer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(salaryEntries.filter(s => s.status === 'pending' && s.type === 'b-income').reduce((sum, s) => sum + s.netAmount, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {salaryEntries.filter(s => s.status === 'pending' && s.type === 'b-income').length} udbetalinger
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CVR afventer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(salaryEntries.filter(s => s.status === 'pending' && s.type === 'cvr').reduce((sum, s) => sum + s.grossAmount, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {salaryEntries.filter(s => s.status === 'pending' && s.type === 'cvr').length} fakturaer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Godkendt - klar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(salaryEntries.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.type === 'b-income' ? s.netAmount : s.grossAmount), 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {salaryEntries.filter(s => s.status === 'approved').length} udbetalinger
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Udbetalt denne måned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(salaryEntries.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.type === 'b-income' ? s.netAmount : s.grossAmount), 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {salaryEntries.filter(s => s.status === 'paid').length} udbetalinger
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Integration Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  e-conomic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Synkroniser fakturaer og regnskabsdata med e-conomic.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">Forbundet</Badge>
                  <span className="text-sm text-muted-foreground">Sidst synkroniseret: i dag kl. 14:30</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Åbn e-conomic
                  </Button>
                  <Button variant="outline" size="sm">
                    Synkroniser nu
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Danløn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Håndter lønudbetalinger til boosters via Danløn.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">Forbundet</Badge>
                  <span className="text-sm text-muted-foreground">Næste kørsel: 1. januar 2025</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Åbn Danløn
                  </Button>
                  <Button size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Send løndata
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>e-conomic API</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Operationel</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Danløn Integration</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Operationel</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Stripe Payments</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Operationel</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinance;
