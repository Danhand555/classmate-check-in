
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
      // Find active session with this code
      const { data: session, error: sessionError } = await supabase
        .from("check_in_sessions")
        .select("id, class_id")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (sessionError || !session) {
        throw new Error("Invalid or expired code");
      }

      // Record the check-in
      const { error: checkInError } = await supabase
        .from("student_check_ins")
        .insert({
          session_id: session.id,
          student_id: user?.id,
          status: "success",
        });

      if (checkInError) {
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
