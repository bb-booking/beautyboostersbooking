import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

export default function SalonPayouts() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Helmet>
        <title>Opsæt udbetalinger – Beauty Boosters</title>
        <meta name="description" content="Opsæt Stripe Connect udbetalinger for din salon på Beauty Boosters." />
        <link rel="canonical" href={`${window.location.origin}/salon/payouts`} />
      </Helmet>
      <h1 className="text-2xl font-bold">Opsæt udbetalinger</h1>
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Du kan forbinde din salon til Stripe for at modtage udbetalinger. Denne funktion bliver tilføjet snart.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
