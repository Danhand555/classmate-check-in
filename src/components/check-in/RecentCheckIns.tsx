
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

type CheckIn = {
  id: string;
  checked_in_at: string;
  status: string;
  classes: {
    name: string;
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
          check_in_sessions ( classes ( name ) )
        `)
        .eq("student_id", user.id)
        .order("checked_in_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        // Transform the data to match the CheckIn type
        const transformedData: CheckIn[] = data.map(item => ({
          id: item.id,
          checked_in_at: item.checked_in_at,
          status: item.status,
          classes: item.check_in_sessions?.classes || null
        }));
        setCheckIns(transformedData);
      }
      setIsLoading(false);
    };

    fetchCheckIns();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-ins</CardTitle>
      </CardHeader>
      <CardContent>
        {checkIns.length === 0 ? (
          <p className="text-muted-foreground">No recent check-ins</p>
        ) : (
          <div className="space-y-4">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {checkIn.classes?.name || "Unknown Class"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(checkIn.checked_in_at), "PPp")}
                  </p>
                </div>
                <Badge variant={checkIn.status === "success" ? "default" : "destructive"}>
                  {checkIn.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
