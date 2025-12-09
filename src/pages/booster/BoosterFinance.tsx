import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign, TrendingUp, Clock, FileText, Download, ArrowUpRight, ArrowDownRight, Wallet, Receipt } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { da } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface EarningsData {
  period: string;
  jobs: number;
  hours: number;
  gross: number;
  tax: number;
  net: number;
}

interface JobEarning {
  id: string;
  title: string;
  client: string;
  date: string;
  hours: number;
  hourlyRate: number;
  total: number;
  status: 'completed' | 'pending' | 'paid';
}

interface Payout {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  reference: string;
}

interface Payslip {
  id: string;
  period: string;
  date: string;
  gross: number;
  tax: number;
  net: number;
}

export default function BoosterFinance() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobEarning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);

  // Mock chart data
  const chartData = [
    { name: 'Jan', indtjening: 42000, timer: 64 },
    { name: 'Feb', indtjening: 38500, timer: 58 },
    { name: 'Mar', indtjening: 51200, timer: 78 },
    { name: 'Apr', indtjening: 47800, timer: 72 },
    { name: 'Maj', indtjening: 55400, timer: 84 },
    { name: 'Jun', indtjening: 62100, timer: 94 },
    { name: 'Jul', indtjening: 48600, timer: 74 },
    { name: 'Aug', indtjening: 59300, timer: 90 },
    { name: 'Sep', indtjening: 53800, timer: 82 },
    { name: 'Okt', indtjening: 61200, timer: 93 },
    { name: 'Nov', indtjening: 57600, timer: 88 },
    { name: 'Dec', indtjening: 45200, timer: 69 },
  ];

  const weeklyChartData = [
    { name: 'Man', indtjening: 4800, timer: 8 },
    { name: 'Tir', indtjening: 3600, timer: 6 },
    { name: 'Ons', indtjening: 5400, timer: 9 },
    { name: 'Tor', indtjening: 4200, timer: 7 },
    { name: 'Fre', indtjening: 6000, timer: 10 },
    { name: 'Lør', indtjening: 3000, timer: 5 },
    { name: 'Søn', indtjening: 0, timer: 0 },
  ];

  // Mock data
  useEffect(() => {
    const mockEarnings: EarningsData[] = [
      { period: 'I dag', jobs: 2, hours: 8, gross: 4800, tax: 1200, net: 3600 },
      { period: 'Denne uge', jobs: 8, hours: 32, gross: 19200, tax: 4800, net: 14400 },
      { period: 'Denne måned', jobs: 24, hours: 96, gross: 57600, tax: 14400, net: 43200 },
      { period: 'Dette år', jobs: 156, hours: 624, gross: 374400, tax: 93600, net: 280800 },
    ];

    const mockJobs: JobEarning[] = [
      {
        id: '1',
        title: 'Bryllup - Sarah & Mikael',
        client: 'Sarah Jensen',
        date: '2025-12-08',
        hours: 6,
        hourlyRate: 600,
        total: 3600,
        status: 'completed'
      },
      {
        id: '2', 
        title: 'Fotoshoot - Mode Magazine',
        client: 'Mode Magazine',
        date: '2025-12-05',
        hours: 4,
        hourlyRate: 700,
        total: 2800,
        status: 'paid'
      },
      {
        id: '3',
        title: 'Event makeup - Gala',
        client: 'Copenhagen Events',
        date: '2025-12-03',
        hours: 5,
        hourlyRate: 650,
        total: 3250,
        status: 'pending'
      },
      {
        id: '4',
        title: 'Privat makeup session',
        client: 'Marie Andersen',
        date: '2025-11-28',
        hours: 2,
        hourlyRate: 600,
        total: 1200,
        status: 'paid'
      },
      {
        id: '5',
        title: 'TV-produktion - DR',
        client: 'DR Studios',
        date: '2025-11-25',
        hours: 8,
        hourlyRate: 750,
        total: 6000,
        status: 'paid'
      }
    ];

    const mockPayouts: Payout[] = [
      { id: '1', date: '2025-12-01', amount: 43200, status: 'completed', reference: 'PAY-2025-12-001' },
      { id: '2', date: '2025-11-01', amount: 38500, status: 'completed', reference: 'PAY-2025-11-001' },
      { id: '3', date: '2025-10-01', amount: 52100, status: 'completed', reference: 'PAY-2025-10-001' },
      { id: '4', date: '2025-09-01', amount: 47800, status: 'completed', reference: 'PAY-2025-09-001' },
    ];

    const mockPayslips: Payslip[] = [
      { id: '1', period: 'December 2025', date: '2025-12-01', gross: 57600, tax: 14400, net: 43200 },
      { id: '2', period: 'November 2025', date: '2025-11-01', gross: 51300, tax: 12825, net: 38475 },
      { id: '3', period: 'Oktober 2025', date: '2025-10-01', gross: 69500, tax: 17375, net: 52125 },
      { id: '4', period: 'September 2025', date: '2025-09-01', gross: 63700, tax: 15925, net: 47775 },
      { id: '5', period: 'August 2025', date: '2025-08-01', gross: 58900, tax: 14725, net: 44175 },
    ];

    setEarningsData(mockEarnings);
    setRecentJobs(mockJobs);
    setPayouts(mockPayouts);
    setPayslips(mockPayslips);
  }, []);

  const currentEarnings = earningsData.find(data => {
    if (selectedPeriod === 'day') return data.period === 'I dag';
    if (selectedPeriod === 'week') return data.period === 'Denne uge';
    if (selectedPeriod === 'month') return data.period === 'Denne måned';
    if (selectedPeriod === 'year') return data.period === 'Dette år';
    return data;
  }) || earningsData[0];

  const previousEarnings = earningsData.find(data => {
    if (selectedPeriod === 'day') return data.period === 'Denne uge';
    if (selectedPeriod === 'week') return data.period === 'Denne måned';
    if (selectedPeriod === 'month') return data.period === 'Dette år';
    return data;
  }) || earningsData[0];

  const getStatusColor = (status: JobEarning['status']) => {
    switch (status) {
      case 'completed': return 'secondary';
      case 'paid': return 'default';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: JobEarning['status']) => {
    switch (status) {
      case 'completed': return 'Udført';
      case 'paid': return 'Betalt';
      case 'pending': return 'Afventer';
      default: return status;
    }
  };

  const getPayoutStatusColor = (status: Payout['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPayoutStatusText = (status: Payout['status']) => {
    switch (status) {
      case 'completed': return 'Udbetalt';
      case 'processing': return 'Behandles';
      case 'pending': return 'Afventer';
      default: return status;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'day': return 'Dag';
      case 'week': return 'Uge';
      case 'month': return 'Måned';
      case 'year': return 'År';
    }
  };

  // Calculate growth percentage (mock)
  const growthPercentage = 12.5;
  const isPositiveGrowth = growthPercentage > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Økonomi</h1>
          <p className="text-muted-foreground">Overblik over indtjening og betalinger</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="week">Uge</SelectItem>
              <SelectItem value="month">Måned</SelectItem>
              <SelectItem value="year">År</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(selectedDate, "d. MMMM yyyy", { locale: da })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={da}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jobs</p>
                <p className="text-2xl font-bold">{currentEarnings?.jobs || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">denne {getPeriodLabel().toLowerCase()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Timer</p>
                <p className="text-2xl font-bold">{currentEarnings?.hours || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">arbejdstimer</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brutto</p>
                <p className="text-2xl font-bold">{currentEarnings?.gross?.toLocaleString('da-DK') || 0} kr</p>
                <p className="text-xs text-muted-foreground mt-1">før skat</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-bl-full" />
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Netto</p>
                <p className="text-2xl font-bold text-primary">{currentEarnings?.net?.toLocaleString('da-DK') || 0} kr</p>
                <div className="flex items-center gap-1 mt-1">
                  {isPositiveGrowth ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${isPositiveGrowth ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositiveGrowth ? '+' : ''}{growthPercentage}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="payouts">Udbetalinger</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
          <TabsTrigger value="documents">Lønsedler</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Seneste jobs</CardTitle>
              <Button variant="outline" size="sm">
                Se alle
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{job.title}</h4>
                        <Badge variant={getStatusColor(job.status)}>
                          {getStatusText(job.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{job.client}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })} • {job.hours} timer • {job.hourlyRate} kr/time
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{job.total.toLocaleString('da-DK')} kr</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Næste udbetaling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Beløb</span>
                    <span className="text-2xl font-bold text-primary">{currentEarnings?.net?.toLocaleString('da-DK') || 0} kr</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Forventet dato</span>
                    <span>1. januar 2026</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary">Afventer periode</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Årsoversigt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total udbetalt i år</span>
                    <span className="font-bold">280.800 kr</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Antal udbetalinger</span>
                    <span>11</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Gns. pr. måned</span>
                    <span>25.527 kr</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Udbetalingshistorik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Månedlig udbetaling</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payout.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getPayoutStatusColor(payout.status)}>
                        {getPayoutStatusText(payout.status)}
                      </Badge>
                      <span className="font-bold text-lg">{payout.amount.toLocaleString('da-DK')} kr</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Gns. timepris</p>
                <p className="text-2xl font-bold">650 kr</p>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +5% fra sidste måned
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Gns. job-værdi</p>
                <p className="text-2xl font-bold">2.400 kr</p>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +8% fra sidste måned
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Booking rate</p>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +2% fra sidste måned
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Indtjening over tid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedPeriod === 'week' ? weeklyChartData : chartData}>
                    <defs>
                      <linearGradient id="colorIndtjening" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('da-DK')} kr`, 'Indtjening']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="indtjening" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorIndtjening)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timer pr. periode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedPeriod === 'week' ? weeklyChartData : chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value} timer`, 'Timer']}
                    />
                    <Bar dataKey="timer" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Lønsedler
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download alle
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payslips.map((payslip) => (
                  <div key={payslip.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{payslip.period}</p>
                        <p className="text-sm text-muted-foreground">
                          Udstedt {new Date(payslip.date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-muted-foreground">Brutto</p>
                        <p className="font-medium">{payslip.gross.toLocaleString('da-DK')} kr</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-muted-foreground">Skat</p>
                        <p className="font-medium text-red-500">-{payslip.tax.toLocaleString('da-DK')} kr</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Netto</p>
                        <p className="font-bold text-primary">{payslip.net.toLocaleString('da-DK')} kr</p>
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
