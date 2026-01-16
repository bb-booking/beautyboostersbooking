import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BoosterSidebar } from "./BoosterSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useChatNotifications } from "@/hooks/useChatNotifications";

export function BoosterLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [boosterName, setBoosterName] = useState<string>("Beauty Boosters");

  // Enable chat notifications for boosters
  useChatNotifications({ userId, userType: 'booster', enabled: authorized });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setAuthorized(false);
        setChecking(false);
        setUserId(undefined);
        setBoosterName("Beauty Boosters");
        navigate("/booster/login");
      } else {
        setUserId(session.user.id);
        setTimeout(async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          const isBooster = !error && (data?.some(r => r.role === "booster") ?? false);
          setAuthorized(isBooster);
          setChecking(false);
          if (!isBooster) navigate("/booster/login");
          
          // Fetch booster name
          if (isBooster) {
            const { data: profile } = await supabase
              .from("booster_profiles")
              .select("name")
              .eq("user_id", session.user.id)
              .maybeSingle();
            if (profile?.name) setBoosterName(profile.name);
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setAuthorized(false);
        setUserId(undefined);
        navigate("/booster/login");
      } else {
        setUserId(session.user.id);
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        const isBooster = !error && (data?.some(r => r.role === "booster") ?? false);
        setAuthorized(isBooster);
        if (!isBooster) navigate("/booster/login");
        
        // Fetch booster name
        if (isBooster) {
          const { data: profile } = await supabase
            .from("booster_profiles")
            .select("name")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (profile?.name) setBoosterName(profile.name);
        }
      }
    }).finally(() => setChecking(false));

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <BoosterSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 sm:h-14 flex items-center justify-between border-b bg-background px-2 sm:px-4 sticky top-0 z-10">
            <div className="flex items-center min-w-0">
              <SidebarTrigger className="mr-2 sm:mr-4 flex-shrink-0" />
              <h1 className="text-sm sm:text-lg font-semibold truncate">{boosterName}</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/booster/login");
              }}
              className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Log ud</span>
            </Button>
          </header>
          
          <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
            {checking ? <div className="text-sm text-muted-foreground">Checker login…</div> : authorized ? <Outlet /> : <div className="text-sm text-muted-foreground">Ingen adgang</div>}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}