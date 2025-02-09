
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const AttendanceHistory = () => {
  return (
    <Card className="animate-fadeIn [animation-delay:400ms]">
      <CardHeader>
        <CardTitle>Attendance History</CardTitle>
        <CardDescription>View past attendance records</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">No data available</p>
      </CardContent>
    </Card>
  );
};
