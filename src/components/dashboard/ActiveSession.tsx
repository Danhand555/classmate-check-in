
import { Clock4, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckInsTable } from "@/components/check-in/CheckInsTable";

interface CheckIn {
  id: string;
  checked_in_at: string;
  profiles: {
    name: string;
  } | null;
}

interface ActiveSessionProps {
  code: string;
  timeLeft: number;
  checkedInCount: number;
  checkIns: CheckIn[];
  onEndSession: () => void;
}

export const ActiveSession = ({ 
  code, 
  timeLeft, 
  checkedInCount,
  checkIns,
  onEndSession 
}: ActiveSessionProps) => {
  const progressValue = (timeLeft / 240) * 100;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-6">
        <div>
          <p className="text-lg text-gray-600 mb-2">Active Code:</p>
          <p className="text-5xl font-bold text-blue-600 tracking-wider">
            {code}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Clock4 className="w-5 h-5" />
            <span>Time Remaining:</span>
          </div>
          <Progress value={progressValue} className="h-2" />
          <p className="text-3xl font-bold text-gray-900">
            {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Users className="w-5 h-5" />
          <span>{checkedInCount} students checked in</span>
        </div>
      </div>

      <CheckInsTable checkIns={checkIns} />

      <Button
        variant="destructive"
        className="w-full"
        onClick={onEndSession}
      >
        End Session
      </Button>
    </div>
  );
};
