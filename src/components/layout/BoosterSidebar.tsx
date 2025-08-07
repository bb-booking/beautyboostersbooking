import { NavLink, useLocation } from "react-router-dom"
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
  useSidebar,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Kalender",
    url: "/booster",
    icon: Calendar,
  },
  {
    title: "Dashboard",
    url: "/booster/dashboard",
    icon: Home,
  },
  {
    title: "Ledige jobs",
    url: "/booster/jobs",
    icon: Briefcase,
  },
  {
    title: "Min kalender",
    url: "/booster/calendar",
    icon: Calendar,
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

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Beauty Boosters</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}