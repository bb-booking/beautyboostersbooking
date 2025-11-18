import { NavLink, useLocation } from "react-router-dom";
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
  Tag
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
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Forespørgsler", url: "/admin/inquiries", icon: MessageSquare },
  { title: "Jobs", url: "/admin/jobs", icon: Calendar },
  { title: "Boosters", url: "/admin/boosters", icon: UserCheck },
  { title: "Booster Ansøgninger", url: "/admin/booster-applications", icon: Users },
  { title: "Kalender", url: "/admin/calendar", icon: CalendarDays },
  { title: "Bookinger", url: "/admin/bookings", icon: Calendar },
  { title: "Beskeder", url: "/admin/messages", icon: MessageSquare },
  { title: "Økonomi", url: "/admin/finance", icon: DollarSign },
  { title: "Rabatkoder", url: "/admin/discount-codes", icon: Tag },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
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

  const [counts, setCounts] = useState({ messages: 0, inquiries: 0, jobs: 0 });

  useEffect(() => {
    const refresh = async () => {
      try {
        const [msgRes, inqRes, jobRes] = await Promise.all([
          supabase.from("conversations").select("id").gt("unread_admin_count", 0),
          supabase.from("inquiries").select("id").eq("status", "new"),
          supabase.from("jobs").select("id").eq("status", "open"),
        ]);
        setCounts({
          messages: msgRes.data?.length || 0,
          inquiries: inqRes.data?.length || 0,
          jobs: jobRes.data?.length || 0,
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

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
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
                const badge =
                  item.title === "Beskeder" ? counts.messages :
                  item.title === "Forespørgsler" ? counts.inquiries :
                  item.title === "Jobs" ? counts.jobs : 0;
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
                    {badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
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
                  <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="ml-2">Log ud</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}