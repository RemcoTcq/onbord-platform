import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileData {
  first_name: string;
  last_name: string;
  company_name: string;
  company_role: string;
  vat_number: string;
  street_address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
}

const Account = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    company_name: "",
    company_role: "",
    vat_number: "",
    street_address: "",
    postal_code: "",
    city: "",
    country: "Belgique",
    phone: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          company_name: data.company_name || "",
          company_role: data.company_role || "",
          vat_number: (data as any).vat_number || "",
          street_address: (data as any).street_address || "",
          postal_code: (data as any).postal_code || "",
          city: (data as any).city || "",
          country: (data as any).country || "Belgique",
          phone: (data as any).phone || "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
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
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
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
