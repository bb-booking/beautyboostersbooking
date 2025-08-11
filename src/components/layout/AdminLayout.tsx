import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setAuthorized(false);
        setChecking(false);
        navigate("/admin/login");
      } else {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(async () => {
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          const isAdmin = !error && (data?.some(r => r.role === "admin") ?? false);
          setAuthorized(isAdmin);
          setChecking(false);
          if (!isAdmin) navigate("/admin/login");
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setAuthorized(false);
        navigate("/admin/login");
      } else {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        const isAdmin = !error && (data?.some(r => r.role === "admin") ?? false);
        setAuthorized(isAdmin);
        if (!isAdmin) navigate("/admin/login");
      }
    }).finally(() => setChecking(false));

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-semibold">Beauty Boosters Admin</h1>
          </header>
          
          <main className="flex-1 p-6 break-words">
            {checking ? <div className="text-sm text-muted-foreground">Checker login…</div> : authorized ? <Outlet /> : <div className="text-sm text-muted-foreground">Ingen adgang</div>}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}