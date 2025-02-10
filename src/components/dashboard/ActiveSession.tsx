
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
    <div className="space-y-8 py-4">
      <div className="text-center space-y-6">
        <div>
          <p className="text-blue-600 text-xl">Active Code:</p>
          <p className="text-blue-600 text-6xl font-bold tracking-wider">
            {code}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-blue-600 text-xl flex items-center justify-center gap-2">
            <Clock4 className="w-6 h-6" />
            Time Remaining:
          </p>
          <Progress value={progressValue} className="h-3" />
          <p className="text-blue-600 text-4xl font-bold">
            {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-blue-600 text-xl">
          <Users className="w-6 h-6" />
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
