"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  defaultDomeProfile,
  resolveDomeProfile,
  type DomeProfile,
} from "@/lib/profile";

export function useProfile(userId?: string) {
  const [supabase] = useState(() => createClient());
  const [profile, setProfile] = useState<DomeProfile>(defaultDomeProfile);
  const [isLoading, setIsLoading] = useState(Boolean(userId));

  useEffect(() => {
    let isActive = true;

    const getProfile = async () => {
      if (!userId) {
        setProfile(defaultDomeProfile);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, tier, subscription_status")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!isActive) {
          return;
        }

        setProfile(resolveDomeProfile(data));
      } catch (error) {
        console.error("Error fetching profile:", error);

        if (isActive) {
          setProfile(defaultDomeProfile);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void getProfile();

    return () => {
      isActive = false;
    };
  }, [supabase, userId]);

  return { profile, setProfile, isLoading };
}
