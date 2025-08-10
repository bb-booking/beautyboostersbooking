import { NavLink, useLocation } from "react-router-dom"
import { Calendar, Home, Settings, Users, Tag, DollarSign, Clock } from "lucide-react"

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
  { title: "Dashboard", url: "/salon/dashboard", icon: Home },
  { title: "Kalender", url: "/salon/calendar", icon: Calendar },
  { title: "Team", url: "/salon/team", icon: Users },
  { title: "Services", url: "/salon/services", icon: Tag },
  { title: "Åbningstider", url: "/salon/hours", icon: Clock },
  { title: "Økonomi", url: "/salon/finance", icon: DollarSign },
  { title: "Rabatkoder", url: "/salon/discount-codes", icon: Tag },
  { title: "Indstillinger", url: "/salon/settings", icon: Settings },
]

export function SalonSidebar() {
  const { state } = useSidebar()
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)
  const getNavClasses = (path: string) =>
    isActive(path) ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Salon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
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
