import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"] as const;
const DAY_LABEL: Record<typeof DAYS[number], string> = { mon: "Mandag", tue: "Tirsdag", wed: "Onsdag", thu: "Torsdag", fri: "Fredag", sat: "Lørdag", sun: "Søndag" };

type DayCfg = { start: string; end: string; closed: boolean };

export default function SalonHours() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [hours, setHours] = useState<Record<string, DayCfg>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;
      const { data: salon } = await supabase.from("salon_profiles").select("id,opening_hours").eq("owner_user_id", userId).maybeSingle();
      if (salon?.id) {
        setSalonId(salon.id);
        const oh = (salon.opening_hours as unknown as Record<string, DayCfg>) ?? ({} as Record<string, DayCfg>);
        setHours(oh);
      }
    };
    load();
  }, []);

  const save = async () => {
    if (!salonId) return;
    await supabase.from("salon_profiles").update({ opening_hours: hours }).eq("id", salonId);
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Åbningstider – Beauty Boosters</title>
        <meta name="description" content="Rediger salonens åbningstider." />
        <link rel="canonical" href={`${window.location.origin}/salon/hours`} />
      </Helmet>
      <h1 className="text-2xl font-bold">Åbningstider</h1>
      <Card className="p-4 space-y-4">
        {DAYS.map((d) => (
          <div key={d} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="font-medium">{DAY_LABEL[d]}</div>
            <div>
              <Label>Fra</Label>
              <Input value={hours?.[d]?.start || "09:00"} onChange={(e) => setHours(h => ({
                ...h,
                [d]: { start: e.target.value, end: (h?.[d]?.end ?? "17:00"), closed: h?.[d]?.closed ?? false }
              }))} />
            </div>
            <div>
              <Label>Til</Label>
              <Input value={hours?.[d]?.end || "17:00"} onChange={(e) => setHours(h => ({
                ...h,
                [d]: { start: (h?.[d]?.start ?? "09:00"), end: e.target.value, closed: h?.[d]?.closed ?? false }
              }))} />
            </div>
            <div>
              <Label>Lukket</Label>
              <input
                type="checkbox"
                checked={hours?.[d]?.closed || false}
                onChange={(e) => setHours(h => ({
                  ...h,
                  [d]: { start: (h?.[d]?.start ?? "09:00"), end: (h?.[d]?.end ?? "17:00"), closed: e.target.checked }
                }))}
              />
            </div>
          </div>
        ))}
        <div className="flex justify-end"><Button onClick={save} disabled={!salonId}>Gem</Button></div>
      </Card>
    </div>
  );
}
