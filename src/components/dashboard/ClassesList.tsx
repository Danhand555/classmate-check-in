
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CreateClassDialog } from "./CreateClassDialog";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";

interface ClassesListProps {
  classes: any[];
  userRole: string;
  onClassCreated?: () => void;
}

export const ClassesList = ({ classes, userRole, onClassCreated }: ClassesListProps) => {
  const { toast } = useToast();

  const handleDeleteClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Class deleted successfully",
      });

      // Refresh the classes list
      if (onClassCreated) {
        onClassCreated();
      }
    } catch (error: any) {
      toast({
        title: "Error deleting class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
              <li 
                key={classItem.id} 
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div>
                  <p className="font-medium">{classItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Capacity: {classItem.capacity}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteClass(classItem.id)}
                  title="Delete class"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
