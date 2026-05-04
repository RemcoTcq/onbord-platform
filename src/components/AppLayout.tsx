import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Command } from "lucide-react";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur-md px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground h-7 w-7" />
            <div className="hidden md:flex flex-1 max-w-md">
              <button
                type="button"
                className="group flex w-full items-center gap-2 rounded-md border border-border/70 bg-card/60 px-3 h-7 text-[12px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">Rechercher…</span>
                <span className="kbd">
                  <Command className="h-2.5 w-2.5" />
                </span>
                <span className="kbd">K</span>
              </button>
            </div>
            <div className="flex-1 md:hidden" />
          </header>
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
