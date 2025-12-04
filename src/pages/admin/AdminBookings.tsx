import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, User, Phone, Mail, Filter } from "lucide-react";

// This would be fetched from database when bookings table is created
interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booster_name: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  location: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data for now - will be replaced with Supabase query
  useEffect(() => {
    const mockBookings: Booking[] = [
      {
        id: "1",
        customer_name: "Anna Nielsen",
        customer_email: "anna@email.dk",
        customer_phone: "+45 12 34 56 78",
        booster_name: "Marie Hansen",
        service_type: "Bryllupsmakeup",
        booking_date: "2024-01-15",
        booking_time: "10:00",
        location: "København",
        status: "confirmed",
        total_amount: 2500,
        created_at: "2024-01-10"
      },
      {
        id: "2",
        customer_name: "Sofie Larsen",
        customer_email: "sofie@email.dk",
        customer_phone: "+45 87 65 43 21",
        booster_name: "Laura Andersen",
        service_type: "Fotoshoot makeup",
        booking_date: "2024-01-16",
        booking_time: "14:00",
        location: "Aarhus",
        status: "pending",
        total_amount: 1800,
        created_at: "2024-01-11"
      }
    ];

    setTimeout(() => {
      setBookings(mockBookings);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bekræftet';
      case 'pending': return 'Afventer';
      case 'completed': return 'Gennemført';
      case 'cancelled': return 'Aflyst';
      default: return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.booster_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Bookinger</h2>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold">Bookinger</h2>
        <Badge variant="outline" className="w-fit">
          {filteredBookings.length} bookinger
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Input
            placeholder="Søg efter kunde, booster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4 mr-2 shrink-0" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle bookinger</SelectItem>
            <SelectItem value="pending">Afventer</SelectItem>
            <SelectItem value="confirmed">Bekræftet</SelectItem>
            <SelectItem value="completed">Gennemført</SelectItem>
            <SelectItem value="cancelled">Aflyst</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Booking #{booking.id}
                </CardTitle>
                <Badge className={getStatusColor(booking.status)}>
                  {getStatusText(booking.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">KUNDE INFORMATION</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${booking.customer_email}`}
                        className="text-primary hover:text-primary/80"
                      >
                        {booking.customer_email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${booking.customer_phone}`}
                        className="text-primary hover:text-primary/80"
                      >
                        {booking.customer_phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">BOOKING DETALJER</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Booster: <span className="font-medium">{booking.booster_name}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>Service: <span className="font-medium">{booking.service_type}</span></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(booking.booking_date).toLocaleDateString('da-DK')}</span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-4" />
                      <span>{booking.booking_time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-lg">{booking.total_amount} DKK</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Oprettet: {new Date(booking.created_at).toLocaleDateString('da-DK')}
                </p>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    Se detaljer
                  </Button>
                  <Button variant="outline" size="sm">
                    Rediger
                  </Button>
                  {booking.status === 'pending' && (
                    <Button size="sm">
                      Bekræft
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-2">Ingen bookinger fundet</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Ingen bookinger matcher dine søgekriterier"
                : "Der er ingen bookinger endnu"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBookings;