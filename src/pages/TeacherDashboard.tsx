import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  GraduationCap, 
  QrCode, 
  Calendar, 
  FileText, 
  BarChart3, 
  Bell,
  LogOut,
  Clock,
  Users,
  CheckCircle,
  BookOpen,
  MapPin,
  Camera,
  Scan,
  MoreHorizontal,
  Eye,
  Settings,
  TrendingUp,
  Award
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { getCurrentLocation, isWithinSchoolRadius, SCHOOL_COORDINATES } from '@/utils/geolocation';
import { requestCameraAccess, stopCameraStream, attachStreamToVideo } from '@/utils/camera';
import { SoundEffects } from '@/utils/soundEffects';
import { LeaveApplicationForm } from '@/components/leave/LeaveApplicationForm';
import { LeaveApplicationsList, type LeaveApplication } from '@/components/leave/LeaveApplicationsList';
import { HolidayCalendarViewer } from '@/components/shared/HolidayCalendarViewer';
import { NotificationManager } from '@/utils/notificationManager';

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<any[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0 });
  const [locationMatched, setLocationMatched] = useState(false);
  const [showLocationMismatch, setShowLocationMismatch] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [attendanceProcessing, setAttendanceProcessing] = useState(false);
  const [teacherAttendanceMarked, setTeacherAttendanceMarked] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAttendanceChart, setShowAttendanceChart] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showLeaveApplications, setShowLeaveApplications] = useState(false);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [showHolidayCalendar, setShowHolidayCalendar] = useState(false);
  const [showStudentAttendanceOverlay, setShowStudentAttendanceOverlay] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{subject: string, class: string, time: string} | null>(null);
  const [subjectAttendanceMarked, setSubjectAttendanceMarked] = useState<{[key: string]: boolean}>({});
  const [classMode, setClassMode] = useState<'online' | 'offline'>('offline');
  const [leaveNotifications, setLeaveNotifications] = useState<any[]>([]);
  const [adminNotices, setAdminNotices] = useState<any[]>([]);

  useEffect(() => {
    // Load class mode from localStorage on component mount
    const storedMode = localStorage.getItem('smartpresence_class_mode');
    if (storedMode) {
      setClassMode(storedMode as 'online' | 'offline');
    }

    // Load leave applications from localStorage
    const storedLeaveApplications = localStorage.getItem('smartpresence_teacher_leave_applications');
    console.log('Loading teacher leave applications:', storedLeaveApplications);
    if (storedLeaveApplications) {
      const parsedApplications = JSON.parse(storedLeaveApplications);
      console.log('Parsed applications:', parsedApplications);
      setLeaveApplications(parsedApplications);
    }

    // Load leave notifications from localStorage
    const storedNotifications = localStorage.getItem('smartpresence_teacher_notifications');
    if (storedNotifications) {
      setLeaveNotifications(JSON.parse(storedNotifications));
    }

    // Load admin notices from localStorage
    const storedAdminNotices = localStorage.getItem('smartpresence_notices');
    if (storedAdminNotices) {
      const parsedNotices = JSON.parse(storedAdminNotices);
      setAdminNotices(parsedNotices);
    }

    // Simulate admin notices appearing with fade-in animation
    const adminNoticesInterval = setInterval(() => {
      const storedNotices = localStorage.getItem('smartpresence_notices');
      if (storedNotices) {
        const parsedNotices = JSON.parse(storedNotices);
        if (parsedNotices.length > adminNotices.length) {
          setAdminNotices(parsedNotices);
        }
      }
    }, 2000);

    // Listen for storage changes to update notifications in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartpresence_teacher_notifications' && e.newValue) {
        // Handle new notifications with animation
        const notifications = JSON.parse(e.newValue);
        setLeaveNotifications(notifications);
        const newNotification = notifications.find((n: any) => n.isNew);
        if (newNotification) {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            className: newNotification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          });
          // Remove the isNew flag
          const updatedNotifications = notifications.map((n: any) => ({ ...n, isNew: false }));
          localStorage.setItem('smartpresence_teacher_notifications', JSON.stringify(updatedNotifications));
          setLeaveNotifications(updatedNotifications);
        }
      } else if (e.key === 'smartpresence_teacher_leave_applications' && e.newValue) {
        setLeaveApplications(JSON.parse(e.newValue));
      } else if (e.key === 'smartpresence_notices' && e.newValue) {
        const parsedNotices = JSON.parse(e.newValue);
        setAdminNotices(parsedNotices);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(adminNoticesInterval);
    };
  }, []);

  // Dummy data for demo
  const dummyNotices = [
    { id: 1, title: "Admin published exam schedule", content: "Mid-term exams start from Oct 15th", created_at: new Date().toISOString() },
    { id: 2, title: "Extra class tomorrow at 3 PM", content: "Additional Physics class scheduled", created_at: new Date().toISOString() },
    { id: 3, title: "Holiday on Friday", content: "School closed for Diwali celebration", created_at: new Date().toISOString() }
  ];

  const dummyProfile = {
    full_name: "Dr. Johnson Smith",
    grade_level: "Secondary",
    subjects: ["Mathematics", "Physics"],
    leave_balance: 15
  };

  useEffect(() => {
    // Set dummy data
    setNotices(dummyNotices);
    setTeacherProfile(dummyProfile);
  }, []);

  const markAttendance = () => {
    if (teacherAttendanceMarked) {
      toast({
        title: "Already Marked",
        description: "Your attendance for today has already been recorded.",
        variant: "default",
      });
      return;
    }
    
    if (isOnlineMode) {
      // Skip location check in online mode - directly open camera
      handleCameraPreview();
    } else {
      // Show location permission modal in offline mode
      setShowLocationModal(true);
    }
  };

  const markSubjectAttendance = (classItem: {subject: string, class: string, time: string}) => {
    const classKey = `${classItem.subject}-${classItem.class}`;
    
    if (subjectAttendanceMarked[classKey]) {
      toast({
        title: "Already Marked",
        description: `Attendance for ${classItem.subject} - ${classItem.class} is already recorded.`,
        variant: "default",
      });
      return;
    }
    
    setSelectedClass(classItem);
    
    if (isOnlineMode) {
      handleSubjectCameraPreview(classItem);
    } else {
      setShowLocationModal(true);
    }
  };

  const handleSubjectCameraPreview = async (classItem: {subject: string, class: string, time: string}) => {
    setShowCameraPreview(true);
    
    try {
      const stream = await requestCameraAccess();
      setCameraStream(stream);
      attachStreamToVideo(stream, 'teacher-camera-video');
      
      setTimeout(() => {
        stopCameraStream(stream);
        setCameraStream(null);
        setShowCameraPreview(false);
        
        // Success notification with sound
        SoundEffects.playSuccess();
        toast({
          title: "✅ Attendance Marked Successfully",
          description: `Attendance marked for ${classItem.subject} - ${classItem.class}`,
        });
        
        // Mark subject attendance as completed
        const classKey = `${classItem.subject}-${classItem.class}`;
        const updatedAttendance = { ...subjectAttendanceMarked, [classKey]: true };
        setSubjectAttendanceMarked(updatedAttendance);
        localStorage.setItem('smartpresence_subject_attendance', JSON.stringify(updatedAttendance));
        
        // Show student attendance selection overlay
        setTimeout(() => {
          console.log('Setting showStudentAttendanceOverlay to true');
          setShowStudentAttendanceOverlay(true);
        }, 1000);
      }, 2000);
      
    } catch (error) {
      console.error('Camera error:', error);
      setShowCameraPreview(false);
      SoundEffects.playError();
      toast({
        title: "❌ Camera Access Denied",
        description: "Camera access is required for attendance marking.",
        variant: "destructive",
      });
    }
  };

  const activateStudentAttendanceMode = (mode: 'qr' | 'face') => {
    if (!selectedClass) return;
    
    // Store the active mode and class info in localStorage for student dashboard
    const attendanceSession = {
      mode,
      subject: selectedClass.subject,
      class: selectedClass.class,
      time: selectedClass.time,
      teacherId: user?.id || 'teacher-1',
      isActive: true,
      timestamp: Date.now()
    };
    
    localStorage.setItem('smartpresence_student_attendance_session', JSON.stringify(attendanceSession));
    
    setShowStudentAttendanceOverlay(false);
    setSelectedClass(null);
    
    toast({
      title: "Student Attendance Activated",
      description: `${mode === 'qr' ? 'QR Code' : 'Face Recognition'} mode activated for ${selectedClass.subject} - ${selectedClass.class}`,
    });
  };

  const handleLocationPermission = async (allowed: boolean) => {
    setShowLocationModal(false);
    
    if (!allowed) {
      SoundEffects.playError();
      toast({
        title: "❌ Location Access Denied",
        description: "Location access is required for offline attendance marking.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAttendanceProcessing(true);
      const position = await getCurrentLocation();
      const detectedLat = position.coords.latitude;
      const detectedLng = position.coords.longitude;
      
      setCurrentLocation({ lat: detectedLat, lng: detectedLng });
      
      // Check if within school radius using new coordinates
      const isWithinRadius = isWithinSchoolRadius(detectedLat, detectedLng);
      setLocationMatched(isWithinRadius);
      
      if (isWithinRadius) {
        SoundEffects.playSuccess();
        toast({
          title: "✅ Location Verified",
          description: `Within school premises (${SCHOOL_COORDINATES.latitude}°N, ${SCHOOL_COORDINATES.longitude}°E)`,
        });
        
        setTimeout(() => {
          if (selectedClass) {
            handleSubjectCameraPreview(selectedClass);
          } else {
            handleCameraPreview();
          }
        }, 1500);
      } else {
        setShowLocationMismatch(true);
        SoundEffects.playError();
        
        // Add shake animation to page
        document.body.classList.add('animate-shake');
        setTimeout(() => {
          document.body.classList.remove('animate-shake');
        }, 500);
        
        toast({
          title: "⚠️ Location Mismatch",
          description: "You must be within 500 meters of school premises to mark attendance.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      SoundEffects.playError();
      toast({
        title: "Location Error",
        description: "Unable to get your location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setAttendanceProcessing(false);
    }
  };

  const handleCameraPreview = async () => {
    setShowCameraPreview(true);
    
    try {
      // Request real camera access using utility
      const stream = await requestCameraAccess();
      setCameraStream(stream);
      
      // Attach stream to video element
      attachStreamToVideo(stream, 'teacher-camera-video');
      
      // Auto-close camera after 2 seconds and show success
      setTimeout(() => {
        // Stop camera stream
        stopCameraStream(stream);
        setCameraStream(null);
        setShowCameraPreview(false);
        
        // Success notification with animation and sound
        SoundEffects.playSuccess();
        toast({
          title: "✅ Attendance Marked Successfully",
          description: "Your attendance has been recorded for today",
        });
        
        // Mark attendance as completed for today
        const today = new Date().toDateString();
        localStorage.setItem('smartpresence_teacher_attendance_date', today);
        setTeacherAttendanceMarked(true);
      }, 2000);
      
    } catch (error) {
      console.error('Camera error:', error);
      setShowCameraPreview(false);
      SoundEffects.playError();
      toast({
        title: "❌ Camera Access Denied",
        description: "Camera access is required for attendance marking.",
        variant: "destructive",
      });
    }
  };


  const handleLeaveSubmit = (leaveData: Omit<LeaveApplication, 'id' | 'status' | 'applicationNumber' | 'submittedAt'>) => {
    const applicationNumber = `TL${Date.now().toString().slice(-6)}`;
    const newApplication: LeaveApplication = {
      ...leaveData,
      id: Date.now().toString(),
      status: 'pending',
      applicationNumber,
      submittedAt: new Date(),
    };

    const updatedApplications = [newApplication, ...leaveApplications];
    setLeaveApplications(updatedApplications);

    // Save to localStorage
    console.log('Saving teacher leave applications:', updatedApplications);
    localStorage.setItem('smartpresence_teacher_leave_applications', JSON.stringify(updatedApplications));

    // Also save to global leave applications for admin
    const globalApplications = JSON.parse(localStorage.getItem('smartpresence_all_leave_applications') || '[]');
    const globalApplication = {
      ...newApplication,
      submittedBy: {
        id: user?.id || 'teacher-1',
        name: teacherProfile?.full_name || 'Teacher',
        role: 'teacher' as const,
        email: user?.email || 'teacher@school.com',
        subjects: teacherProfile?.subjects || [],
      }
    };
    globalApplications.push(globalApplication);
    localStorage.setItem('smartpresence_all_leave_applications', JSON.stringify(globalApplications));
  };

  // Mock data for today's classes
  const todaysClasses = [
    { time: "09:00 AM", subject: "Mathematics", class: "10-A", room: "Room 101" },
    { time: "11:00 AM", subject: "Physics", class: "11-B", room: "Room 203" },
    { time: "02:00 PM", subject: "Mathematics", class: "9-C", room: "Room 105" },
  ];

  // Show Holiday Calendar
  if (showHolidayCalendar) {
    return (
      <HolidayCalendarViewer 
        onBack={() => setShowHolidayCalendar(false)}
        userRole="teacher"
      />
    );
  }

  // Show Leave Applications List
  if (showLeaveApplications) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-glassmorphism backdrop-blur-glass border-b border-border shadow-glass">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setShowLeaveApplications(false)}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">My Leave Applications</h1>
                <p className="text-muted-foreground">View and manage your leave applications</p>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <LeaveApplicationsList applications={leaveApplications} userType="teacher" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-glassmorphism backdrop-blur-glass border-b border-border shadow-glass">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {teacherProfile?.full_name || 'Teacher'}</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysClasses.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherProfile?.subjects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Teaching subjects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
              <p className="text-xs text-muted-foreground">Total students</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            onMouseEnter={() => setShowAttendanceChart(true)}
            onMouseLeave={() => setShowAttendanceChart(false)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">This week</p>
              
              {showAttendanceChart && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center animate-fade-in z-10">
                  <div className="p-4 text-center animate-scale-in">
                    <div className="w-24 h-24 mx-auto mb-2 relative">
                      {/* Pie Chart Representation */}
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="3"
                          strokeDasharray="92, 100"
                          className="animate-[draw_1s_ease-out]"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">92%</span>
                      </div>
                    </div>
                    <p className="text-xs font-medium">Weekly Progress</p>
                    <p className="text-xs text-muted-foreground">Present: 23/25 days</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Actions - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className={`cursor-pointer transition-all duration-300 border-2 ${
            teacherAttendanceMarked
              ? 'opacity-50 cursor-not-allowed border-green-200 bg-green-50'
              : attendanceProcessing 
              ? 'border-primary/50 bg-primary/5 animate-pulse' 
              : 'border-transparent hover:border-primary/20 hover:shadow-xl hover:scale-105'
          }`} onClick={markAttendance}>
            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                attendanceProcessing 
                  ? 'bg-primary/20 animate-spin' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:shadow-lg'
              }`}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-lg">Mark Attendance</CardTitle>
              <p className="text-sm text-muted-foreground mb-2">Mark your own attendance for today</p>
              <CardDescription>
                {isOnlineMode 
                  ? 'Quick camera-based attendance' 
                  : 'Location + camera verification required'
                }
              </CardDescription>
              {!isOnlineMode && (
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                  <MapPin className="w-3 h-3" />
                  <span>500m radius check</span>
                </div>
              )}
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Student Reports", description: "Detailed attendance analytics coming soon!" })}>
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <CardTitle>Student Reports</CardTitle>
              <CardDescription>
                Daily, weekly, and monthly attendance reports
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Class Management", description: "Advanced class management tools coming soon!" })}>
            <CardHeader className="text-center">
              <Users className="w-12 h-12 mx-auto text-purple-500 mb-2" />
              <CardTitle>Class Management</CardTitle>
              <CardDescription>
                Manage your classes and student groups
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300" onClick={() => setShowMoreOptions(!showMoreOptions)}>
            <CardHeader className="text-center">
              <MoreHorizontal className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
              <CardTitle>More Options</CardTitle>
              <CardDescription>
                Additional features and tools
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* More Options - Hidden Cards */}
        {showMoreOptions && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right" onClick={() => setShowLeaveForm(true)}>
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 mx-auto text-orange-500 mb-2" />
                <CardTitle>Apply for Leave</CardTitle>
                <CardDescription>
                  Submit leave applications for approval
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right" style={{animationDelay: '0.1s'}} onClick={() => setShowLeaveApplications(true)}>
              <CardHeader className="text-center">
                <Eye className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <CardTitle>View Leave Applications</CardTitle>
                <CardDescription>
                  Check your leave application history
                </CardDescription>
                {leaveApplications.length > 0 && (
                  <Badge className="mt-2 bg-blue-500">
                    {leaveApplications.length} application(s)
                  </Badge>
                )}
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right" style={{animationDelay: '0.2s'}} onClick={() => setShowHolidayCalendar(true)}>
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-purple-500 mb-2" />
                <CardTitle>View Holiday Calendar</CardTitle>
                <CardDescription>
                  Check school holidays and breaks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right" style={{animationDelay: '0.3s'}} onClick={() => toast({ title: "Teacher Settings", description: "Settings panel coming soon!" })}>
              <CardHeader className="text-center">
                <Settings className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                <CardTitle>Teacher Settings</CardTitle>
                <CardDescription>
                  Customize your preferences
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right" style={{animationDelay: '0.3s'}} onClick={() => toast({ title: "Performance Awards", description: "Awards system coming soon!" })}>
              <CardHeader className="text-center">
                <Award className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                <CardTitle>Performance Awards</CardTitle>
                <CardDescription>
                  View your teaching awards
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>
              Your classes for today, {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysClasses.map((classItem, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-semibold">{classItem.time}</div>
                    </div>
                    <div>
                      <h3 className="font-medium">{classItem.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        Class {classItem.class} • {classItem.room}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => markSubjectAttendance(classItem)}
                    disabled={subjectAttendanceMarked[`${classItem.subject}-${classItem.class}`]}
                    className={subjectAttendanceMarked[`${classItem.subject}-${classItem.class}`] 
                      ? 'opacity-50 cursor-not-allowed bg-green-50 text-green-600' 
                      : ''}
                  >
                    {subjectAttendanceMarked[`${classItem.subject}-${classItem.class}`] ? '✅ Marked' : 'Mark Attendance'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Notifications with Slide-up Animation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
              {leaveNotifications.some(n => n.isNew) && (
                <Badge className="bg-red-500 animate-bounce">New</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Latest announcements and leave updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const allNotifications = [
                  ...notices.map(notice => ({ 
                    ...notice, 
                    type: 'notice', 
                    date: notice.created_at,
                    content: notice.content
                  })),
                  ...adminNotices.map(notice => ({ 
                    ...notice, 
                    type: 'admin_notice', 
                    date: notice.created_at,
                    content: notice.content
                  })),
                  ...leaveNotifications.map(notification => ({ 
                    ...notification, 
                    type: 'leave', 
                    date: notification.timestamp,
                    content: notification.message 
                  }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5); // Show only latest 5 notifications

                return allNotifications.length > 0 ? (
                  allNotifications.map((item, index) => (
                    <div 
                      key={`${item.type}-${item.id}`} 
                      className={`p-4 border rounded-lg transition-all duration-500 transform ${
                        item.slideDirection === 'up' 
                          ? 'animate-[slideUp_0.5s_ease-out]' 
                          : 'animate-fade-in'
                      } ${
                        item.type === 'leave' ? (
                          item.type === 'success' 
                            ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20' 
                            : 'bg-red-50/50 border-red-200 dark:bg-red-950/20'
                        ) : item.type === 'admin_notice' 
                          ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20' 
                          : 'hover:bg-muted/50'
                      } ${item.isNew ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        '--slide-distance': item.slideDirection === 'up' ? '20px' : '0px'
                      } as React.CSSProperties}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium flex items-center gap-2">
                            {item.title}
                            {item.isNew && (
                              <Badge className="bg-red-500 text-white animate-pulse">NEW</Badge>
                            )}
                            {item.type === 'leave' && (
                              <Badge variant="outline" className={
                                item.type === 'success' 
                                  ? 'text-green-600 bg-green-50' 
                                  : 'text-red-600 bg-red-50'
                              }>
                                Leave Update
                              </Badge>
                            )}
                            {item.type === 'admin_notice' && (
                              <Badge variant="outline" className="text-blue-600 bg-blue-50 animate-pulse">
                                Admin Notice
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.content}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(item.date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Teacher Profile Info */}
        {teacherProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Your Teaching Profile</CardTitle>
              <CardDescription>Your assigned subjects and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Grade Level</Label>
                  <Badge variant="outline" className="mt-1">
                    {teacherProfile.grade_level}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Classes Today</Label>
                  <Badge variant="outline" className="mt-1">
                    {todaysClasses.length}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Attendance Rate</Label>
                  <Badge variant="outline" className="mt-1 text-green-600">
                    92%
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Leave Balance</Label>
                  <Badge variant="outline" className="mt-1">
                    12 days
                  </Badge>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-sm font-medium">Subjects</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {teacherProfile.subjects?.map((subject: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>This Week Overview</CardTitle>
            <CardDescription>Your teaching statistics for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">18</div>
                <div className="text-sm text-blue-600">Classes Taught</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-green-600">Students Present</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">12</div>
                <div className="text-sm text-orange-600">Assignments Given</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">94%</div>
                <div className="text-sm text-purple-600">Avg Attendance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Permission Modal - Enhanced */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md animate-fade-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <MapPin className="w-5 h-5" />
              📍 Location Verification Required
            </DialogTitle>
            <DialogDescription>
              SmartPresence needs to verify you're within 500 meters of school premises for offline attendance.
            </DialogDescription>
          </DialogHeader>
          
          {/* School Location Info */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              School Location:
            </div>
            <div className="font-mono text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <div>📍 Latitude: {SCHOOL_COORDINATES.latitude}°</div>
              <div>📍 Longitude: {SCHOOL_COORDINATES.longitude}°</div>
              <div className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                ⭕ Allowed radius: 500 meters
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => handleLocationPermission(false)}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            >
              ❌ Deny Access
            </Button>
            <Button 
              onClick={() => handleLocationPermission(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
              disabled={attendanceProcessing}
            >
              {attendanceProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>✅ Allow Location Access</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Mismatch Modal - Enhanced */}
      <Dialog open={showLocationMismatch} onOpenChange={setShowLocationMismatch}>
        <DialogContent className="sm:max-w-md animate-shake border-red-200 dark:border-red-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              ⚠️ Location Verification Failed
            </DialogTitle>
            <DialogDescription className="text-red-600/80">
              You must be within 500 meters of school premises to mark attendance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                Your Current Location:
              </div>
              <div className="font-mono text-sm text-red-600 dark:text-red-400">
                <div>📍 Latitude: {currentLocation.lat.toFixed(6)}°</div>
                <div>📍 Longitude: {currentLocation.lng.toFixed(6)}°</div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                Required Location (School):
              </div>
              <div className="font-mono text-sm text-blue-600 dark:text-blue-400">
                <div>📍 Latitude: {SCHOOL_COORDINATES.latitude}°</div>
                <div>📍 Longitude: {SCHOOL_COORDINATES.longitude}°</div>
              </div>
            </div>

            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-amber-700 dark:text-amber-300 text-sm font-medium">
                🚶‍♂️ Please come to school premises and try again
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowLocationMismatch(false)}
              variant="outline"
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            >
              ❌ Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Preview Modal - Enhanced */}
      <Dialog open={showCameraPreview} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Camera className="w-5 h-5" />
              📸 Capturing Attendance
            </DialogTitle>
            <DialogDescription>
              Please look directly at the camera. Auto-capture in 2 seconds...
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-6">
            <div className="relative">
              <video 
                id="teacher-camera-video"
                className="w-64 h-48 bg-black rounded-xl object-cover shadow-xl border-4 border-green-200 dark:border-green-800"
                autoPlay
                muted
                playsInline
              />
              {/* Overlay animation */}
              <div className="absolute inset-0 rounded-xl border-4 border-green-400 animate-pulse"></div>
              {/* Corner indicators */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-green-400"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-green-400"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-green-400"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-green-400"></div>
            </div>
          </div>
          
          {/* Location display during camera preview */}
          {!isOnlineMode && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800 text-center">
              <div className="text-xs text-green-600 dark:text-green-400 mb-1">✅ Location Verified</div>
              <div className="font-mono text-xs text-green-500 dark:text-green-400">
                📍 {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <div className={`text-sm font-medium ${
              isOnlineMode ? 'text-blue-600' : 'text-green-600'
            }`}>
              {isOnlineMode ? '🌐 Online Mode - No location check required' : '🏫 Verified at school premises'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Application Form */}
      <LeaveApplicationForm
        open={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        userType="teacher"
        onSubmit={handleLeaveSubmit}
      />

      {/* Student Attendance Selection Overlay */}
      {showStudentAttendanceOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
          
          {/* Animated Cards */}
          <div className="relative z-10 flex gap-8 animate-fade-in">
            <Card 
              className="w-80 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-scale-in border-2 border-primary/20 hover:border-primary/40"
              onClick={() => activateStudentAttendanceMode('qr')}
              style={{ animationDelay: '0.1s' }}
            >
              <CardHeader className="text-center pb-8 pt-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg hover:shadow-xl transition-shadow">
                  <QrCode className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Mark Student Attendance via QR</CardTitle>
                <CardDescription className="text-base">
                  Students will scan QR codes to mark their attendance for {selectedClass?.subject} - {selectedClass?.class}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="w-80 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-scale-in border-2 border-primary/20 hover:border-primary/40"
              onClick={() => activateStudentAttendanceMode('face')}
              style={{ animationDelay: '0.2s' }}
            >
              <CardHeader className="text-center pb-8 pt-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg hover:shadow-xl transition-shadow">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Mark Student Attendance via Face Recognition</CardTitle>
                <CardDescription className="text-base">
                  Students will use facial recognition to mark their attendance for {selectedClass?.subject} - {selectedClass?.class}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Close button */}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-6 right-6 z-20"
            onClick={() => {
              setShowStudentAttendanceOverlay(false);
              setSelectedClass(null);
            }}
          >
            ✕ Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;