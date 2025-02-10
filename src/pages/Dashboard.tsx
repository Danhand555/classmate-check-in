
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-gray-700" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === "student" ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <CodeEntry />
            <AttendanceHistory />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CheckInSession classes={classes} />
              <ClassesList 
                classes={classes} 
                userRole={user.role} 
                onClassCreated={fetchClasses}
              />
            </div>
            <AttendanceHistory />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
