
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateRandomCode } from "@/utils/codeGenerator";
import { startCheckInSession, endCheckInSession } from "@/utils/sessionManagement";
import { ActiveSession } from "./ActiveSession";
import { CodeGeneratorForm } from "./CodeGeneratorForm";

interface CheckInSessionProps {
  classes: any[];
}

export const CheckInSession = ({ classes }: CheckInSessionProps) => {
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [customCode, setCustomCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [checkedInCount, setCheckedInCount] = useState(0);

  useEffect(() => {
    if (activeSession) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleEndSession();
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
    setCustomCode(code);
    toast({
      title: "Code Generated",
      description: `Generated code: ${code}`,
    });
  };

  const handleStartSession = async () => {
    try {
      if (!customCode) {
        toast({
          title: "Error",
          description: "Please enter or generate a code first",
          variant: "destructive",
        });
        return;
      }

      if (classes.length === 0) {
        toast({
          title: "Error",
          description: "No classes available",
          variant: "destructive",
        });
        return;
      }

      const data = await startCheckInSession(classes[0].id, customCode);
      setActiveSession(data);
      setTimeLeft(300);
      setCheckedInCount(0);
      toast({
        title: "Session started",
        description: `Check-in code: ${customCode}`,
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

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      const checkIns = await endCheckInSession(activeSession.id);

      toast({
        title: "Session ended",
        description: `Total check-ins: ${checkIns?.length || 0}`,
      });

      setActiveSession(null);
      setTimeLeft(300);
      setCustomCode("");
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
          <ActiveSession
            code={activeSession.code}
            timeLeft={timeLeft}
            checkedInCount={checkedInCount}
            onEndSession={handleEndSession}
          />
        ) : (
          <CodeGeneratorForm
            customCode={customCode}
            onCodeChange={setCustomCode}
            onGenerateCode={handleGenerateCode}
            onStartSession={handleStartSession}
          />
        )}
      </CardContent>
    </Card>
  );
};
