import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Account = () => {
  const { user } = useAuth();
  const { profile: contextProfile, loading, refetch } = useProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string> | null>(null);

  // Initialize form from context profile
  const profile = form ?? contextProfile;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...(prev ?? contextProfile ?? {}), [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(profile as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour avec succès");
      await refetch();
      setForm(null);
    }
  };

  if (loading || !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Mon compte</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input id="first_name" value={profile.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input id="last_name" value={profile.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={profile.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+32 ..." />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input id="company_name" value={profile.company_name} onChange={(e) => handleChange("company_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_role">Fonction</Label>
                <Input id="company_role" value={profile.company_role} onChange={(e) => handleChange("company_role", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_number">Numéro de TVA (Belgique)</Label>
              <Input id="vat_number" value={profile.vat_number} onChange={(e) => handleChange("vat_number", e.target.value)} placeholder="BE0123.456.789" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adresse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street_address">Rue et numéro</Label>
              <Input id="street_address" value={profile.street_address} onChange={(e) => handleChange("street_address", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Code postal</Label>
                <Input id="postal_code" value={profile.postal_code} onChange={(e) => handleChange("postal_code", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" value={profile.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input id="country" value={profile.country} onChange={(e) => handleChange("country", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Account;
