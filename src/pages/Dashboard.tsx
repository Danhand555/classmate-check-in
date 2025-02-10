
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CheckInSession } from "@/components/dashboard/CheckInSession";
import { ClassesList } from "@/components/dashboard/ClassesList";
import { AttendanceHistory } from "@/components/dashboard/AttendanceHistory";
import { CodeEntry } from "@/components/check-in/CodeEntry";
import { LogOut, GraduationCap } from "lucide-react";

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {user.role === "student" ? (
          <div className="space-y-6 max-w-3xl mx-auto">
            <CodeEntry />
            <AttendanceHistory />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CheckInSession classes={classes} />
            <ClassesList 
              classes={classes} 
              userRole={user.role} 
              onClassCreated={fetchClasses}
            />
            <AttendanceHistory />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
