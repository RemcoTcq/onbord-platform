import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
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

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultProfile: Profile = {
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
};

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  refetch: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
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
    } else {
      setProfile(defaultProfile);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refetch: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};
