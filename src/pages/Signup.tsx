import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import onbordLogo from "@/assets/onbord-logo.png";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (authData.user) {
      // Profile is created by trigger. Try to update with user details.
      // This may fail if email confirmation is required (user not fully authed yet).
      // In that case, we use the service role approach or skip - profile will have defaults.
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            company_name: companyName,
            company_role: companyRole,
          })
          .eq("user_id", authData.user.id);
      } catch {
        // Profile will be updated on first login if needed
      }
    }

    setLoading(false);
    toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <img src={onbordLogo} alt="Onbord" className="h-10 w-auto mb-2" />
          <p className="mt-2 text-muted-foreground">Créez votre compte entreprise</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>Rejoignez la plateforme en quelques secondes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jean" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Dupont" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Acme SA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyRole">Rôle dans l'entreprise</Label>
                <Input id="companyRole" value={companyRole} onChange={(e) => setCompanyRole(e.target.value)} required placeholder="Directeur RH" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@entreprise.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 6 caractères" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création..." : "Créer mon compte"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
