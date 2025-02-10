
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
          session:check_in_sessions!student_check_ins_session_id_fkey(
            id,
            class:classes!check_in_sessions_class_id_fkey(
              capacity
            )
          )
        `)
        .eq("student_id", userId)
        .order("checked_in_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkIn?.session) {
        setActiveSession(checkIn.session);
      }
    };

    checkActiveSession();
  }, [userId]);

  return activeSession;
};
