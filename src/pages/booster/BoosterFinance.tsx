import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  FileText, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Send,
  PiggyBank,
  CalendarClock,
  Info,
  ExternalLink,
  Percent,
  Banknote
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, differenceInDays, addMonths } from "date-fns";
import { da } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  periodStart: string;
  periodEnd: string;
  date: string;
  honorar: number; // B-income: Honorar, bidragspligtigt (amount paid out)
  bIndkomstYearToDate: number; // Year to date B-income
  downloadUrl?: string;
}

interface BoosterProfile {
  hasCVR: boolean;
  cvrNumber?: string;
  companyName?: string;
  employmentType: 'freelancer' | 'salaried';
  isVATRegistered: boolean;
  vatPeriod: 'monthly' | 'quarterly' | 'semi-annual';
  annualRevenue?: number;
}

interface VATDeadline {
  period: string;
  dueDate: Date;
  amount: number;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'paid';
}

interface MonthlyInvoice {
  id: string;
  period: string;
  dueDate: Date;
  amount: number;
  status: 'draft' | 'pending' | 'sent' | 'paid';
  generatedAt?: Date;
}

// Determine VAT period based on annual revenue (Danish rules)
const determineVATPeriod = (annualRevenue: number): 'monthly' | 'quarterly' | 'semi-annual' => {
  if (annualRevenue >= 50000000) return 'monthly';
  if (annualRevenue >= 5000000) return 'quarterly';
  return 'semi-annual';
};

const getVATPeriodLabel = (period: 'monthly' | 'quarterly' | 'semi-annual'): string => {
  switch (period) {
    case 'monthly': return 'Månedsmoms';
    case 'quarterly': return 'Kvartalsmoms';
    case 'semi-annual': return 'Halvårsmoms';
  }
};

// BeautyBoosters cut percentage for B-income workers (40% of amount AFTER VAT)
const BEAUTYBOOSTERS_CUT_PERCENT = 40;
const VAT_RATE = 0.25; // 25% Danish VAT

