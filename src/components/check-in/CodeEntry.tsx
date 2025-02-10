
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const CodeEntry = () => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        .select("*, is_session_valid(check_in_sessions)")
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
      setCode("");
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
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Check-in Session</CardTitle>
        <CardDescription>Enter the code provided by your teacher</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="Enter 6-character code"
              className="text-center text-lg tracking-widest font-mono uppercase focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 transition-colors"
            disabled={isSubmitting || code.length !== 6}
          >
            Check In
            <ArrowRight className="ml-2" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

