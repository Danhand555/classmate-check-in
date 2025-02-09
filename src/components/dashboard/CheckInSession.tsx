
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock4 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateRandomCode } from "@/utils/codeGenerator";

interface CheckInSessionProps {
  classes: any[];
}

export const CheckInSession = ({ classes }: CheckInSessionProps) => {
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [customCode, setCustomCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [preparationCountdown, setPreparationCountdown] = useState(0);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    if (preparationCountdown > 0) {
      const timer = setInterval(() => {
        setPreparationCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            toast({
              title: "Ready to Start Session",
              description: "You can now start the check-in session",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [preparationCountdown]);

  useEffect(() => {
    if (activeSession) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            endSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activeSession]);

  const handleGenerateCode = () => {
    const code = generateRandomCode();
    setGeneratedCode(code);
    setCustomCode(code);
    setPreparationCountdown(120); // 2 minutes countdown
    toast({
      title: "Code Generated",
      description: `Your code is: ${code}. Session can be started in 2 minutes.`,
    });
  };

  const startSession = async (classId: string, customCode?: string) => {
    try {
      const code = customCode || generatedCode;
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

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

      setActiveSession(data);
      setTimeLeft(300);
      setCheckedInCount(0);
      toast({
        title: "Session started",
        description: `Check-in code: ${code}`,
      });

      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'student_check_ins',
            filter: `session_id=eq.${data.id}`,
          },
          (payload) => {
            setCheckedInCount((prev) => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      toast({
        title: "Error starting session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from("check_in_sessions")
        .update({ is_active: false })
        .eq("id", activeSession.id);

      if (error) throw error;

      const { data: checkIns, error: checkInsError } = await supabase
        .from("student_check_ins")
        .select(`
          *,
          student:student_id(name)
        `)
        .eq("session_id", activeSession.id)
        .order("checked_in_at", { ascending: true });

      if (checkInsError) throw checkInsError;

      toast({
        title: "Session ended",
        description: `Total check-ins: ${checkIns?.length || 0}`,
      });

      setActiveSession(null);
      setTimeLeft(300);
      setCustomCode("");
      setGeneratedCode("");
    } catch (error: any) {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="col-span-full animate-fadeIn">
      <CardHeader>
        <CardTitle>Check-in Session</CardTitle>
        <CardDescription>
          {activeSession
            ? "Active session in progress"
            : preparationCountdown > 0
            ? "Preparing session..."
            : "Start a new check-in session"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  Code: {activeSession.code}
                </p>
                <p className="text-sm text-gray-500">
                  Students checked in: {checkedInCount}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock4 className="w-4 h-4" />
                <span>
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={endSession}
            >
              End Session
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-code">Session Code</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-code"
                  value={customCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (value.length <= 6 && /^[A-Z0-9]*$/.test(value)) {
                      setCustomCode(value);
                    }
                  }}
                  placeholder="Enter or generate 6-character code"
                  maxLength={6}
                />
                <Button onClick={handleGenerateCode}>
                  Generate
                </Button>
              </div>
            </div>
            {preparationCountdown > 0 && (
              <div className="text-center py-2 bg-secondary rounded-md">
                <p className="text-sm text-muted-foreground">
                  Session can be started in{" "}
                  {Math.floor(preparationCountdown / 60)}:
                  {(preparationCountdown % 60).toString().padStart(2, "0")}
                </p>
              </div>
            )}
            {classes.map((classItem) => (
              <Button
                key={classItem.id}
                className="w-full"
                onClick={() => startSession(classItem.id, customCode)}
                disabled={preparationCountdown > 0}
              >
                Start Session for {classItem.name}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
