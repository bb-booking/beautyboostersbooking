import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign, TrendingUp, Clock, FileText } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { da } from "date-fns/locale";

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

export default function BoosterFinance() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobEarning[]>([]);

  // Mock data
  useEffect(() => {
    const mockEarnings: EarningsData[] = [
      { period: 'I dag', jobs: 2, hours: 8, gross: 4800, tax: 1200, net: 3600 },
      { period: 'Denne uge', jobs: 8, hours: 32, gross: 19200, tax: 4800, net: 14400 },
      { period: 'Denne måned', jobs: 24, hours: 96, gross: 57600, tax: 14400, net: 43200 },
    ];

    const mockJobs: JobEarning[] = [
      {
        id: '1',
        title: 'Bryllup - Sarah & Mikael',
        client: 'Sarah Jensen',
        date: '2024-01-20',
        hours: 6,
        hourlyRate: 600,
        total: 3600,
        status: 'completed'
      },
      {
        id: '2', 
        title: 'Fotoshoot - Mode Magazine',
        client: 'Mode Magazine',
        date: '2024-01-18',
        hours: 4,
        hourlyRate: 700,
        total: 2800,
        status: 'paid'
      },
      {
        id: '3',
        title: 'Event makeup - Gala',
        client: 'Copenhagen Events',
        date: '2024-01-15',
        hours: 5,
        hourlyRate: 650,
        total: 3250,
        status: 'pending'
      }
    ];

    setEarningsData(mockEarnings);
    setRecentJobs(mockJobs);
  }, []);

  const currentEarnings = earningsData.find(data => {
    if (selectedPeriod === 'day') return data.period === 'I dag';
    if (selectedPeriod === 'week') return data.period === 'Denne uge';
    if (selectedPeriod === 'month') return data.period === 'Denne måned';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(selectedDate, "PPP", { locale: da })}
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jobs</p>
                <p className="text-2xl font-bold">{currentEarnings?.jobs || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Timer</p>
                <p className="text-2xl font-bold">{currentEarnings?.hours || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brutto</p>
                <p className="text-2xl font-bold">{currentEarnings?.gross?.toLocaleString('da-DK') || 0} kr</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Netto</p>
                <p className="text-2xl font-bold">{currentEarnings?.net?.toLocaleString('da-DK') || 0} kr</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Jobs & Betalinger</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
          <TabsTrigger value="documents">Dokumenter</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seneste jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{job.title}</h4>
                        <Badge variant={getStatusColor(job.status)}>
                          {getStatusText(job.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{job.client}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.date).toLocaleDateString('da-DK')} • {job.hours} timer • {job.hourlyRate} kr
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

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Indtjening over tid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>Graf over indtjening kommer her</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lønsedler & Fakturaer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Ingen dokumenter endnu</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Lønsedler og fakturaer vil vises her når de er klar
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}