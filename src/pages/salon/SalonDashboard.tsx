import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function SalonDashboard() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Helmet>
        <title>Salon dashboard – Beauty Boosters</title>
        <meta name="description" content="Overblik for salon-ejere på Beauty Boosters: status, udbetalinger, services og åbningstider." />
        <link rel="canonical" href={`${window.location.origin}/salon/dashboard`} />
      </Helmet>
      <h1 className="text-2xl font-bold">Velkommen til din Salon</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Profilstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Færdiggør din profil for at blive synlig.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/salon/services">Tilføj services</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/salon/hours">Åbningstider</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Udbetalinger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Opsæt Stripe Connect for udbetalinger.</p>
            <div className="mt-4">
              <Button asChild>
                <Link to="/salon/payouts">Opsæt udbetalinger</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hurtige genveje</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <Button variant="secondary" asChild>
              <Link to="/salon/calendar">Kalender</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/salon/settings">Indstillinger</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
