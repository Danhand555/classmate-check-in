
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
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

type CheckIn = {
  id: string;
  checked_in_at: string;
  status: string;
  check_in_sessions: {
    class: {
      name: string;
    };
  } | null;
};

export const RecentCheckIns = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCheckIns = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("student_check_ins")
        .select(`
          id,
          checked_in_at,
          status,
          check_in_sessions!inner (
            class:class_id (
              name
            )
          )
        `)
        .eq("student_id", user.id)
        .order("checked_in_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setCheckIns(data as CheckIn[]);
      }
      setIsLoading(false);
    };

    fetchCheckIns();
  }, [user]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : checkIns.length === 0 ? (
          <p className="text-muted-foreground">No recent check-ins</p>
        ) : (
          <div className="space-y-4">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="bg-gray-50 p-4 rounded-lg flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {checkIn.check_in_sessions?.class?.name || "Unknown Class"}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(checkIn.checked_in_at), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(checkIn.checked_in_at), "h:mm a")}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant={checkIn.status === "success" ? "default" : "destructive"}
                  className={checkIn.status === "success" ? "bg-green-500" : ""}
                >
                  {checkIn.status === "success" ? "Present" : checkIn.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