export default function BoosterFinance() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobEarning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [activeTab, setActiveTab] = useState('earnings');
  const [loading, setLoading] = useState(true);
  const [boosterProfile, setBoosterProfile] = useState<BoosterProfile>({
    hasCVR: false,
    employmentType: 'freelancer',
    isVATRegistered: false,
    vatPeriod: 'quarterly',
  });
  const [vatDeadlines, setVatDeadlines] = useState<VATDeadline[]>([]);
  const [monthlyInvoices, setMonthlyInvoices] = useState<MonthlyInvoice[]>([]);
  const [vatSavingsAmount, setVatSavingsAmount] = useState(0);

  // Fetch booster profile from database
  useEffect(() => {
    const fetchBoosterProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from('booster_profiles')
          .select('employment_type')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching booster profile:', error);
          return;
        }

        if (profile) {
          // B-income (freelancer) workers don't have CVR
          const employmentType = (profile.employment_type as 'freelancer' | 'salaried') || 'freelancer';
          const hasCVR = false; // For now, CVR is not tracked - B-income workers don't have CVR
          
          setBoosterProfile({
            hasCVR,
            employmentType,
            isVATRegistered: false,
            vatPeriod: 'quarterly',
          });

          // Set default tab based on employment type
          if (employmentType === 'freelancer') {
            setActiveTab('earnings');
          } else {
            setActiveTab('invoicing');
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoosterProfile();
  }, []);

  // Calculate VAT deadlines based on VAT period type and current date
  const calculateVATDeadlines = (vatPeriod: 'monthly' | 'quarterly' | 'semi-annual') => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const deadlines: VATDeadline[] = [];

    if (vatPeriod === 'semi-annual') {
      const periods = [
        { period: `H1 ${currentYear} (Jan-Jun)`, dueDate: new Date(currentYear, 8, 1) },
        { period: `H2 ${currentYear} (Jul-Dec)`, dueDate: new Date(currentYear + 1, 2, 1) },
        { period: `H1 ${currentYear + 1} (Jan-Jun)`, dueDate: new Date(currentYear + 1, 8, 1) },
      ];
      
      periods.forEach((p, idx) => {
        const daysUntil = differenceInDays(p.dueDate, now);
        let status: VATDeadline['status'] = 'upcoming';
        if (daysUntil < 0) status = 'paid';
        else if (daysUntil <= 14) status = 'due_soon';
        
        if (daysUntil >= -30) {
          deadlines.push({ 
            ...p, 
            amount: idx === 0 ? 46800 : 0,
            status 
          });
        }
      });
    } else if (vatPeriod === 'quarterly') {
      const quarters = [
        { period: `Q3 ${currentYear} (Jul-Sep)`, dueDate: new Date(currentYear, 11, 1) },
        { period: `Q4 ${currentYear} (Okt-Dec)`, dueDate: new Date(currentYear + 1, 2, 1) },
        { period: `Q1 ${currentYear + 1} (Jan-Mar)`, dueDate: new Date(currentYear + 1, 5, 1) },
      ];

      quarters.forEach((q, idx) => {
        const daysUntil = differenceInDays(q.dueDate, now);
        let status: VATDeadline['status'] = 'upcoming';
        if (daysUntil < 0) status = 'paid';
        else if (daysUntil <= 14) status = 'due_soon';

        deadlines.push({ 
          ...q, 
          amount: idx === 0 ? 14400 : 0,
          status 
        });
      });
    } else {
      for (let i = 0; i < 3; i++) {
        const monthOffset = currentMonth + i;
        const year = currentYear + Math.floor(monthOffset / 12);
        const month = monthOffset % 12;
        const periodDate = new Date(year, month, 1);
        const dueDate = new Date(year, month + 1, 25);
        
        const daysUntil = differenceInDays(dueDate, now);
        let status: VATDeadline['status'] = 'upcoming';
        if (daysUntil < 0) status = 'paid';
        else if (daysUntil <= 7) status = 'due_soon';

        deadlines.push({
          period: format(periodDate, 'MMMM yyyy', { locale: da }),
          dueDate,
          amount: i === 0 ? 4800 : 0,
          status
        });
      }
    }

    return deadlines.filter(d => d.status !== 'paid' || differenceInDays(new Date(), d.dueDate) <= 60);
  };

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

    // Mock payslips from Danløn for B-income workers
    // B-income: Honorar bidragspligtigt - no tax/AM-bidrag deducted, booster handles this themselves
    const mockPayslips: Payslip[] = [
      { id: '1', period: 'December 2025', periodStart: '2025-11-20', periodEnd: '2025-12-19', date: '2025-12-31', honorar: 27648, bIndkomstYearToDate: 158420 },
      { id: '2', period: 'November 2025', periodStart: '2025-10-20', periodEnd: '2025-11-19', date: '2025-11-30', honorar: 24180, bIndkomstYearToDate: 130772 },
      { id: '3', period: 'Oktober 2025', periodStart: '2025-09-20', periodEnd: '2025-10-19', date: '2025-10-31', honorar: 32840, bIndkomstYearToDate: 106592 },
      { id: '4', period: 'September 2025', periodStart: '2025-08-20', periodEnd: '2025-09-19', date: '2025-09-30', honorar: 28650, bIndkomstYearToDate: 73752 },
      { id: '5', period: 'August 2025', periodStart: '2025-07-20', periodEnd: '2025-08-19', date: '2025-08-31', honorar: 21590, bIndkomstYearToDate: 45102 },
    ];

    // Monthly invoices for payroll (only for CVR holders)
    const mockMonthlyInvoices: MonthlyInvoice[] = [
      { id: '1', period: 'December 2025', dueDate: new Date(2025, 11, 31), amount: 57600, status: 'draft', generatedAt: new Date() },
      { id: '2', period: 'November 2025', dueDate: new Date(2025, 10, 30), amount: 51300, status: 'paid' },
      { id: '3', period: 'Oktober 2025', dueDate: new Date(2025, 9, 31), amount: 69500, status: 'paid' },
    ];

    setEarningsData(mockEarnings);
    setRecentJobs(mockJobs);
    setPayouts(mockPayouts);
    setPayslips(mockPayslips);
    setVatDeadlines(calculateVATDeadlines(boosterProfile.vatPeriod));
    setMonthlyInvoices(mockMonthlyInvoices);
    
    const currentMonthGross = mockEarnings.find(e => e.period === 'Denne måned')?.gross || 0;
    setVatSavingsAmount(currentMonthGross * 0.20);
  }, [boosterProfile.vatPeriod]);

  const currentEarnings = earningsData.find(data => {
    if (selectedPeriod === 'day') return data.period === 'I dag';
    if (selectedPeriod === 'week') return data.period === 'Denne uge';
    if (selectedPeriod === 'month') return data.period === 'Denne måned';
    if (selectedPeriod === 'year') return data.period === 'Dette år';
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

  const getVATStatusColor = (status: VATDeadline['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'due_soon': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };

  const getInvoiceStatusColor = (status: MonthlyInvoice['status']) => {
    switch (status) {
      case 'paid': return 'default';
      case 'sent': return 'secondary';
      case 'pending': return 'outline';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const handleSendMonthlyInvoice = async (invoiceId: string) => {
    toast.success("Faktura sendt til admin/lønsystem");
    setMonthlyInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, status: 'sent' as const } : inv
    ));
  };

  // Calculate growth percentage (mock)
  const growthPercentage = 12.5;
  const isPositiveGrowth = growthPercentage > 0;

  // Days until end of month (for invoice reminder)
  const daysUntilMonthEnd = differenceInDays(endOfMonth(new Date()), new Date());
  const needsInvoiceGeneration = daysUntilMonthEnd <= 5;

  // Calculate B-income specific values
  // Customer pays X kr inkl. moms -> After VAT = X / 1.25 -> Booster gets 60% of that
  const isFreelancer = boosterProfile.employmentType === 'freelancer' && !boosterProfile.hasCVR;
  const grossInclVat = currentEarnings?.gross || 0; // This is what customer pays (inkl. moms)
  const grossExVat = Math.round(grossInclVat / (1 + VAT_RATE)); // Amount after VAT removed
  const beautyBoostersCut = Math.round(grossExVat * (BEAUTYBOOSTERS_CUT_PERCENT / 100)); // 40% cut
  const yourEarningsAfterCut = grossExVat - beautyBoostersCut; // Booster's earnings (60% of ex-VAT)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Økonomi</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {boosterProfile.hasCVR 
              ? `CVR: ${boosterProfile.cvrNumber}`
              : 'B-indkomst'
            }
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-24 sm:w-32">
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
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <CalendarIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{format(selectedDate, "d. MMM", { locale: da })}</span>
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

      {/* B-income: Earnings breakdown card */}
      {isFreelancer && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-muted-foreground">Din indtjening denne {getPeriodLabel().toLowerCase()}</p>
                    <Badge variant="outline" className="text-xs">B-indkomst</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{yourEarningsAfterCut.toLocaleString('da-DK')} kr</p>
                  <p className="text-xs text-muted-foreground">
                    Efter moms og {BEAUTYBOOSTERS_CUT_PERCENT}% cut
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Næste lønudbetaling</p>
                <p className="font-medium text-lg">Ultimo måneden</p>
                <p className="text-xs text-muted-foreground">via Danløn</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* B-income info alert */}
      {isFreelancer && (
        <Alert className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-400">Du har selv ansvar for skatteindberetning</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Som B-lønnet freelancer skal du selv indberette din indtjening til SKAT. BeautyBoosters udbetaler din andel efter moms og cut – skatten håndterer du selv via din forskudsopgørelse og årsopgørelse.
            <Button size="sm" variant="outline" className="ml-4 mt-2" asChild>
              <a href="https://skat.dk" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Gå til SKAT
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* CVR/VAT alerts - only for CVR holders */}
      {boosterProfile.hasCVR && needsInvoiceGeneration && (
        <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CalendarClock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-400">Månedsfaktura skal sendes</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            Der er {daysUntilMonthEnd} dage til månedens udgang. Husk at sende din faktura til lønsystemet for at få udbetaling til tiden.
            <Button size="sm" className="ml-4" onClick={() => handleSendMonthlyInvoice(monthlyInvoices[0]?.id)}>
              <Send className="h-4 w-4 mr-2" />
              Send faktura nu
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {boosterProfile.hasCVR && vatDeadlines.some(d => d.status === 'due_soon') && (
        <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">Momsfrist nærmer sig</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {vatDeadlines.find(d => d.status === 'due_soon')?.period} skal indberettes inden{' '}
            {format(vatDeadlines.find(d => d.status === 'due_soon')?.dueDate || new Date(), "d. MMMM yyyy", { locale: da })}.
            <Button size="sm" variant="outline" className="ml-4" asChild>
              <a href="https://skat.dk" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Gå til SKAT
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* VAT Savings Card for CVR holders */}
      {boosterProfile.hasCVR && boosterProfile.isVATRegistered && (
        <Card className="border-green-300 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-muted-foreground">Læg til side til moms denne måned</p>
                    <Badge variant="outline" className="text-xs">
                      {getVATPeriodLabel(boosterProfile.vatPeriod)}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{vatSavingsAmount.toLocaleString('da-DK')} kr</p>
                  <p className="text-xs text-muted-foreground">20% af brutto ({currentEarnings?.gross?.toLocaleString('da-DK')} kr)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Næste momsfrist</p>
                <p className="font-medium text-lg">
                  {vatDeadlines.find(d => d.status !== 'paid')?.dueDate 
                    ? format(vatDeadlines.find(d => d.status !== 'paid')!.dueDate, "d. MMMM yyyy", { locale: da })
                    : 'Ingen kommende'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {vatDeadlines.find(d => d.status !== 'paid')?.period}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-sm text-muted-foreground">{isFreelancer ? 'Job-værdi' : 'Brutto'}</p>
                <p className="text-2xl font-bold">{currentEarnings?.gross?.toLocaleString('da-DK') || 0} kr</p>
                <p className="text-xs text-muted-foreground mt-1">{isFreelancer ? 'før cut' : 'før skat'}</p>
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
                <p className="text-sm text-muted-foreground">{isFreelancer ? 'Din andel' : 'Netto'}</p>
                <p className="text-2xl font-bold text-primary">
                  {isFreelancer 
                    ? yourEarningsAfterCut.toLocaleString('da-DK')
                    : currentEarnings?.net?.toLocaleString('da-DK') || 0
                  } kr
                </p>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Mobile: Dropdown */}
        <div className="sm:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Vælg sektion" />
            </SelectTrigger>
            <SelectContent>
              {isFreelancer ? (
                <>
                  <SelectItem value="earnings">Indtjening</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="payouts">Udbetalinger</SelectItem>
                  <SelectItem value="statistics">Statistik</SelectItem>
                  <SelectItem value="documents">Lønsedler</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="invoicing">Fakturering</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="payouts">Udbetalinger</SelectItem>
                  <SelectItem value="statistics">Statistik</SelectItem>
                  <SelectItem value="documents">Lønsedler</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        {/* Desktop: Tabs */}
        <TabsList className="hidden sm:inline-flex">
          {isFreelancer ? (
            <>
              <TabsTrigger value="earnings" className="flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                Indtjening
              </TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="payouts">Udbetalinger</TabsTrigger>
              <TabsTrigger value="statistics">Statistik</TabsTrigger>
              <TabsTrigger value="documents">Lønsedler</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="invoicing" className="flex items-center gap-1">
                <Send className="h-4 w-4" />
                Fakturering
              </TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="payouts">Udbetalinger</TabsTrigger>
              <TabsTrigger value="statistics">Statistik</TabsTrigger>
              <TabsTrigger value="documents">Lønsedler</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* B-income Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          {/* Earnings breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Indtjeningsoversigt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Visual breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Kunde betaler (inkl. moms)</p>
                        <p className="text-sm text-foreground/70">Total job-værdi fra kunder</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground">{grossInclVat.toLocaleString('da-DK')} kr</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <Percent className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Moms (25%)</p>
                        <p className="text-sm text-foreground/70">Fratrækkes kundens betaling</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground">-{(grossInclVat - grossExVat).toLocaleString('da-DK')} kr</p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Beløb ex. moms</p>
                        <p className="text-sm text-foreground/70">Grundlag for cut-beregning</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground">{grossExVat.toLocaleString('da-DK')} kr</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <Percent className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-medium text-foreground">BeautyBoosters cut ({BEAUTYBOOSTERS_CUT_PERCENT}%)</p>
                        <p className="text-sm text-foreground/70">Platform, booking, support & forsikring</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground">-{beautyBoostersCut.toLocaleString('da-DK')} kr</p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-card border-primary/30">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Din indtjening</p>
                        <p className="text-sm text-foreground/70">Udbetales til dig (før din egen skat)</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground">{yourEarningsAfterCut.toLocaleString('da-DK')} kr</p>
                  </div>
                </div>

                {/* Info box */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-400 mb-2">Vigtigt: Du har selv ansvar for skatteindberetning</p>
                      <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                        <li>Du modtager B-indkomst fra BeautyBoosters</li>
                        <li>Du skal selv indberette din indtjening til SKAT</li>
                        <li>Husk at sætte penge til side til skat (typisk 38-52%)</li>
                        <li>Opdater din forskudsopgørelse så du betaler løbende B-skat</li>
                        <li>Gem dokumentation for alle udbetalinger til din årsopgørelse</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Example calculation */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Eksempel på beregning:</p>
                      <div className="space-y-1 font-mono text-xs">
                        <p>Kunde betaler: 2.000 kr (inkl. moms)</p>
                        <p>Efter moms (÷25%): 2.000 / 1,25 = 1.600 kr</p>
                        <p>BeautyBoosters cut (40%): 1.600 × 0,40 = -640 kr</p>
                        <p className="font-bold text-foreground">Din indtjening: 1.600 - 640 = 960 kr</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimated tax to set aside */}
                <div className="p-4 border-2 border-amber-300 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Anbefalet at sætte til side til skat</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Ca. 40% af din indtjening</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                      ~{Math.round(yourEarningsAfterCut * 0.40).toLocaleString('da-DK')} kr
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoicing & VAT Tab - Only for CVR holders */}
        <TabsContent value="invoicing" className="space-y-4">
          {boosterProfile.hasCVR ? (
            <>
              {/* Monthly Invoice Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Månedlige fakturaer til lønsystem
                  </CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Auto-genereret d. 25 hver måned
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyInvoices.map((invoice) => (
                      <div key={invoice.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                            invoice.status === 'draft' ? 'bg-yellow-500/10' :
                            invoice.status === 'sent' ? 'bg-blue-500/10' :
                            invoice.status === 'paid' ? 'bg-green-500/10' : 'bg-muted'
                          }`}>
                            <FileText className={`h-5 w-5 ${
                              invoice.status === 'draft' ? 'text-yellow-600' :
                              invoice.status === 'sent' ? 'text-blue-600' :
                              invoice.status === 'paid' ? 'text-green-600' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{invoice.period}</p>
                                <p className="text-sm text-muted-foreground">
                                  Frist: {format(invoice.dueDate, "d. MMM yyyy", { locale: da })}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-bold">{invoice.amount.toLocaleString('da-DK')} kr</p>
                                <Badge variant={getInvoiceStatusColor(invoice.status)} className="text-xs">
                                  {invoice.status === 'draft' ? 'Kladde' :
                                   invoice.status === 'sent' ? 'Sendt' :
                                   invoice.status === 'pending' ? 'Afventer' : 'Betalt'}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              {invoice.status === 'draft' && (
                                <Button size="sm" onClick={() => handleSendMonthlyInvoice(invoice.id)} className="w-full sm:w-auto">
                                  <Send className="h-4 w-4 mr-2" />
                                  Send faktura
                                </Button>
                              )}
                              {invoice.status !== 'draft' && (
                                <Button size="sm" variant="outline" className="w-full sm:w-auto">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* VAT Section for CVR holders */}
              {boosterProfile.isVATRegistered && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Momsindberetning
                      </CardTitle>
                      <Badge variant="secondary">{getVATPeriodLabel(boosterProfile.vatPeriod)}</Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://skat.dk" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Gå til SKAT
                      </a>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* VAT Overview */}
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                          <p className="text-sm text-muted-foreground">Udgående moms (salg)</p>
                          <p className="text-xl font-bold text-green-700 dark:text-green-400">
                            {Math.round((currentEarnings?.gross || 0) * 0.25).toLocaleString('da-DK')} kr
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                          <p className="text-sm text-muted-foreground">Indgående moms (køb)</p>
                          <p className="text-xl font-bold text-red-700 dark:text-red-400">
                            -{Math.round((currentEarnings?.gross || 0) * 0.05).toLocaleString('da-DK')} kr
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                          <p className="text-sm text-muted-foreground">Moms til betaling</p>
                          <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                            {Math.round((currentEarnings?.gross || 0) * 0.20).toLocaleString('da-DK')} kr
                          </p>
                        </div>
                      </div>

                      {/* VAT Deadlines */}
                      <div className="space-y-3">
                        <h4 className="font-medium">Momsfrister</h4>
                        {vatDeadlines.map((deadline, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {deadline.status === 'paid' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : deadline.status === 'overdue' ? (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              ) : (
                                <CalendarClock className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">{deadline.period}</p>
                                <p className="text-sm text-muted-foreground">
                                  Frist: {format(deadline.dueDate, "d. MMMM yyyy", { locale: da })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {deadline.amount > 0 && (
                                <span className="font-medium">{deadline.amount.toLocaleString('da-DK')} kr</span>
                              )}
                              <Badge className={getVATStatusColor(deadline.status)}>
                                {deadline.status === 'paid' ? 'Betalt' :
                                 deadline.status === 'upcoming' ? 'Kommende' :
                                 deadline.status === 'due_soon' ? 'Snart' : 'Forfalden'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Fakturering er ikke relevant for B-lønnede</h3>
                <p className="text-muted-foreground">
                  Som B-lønnet behøver du ikke at fakturere. Se i stedet din indtjening og lønsedler.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

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
                      {isFreelancer && (
                        <p className="text-xs text-muted-foreground">
                          Din andel: {Math.round((job.total / (1 + VAT_RATE)) * (1 - BEAUTYBOOSTERS_CUT_PERCENT / 100)).toLocaleString('da-DK')} kr
                        </p>
                      )}
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
                    <span className="text-muted-foreground">Estimeret beløb</span>
                    <span className="text-2xl font-bold text-primary">
                      {yourEarningsAfterCut.toLocaleString('da-DK')} kr
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Forventet dato</span>
                    <span>Ultimo januar 2026</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Udbetales via</span>
                    <span>{isFreelancer ? 'Danløn' : 'Bank'}</span>
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
                        <p className="font-medium">{isFreelancer ? 'Lønudbetaling' : 'Månedlig udbetaling'}</p>
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
                Lønsedler fra Danløn
              </CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download alle
              </Button>
            </CardHeader>
            <CardContent>
              {isFreelancer && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-400">B-indkomst lønsedler via Danløn</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Dit honorar udbetales som B-indkomst (bidragspligtigt). Du er selv ansvarlig for at indberette og betale skat via SKAT.dk.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Estimated tax calculation card */}
              {isFreelancer && payslips.length > 0 && (
                <Card className="mb-4 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Percent className="h-5 w-5 text-amber-600" />
                      Estimeret skat du selv skal indberette
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Baseret på din B-indkomst i år: <span className="font-medium">{payslips[0]?.bIndkomstYearToDate.toLocaleString('da-DK')} kr</span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const yearToDate = payslips[0]?.bIndkomstYearToDate || 0;
                      // AM-bidrag: 8% af B-indkomst
                      const amBidrag = Math.round(yearToDate * 0.08);
                      // Grundlag efter AM-bidrag
                      const afterAm = yearToDate - amBidrag;
                      // Personfradrag 2025 (årligt) - antager det bruges
                      const personfradrag = 49700;
                      // Skattepligtig indkomst efter fradrag
                      const skattepligtigIndkomst = Math.max(0, afterAm - personfradrag);
                      // Bundskat: 12.09%
                      const bundskat = Math.round(skattepligtigIndkomst * 0.1209);
                      // Kommuneskat: ca. 24.97% (gennemsnit)
                      const kommuneskat = Math.round(skattepligtigIndkomst * 0.2497);
                      // Kirkeskat: ca. 0.68% (valgfri, antager medlem)
                      const kirkeskat = Math.round(skattepligtigIndkomst * 0.0068);
                      // Total skat
                      const totalSkat = amBidrag + bundskat + kommuneskat + kirkeskat;
                      // Effektiv skatteprocent
                      const effektivProcent = yearToDate > 0 ? Math.round((totalSkat / yearToDate) * 100) : 0;
                      
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left column - breakdown */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">B-indkomst i år</span>
                                <span className="font-medium">{yearToDate.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">AM-bidrag (8%)</span>
                                <span className="font-medium text-red-600">-{amBidrag.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-muted-foreground">Grundlag efter AM</span>
                                <span className="font-medium">{afterAm.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Personfradrag (årligt)</span>
                                <span className="font-medium text-green-600">-{personfradrag.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-muted-foreground">Skattepligtig indkomst</span>
                                <span className="font-medium">{skattepligtigIndkomst.toLocaleString('da-DK')} kr</span>
                              </div>
                            </div>
                            
                            {/* Right column - taxes */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Bundskat (12,09%)</span>
                                <span className="font-medium">{bundskat.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Kommuneskat (~24,97%)</span>
                                <span className="font-medium">{kommuneskat.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Kirkeskat (~0,68%)</span>
                                <span className="font-medium">{kirkeskat.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm border-t pt-2 font-bold">
                                <span>Estimeret skat i alt</span>
                                <span className="text-amber-700 dark:text-amber-400">{totalSkat.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Effektiv skatteprocent</span>
                                <span className="font-medium">{effektivProcent}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg mt-4">
                            <div>
                              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Du bør have lagt til side</p>
                              <p className="text-xs text-amber-700 dark:text-amber-400">Til at betale B-skat</p>
                            </div>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{totalSkat.toLocaleString('da-DK')} kr</p>
                          </div>
                          
                          <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <p>
                              Dette er et estimat baseret på gennemsnitlige satser. Din faktiske skat afhænger af din kommune, 
                              andre indkomster, og fradrag. Opdater din forskudsopgørelse på{' '}
                              <a href="https://skat.dk" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">
                                SKAT.dk
                              </a>
                              {' '}for at betale løbende B-skat.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-3">
                {payslips.map((payslip) => {
                  // Calculate estimated tax for each payslip
                  const amBidrag = Math.round(payslip.honorar * 0.08);
                  const afterAm = payslip.honorar - amBidrag;
                  const skatProcent = 0.37; // Simplified rate after AM-bidrag
                  const estimatedTax = amBidrag + Math.round(afterAm * skatProcent);
                  
                  return (
                    <div key={payslip.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{payslip.period}</p>
                            <p className="text-sm text-muted-foreground">
                              Lønperiode: {new Date(payslip.periodStart).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} - {new Date(payslip.periodEnd).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground">Honorar</p>
                            <p className="font-medium text-foreground">{payslip.honorar.toLocaleString('da-DK')} kr</p>
                          </div>
                          <div className="text-right hidden md:block">
                            <p className="text-sm text-muted-foreground">B-indkomst i alt</p>
                            <p className="font-medium text-muted-foreground">{payslip.bIndkomstYearToDate.toLocaleString('da-DK')} kr</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Udbetalt</p>
                            <p className="font-bold text-foreground">{payslip.honorar.toLocaleString('da-DK')} kr</p>
                          </div>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Estimated tax for this period */}
                      <div className="mt-3 pt-3 border-t border-dashed flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Percent className="h-4 w-4" />
                          <span>Estimeret skat for denne periode (til selvindberetning)</span>
                        </div>
                        <span className="font-medium text-amber-600 dark:text-amber-400">~{estimatedTax.toLocaleString('da-DK')} kr</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
