import { Home, Plus, FileText, Send, Shield, LogOut, User, Settings, ChevronsUpDown } from "lucide-react";
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo zone */}
      <div className="flex h-12 items-center border-b border-sidebar-border px-3">
        {!collapsed ? (
          <img src={onbordLogo} alt="Onbord" className="h-7 w-auto" />
        ) : (
          <img src={onbordIcon} alt="Onbord" className="h-6 w-6 object-contain mx-auto" />
        )}
      </div>

      {/* Primary CTA */}
      <div className={cn("px-2 pt-3", collapsed && "px-1.5")}>
        <Button
          onClick={() => navigate("/request/new")}
          variant="default"
          size="sm"
          className={cn(
            "w-full gap-1.5 shadow-sm",
            collapsed && "w-9 px-0",
          )}
          title="Nouvelle demande"
        >
          <Plus className="h-3.5 w-3.5" />
          {!collapsed && <span>Nouvelle demande</span>}
        </Button>
      </div>

      <SidebarContent className="pt-3">
        <SidebarGroup>
          {!collapsed && (
            <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              Espace
            </div>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-8">
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={cn(
                        "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-all duration-150",
                        "hover:bg-sidebar-accent/60 hover:text-foreground",
                      )}
                      activeClassName="!bg-primary/[0.08] !text-foreground !font-semibold before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-primary before:rounded-r-full"
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

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2.5 w-full rounded-md py-1.5 hover:bg-sidebar-accent/70 transition-colors text-left overflow-hidden",
                collapsed ? "justify-center px-0" : "px-2",
              )}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-[11px] font-semibold shadow-sm">
                {initials || <User className="h-3.5 w-3.5" />}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-foreground truncate leading-tight">
                      {displayName || user?.email || "Mon compte"}
                    </p>
                    {companyName && (
                      <p className="text-[11px] text-muted-foreground truncate leading-tight">{companyName}</p>
                    )}
                  </div>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </>
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
