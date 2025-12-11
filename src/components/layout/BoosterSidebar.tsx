import { NavLink, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  Calendar,
  Camera,
  DollarSign,
  Home,
  MessageSquare,
  Settings,
  Tag,
  User,
  Briefcase,
  Star
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar"
import { supabase } from "@/integrations/supabase/client"

const menuItems = [
  {
    title: "Dashboard",
    url: "/booster/dashboard",
    icon: Home,
  },
  {
    title: "Kalender",
    url: "/booster",
    icon: Calendar,
  },
  {
    title: "Jobs",
    url: "/booster/jobs",
    icon: Briefcase,
  },
  {
    title: "Portfolio",
    url: "/booster/portfolio",
    icon: Camera,
  },
  {
    title: "Kompetencer",
    url: "/booster/skills",
    icon: Tag,
  },
  {
    title: "Om mig",
    url: "/booster/profile",
    icon: User,
  },
  {
    title: "Økonomi",
    url: "/booster/finance",
    icon: DollarSign,
  },
  {
    title: "Beskeder",
    url: "/booster/messages",
    icon: MessageSquare,
  },
  {
    title: "Anmeldelser",
    url: "/booster/reviews",
    icon: Star,
  },
  {
    title: "Indstillinger",
    url: "/booster/settings",
    icon: Settings,
  },
]

export function BoosterSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const [unreadMessages, setUnreadMessages] = useState(0)

  const isActive = (path: string) => {
    if (path === "/booster") {
      return location.pathname === "/booster"
    }
    return location.pathname.startsWith(path)
  }

  const getNavClasses = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground" 
      : "hover:bg-accent hover:text-accent-foreground"
  }

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Count unread messages in job_communications where booster hasn't read
      const { data, error } = await supabase
        .from('job_communications')
        .select('id')
        .neq('sender_type', 'booster')
        .is('read_at', null)
      
      if (!error && data) {
        setUnreadMessages(data.length)
      }
    }

    fetchUnreadCount()

    // Subscribe to new messages
    const channel = supabase
      .channel('booster-unread-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_communications' },
        () => fetchUnreadCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Beauty Boosters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const badge = item.title === "Beskeder" ? unreadMessages : 0
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/booster"}
                        className={getNavClasses(item.url)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                    {badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}