import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, MapPin, User, Mail, Phone } from "lucide-react";

const BookingConfirmation = () => {
  const location = useLocation();
  const { booking, booster } = location.state || {};

  if (!booking || !booster) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Booking ikke fundet</h2>
          <Link to="/stylists">
            <Button>Tilbage til stylister</Button>
          </Link>
        </div>
      </div>
    );
  }

  const bookingDate = new Date(booking.service_date);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Booking Bekræftet!</h1>
        <p className="text-muted-foreground">
          Din booking anmodning er sendt til {booster.name}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Detaljer</CardTitle>
          <CardDescription>
            Din booking reference: #BK{Math.random().toString(36).substr(2, 9).toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <img
              src={booster.portfolio_image_url}
              alt={booster.name}
              className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{booster.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                {booster.location}
              </div>
              <div className="flex flex-wrap gap-1">
                {booster.specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Dato</p>
                <p className="font-medium">{bookingDate.toLocaleDateString('da-DK')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tidspunkt</p>
                <p className="font-medium">{bookingDate.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-t">
            <span className="text-sm text-muted-foreground">Varighed:</span>
            <span className="font-medium">{booking.duration_hours} time{booking.duration_hours > 1 ? 'r' : ''}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total pris:</span>
            <span className="font-semibold text-lg text-primary">{booking.total_price} kr</span>
          </div>

          {booking.notes && (
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground mb-1">Særlige ønsker:</p>
              <p className="text-sm bg-muted/50 p-3 rounded">{booking.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Næste Skridt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <p className="font-medium">Bekræftelse fra stylist</p>
              <p className="text-sm text-muted-foreground">
                {booster.name} vil bekræfte din booking inden for 24 timer
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <p className="font-medium">Betaling</p>
              <p className="text-sm text-muted-foreground">
                Du modtager et betalingslink efter bekræftelse
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <p className="font-medium">Påmindelse</p>
              <p className="text-sm text-muted-foreground">
                Du får en påmindelse 24 timer før din aftale
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kontakt Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">support@beautyboosters.dk</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">+45 12 34 56 78</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/bookings" className="flex-1">
          <Button variant="outline" className="w-full">
            Se Mine Bookinger
          </Button>
        </Link>
        <Link to="/stylists" className="flex-1">
          <Button className="w-full">
            Book Mere
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;