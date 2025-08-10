import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function SalonFinance() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, customers: 0 });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;
      const { data: salon } = await supabase.from("salon_profiles").select("id").eq("owner_user_id", userId).maybeSingle();
      if (!salon?.id) return;
      setSalonId(salon.id);
      const [{ data: bookings }, { data: services }] = await Promise.all([
        supabase.from("salon_bookings").select("id, service_id, customer_email").eq("salon_id", salon.id),
        supabase.from("salon_services").select("id, price").eq("salon_id", salon.id),
      ]);
      const priceMap = new Map((services || []).map(s => [s.id, s.price]));
      const revenue = (bookings || []).reduce((sum, b) => sum + (priceMap.get(b.service_id as any) || 0), 0);
      const customers = new Set((bookings || []).map(b => b.customer_email || b.id)).size;
      setStats({ revenue, bookings: bookings?.length || 0, customers });
    };
    load();
  }, []);

  const cards = useMemo(() => ([
    { title: "Indtjening (est.)", value: `${stats.revenue} DKK` },
    { title: "Antal kunder", value: String(stats.customers) },
    { title: "Bookinger", value: String(stats.bookings) },
  ]), [stats]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Økonomi – Beauty Boosters</title>
        <meta name="description" content="Overblik over indtjening, kunder og bookinger." />
        <link rel="canonical" href={`${window.location.origin}/salon/finance`} />
      </Helmet>
      <h1 className="text-2xl font-bold">Økonomi</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title} className="p-4">
            <div className="text-sm text-muted-foreground">{c.title}</div>
            <div className="text-2xl font-semibold mt-1">{c.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
