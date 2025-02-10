
import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Subscribe to real-time changes in check_in_sessions
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_in_sessions',
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh active session when changes occur
          if (user?.id) {
            // The useActiveSession hook will handle the refresh
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

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
          id,
          code,
          is_active,
          expires_at,
          class:classes!check_in_sessions_class_id_fkey (
            capacity
          )
        `)
        .eq("code", code.toUpperCase())
        .maybeSingle();

      if (sessionError) {
        throw new Error("Error checking code. Please try again.");
      }

      if (!session) {
        throw new Error("Invalid code. Please check and try again.");
      }

      // Manual validation since we can't use the function directly
      const isValid = session.is_active && new Date(session.expires_at) > new Date();

      if (!isValid) {
        throw new Error("This session has expired");
      }

      // Check if student has already checked in
      const { data: existingCheckIn, error: checkInError } = await supabase
        .from("student_check_ins")
        .select("id")
        .eq("session_id", session.id)
        .eq("student_id", user?.id)
        .maybeSingle();

      if (checkInError) {
        throw new Error("Error checking existing check-in");
      }

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
