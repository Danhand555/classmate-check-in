
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

type CheckIn = {
  id: string;
  checked_in_at: string;
  status: string;
  profiles: {
    name: string;
  };
  check_in_sessions: {
    code: string;
    class: {
      name: string;
      capacity: number;
    };
  };
};

type GroupedCheckIns = {
  [sessionId: string]: {
    sessionCode: string;
    className: string;
    capacity: number;
    created_at: string;
    checkIns: CheckIn[];
  };
};

export const AttendanceHistory = () => {
  const [groupedCheckIns, setGroupedCheckIns] = useState<GroupedCheckIns>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCheckIns = async () => {
      if (!user || user.role !== 'teacher') return;

      const { data, error } = await supabase
        .from('student_check_ins')
        .select(`
          id,
          checked_in_at,
          status,
          profiles (
            name
          ),
          check_in_sessions!inner (
            id,
            code,
            created_at,
            class:classes!check_in_sessions_class_id_fkey (
              name,
              capacity
            )
          )
        `)
        .order('checked_in_at', { ascending: false });

      if (error) {
        console.error('Error fetching check-ins:', error);
        return;
      }

      if (data) {
        // Group check-ins by session
        const grouped = data.reduce((acc: GroupedCheckIns, checkIn: any) => {
          const sessionId = checkIn.check_in_sessions.id;
          if (!acc[sessionId]) {
            acc[sessionId] = {
              sessionCode: checkIn.check_in_sessions.code,
              className: checkIn.check_in_sessions.class.name,
              capacity: checkIn.check_in_sessions.class.capacity,
              created_at: checkIn.check_in_sessions.created_at,
              checkIns: []
            };
          }
          acc[sessionId].checkIns.push(checkIn);
          return acc;
        }, {});

        setGroupedCheckIns(grouped);
      }
      setIsLoading(false);
    };

    fetchCheckIns();
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
        ) : Object.keys(groupedCheckIns).length === 0 ? (
          <p className="text-muted-foreground text-lg">No past sessions found</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedCheckIns).map(([sessionId, session]) => (
              <div key={sessionId} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {session.className}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="space-x-4 flex items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Code: </span>
                      <span className="font-medium">{session.sessionCode}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => navigate(`/class-log/${sessionId}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.checkIns.length > 0 ? (
                        session.checkIns.map((checkIn) => (
                          <TableRow key={checkIn.id}>
                            <TableCell className="font-medium">
                              {checkIn.profiles.name}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={checkIn.status === "success" ? "default" : "destructive"}
                                className={checkIn.status === "success" ? "bg-green-500" : ""}
                              >
                                {checkIn.status === "success" ? "Present" : checkIn.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                            No check-ins recorded
                          </TableCell>
                        </TableRow>
                      )}
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
