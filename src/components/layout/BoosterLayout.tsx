import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BoosterSidebar } from "./BoosterSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function BoosterLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setAuthorized(false);
        setChecking(false);
        navigate("/booster/login");
      } else {
        setTimeout(async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          const isBooster = !error && (data?.some(r => r.role === "booster") ?? false);
          setAuthorized(isBooster);
          setChecking(false);
          if (!isBooster) navigate("/booster/login");
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setAuthorized(false);
        navigate("/booster/login");
      } else {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        const isBooster = !error && (data?.some(r => r.role === "booster") ?? false);
        setAuthorized(isBooster);
        if (!isBooster) navigate("/booster/login");
      }
    }).finally(() => setChecking(false));

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <BoosterSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-lg font-semibold">Beauty Boosters</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/booster/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log ud
            </Button>
          </header>
          
          <main className="flex-1 p-6 break-words">
            {checking ? <div className="text-sm text-muted-foreground">Checker login…</div> : authorized ? <Outlet /> : <div className="text-sm text-muted-foreground">Ingen adgang</div>}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}