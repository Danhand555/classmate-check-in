
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CheckIn {
  id: string;
  checked_in_at: string;
  profiles: {
    name: string;
  } | null;
}

interface CheckInsTableProps {
  checkIns: CheckIn[];
}

export const CheckInsTable = ({ checkIns }: CheckInsTableProps) => {
  if (!checkIns || checkIns.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No check-ins recorded yet
      </div>
    );
  }

  return (
    <div className="border rounded-lg mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Check-in Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkIns.map((checkIn) => (
            <TableRow key={checkIn.id}>
              <TableCell>{checkIn.profiles?.name || "Unknown"}</TableCell>
              <TableCell>
                {format(new Date(checkIn.checked_in_at), "h:mm a")}
              </TableCell>
              <TableCell>
                <Badge variant="default" className="bg-green-500">
                  Present
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
