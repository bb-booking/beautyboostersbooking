import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Star,
  Plus,
  History,
  Home,
  Settings,
  Heart
} from "lucide-react";

interface Booking {
  id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  location: string;
  amount: number;
  status: string;
  booster_name?: string;
  created_at: string;
}

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  postal_code: string;
  city: string;
  is_default: boolean;
}

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      await Promise.all([
        fetchBookings(session.user.email!),
        fetchSavedAddresses(session.user.id)
      ]);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_email', email)
        .order('booking_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchSavedAddresses = async (userId: string) => {
    // Mock data for now - we'll create this table later
    setSavedAddresses([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bekræftet';
      case 'pending_payment':
        return 'Afventer betaling';
      case 'completed':
        return 'Gennemført';
      case 'cancelled':
        return 'Annulleret';
      default:
        return status;
    }
  };

  const handleRebook = (booking: Booking) => {
    // Pre-fill booking form with previous booking details
    sessionStorage.setItem('rebookingData', JSON.stringify({
      serviceId: booking.service_name,
      address: booking.location,
    }));
    navigate('/services');
    toast.success('Genbestil din tidligere booking');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => 
    new Date(b.booking_date) >= new Date() && b.status === 'confirmed'
  );
  
  const pastBookings = bookings.filter(b => 
    new Date(b.booking_date) < new Date() || b.status === 'completed'
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mit Beauty Boosters</h1>
          <p className="text-muted-foreground mt-1">
            Velkommen tilbage, {user?.email?.split('@')[0]}
          </p>
        </div>
        <Button onClick={() => navigate('/services')} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Ny booking
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/services')}>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Book nu</h3>
            <p className="text-sm text-muted-foreground">Ny booking</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/stylists')}>
          <CardContent className="p-6 text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Mine favoritter</h3>
            <p className="text-sm text-muted-foreground">Dine boosters</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Mine adresser</h3>
            <p className="text-sm text-muted-foreground">{savedAddresses.length} gemt</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Indstillinger</h3>
            <p className="text-sm text-muted-foreground">Profil & mere</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kommende bookinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{booking.service_name}</h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(booking.booking_date), 'EEEE d. MMMM yyyy', { locale: da })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Kl. {booking.booking_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {booking.location}
                          </div>
                          {booking.booster_name && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {booking.booster_name}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-2">
                          {booking.amount} kr
                        </div>
                        <Button variant="outline" size="sm">
                          Se detaljer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Tidligere bookinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Ingen tidligere bookinger</h3>
              <p className="text-muted-foreground mb-4">
                Book din første behandling hos os
              </p>
              <Button onClick={() => navigate('/services')}>
                Se vores services
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{booking.service_name}</h4>
                          <Badge variant="outline" className={getStatusColor(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(booking.booking_date), 'd. MMM yyyy', { locale: da })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.location}
                          </span>
                          {booking.booster_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {booking.booster_name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-4">
                          <div className="font-semibold">{booking.amount} kr</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRebook(booking)}
                        >
                          Genbestil
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
