 import { useState } from "react";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Clock, MapPin, LogIn, LogOut, Laptop } from "lucide-react";
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
 
 export function ClockInOutCard() {
   const { todayRecord, isLoading, isClockedIn, clockIn, clockOut } = useAttendance();
   const [isRemote, setIsRemote] = useState(false);
 
   const handleClockIn = async () => {
     await clockIn("present", isRemote);
   };
 
   const handleClockOut = async () => {
     await clockOut();
   };
 
   return (
     <Card className="overflow-hidden">
       <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <Clock className="h-5 w-5" />
               Today's Attendance
             </CardTitle>
             <CardDescription>
               {format(new Date(), "EEEE, MMMM d, yyyy")}
             </CardDescription>
           </div>
           {todayRecord && (
             <Badge className={statusColors[todayRecord.status]}>
               {statusLabels[todayRecord.status]}
             </Badge>
           )}
         </div>
       </CardHeader>
       <CardContent className="p-6">
         {todayRecord ? (
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <p className="text-sm text-muted-foreground">Clock In</p>
                 <p className="text-lg font-semibold">
                   {todayRecord.clock_in
                     ? format(new Date(todayRecord.clock_in), "h:mm a")
                     : "—"}
                 </p>
                 {todayRecord.clock_in_location && (
                   <p className="text-xs text-muted-foreground flex items-center gap-1">
                     <MapPin className="h-3 w-3" />
                     Location recorded
                   </p>
                 )}
               </div>
               <div className="space-y-1">
                 <p className="text-sm text-muted-foreground">Clock Out</p>
                 <p className="text-lg font-semibold">
                   {todayRecord.clock_out
                     ? format(new Date(todayRecord.clock_out), "h:mm a")
                     : "—"}
                 </p>
                 {todayRecord.clock_out_location && (
                   <p className="text-xs text-muted-foreground flex items-center gap-1">
                     <MapPin className="h-3 w-3" />
                     Location recorded
                   </p>
                 )}
               </div>
             </div>
 
             {isClockedIn && (
               <Button
                 onClick={handleClockOut}
                 disabled={isLoading}
                 className="w-full"
                 variant="destructive"
               >
                 <LogOut className="h-4 w-4 mr-2" />
                 {isLoading ? "Processing..." : "Clock Out"}
               </Button>
             )}
 
             {todayRecord.clock_out && (
               <div className="text-center text-sm text-muted-foreground">
                 Total hours:{" "}
                 <span className="font-medium">
                   {(() => {
                     const clockIn = new Date(todayRecord.clock_in!);
                     const clockOut = new Date(todayRecord.clock_out);
                     const diff = clockOut.getTime() - clockIn.getTime();
                     const hours = Math.floor(diff / (1000 * 60 * 60));
                     const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                     return `${hours}h ${minutes}m`;
                   })()}
                 </span>
               </div>
             )}
           </div>
         ) : (
           <div className="space-y-4">
             <p className="text-center text-muted-foreground">
               You haven't clocked in yet today
             </p>
             
             <div className="flex items-center justify-center gap-2">
               <Button
                 variant={isRemote ? "outline" : "default"}
                 size="sm"
                 onClick={() => setIsRemote(false)}
               >
                 On-site
               </Button>
               <Button
                 variant={isRemote ? "default" : "outline"}
                 size="sm"
                 onClick={() => setIsRemote(true)}
               >
                 <Laptop className="h-4 w-4 mr-1" />
                 Remote
               </Button>
             </div>
 
             <Button
               onClick={handleClockIn}
               disabled={isLoading}
               className="w-full"
             >
               <LogIn className="h-4 w-4 mr-2" />
               {isLoading ? "Processing..." : "Clock In"}
             </Button>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }