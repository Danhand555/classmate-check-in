
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ActiveSession } from "../types";

export const useActiveSession = (userId: string | undefined) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    const checkActiveSession = async () => {
      if (!userId) return;

      const { data: checkIn } = await supabase
        .from("student_check_ins")
        .select(`
          session:session_id(
            id,
            class:class_id(
              capacity
            )
          )
        `)
        .eq("student_id", userId)
        .order("checked_in_at", { ascending: false })
        .limit(1)
        .single();

      if (checkIn?.session) {
        setActiveSession(checkIn.session);
      }
    };

    checkActiveSession();
  }, [userId]);

  return activeSession;
};
