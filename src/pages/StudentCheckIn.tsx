
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CodeEntry } from "@/components/check-in/CodeEntry";
import { RecentCheckIns } from "@/components/check-in/RecentCheckIns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, GraduationCap } from "lucide-react";

const StudentCheckIn = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "student") {
      toast.error("Only students can access this page");
      navigate("/dashboard");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">Student</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <CodeEntry />
        <RecentCheckIns />
      </div>
    </div>
  );
};

export default StudentCheckIn;

