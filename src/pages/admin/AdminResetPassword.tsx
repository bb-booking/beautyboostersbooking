import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function AdminResetPassword() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Exchange the hash fragment for a session
    const handlePasswordRecovery = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) throw error;
          setSessionReady(true);
        } catch (err: any) {
          toast({ 
            title: "Fejl", 
            description: "Ugyldig eller udløbet link. Anmod om en ny nulstilling.", 
            variant: "destructive" 
          });
        }
      } else {
        // Check if already has a session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setSessionReady(true);
          } else {
            toast({ 
              title: "Auth session missing!", 
              description: "Klik på linket i din email for at nulstille din adgangskode.",
              variant: "destructive" 
            });
          }
        });
      }
    };

    handlePasswordRecovery();
  }, [toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "For kort adgangskode", description: "Mindst 6 tegn.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Adgangskoder matcher ikke", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Adgangskode opdateret" });
      window.location.href = "/admin/login";
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Indlæser...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card className="p-6">
        <h1 className="text-xl font-semibold mb-4">Vælg ny adgangskode</h1>
        <form className="space-y-4" onSubmit={handleUpdate}>
          <Input type="password" placeholder="Ny adgangskode" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input type="password" placeholder="Gentag adgangskode" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Opdaterer…" : "Opdater adgangskode"}</Button>
        </form>
      </Card>
    </div>
  );
}
