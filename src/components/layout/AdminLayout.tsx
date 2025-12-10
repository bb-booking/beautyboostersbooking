import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useChatNotifications } from "@/hooks/useChatNotifications";

export function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const roleCheckCache = useRef<{ [userId: string]: boolean }>({});
  const checkingInProgress = useRef(false);

  // Enable chat notifications for admins
  useChatNotifications({ userId, userType: 'admin', enabled: authorized });

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
    let sessionChecked = false;

    const handleSession = async (session: any) => {
      if (!isMounted || sessionChecked) return;
      sessionChecked = true;
      
      if (!session) {
        setAuthorized(false);
        setChecking(false);
        setUserId(undefined);
        navigate("/admin/login", { replace: true });
        return;
      }

      setUserId(session.user.id);
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

    // Only check session once on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Don't render anything while checking or if not authorized
  if (checking) {
    return null;
  }

  if (!authorized) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-background px-4">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-lg font-semibold">Beauty Boosters Admin</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/admin/login");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log ud
            </Button>
          </header>
          
          <main className="flex-1 p-6 break-words">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}