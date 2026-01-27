import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { da } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type PeriodType = "custom" | "week" | "month" | "year" | "ytd";

interface BookingData {
  id: string;
  start_time: string;
  service_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: string;
}

export default function SalonFinance() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; price: number }[]>([]);
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const now = new Date();
    return { from: startOfMonth(now), to: endOfMonth(now) };
  });
  const [loading, setLoading] = useState(true);

  // Update date range when period type changes
  useEffect(() => {
    const now = new Date();
    switch (periodType) {
      case "week":
        setDateRange({ from: startOfWeek(now, { locale: da }), to: endOfWeek(now, { locale: da }) });
        break;
      case "month":
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "year":
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case "ytd":
        setDateRange({ from: startOfYear(now), to: now });
        break;
      // custom keeps current selection
    }
  }, [periodType]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) { setLoading(false); return; }
      
      const { data: salon } = await supabase.from("salon_profiles").select("id").eq("owner_user_id", userId).maybeSingle();
      if (!salon?.id) { setLoading(false); return; }
      setSalonId(salon.id);

      const [{ data: bookingsData }, { data: servicesData }] = await Promise.all([
        supabase.from("salon_bookings")
          .select("id, start_time, service_id, customer_name, customer_email, status")
          .eq("salon_id", salon.id)
          .gte("start_time", dateRange.from.toISOString())
          .lte("start_time", dateRange.to.toISOString())
          .order("start_time", { ascending: false }),
        supabase.from("salon_services").select("id, name, price").eq("salon_id", salon.id),
      ]);

      setBookings(bookingsData || []);
      setServices(servicesData || []);
      setLoading(false);
    };
    load();
  }, [dateRange]);

  const priceMap = useMemo(() => new Map(services.map(s => [s.id, s.price])), [services]);
  const serviceNameMap = useMemo(() => new Map(services.map(s => [s.id, s.name])), [services]);

  const stats = useMemo(() => {
    const revenue = bookings.reduce((sum, b) => sum + (priceMap.get(b.service_id || "") || 0), 0);
    const customers = new Set(bookings.map(b => b.customer_email || b.id)).size;
    return { revenue, bookings: bookings.length, customers };
  }, [bookings, priceMap]);

  const cards = useMemo(() => ([
    { title: "Indtjening (est.)", value: `${stats.revenue.toLocaleString("da-DK")} DKK` },
    { title: "Antal kunder", value: String(stats.customers) },
    { title: "Bookinger", value: String(stats.bookings) },
  ]), [stats]);

  // Export functions
  const getExportData = () => {
    return bookings.map(b => ({
      Dato: format(new Date(b.start_time), "dd/MM/yyyy", { locale: da }),
      Tidspunkt: format(new Date(b.start_time), "HH:mm", { locale: da }),
      Kunde: b.customer_name || b.customer_email || "Ukendt",
      Service: serviceNameMap.get(b.service_id || "") || "Ukendt",
      Pris: priceMap.get(b.service_id || "") || 0,
      Status: b.status === "booked" ? "Booket" : b.status === "completed" ? "Udført" : b.status,
    }));
  };

  const exportCSV = () => {
    const data = getExportData();
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(";"),
      ...data.map(row => headers.map(h => row[h as keyof typeof row]).join(";"))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `økonomi-${format(dateRange.from, "yyyy-MM-dd")}-${format(dateRange.to, "yyyy-MM-dd")}.csv`);
  };

  const exportExcel = () => {
    // Excel-compatible CSV with proper encoding
    const data = getExportData();
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const tsvContent = [
      headers.join("\t"),
      ...data.map(row => headers.map(h => row[h as keyof typeof row]).join("\t"))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + tsvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    downloadBlob(blob, `økonomi-${format(dateRange.from, "yyyy-MM-dd")}-${format(dateRange.to, "yyyy-MM-dd")}.xls`);
  };

  const exportPDF = () => {
    const data = getExportData();
    if (data.length === 0) return;
    
    // Create printable HTML that opens in new window for PDF printing
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Økonomirapport</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          .period { color: #666; margin-bottom: 20px; }
          .summary { display: flex; gap: 40px; margin-bottom: 30px; }
          .stat { }
          .stat-label { font-size: 12px; color: #666; }
          .stat-value { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Økonomirapport</h1>
        <div class="period">Periode: ${format(dateRange.from, "d. MMMM yyyy", { locale: da })} - ${format(dateRange.to, "d. MMMM yyyy", { locale: da })}</div>
        <div class="summary">
          <div class="stat"><div class="stat-label">Indtjening (est.)</div><div class="stat-value">${stats.revenue.toLocaleString("da-DK")} DKK</div></div>
          <div class="stat"><div class="stat-label">Antal kunder</div><div class="stat-value">${stats.customers}</div></div>
          <div class="stat"><div class="stat-label">Bookinger</div><div class="stat-value">${stats.bookings}</div></div>
        </div>
        <table>
          <thead><tr>${Object.keys(data[0] || {}).map(h => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Helmet>
        <title>Økonomi – Beauty Boosters</title>
        <meta name="description" content="Overblik over indtjening, kunder og bookinger." />
        <link rel="canonical" href={`${window.location.origin}/salon/finance`} />
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Økonomi</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Denne uge</SelectItem>
              <SelectItem value="month">Denne måned</SelectItem>
              <SelectItem value="year">Dette år</SelectItem>
              <SelectItem value="ytd">År til dato</SelectItem>
              <SelectItem value="custom">Vælg periode</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date range picker */}
          {periodType === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "d. MMM", { locale: da })} - {format(dateRange.to, "d. MMM yyyy", { locale: da })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-background" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    } else if (range?.from) {
                      setDateRange({ from: range.from, to: range.from });
                    }
                  }}
                  numberOfMonths={2}
                  locale={da}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Eksporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
              <DropdownMenuItem onClick={exportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Period display */}
      <p className="text-sm text-muted-foreground">
        Viser data fra {format(dateRange.from, "d. MMMM yyyy", { locale: da })} til {format(dateRange.to, "d. MMMM yyyy", { locale: da })}
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title} className="p-4">
            <div className="text-sm text-muted-foreground">{c.title}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </Card>
        ))}
      </div>

      {/* Bookings table */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Bookinger i perioden</h2>
        {loading ? (
          <p className="text-muted-foreground">Indlæser...</p>
        ) : bookings.length === 0 ? (
          <p className="text-muted-foreground">Ingen bookinger i den valgte periode.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dato</TableHead>
                  <TableHead>Tidspunkt</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Pris</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{format(new Date(b.start_time), "d. MMM yyyy", { locale: da })}</TableCell>
                    <TableCell>{format(new Date(b.start_time), "HH:mm", { locale: da })}</TableCell>
                    <TableCell>{b.customer_name || b.customer_email || "Ukendt"}</TableCell>
                    <TableCell>{serviceNameMap.get(b.service_id || "") || "Ukendt"}</TableCell>
                    <TableCell className="text-right">{(priceMap.get(b.service_id || "") || 0).toLocaleString("da-DK")} DKK</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        b.status === "completed" && "bg-green-100 text-green-800",
                        b.status === "booked" && "bg-blue-100 text-blue-800",
                        b.status === "cancelled" && "bg-red-100 text-red-800"
                      )}>
                        {b.status === "booked" ? "Booket" : b.status === "completed" ? "Udført" : b.status === "cancelled" ? "Aflyst" : b.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
