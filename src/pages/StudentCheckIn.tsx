
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CodeEntry } from "@/components/check-in/CodeEntry";
import { RecentCheckIns } from "@/components/check-in/RecentCheckIns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const StudentCheckIn = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <Button
            variant="outline"
            onClick={() => {
              navigate("/dashboard");
            }}
          >
            Dashboard
          </Button>
        </div>

        <CodeEntry />
        <RecentCheckIns />
      </div>
    </div>
  );
};

export default StudentCheckIn;
