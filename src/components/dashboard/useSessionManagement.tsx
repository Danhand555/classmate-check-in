
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startCheckInSession, endCheckInSession } from "@/utils/sessionManagement";

interface CheckIn {
  id: string;
  checked_in_at: string;
  profiles: {
    name: string;
  } | null;
}

export const useSessionManagement = (selectedClassId: string) => {
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [customCode, setCustomCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(240);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    if (activeSession) {
      const fetchCheckIns = async () => {
        const { data } = await supabase
          .from("student_check_ins")
          .select(`
            id,
            checked_in_at,
            profiles (
              name
            )
          `)
          .eq("session_id", activeSession.id)
          .order("checked_in_at", { ascending: true });

        if (data) {
          console.log('Fetched check-ins:', data);
          setCheckIns(data);
          setCheckedInCount(data.length);
        }
      };

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
          async (payload) => {
            console.log('New check-in:', payload);
            fetchCheckIns();
          }
        )
        .subscribe();

      fetchCheckIns();

      return () => {
        clearInterval(timer);
        channel.unsubscribe();
      };
    }
  }, [activeSession]);

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
            if (!payload.new.is_active) {
              setActiveSession(null);
              setTimeLeft(240);
              setCustomCode("");
              setCheckIns([]);
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [activeSession]);

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
      setTimeLeft(240);
      setCheckedInCount(0);
      setCheckIns([]);
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
      setCheckIns([]);
    } catch (error: any) {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    activeSession,
    customCode,
    setCustomCode,
    timeLeft,
    checkedInCount,
    checkIns,
    handleStartSession,
    handleEndSession,
  };
};
