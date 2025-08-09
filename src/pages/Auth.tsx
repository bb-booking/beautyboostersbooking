import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function Auth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Logget ind" });
        navigate("/");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ title: "Bruger oprettet", description: "Tjek din e-mail for bekræftelse." });
      }
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <Helmet>
        <title>Log ind / Opret – Beauty Boosters</title>
        <meta name="description" content="Log ind eller opret konto som kunde hos Beauty Boosters." />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>
      <Card className="p-6">
        <h1 className="text-xl font-semibold mb-4">Kunde {mode === "login" ? "login" : "signup"}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Arbejder…" : mode === "login" ? "Log ind" : "Opret"}</Button>
        </form>
        <div className="text-sm text-muted-foreground mt-4 space-y-2">
          {mode === "login" ? (
            <button className="underline" onClick={() => setMode("signup")}>Har du ikke en konto? Opret</button>
          ) : (
            <button className="underline" onClick={() => setMode("login")}>Har du allerede en konto? Log ind</button>
          )}
          <div>
            Booster / Salon? <Link to="/booster/login" className="underline">Log ind som Booster</Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
