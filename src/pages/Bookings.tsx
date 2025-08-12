import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, Phone, MessageCircle } from "lucide-react";

// Mock data for demonstration
const mockBookings = [
  {
    id: 1,
    booster: {
      name: "Anna G.",
      image: "/placeholder.svg",
      location: "København K"
    },
    date: new Date(Date.now() + 86400000 * 3), // 3 days from now
    duration: 2,
    price: 800,
    status: "confirmed",
    service: "Bryllup makeup og hårstyling"
  },
  {
    id: 2,
    booster: {
      name: "Angelica",
      image: "/placeholder.svg", 
      location: "Frederiksberg"
    },
    date: new Date(Date.now() + 86400000 * 7), // 1 week from now
    duration: 1,
    price: 350,
    status: "pending",
    service: "Evening makeup"
  },
  {
    id: 3,
    booster: {
      name: "Clara Alma",
      image: "/placeholder.svg",
      location: "Østerbro"
    },
    date: new Date(Date.now() - 86400000 * 5), // 5 days ago
    duration: 3,
    price: 1200,
    status: "completed",
    service: "Festmakeup og opsætning"
  }
];

const Bookings = () => {
  const [bookings] = useState(mockBookings);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
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
      case 'pending':
        return 'Afventer';
      case 'completed':
        return 'Gennemført';
      case 'cancelled':
        return 'Aflyst';
      default:
        return status;
    }
  };

  const upcomingBookings = bookings.filter(booking => 
    booking.date > new Date() && booking.status !== 'cancelled'
  );

  const pastBookings = bookings.filter(booking => 
    booking.date < new Date() || booking.status === 'completed'
  );

  const pendingBookings = bookings.filter(booking => 
    booking.status === 'pending'
  );

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <img
              src={booking.booster.image}
              alt={booking.booster.name}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div>
              <h3 className="font-semibold text-lg">{booking.booster.name}</h3>
              <p className="text-sm text-muted-foreground">{booking.service}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {booking.booster.location}
              </div>
            </div>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusText(booking.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{booking.date.toLocaleDateString('da-DK')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{booking.duration} time{booking.duration > 1 ? 'r' : ''}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">{booking.price} kr</span>
          <div className="flex gap-2">
            {booking.status === 'confirmed' && booking.date > new Date() && (
              <>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Besked
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Ring
                </Button>
              </>
            )}
            {booking.status === 'completed' && (
              <Button variant="outline" size="sm">
                Anmeld
              </Button>
            )}
            {booking.status === 'pending' && (
              <Button variant="outline" size="sm">
                Rediger
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mine Bookinger</h1>
          <p className="text-muted-foreground">Oversigt over dine aftaler og behandlinger</p>
        </div>
        <Link to="/stylists">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Book Nu
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Kommende ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Afventer ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Tidligere ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingBookings.length > 0 ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen kommende bookinger</h3>
                <p className="text-muted-foreground mb-4">
                  Du har ingen planlagte aftaler. Book din næste behandling nu!
                </p>
                <Link to="/stylists">
                  <Button>Find Artist</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          {pendingBookings.length > 0 ? (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen afventende bookinger</h3>
                <p className="text-muted-foreground">
                  Alle dine bookinger er blevet bekræftet eller afsluttet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastBookings.length > 0 ? (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen tidligere bookinger</h3>
                <p className="text-muted-foreground">
                  Du har ikke haft nogen behandlinger endnu.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Bookings;