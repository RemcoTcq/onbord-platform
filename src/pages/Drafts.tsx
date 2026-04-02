import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Draft {
  id: string;
  title: string;
  created_at: string;
  domain: string;
}

const Drafts = () => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("requests")
      .select("id, title, created_at, domain")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .order("created_at", { ascending: false });
    setDrafts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("requests").delete().eq("id", id);
    if (error) {
      toast.error("Impossible de supprimer ce brouillon");
    } else {
      toast.success("Brouillon supprimé");
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Brouillons</h1>
          <p className="text-muted-foreground text-sm">Vos demandes non envoyées</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground/20 border-t-foreground" />
          </div>
        ) : drafts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-card-foreground/30" />
              <h3 className="text-lg font-semibold text-card-foreground">Aucun brouillon</h3>
              <p className="text-card-foreground/60 text-sm">
                Vos demandes en cours de création apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {drafts.map((draft) => (
              <Card key={draft.id} className="card-hover">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-card-foreground truncate">
                      {draft.title || "Sans titre"}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-card-foreground/50 mt-1">
                      {draft.domain && <span>{draft.domain}</span>}
                      <span>{new Date(draft.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/request/new?draft=${draft.id}`}>
                      <Button size="sm" className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> Continuer
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(draft.id)}
                      className="gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

export default Drafts;
