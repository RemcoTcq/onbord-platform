import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Notif {
  id: string;
  type: string;
  request_id: string | null;
  payload: any;
  read: boolean;
  created_at: string;
}

const LABELS: Record<string, string> = {
  profiles_rejected: "Tous les profils rejetés",
  profile_accepted: "Un profil a été validé",
  interview_slots_proposed: "Créneaux d'entretien proposés",
};

export const AdminNotificationsBell = () => {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifs((data as any) || []);
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, () => {
        fetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const ids = notifs.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("admin_notifications").update({ read: true }).in("id", ids);
    fetch();
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-xs">{unreadCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b p-3 font-semibold">Notifications</div>
        <div className="max-h-96 overflow-y-auto">
          {notifs.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucune notification</p>}
          {notifs.map((n) => (
            <Link
              key={n.id}
              to={n.request_id ? `/request/${n.request_id}` : "#"}
              onClick={() => setOpen(false)}
              className="block border-b px-3 py-2 text-sm hover:bg-muted"
            >
              <div className="font-medium">{LABELS[n.type] || n.type}</div>
              <div className="text-xs text-muted-foreground">{format(new Date(n.created_at), "Pp", { locale: fr })}</div>
              {n.type === "profiles_rejected" && n.payload?.reasons && (
                <div className="text-xs text-muted-foreground mt-1">{n.payload.reasons.join(", ")}</div>
              )}
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
