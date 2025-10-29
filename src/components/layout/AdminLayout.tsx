import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const roleCheckCache = useRef<{ [userId: string]: boolean }>({});
  const checkingInProgress = useRef(false);

  const checkUserRole = async (userId: string): Promise<boolean> => {
    // Use cached result if available
    if (roleCheckCache.current[userId] !== undefined) {
      return roleCheckCache.current[userId];
    }

    // Prevent multiple simultaneous checks
    if (checkingInProgress.current) {
      return false;
    }

    checkingInProgress.current = true;
    
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      const isAdmin = !error && (data?.some(r => r.role === "admin") ?? false);
      
      // Cache the result
      roleCheckCache.current[userId] = isAdmin;
      
      return isAdmin;
    } catch (error) {
      console.error("Role check error:", error);
      return false;
    } finally {
      checkingInProgress.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (session: any) => {
      if (!isMounted) return;
      
      if (!session) {
        setAuthorized(false);
        setChecking(false);
        navigate("/admin/login", { replace: true });
        return;
      }

      const isAdmin = await checkUserRole(session.user.id);
      
      if (isMounted) {
        if (!isAdmin) {
          setAuthorized(false);
          setChecking(false);
          navigate("/admin/login", { replace: true });
        } else {
          setAuthorized(true);
          setChecking(false);
        }
      }
    };

    // Check initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Then listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      handleSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking || !authorized) {
    return null;
  }

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
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}