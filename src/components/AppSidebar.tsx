import { Home, Plus, FileText, Send, Shield, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import onbordLogo from "@/assets/onbord-logo.png";
import onbordIcon from "@/assets/onbord-icon.png";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  { title: "Accueil", url: "/dashboard", icon: Home },
  { title: "Nouvelle demande", url: "/request/new", icon: Plus },
  { title: "Brouillons", url: "/drafts", icon: FileText },
  { title: "Demandes", url: "/requests", icon: Send },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { isAdmin, signOut, user } = useAuth();
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
  const initials = profile
    ? [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join("").toUpperCase()
    : "";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <div className="flex h-16 items-center justify-center px-4">
        {!collapsed ? (
          <img src={onbordLogo} alt="Onbord" className="h-8 w-auto" />
        ) : (
          <img src={onbordIcon} alt="Onbord" className="h-8 w-8 object-contain" />
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Espace
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      activeClassName="bg-muted text-primary font-semibold"
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

      <SidebarFooter className="p-2 border-t border-border/60">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 w-full rounded-lg py-2 hover:bg-muted/60 transition-colors text-left overflow-hidden",
              collapsed ? "justify-center px-0" : "px-2"
            )}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-xs font-semibold">
                {initials || <User className="h-3.5 w-3.5" />}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-sidebar-foreground truncate">
                    {displayName || user?.email || "Mon compte"}
                  </p>
                  {companyName && (
                    <p className="text-[11px] text-muted-foreground truncate">{companyName}</p>
                  )}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{displayName || "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres du compte
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
