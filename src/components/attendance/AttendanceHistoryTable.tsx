 import { useEffect } from "react";
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
 import { Calendar, MapPin } from "lucide-react";
 import { useAttendance, AttendanceStatus } from "@/hooks/useAttendance";
 import { format } from "date-fns";
 
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
 
 export function AttendanceHistoryTable() {
   const { attendanceHistory, isLoading, fetchAttendanceHistory } = useAttendance();
 
   useEffect(() => {
     fetchAttendanceHistory();
   }, [fetchAttendanceHistory]);
 
   const calculateHours = (clockIn: string | null, clockOut: string | null) => {
     if (!clockIn || !clockOut) return "—";
     const start = new Date(clockIn);
     const end = new Date(clockOut);
     const diff = end.getTime() - start.getTime();
     const hours = Math.floor(diff / (1000 * 60 * 60));
     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
     return `${hours}h ${minutes}m`;
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Calendar className="h-5 w-5" />
           Attendance History
         </CardTitle>
         <CardDescription>Your recent attendance records</CardDescription>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="flex items-center justify-center py-8 text-muted-foreground">
             Loading...
           </div>
         ) : attendanceHistory.length === 0 ? (
           <div className="flex items-center justify-center py-8 text-muted-foreground">
             No attendance records found
           </div>
         ) : (
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Clock In</TableHead>
                   <TableHead>Clock Out</TableHead>
                   <TableHead>Hours</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Location</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {attendanceHistory.map((record) => (
                   <TableRow key={record.id}>
                     <TableCell className="font-medium">
                       {format(new Date(record.date), "MMM d, yyyy")}
                     </TableCell>
                     <TableCell>
                       {record.clock_in
                         ? format(new Date(record.clock_in), "h:mm a")
                         : "—"}
                     </TableCell>
                     <TableCell>
                       {record.clock_out
                         ? format(new Date(record.clock_out), "h:mm a")
                         : "—"}
                     </TableCell>
                     <TableCell>
                       {calculateHours(record.clock_in, record.clock_out)}
                     </TableCell>
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