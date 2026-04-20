import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { STATUSES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminRequest {
  id: string;
  title: string;
  domain: string;
  status: string;
  created_at: string;
  weekly_price: number;
  monthly_price: number;
  talents_number: number;
  user_id: string;
  talent_type: string;
}

interface ProfileMap {
  [userId: string]: { first_name: string; last_name: string; company_name: string; email?: string };
}

const Admin = () => {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    const [reqRes, profRes] = await Promise.all([
      supabase.from("requests").select("id, title, domain, status, created_at, weekly_price, monthly_price, talents_number, user_id").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, first_name, last_name, company_name"),
    ]);
    setRequests(reqRes.data || []);
    const map: ProfileMap = {};
    (profRes.data || []).forEach((p) => { map[p.user_id] = p; });
    setProfiles(map);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("requests").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erreur de mise à jour");
    } else {
      toast.success("Statut mis à jour");
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("requests").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Demande supprimée");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const getProfileLabel = (userId: string) => {
    const p = profiles[userId];
    if (!p) return userId.slice(0, 8) + "…";
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (p.company_name && name) return `${p.company_name} — ${name}`;
    return p.company_name || name || userId.slice(0, 8) + "…";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin — Toutes les demandes</h1>
          <p className="text-muted-foreground">{requests.length} demande(s) au total</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{req.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{req.domain} · {req.talents_number} talent(s)</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{getProfileLabel(req.user_id)}</span>
                      </div>
                    </div>
                    <Select value={req.status} onValueChange={(v) => updateStatus(req.id, v)}>
                      <SelectTrigger className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{new Date(req.created_at).toLocaleDateString("fr-FR")}</span>
                    <span>{Number(req.monthly_price).toLocaleString("fr-FR")}€/mois</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/request/${req.id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Détails
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. La demande « {req.title} » sera définitivement supprimée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(req.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Admin;
