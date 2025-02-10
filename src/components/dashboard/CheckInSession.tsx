
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateRandomCode } from "@/utils/codeGenerator";
import { startCheckInSession, endCheckInSession } from "@/utils/sessionManagement";
import { ActiveSession } from "./ActiveSession";
import { CodeGeneratorForm } from "./CodeGeneratorForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckInSessionProps {
  classes: any[];
}

export const CheckInSession = ({ classes }: CheckInSessionProps) => {
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [customCode, setCustomCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(240); // 4 minutes in seconds
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes]);

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

      // Subscribe to check-ins for this session
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'student_check_ins',
            filter: `session_id=eq.${activeSession.id}`,
          },
          (payload) => {
            console.log('New check-in:', payload);
            setCheckedInCount((prev) => prev + 1);
          }
        )
        .subscribe();

      return () => {
        clearInterval(timer);
        channel.unsubscribe();
      };
    }
  }, [activeSession]);

  // Monitor active session changes
  useEffect(() => {
    if (activeSession) {
      const channel = supabase
        .channel('session-monitor')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'check_in_sessions',
            filter: `id=eq.${activeSession.id}`,
          },
          (payload: any) => {
            console.log('Session updated:', payload);
            // If session was deactivated, clear local state
            if (!payload.new.is_active) {
              setActiveSession(null);
              setTimeLeft(240);
              setCustomCode("");
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
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

      if (!selectedClassId) {
        toast({
          title: "Error",
          description: "Please select a class first",
          variant: "destructive",
        });
        return;
      }

      const data = await startCheckInSession(selectedClassId, customCode);
      setActiveSession(data);
      setTimeLeft(240); // Reset to 4 minutes
      setCheckedInCount(0);
      toast({
        title: "Session started",
        description: `Check-in code: ${customCode}`,
      });
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
      setTimeLeft(240);
      setCustomCode("");
      setCheckedInCount(0);
    } catch (error: any) {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (classes.length === 0) {
    return (
      <Card className="col-span-full animate-fadeIn">
        <CardHeader>
          <CardTitle>Class Code Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No classes available. Please create a class first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="class-select" className="text-sm font-medium">
                Select Class
              </label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CodeGeneratorForm
              customCode={customCode}
              onCodeChange={setCustomCode}
              onGenerateCode={handleGenerateCode}
              onStartSession={handleStartSession}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
