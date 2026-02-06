 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 
 export type AttendanceStatus = "present" | "late" | "remote" | "half_day" | "absent";
 
 export interface AttendanceRecord {
   id: string;
   user_id: string;
   date: string;
   clock_in: string | null;
   clock_out: string | null;
   status: AttendanceStatus;
   clock_in_location: { lat: number; lng: number; accuracy: number } | null;
   clock_out_location: { lat: number; lng: number; accuracy: number } | null;
   notes: string | null;
   created_at: string;
   updated_at: string;
   user?: {
     id: string;
     first_name: string | null;
     last_name: string | null;
     email: string;
     avatar_url: string | null;
   };
 }
 
 interface LocationData {
   lat: number;
   lng: number;
   accuracy: number;
 }
 
 export function useAttendance() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
   const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
   const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [isClockedIn, setIsClockedIn] = useState(false);
 
   const getLocation = (): Promise<LocationData | null> => {
     return new Promise((resolve) => {
       if (!navigator.geolocation) {
         resolve(null);
         return;
       }
 
       navigator.geolocation.getCurrentPosition(
         (position) => {
           resolve({
             lat: position.coords.latitude,
             lng: position.coords.longitude,
             accuracy: position.coords.accuracy,
           });
         },
         (error) => {
           console.error("Geolocation error:", error);
           resolve(null);
         },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
       );
     });
   };
 
   const determineStatus = (clockInTime: Date): AttendanceStatus => {
     const hours = clockInTime.getHours();
     const minutes = clockInTime.getMinutes();
     const totalMinutes = hours * 60 + minutes;
     
     // Assuming work starts at 9:00 AM
     const workStartMinutes = 9 * 60;
     const lateThreshold = 15; // 15 minutes grace period
     
     if (totalMinutes <= workStartMinutes + lateThreshold) {
       return "present";
     }
     return "late";
   };
 
   const fetchTodayRecord = useCallback(async () => {
     if (!user) return;
 
     const today = new Date().toISOString().split("T")[0];
     
     const { data, error } = await supabase
       .from("attendance_records")
       .select("*")
       .eq("user_id", user.id)
       .eq("date", today)
       .maybeSingle();
 
     if (error) {
       console.error("Error fetching today's record:", error);
       return;
     }
 
     if (data) {
       setTodayRecord(data as AttendanceRecord);
       setIsClockedIn(!!data.clock_in && !data.clock_out);
     } else {
       setTodayRecord(null);
       setIsClockedIn(false);
     }
   }, [user]);
 
   const fetchAttendanceHistory = useCallback(async (startDate?: string, endDate?: string) => {
     if (!user) return;
 
     setIsLoading(true);
     
     let query = supabase
       .from("attendance_records")
       .select("*")
       .eq("user_id", user.id)
       .order("date", { ascending: false });
 
     if (startDate) {
       query = query.gte("date", startDate);
     }
     if (endDate) {
       query = query.lte("date", endDate);
     }
 
     const { data, error } = await query.limit(30);
 
     if (error) {
       console.error("Error fetching attendance history:", error);
       setIsLoading(false);
       return;
     }
 
     setAttendanceHistory((data || []) as AttendanceRecord[]);
     setIsLoading(false);
   }, [user]);
 
   const fetchTeamAttendance = useCallback(async (date?: string) => {
     if (!user) return;
 
     const targetDate = date || new Date().toISOString().split("T")[0];
     
     const { data, error } = await supabase
       .from("attendance_records")
       .select(`
         *,
         user:user_id (
           id,
           first_name,
           last_name,
           email,
           avatar_url
         )
       `)
       .eq("date", targetDate)
       .order("clock_in", { ascending: true });
 
     if (error) {
       console.error("Error fetching team attendance:", error);
       return;
     }
 
     setTeamAttendance((data || []) as AttendanceRecord[]);
   }, [user]);
 
   const clockIn = async (status: AttendanceStatus = "present", isRemote: boolean = false) => {
     if (!user) return false;
 
     setIsLoading(true);
     const now = new Date();
     const today = now.toISOString().split("T")[0];
     
     const location = await getLocation();
     const finalStatus = isRemote ? "remote" : determineStatus(now);
 
     const locationJson = location ? { lat: location.lat, lng: location.lng, accuracy: location.accuracy } : null;
 
     const { data, error } = await supabase
       .from("attendance_records")
       .insert({
         user_id: user.id,
         date: today,
         clock_in: now.toISOString(),
         status: finalStatus,
         clock_in_location: locationJson,
       })
       .select()
       .single();
 
     setIsLoading(false);
 
     if (error) {
       if (error.code === "23505") {
         toast({
           variant: "destructive",
           title: "Already clocked in",
           description: "You have already clocked in for today.",
         });
       } else {
         toast({
           variant: "destructive",
           title: "Clock-in failed",
           description: error.message,
         });
       }
       return false;
     }
 
     setTodayRecord(data as AttendanceRecord);
     setIsClockedIn(true);
     
     toast({
       title: "Clocked in successfully",
       description: `Status: ${finalStatus.replace("_", " ")}${location ? " (Location recorded)" : ""}`,
     });
 
     return true;
   };
 
   const clockOut = async () => {
     if (!user || !todayRecord) return false;
 
     setIsLoading(true);
     const now = new Date();
     const location = await getLocation();
 
     const locationJson = location ? { lat: location.lat, lng: location.lng, accuracy: location.accuracy } : null;
 
     const { data, error } = await supabase
       .from("attendance_records")
       .update({
         clock_out: now.toISOString(),
         clock_out_location: locationJson,
       })
       .eq("id", todayRecord.id)
       .select()
       .single();
 
     setIsLoading(false);
 
     if (error) {
       toast({
         variant: "destructive",
         title: "Clock-out failed",
         description: error.message,
       });
       return false;
     }
 
     setTodayRecord(data as AttendanceRecord);
     setIsClockedIn(false);
     
     toast({
       title: "Clocked out successfully",
       description: location ? "Location recorded" : undefined,
     });
 
     return true;
   };
 
   const updateStatus = async (recordId: string, status: AttendanceStatus) => {
     const { error } = await supabase
       .from("attendance_records")
       .update({ status })
       .eq("id", recordId);
 
     if (error) {
       toast({
         variant: "destructive",
         title: "Update failed",
         description: error.message,
       });
       return false;
     }
 
     toast({
       title: "Status updated",
       description: `Changed to ${status.replace("_", " ")}`,
     });
 
     fetchTodayRecord();
     fetchTeamAttendance();
     return true;
   };
 
  // Initial data fetch
  useEffect(() => {
    fetchTodayRecord();
    fetchAttendanceHistory();
  }, [fetchTodayRecord, fetchAttendanceHistory]);

  // Realtime subscription for attendance updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("attendance-realtime-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
        },
        () => {
          // Refresh data when any attendance record changes
          fetchTodayRecord();
          fetchAttendanceHistory();
          fetchTeamAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTodayRecord, fetchAttendanceHistory, fetchTeamAttendance]);
 
   return {
     todayRecord,
     attendanceHistory,
     teamAttendance,
     isLoading,
     isClockedIn,
     clockIn,
     clockOut,
     updateStatus,
     fetchTodayRecord,
     fetchAttendanceHistory,
     fetchTeamAttendance,
   };
 }