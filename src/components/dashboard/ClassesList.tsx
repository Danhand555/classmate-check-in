
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateClassDialog } from "./CreateClassDialog";

interface ClassesListProps {
  classes: any[];
  userRole: string;
  onClassCreated?: () => void;
}

export const ClassesList = ({ classes, userRole, onClassCreated }: ClassesListProps) => {
  return (
    <Card className="animate-fadeIn [animation-delay:200ms]">
      <CardHeader>
        <CardTitle>
          {userRole === "teacher" ? "Your Classes" : "Your Schedule"}
        </CardTitle>
        <CardDescription>
          {userRole === "teacher"
            ? "Manage your class schedules"
            : "View your class schedule"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {userRole === "teacher" && <CreateClassDialog onClassCreated={onClassCreated} />}
        {userRole === "teacher" && classes.length > 0 ? (
          <ul className="space-y-2">
            {classes.map((classItem) => (
              <li key={classItem.id} className="text-gray-600">
                {classItem.name} (Capacity: {classItem.capacity})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No classes yet</p>
        )}
      </CardContent>
    </Card>
  );
};
