import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  MapPin,
  Clock,
  Star,
  User,
  Camera
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { da } from "date-fns/locale";

interface Booking {
  id: string;
  title: string;
  client_name: string;
  client_phone: string;
  date_needed: string;
  time_needed: string;
  location: string;
  service_type: string;
  hourly_rate: number;
  duration_hours: number;
  status: string;
  description?: string;
}

type ViewMode = 'day' | 'week' | 'month';

const BoosterCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .in("status", ["confirmed", "in_progress", "completed"]);
        
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const getDateRange = () => {
    switch (viewMode) {
      case 'day':
        return [currentDate];
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
      case 'month':
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.date_needed), date)
    );
  };

  const formatDateHeader = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE d. MMMM yyyy', { locale: da });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `Uge ${format(weekStart, 'w')} • ${format(weekStart, 'd. MMM', { locale: da })} - ${format(weekEnd, 'd. MMM yyyy', { locale: da })}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: da });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bekræftet';
      case 'in_progress': return 'I gang';
      case 'completed': return 'Afsluttet';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Min kalender</h2>
          <div className="animate-pulse h-8 w-32 bg-muted rounded"></div>
        </div>
        <div className="animate-pulse h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  const dateRange = getDateRange();

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Min kalender</h2>
          <Badge variant="secondary" className="text-sm">
            {bookings.length} bookinger denne måned
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View mode buttons */}
          <div className="flex border rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="text-xs"
              >
                {mode === 'day' ? 'Dag' : mode === 'week' ? 'Uge' : 'Måned'}
              </Button>
            ))}
          </div>
          
          {/* Navigation arrows */}
          <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* Today button */}
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            I dag
          </Button>
        </div>
      </div>

      {/* Date header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-muted-foreground">
          {formatDateHeader()}
        </h3>
      </div>

      {/* Calendar grid */}
      <div className="grid gap-4">
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
        )}
        
        <div className={`grid gap-4 ${
          viewMode === 'day' ? 'grid-cols-1' : 
          viewMode === 'week' ? 'grid-cols-7' : 
          'grid-cols-7'
        }`}>
          {dateRange.map((date, index) => {
            const dayBookings = getBookingsForDate(date);
            const isToday = isSameDay(date, new Date());
            
            return (
              <Card 
                key={index} 
                className={`min-h-[120px] ${isToday ? 'ring-2 ring-primary' : ''} hover:shadow-md transition-shadow`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {viewMode === 'month' ? format(date, 'd', { locale: da }) : format(date, 'EEE d', { locale: da })}
                    </span>
                    {dayBookings.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayBookings.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0 space-y-2">
                  {dayBookings.slice(0, 3).map((booking, bookingIndex) => (
                    <div
                      key={bookingIndex}
                      className="p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted transition-colors group"
                      onClick={() => console.log('Open booking details', booking.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(booking.status)}`}></div>
                            <span className="text-xs font-medium truncate">
                              {booking.time_needed} - {booking.client_name}
                            </span>
                          </div>
                          
                          <div className="text-xs text-muted-foreground truncate mb-1">
                            {booking.service_type}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{booking.location}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-medium">
                            {booking.hourly_rate} kr/t
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MessageSquare className="h-3 w-3 text-muted-foreground hover:text-primary cursor-pointer" />
                            <Camera className="h-3 w-3 text-muted-foreground hover:text-primary cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayBookings.length - 3} flere
                    </div>
                  )}
                  
                  {dayBookings.length === 0 && viewMode === 'day' && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Ingen bookinger denne dag</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">I dag</p>
                <p className="text-2xl font-bold">
                  {getBookingsForDate(new Date()).length}
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Denne uge</p>
                <p className="text-2xl font-bold">
                  {bookings.filter(b => {
                    const bookingDate = new Date(b.date_needed);
                    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
                    return bookingDate >= weekStart && bookingDate <= weekEnd;
                  }).length}
                </p>
              </div>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Indtjening (uge)</p>
                <p className="text-2xl font-bold">4.200 kr</p>
              </div>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BoosterCalendar;