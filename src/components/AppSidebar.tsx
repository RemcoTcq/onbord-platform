import { Home, Plus, FileText, Send, Shield, LogOut, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import onbordLogo from "@/assets/onbord-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Accueil", url: "/dashboard", icon: Home },
  { title: "Nouvelle demande", url: "/request/new", icon: Plus },
  { title: "Brouillons", url: "/drafts", icon: FileText },
  { title: "Demandes", url: "/requests", icon: Send },
  { title: "Mon compte", url: "/account", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { isAdmin, signOut } = useAuth();
  const { profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const allItems = isAdmin
    ? [...menuItems, { title: "Admin", url: "/admin", icon: Shield }]
    : menuItems;

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    : "";
  const companyName = profile?.company_name || "";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex h-16 items-center px-4">
        {!collapsed && (
          <img src={onbordLogo} alt="Onbord" className="h-8 w-auto" />
        )}
        {collapsed && (
          <img src={onbordLogo} alt="Onbord" className="h-6 w-6 object-contain object-left" />
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {!collapsed && (displayName || companyName) && (
          <div className="px-2 py-1.5">
            {displayName && (
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
            )}
            {companyName && (
              <p className="text-xs text-sidebar-foreground/60 truncate">{companyName}</p>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
