
import { supabase } from "@/integrations/supabase/client";

export const startCheckInSession = async (classId: string, code: string) => {
  const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

  const { data, error } = await supabase
    .from("check_in_sessions")
    .insert([
      {
        class_id: classId,
        code,
        expires_at: expiresAt.toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const endCheckInSession = async (sessionId: string) => {
  const { error } = await supabase
    .from("check_in_sessions")
    .update({ is_active: false })
    .eq("id", sessionId);

  if (error) throw error;

  const { data: checkIns, error: checkInsError } = await supabase
    .from("student_check_ins")
    .select(`
      *,
      student:student_id(name)
    `)
    .eq("session_id", sessionId)
    .order("checked_in_at", { ascending: true });

  if (checkInsError) throw checkInsError;
  return checkIns;
};
