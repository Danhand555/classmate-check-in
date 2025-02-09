
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/signup");
    }
  }, [user, navigate]);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="animate-fadeIn">
            <CardHeader>
              <CardTitle>Quick Check-in</CardTitle>
              <CardDescription>
                {user.role === "teacher"
                  ? "Mark your attendance for today"
                  : "Check in to your classes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Check In</Button>
            </CardContent>
          </Card>

          <Card className="animate-fadeIn [animation-delay:200ms]">
            <CardHeader>
              <CardTitle>
                {user.role === "teacher" ? "Your Classes" : "Your Schedule"}
              </CardTitle>
              <CardDescription>
                {user.role === "teacher"
                  ? "Manage your class schedules"
                  : "View your class schedule"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No classes yet</p>
            </CardContent>
          </Card>

          <Card className="animate-fadeIn [animation-delay:400ms]">
            <CardHeader>
              <CardTitle>Attendance Statistics</CardTitle>
              <CardDescription>View your attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">No data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
