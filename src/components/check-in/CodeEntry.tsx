
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CheckInProgress } from "./CheckInProgress";
import { CodeEntryForm } from "./CodeEntryForm";
import { useActiveSession } from "./hooks/useActiveSession";
import type { CheckInSessionResponse } from "./types";

export const CodeEntry = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const activeSession = useActiveSession(user?.id);

  const handleSubmit = async (code: string) => {
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-character code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Find session with this code that is active and not expired
      const { data: session, error: sessionError } = await supabase
        .from("check_in_sessions")
        .select(`
          *,
          is_session_valid(check_in_sessions),
          class:classes!check_in_sessions_class_id_fkey(
            capacity
          )
        `)
        .eq("code", code.toUpperCase())
        .single();

      if (sessionError || !session || !session.is_session_valid) {
        throw new Error(
          !session 
            ? "Invalid code" 
            : !session.is_session_valid 
              ? "This session has expired" 
              : "Invalid or expired code"
        );
      }

      // Check if student has already checked in
      const { data: existingCheckIn, error: checkInError } = await supabase
        .from("student_check_ins")
        .select("id")
        .eq("session_id", session.id)
        .eq("student_id", user?.id)
        .single();

      if (existingCheckIn) {
        throw new Error("You have already checked in for this session");
      }

      // Record the check-in
      const { error: insertError } = await supabase
        .from("student_check_ins")
        .insert({
          session_id: session.id,
          student_id: user?.id,
          status: "success",
        });

      if (insertError) {
        throw new Error("Failed to record check-in");
      }

      toast({
        title: "Success!",
        description: "You have successfully checked in",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Check-in Session</CardTitle>
          <CardDescription>Enter the code provided by your teacher</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeEntryForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </CardContent>
      </Card>

      {activeSession && activeSession.class && (
        <CheckInProgress 
          sessionId={activeSession.id} 
          classCapacity={activeSession.class.capacity} 
        />
      )}
    </div>
  );
};
