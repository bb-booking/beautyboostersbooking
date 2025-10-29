import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
export default function AdminLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        navigate("/admin/messages", { replace: true });
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔐 Starting login attempt with:", email);
    setLoading(true);
    try {
      if (mode === "login") {
        console.log("🔐 Attempting signInWithPassword...");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.log("❌ Supabase auth error:", error);
          throw error;
        }
        console.log("✅ Authentication successful, user:", data.user?.email);
        const user = data.user || (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error("Kunne ikke hente bruger-ID");
        const userId = user.id;
        const userEmail = (user.email || "").toLowerCase();
        console.log("👤 User ID:", userId, "Email:", userEmail);

        console.log("🔍 Checking user roles...");
        let { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (rolesError) {
          console.log("❌ Role check error:", rolesError);
          throw rolesError;
        }
        console.log("📋 Current roles:", roles);

        // Bootstrap: giv admin-rolle til den autoriserede e-mail, hvis mangler
        const authorizedAdminEmails = ["hello@beautyboosters.dk", "louise@beautyboosters.dk"];
        const hasAdmin = roles?.some((r) => r.role === "admin");
        const isAuthorizedEmail = authorizedAdminEmails.includes(userEmail);
        console.log("🔐 Has admin role:", hasAdmin, "Authorized email match:", isAuthorizedEmail);
        if (!hasAdmin && isAuthorizedEmail) {
          console.log("➕ Adding admin role for authorized email...");
          const { error: insertErr } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "admin" });
          if (insertErr) {
            console.log("❌ Admin role insert error:", insertErr);
            throw insertErr;
          }
          console.log("✅ Admin role added, refetching roles...");
          const refetch = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId);
          roles = refetch.data || roles;
          console.log("📋 Updated roles:", roles);
        }

        const isAdmin = roles?.some((r) => r.role === "admin");
        console.log("🎯 Final admin check:", isAdmin);
        if (!isAdmin) {
          console.log("❌ User is not admin, signing out...");
          await supabase.auth.signOut();
          throw new Error("Denne konto har ikke admin-adgang.");
        }
        console.log("✅ Admin access confirmed, navigating...");
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

  const handleSendReset = async () => {
    const targetEmail = resetEmail || email;
    if (!targetEmail) {
      toast({ title: "Manglende email", description: "Indtast din e-mail for at nulstille adgangskoden.", variant: "destructive" });
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Mail sendt", description: "Tjek din e-mail for link til nulstilling." });
      setResetOpen(false);
    } catch (err: any) {
      toast({ title: "Fejl", description: err.message, variant: "destructive" });
    } finally {
      setSendingReset(false);
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

        {mode === "login" && (
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <div className="mt-3 text-right">
              <button className="underline text-sm" onClick={() => setResetOpen(true)}>Glemt adgangskode?</button>
            </div>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nulstil adgangskode</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="resetEmail">E-mail</Label>
                <Input id="resetEmail" type="email" placeholder="din@email.dk" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                <p className="text-xs text-muted-foreground">Vi sender et link til at vælge en ny adgangskode.</p>
              </div>
              <DialogFooter>
                <Button onClick={handleSendReset} disabled={sendingReset} className="w-full">{sendingReset ? "Sender…" : "Send nulstillingsmail"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

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
