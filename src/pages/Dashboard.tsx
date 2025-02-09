
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CheckInSession } from "@/components/dashboard/CheckInSession";
import { ClassesList } from "@/components/dashboard/ClassesList";
import { AttendanceHistory } from "@/components/dashboard/AttendanceHistory";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/signup");
    } else if (user.role === "teacher") {
      fetchClasses();
    }
  }, [user, navigate]);

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
          {user.role === "teacher" && <CheckInSession classes={classes} />}
          <ClassesList classes={classes} userRole={user.role} />
          <AttendanceHistory />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
