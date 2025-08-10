import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SalonSidebar } from "./SalonSidebar";
import { supabase } from "@/integrations/supabase/client";

export function SalonLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setAuthorized(false);
        setChecking(false);
        navigate("/salon/login");
      } else {
        setTimeout(async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          const isSalon = !error && (data?.some(r => r.role === "salon") ?? false);
          setAuthorized(isSalon);
          setChecking(false);
          if (!isSalon) navigate("/salon/login");
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setAuthorized(false);
        navigate("/salon/login");
      } else {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        const isSalon = !error && (data?.some(r => r.role === "salon") ?? false);
        setAuthorized(isSalon);
        if (!isSalon) navigate("/salon/login");
      }
    }).finally(() => setChecking(false));

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SalonSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold">Salon</h1>
            <div className="ml-auto">
              <button
                className="text-sm underline"
                onClick={async () => { await supabase.auth.signOut(); navigate("/salon/login"); }}
              >
                Log ud
              </button>
            </div>
          </header>
          <main className="flex-1 p-6">
            {checking ? <div className="text-sm text-muted-foreground">Checker login…</div> : authorized ? <Outlet /> : <div className="text-sm text-muted-foreground">Ingen adgang</div>}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
