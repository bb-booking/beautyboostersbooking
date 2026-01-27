import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function SalonTeam() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; avatar_url: string | null }>>([]);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) return;
      const { data: salon } = await supabase.from("salon_profiles").select("id").eq("owner_user_id", userId).maybeSingle();
      if (salon?.id) {
        setSalonId(salon.id);
        const { data: emps } = await supabase.from("salon_employees").select("id,name,avatar_url").eq("salon_id", salon.id).order("name");
        setEmployees(emps || []);
      }
    };
    load();
  }, []);

  const addEmployee = async () => {
    if (!salonId || !newName.trim()) return;
    const { data, error } = await supabase.from("salon_employees").insert({ salon_id: salonId, name: newName.trim(), avatar_url: newAvatar || null }).select("id,name,avatar_url").single();
    if (!error && data) {
      setEmployees((prev) => [...prev, data]);
      setNewName("");
      setNewAvatar("");
    }
  };

  const removeEmployee = async (id: string) => {
    await supabase.from("salon_employees").delete().eq("id", id);
    setEmployees((prev) => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <Helmet>
        <title>Team – Beauty Boosters</title>
        <meta name="description" content="Administrer salonens team, arbejdstider og rettigheder." />
        <link rel="canonical" href={`${window.location.origin}/salon/team`} />
      </Helmet>
      <h1 className="text-2xl font-bold">Team</h1>
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Navn</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Medarbejdernavn" />
          </div>
          <div>
            <Label>Profilbillede URL</Label>
            <Input value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-end">
            <Button onClick={addEmployee} disabled={!salonId || !newName.trim()}>Tilføj</Button>
          </div>
        </div>
        <div className="divide-y">
          {employees.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <img src={e.avatar_url || "/placeholder.svg"} alt={`Profilbillede af ${e.name}`} className="h-10 w-10 rounded-full object-cover" />
                <div className="font-medium">{e.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => removeEmployee(e.id)}>Fjern</Button>
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">Ingen medarbejdere endnu. Tilføj dine medarbejdere for at se dem i kalenderen.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
