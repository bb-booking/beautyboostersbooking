import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Calendar,
  LogOut,
  Settings,
  UserCheck,
  DollarSign,
  CalendarDays,
  Tag,
  UserCircle
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Kalender", url: "/admin/calendar", icon: Calendar },
  { title: "Jobs", url: "/admin/jobs", icon: CalendarDays },
  { title: "Kunder", url: "/admin/customers", icon: UserCircle },
  { title: "Boosters", url: "/admin/boosters", icon: UserCheck },
  { title: "Beskeder", url: "/admin/messages", icon: MessageSquare },
  { title: "Økonomi", url: "/admin/finance", icon: DollarSign },
  { title: "Rabatkoder", url: "/admin/discount-codes", icon: Tag },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (active: boolean) =>
    active 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";

  const [counts, setCounts] = useState({ messages: 0, inquiries: 0, jobs: 0, jobChats: 0, applications: 0 });

  useEffect(() => {
    const refresh = async () => {
      try {
        const [msgRes, inqRes, jobRes, chatRes, appRes] = await Promise.all([
          supabase.from("conversations").select("id").gt("unread_admin_count", 0),
          supabase.from("inquiries").select("id").eq("status", "new"),
          supabase.from("jobs").select("id").eq("status", "open"),
          supabase.from("job_communications").select("id").is("read_at", null),
          supabase.from("booster_applications").select("id").eq("status", "pending"),
        ]);
        setCounts({
          messages: msgRes.data?.length || 0,
          inquiries: inqRes.data?.length || 0,
          jobs: jobRes.data?.length || 0,
          jobChats: chatRes.data?.length || 0,
          applications: appRes.data?.length || 0,
        });
      } catch (e) {
        // noop
      }
    };
    refresh();

    const ch1 = supabase
      .channel("conversations-count")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        () => refresh()
      )
      .subscribe();

    const ch2 = supabase
      .channel("inquiries-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        () => refresh()
      )
      .subscribe();

    const ch3 = supabase
      .channel("jobs-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => refresh()
      )
      .subscribe();

    const ch4 = supabase
      .channel("job-chats-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_communications" },
        () => refresh()
      )
      .subscribe();

    const ch5 = supabase
      .channel("applications-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booster_applications" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
      supabase.removeChannel(ch4);
      supabase.removeChannel(ch5);
    };
  }, []);

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Beauty Boosters Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
            {adminItems.map((item) => {
                let badge = 0;
                if (item.title === "Beskeder") badge = counts.messages;
                // Jobs badge: only show inquiries + unread chats (things requiring action)
                else if (item.title === "Jobs") badge = counts.inquiries + counts.jobChats;
                else if (item.title === "Boosters") badge = counts.applications;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/admin"}
                        className={getNavCls(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="ml-2">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                    {badge > 0 && (
                      <SidebarMenuBadge className="bg-destructive text-destructive-foreground rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-medium">
                        {badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/admin/settings" className={getNavCls(isActive("/admin/settings"))}>
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Indstillinger</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/admin/login");
                    }}
                    className="w-full justify-start hover:bg-muted/50 flex items-center"
                  >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Log ud</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}