
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock4, Timer, Users } from "lucide-react";
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
  const [selectedClass, setSelectedClass] = useState<any>(null);

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

  const handleGenerateCode = async () => {
    const code = generateRandomCode();
    setCustomCode(code);
    toast({
      title: "Code Generated",
      description: `Generated code: ${code}`,
    });
  };

  const startSession = async (classId: string, code: string) => {
    try {
      if (!code) {
        toast({
          title: "Error",
          description: "Please enter or generate a code first",
          variant: "destructive",
        });
        return;
      }

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
      setSelectedClass(null);
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
        <CardTitle>Class Code Generator</CardTitle>
      </CardHeader>
      <CardContent>
        {activeSession ? (
          <div className="space-y-8 py-4">
            <div className="text-center space-y-6">
              <div>
                <p className="text-blue-600 text-xl">Active Code:</p>
                <p className="text-blue-600 text-6xl font-bold tracking-wider">
                  {activeSession.code}
                </p>
              </div>
              <div>
                <p className="text-blue-600 text-xl">Time Remaining:</p>
                <p className="text-blue-600 text-6xl font-bold">
                  {Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-blue-600 text-xl">
                <Users className="w-6 h-6" />
                <span>{checkedInCount} students checked in</span>
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
            <div className="flex gap-2">
              <Input
                value={customCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  if (value.length <= 6 && /^[A-Z0-9]*$/.test(value)) {
                    setCustomCode(value);
                  }
                }}
                placeholder="Enter custom code"
                maxLength={6}
                className="text-lg"
              />
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (classes.length > 0) {
                    startSession(classes[0].id, customCode);
                  }
                }}
              >
                Use Code
              </Button>
            </div>
            <Button
              className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
              onClick={handleGenerateCode}
            >
              <Timer className="w-6 h-6 mr-2" />
              Generate Random Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
