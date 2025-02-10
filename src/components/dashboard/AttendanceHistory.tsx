
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SessionHistory = {
  id: string;
  created_at: string;
  code: string;
  class: {
    name: string;
  };
  student_check_ins: {
    id: string;
    status: string;
    profiles: {
      name: string;
    };
  }[];
};

export const AttendanceHistory = () => {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user || user.role !== 'teacher') return;

      const { data, error } = await supabase
        .from('check_in_sessions')
        .select(`
          id,
          created_at,
          code,
          class:class_id (
            name
          ),
          student_check_ins (
            id,
            status,
            profiles:student_id (
              name
            )
          )
        `)
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setSessions(data as SessionHistory[]);
      }
      setIsLoading(false);
    };

    fetchSessions();
  }, [user]);

  if (user?.role !== 'teacher') {
    return null;
  }

  return (
    <Card className="animate-fadeIn [animation-delay:400ms] col-span-2">
      <CardHeader>
        <CardTitle>Past Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground">No past sessions found</p>
        ) : (
          <div className="space-y-6">
            {sessions.map((session) => (
              <div key={session.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {session.class.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Code: {session.code}
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.student_check_ins.map((checkIn) => (
                        <TableRow key={checkIn.id}>
                          <TableCell>{checkIn.profiles.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={checkIn.status === "success" ? "default" : "destructive"}
                              className={checkIn.status === "success" ? "bg-green-500" : ""}
                            >
                              {checkIn.status === "success" ? "Present" : checkIn.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
