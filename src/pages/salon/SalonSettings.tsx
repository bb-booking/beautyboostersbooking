import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";

export default function SalonSettings() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Helmet>
        <title>Indstillinger – Beauty Boosters</title>
        <meta name="description" content="Salonens indstillinger." />
        <link rel="canonical" href={`${window.location.origin}/salon/settings`} />
      </Helmet>
      <h1 className="text-2xl font-bold">Indstillinger</h1>
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Flere indstillinger kommer snart.</div>
      </Card>
    </div>
  );
}
