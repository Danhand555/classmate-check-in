
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock4 } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [customCode, setCustomCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [checkedInCount, setCheckedInCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/signup");
    } else if (user.role === "teacher") {
      fetchClasses();
    }
  }, [user, navigate]);

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

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setCustomCode(code);
    toast({
      title: "Code Generated",
      description: `New code: ${code}`,
    });
    return code;
  };

  const startSession = async (classId: string, customCode?: string) => {
    try {
      const code = customCode || generateRandomCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

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

      // Subscribe to check-ins
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

      // Fetch session summary
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
    } catch (error: any) {
      toast({
        title: "Error ending session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user.name}
            </h1>
            <p className="text-gray-600">
              {user.role === "teacher"
                ? `Subject: ${user.subject}`
                : "Student Dashboard"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate("/signup");
            }}
          >
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user.role === "teacher" && (
            <Card className="col-span-full animate-fadeIn">
              <CardHeader>
                <CardTitle>Check-in Session</CardTitle>
                <CardDescription>
                  {activeSession
                    ? "Active session in progress"
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
                        <Button onClick={() => generateRandomCode()}>
                          Generate
                        </Button>
                      </div>
                    </div>
                    {classes.map((classItem) => (
                      <Button
                        key={classItem.id}
                        className="w-full"
                        onClick={() => startSession(classItem.id, customCode)}
                      >
                        Start Session for {classItem.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="animate-fadeIn [animation-delay:200ms]">
            <CardHeader>
              <CardTitle>
                {user.role === "teacher" ? "Your Classes" : "Your Schedule"}
              </CardTitle>
              <CardDescription>
                {user.role === "teacher"
                  ? "Manage your class schedules"
                  : "View your class schedule"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.role === "teacher" && classes.length > 0 ? (
                <ul className="space-y-2">
                  {classes.map((classItem) => (
                    <li key={classItem.id} className="text-gray-600">
                      {classItem.name} (Capacity: {classItem.capacity})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No classes yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fadeIn [animation-delay:400ms]">
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>View past attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
