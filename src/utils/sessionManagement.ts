
import { supabase } from "@/integrations/supabase/client";

export const startCheckInSession = async (classId: string, code: string) => {
  const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes from now

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
  // First get all check-ins with student names
  const { data: checkIns, error: checkInsError } = await supabase
    .from("student_check_ins")
    .select(`
      id,
      checked_in_at,
      status,
      student_id,
      profiles (
        name
      )
    `)
    .eq("session_id", sessionId)
    .order("checked_in_at", { ascending: true });

  if (checkInsError) throw checkInsError;

  // Update session to mark as inactive
  const { error } = await supabase
    .from("check_in_sessions")
    .update({ is_active: false })
    .eq("id", sessionId);

  if (error) throw error;

  return checkIns;
};
