import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("hello@beautyboosters.dk");
  const [password, setPassword] = useState("Skovlund42!");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/admin/messages");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin/messages");
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
        navigate("/admin/messages");
      } else {
        const redirectUrl = `${window.location.origin}/admin/messages`;
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
      <Card className="p-6">
        <h1 className="text-xl font-semibold mb-4">Admin {mode === "login" ? "login" : "signup"}</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Arbejder…" : mode === "login" ? "Log ind" : "Opret"}</Button>
        </form>
        <div className="text-sm text-muted-foreground mt-4">
          {mode === "login" ? (
            <button className="underline" onClick={() => setMode("signup")}>Har du ikke en konto? Opret</button>
          ) : (
            <button className="underline" onClick={() => setMode("login")}>Har du allerede en konto? Log ind</button>
          )}
        </div>
      </Card>
    </div>
  );
}
