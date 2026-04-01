import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, CalendarIcon, MapPin, Search } from "lucide-react";
import { useAttendance, AttendanceStatus } from "@/hooks/useAttendance";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors: Record<AttendanceStatus, string> = {
  present: "bg-green-500/10 text-green-600 border-green-200",
  late: "bg-amber-500/10 text-amber-600 border-amber-200",
  remote: "bg-blue-500/10 text-blue-600 border-blue-200",
  half_day: "bg-purple-500/10 text-purple-600 border-purple-200",
  absent: "bg-red-500/10 text-red-600 border-red-200",
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  remote: "Remote",
  half_day: "Half Day",
  absent: "Absent",
};

export function TeamAttendanceTable() {
  const { teamAttendance, fetchTeamAttendance } = useAttendance();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [employeeFilter, setEmployeeFilter] = useState("");

  useEffect(() => {
    fetchTeamAttendance(format(selectedDate, "yyyy-MM-dd"));
  }, [selectedDate, fetchTeamAttendance]);

  const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    return email[0].toUpperCase();
  };

  const getName = (firstName: string | null, lastName: string | null, email: string) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return email.split("@")[0];
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return "—";
    const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const filteredRecords = teamAttendance.filter((record) => {
    if (!employeeFilter.trim()) return true;
    const name = record.user
      ? getName(record.user.first_name, record.user.last_name, record.user.email)
      : "";
    return name.toLowerCase().includes(employeeFilter.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Attendance
            </CardTitle>
            <CardDescription>View attendance records for your team</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by name..."
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="pl-8 w-[180px]"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No attendance records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record.user?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {record.user
                              ? getInitials(record.user.first_name, record.user.last_name, record.user.email)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {record.user
                            ? getName(record.user.first_name, record.user.last_name, record.user.email)
                            : "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.clock_in ? format(new Date(record.clock_in), "h:mm a") : "—"}
                    </TableCell>
                    <TableCell>
                      {record.clock_out ? format(new Date(record.clock_out), "h:mm a") : "—"}
                    </TableCell>
                    <TableCell>{calculateHours(record.clock_in, record.clock_out)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[record.status]}>
                        {statusLabels[record.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.clock_in_location ? (
                        <MapPin className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
