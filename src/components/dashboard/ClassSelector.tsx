
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassSelectorProps {
  classes: any[];
  selectedClassId: string;
  onClassSelect: (classId: string) => void;
}

export const ClassSelector = ({ 
  classes, 
  selectedClassId, 
  onClassSelect 
}: ClassSelectorProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="class-select" className="text-sm font-medium">
        Select Class
      </label>
      <Select
        value={selectedClassId}
        onValueChange={onClassSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent>
          {classes.map((classItem) => (
            <SelectItem key={classItem.id} value={classItem.id}>
              {classItem.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
