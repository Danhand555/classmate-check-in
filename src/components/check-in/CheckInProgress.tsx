
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface CheckInProgressProps {
  sessionId: string;
  classCapacity: number;
}

interface StudentCheckIn {
  id: string;
  checked_in_at: string;
  student: {
    name: string;
  } | null;
}

export const CheckInProgress = ({ sessionId, classCapacity }: CheckInProgressProps) => {
  const [checkIns, setCheckIns] = useState<StudentCheckIn[]>([]);

  useEffect(() => {
    // Initial fetch of check-ins
    const fetchCheckIns = async () => {
      const { data } = await supabase
        .from("student_check_ins")
        .select(`
          id,
          checked_in_at,
          student:student_id(name)
        `)
        .eq("session_id", sessionId)
        .order("checked_in_at", { ascending: true });

      if (data) {
        setCheckIns(data as StudentCheckIn[]);
      }
    };

    fetchCheckIns();

    // Subscribe to new check-ins
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "student_check_ins",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch the complete check-in data including student name
          const { data } = await supabase
            .from("student_check_ins")
            .select(`
              id,
              checked_in_at,
              student:student_id(name)
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setCheckIns((prev) => [...prev, data as StudentCheckIn]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const progressValue = (checkIns.length / classCapacity) * 100;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>{checkIns.length} students checked in</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={progressValue} className="h-3" />
          <p className="text-sm text-muted-foreground text-center">
            {checkIns.length} of {classCapacity} students
          </p>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Check-in Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkIns.map((checkIn) => (
                <TableRow key={checkIn.id}>
                  <TableCell>{checkIn.student?.name}</TableCell>
                  <TableCell>
                    {new Date(checkIn.checked_in_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
