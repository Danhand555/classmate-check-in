
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CheckInDetail {
  id: string;
  checked_in_at: string;
  status: string;
  student_name: string;
}

interface SessionDetails {
  id: string;
  created_at: string;
  code: string;
  check_in_details: CheckInDetail[] | null;
  class: {
    name: string;
    capacity: number;
  };
}

export default function ClassLog() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/dashboard');
      return;
    }

    const fetchSessionDetails = async () => {
      const { data, error } = await supabase
        .from('check_in_sessions')
        .select(`
          id,
          created_at,
          code,
          check_in_details,
          class:classes (
            name,
            capacity
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        navigate('/dashboard');
      } else if (data) {
        setSession(data);
      }
      setIsLoading(false);
    };

    fetchSessionDetails();
  }, [sessionId, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-600">Session not found</p>
        </div>
      </div>
    );
  }

  const attendanceRate = session.check_in_details 
    ? (session.check_in_details.filter(c => c.status === 'success').length / session.class.capacity) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex justify-between items-center">
              <span>{session.class.name}</span>
              <Badge variant="secondary" className="text-lg">
                Code: {session.code}
              </Badge>
            </CardTitle>
            <CardDescription>
              Session on {format(new Date(session.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {Math.round(attendanceRate)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">Students Present</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {session.check_in_details?.filter(c => c.status === 'success').length || 0} / {session.class.capacity}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.check_in_details && session.check_in_details.length > 0 ? (
                        session.check_in_details.map((checkIn) => (
                          <TableRow key={checkIn.id}>
                            <TableCell className="font-medium">
                              {checkIn.student_name}
                            </TableCell>
                            <TableCell>
                              {format(new Date(checkIn.checked_in_at), "h:mm a")}
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
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                            No check-ins recorded
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
