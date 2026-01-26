import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Download,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, getYear, getMonth } from "date-fns";
import { da } from "date-fns/locale";

interface BookingOverviewItem {
  id: string;
  date: string;
  customer_name: string | null;
  customer_email: string;
  service_name: string;
  amount: number;
  booster_name: string | null;
  status: string;
  payment_captured_at: string | null;
  special_requests: string | null;
  location: string | null;
}

interface MonthlyGroup {
  month: string;
  monthLabel: string;
  bookings: BookingOverviewItem[];
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  bookingCount: number;
}

const monthNames = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December"
];

export default function AdminMonthlyOverview() {
  const [bookings, setBookings] = useState<BookingOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookings();
  }, [selectedYear]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_date, customer_name, customer_email, service_name, amount, booster_name, status, payment_captured_at, special_requests, location")
        .gte("booking_date", startDate)
        .lte("booking_date", endDate)
        .order("booking_date", { ascending: true });

      if (error) throw error;

      setBookings(data?.map(b => ({
        ...b,
        date: b.booking_date,
      })) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!searchTerm) return bookings;
    const search = searchTerm.toLowerCase();
    return bookings.filter(b => 
      (b.customer_name?.toLowerCase() || "").includes(search) ||
      b.customer_email.toLowerCase().includes(search) ||
      b.service_name.toLowerCase().includes(search) ||
      (b.booster_name?.toLowerCase() || "").includes(search)
    );
  }, [bookings, searchTerm]);

  const monthlyGroups = useMemo(() => {
    const groups: Record<string, MonthlyGroup> = {};

    filteredBookings.forEach(booking => {
      const date = parseISO(booking.date);
      const monthKey = format(date, "yyyy-MM");
      const monthIndex = getMonth(date);

      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthKey,
          monthLabel: monthNames[monthIndex],
          bookings: [],
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          bookingCount: 0,
        };
      }

      const isPaid = !!booking.payment_captured_at || booking.status === "completed" || booking.status === "confirmed";
      
      groups[monthKey].bookings.push(booking);
      groups[monthKey].totalAmount += Number(booking.amount) || 0;
      groups[monthKey].bookingCount += 1;
      
      if (isPaid) {
        groups[monthKey].paidAmount += Number(booking.amount) || 0;
      } else {
        groups[monthKey].unpaidAmount += Number(booking.amount) || 0;
      }
    });

    return Object.values(groups).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredBookings]);

  const yearStats = useMemo(() => {
    return {
      totalBookings: filteredBookings.length,
      totalRevenue: filteredBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0),
      paidRevenue: filteredBookings
        .filter(b => !!b.payment_captured_at || b.status === "completed" || b.status === "confirmed")
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0),
      unpaidRevenue: filteredBookings
        .filter(b => !b.payment_captured_at && b.status !== "completed" && b.status !== "confirmed")
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0),
    };
  }, [filteredBookings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "d. MMM", { locale: da });
  };

  const getPaymentStatus = (booking: BookingOverviewItem) => {
    if (booking.payment_captured_at || booking.status === "completed" || booking.status === "confirmed") {
      return { paid: true, label: "Betalt", variant: "default" as const };
    }
    if (booking.status === "cancelled") {
      return { paid: false, label: "Annulleret", variant: "destructive" as const };
    }
    return { paid: false, label: "Afventer", variant: "secondary" as const };
  };

  const availableYears = [2024, 2025, 2026, 2027];

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Månedsoverblik</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Månedsoverblik</h1>
          <p className="text-muted-foreground">
            Overblik over bookings, betalinger og omsætning pr. måned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear.toString()}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Vælg år" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Year Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{yearStats.totalBookings}</p>
                <p className="text-xs text-muted-foreground">Bookings i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(yearStats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Total omsætning</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(yearStats.paidRevenue)}</p>
                <p className="text-xs text-muted-foreground">Betalt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(yearStats.unpaidRevenue)}</p>
                <p className="text-xs text-muted-foreground">Afventer betaling</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Søg på kunde, service eller booster..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Monthly Groups */}
      {monthlyGroups.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Ingen bookings fundet</h3>
            <p className="text-muted-foreground">
              Der er ingen bookings for {selectedYear}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {monthlyGroups.map((group) => (
            <Card key={group.month}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Calendar className="h-5 w-5" />
                    {group.monthLabel}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-foreground">
                      {group.bookingCount} bookings
                    </Badge>
                    <Badge variant="default" className="bg-green-600">
                      <Check className="h-3 w-3 mr-1" />
                      {formatCurrency(group.paidAmount)}
                    </Badge>
                    {group.unpaidAmount > 0 && (
                      <Badge variant="secondary" className="text-foreground">
                        <X className="h-3 w-3 mr-1" />
                        {formatCurrency(group.unpaidAmount)} afventer
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Dato</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Behandling</TableHead>
                        <TableHead className="text-right">Pris</TableHead>
                        <TableHead>Booster</TableHead>
                        <TableHead className="text-center">Betalt</TableHead>
                        <TableHead>Kommentar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.bookings.map((booking) => {
                        const paymentStatus = getPaymentStatus(booking);
                        return (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium text-foreground whitespace-nowrap">
                              {formatDate(booking.date)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">
                                  {booking.customer_name || "Ukendt"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {booking.customer_email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {booking.service_name}
                            </TableCell>
                            <TableCell className="text-right font-medium text-foreground whitespace-nowrap">
                              {formatCurrency(Number(booking.amount))}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {booking.booster_name || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {paymentStatus.paid ? (
                                <Badge variant="default" className="bg-green-600">
                                  <Check className="h-3 w-3" />
                                </Badge>
                              ) : (
                                <Badge variant={paymentStatus.variant}>
                                  {paymentStatus.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {booking.special_requests || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
