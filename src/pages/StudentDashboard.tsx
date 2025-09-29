import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import studentPhoto from '@/assets/student-photo.png';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  CreditCard, 
  Bell,
  BarChart3,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  PieChart,
  Scan,
  QrCode,
  MapPin,
  Camera,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { getCurrentLocation, isWithinSchoolRadius, SCHOOL_COORDINATES } from '@/utils/geolocation';
import { requestCameraAccess, stopCameraStream, attachStreamToVideo } from '@/utils/camera';
import { QRScanner } from '@/utils/qrScanner';
import { SoundEffects } from '@/utils/soundEffects';
import { LeaveApplicationForm } from '@/components/leave/LeaveApplicationForm';
import { LeaveApplicationsList, type LeaveApplication } from '@/components/leave/LeaveApplicationsList';
import { HolidayCalendarViewer } from '@/components/shared/HolidayCalendarViewer';
import { NotificationManager } from '@/utils/notificationManager';

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [enabledAttendanceMethod, setEnabledAttendanceMethod] = useState<'face' | 'qr' | null>(null);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lng: 0 });
  const [showLocationMismatch, setShowLocationMismatch] = useState(false);
  const [attendanceProcessing, setAttendanceProcessing] = useState(false);
  const [qrScanner, setQrScanner] = useState<QRScanner | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showLeaveApplicationsList, setShowLeaveApplicationsList] = useState(false);
  const [showHolidayCalendar, setShowHolidayCalendar] = useState(false);
  const [showFeePayment, setShowFeePayment] = useState(false);
  const [feePaymentStep, setFeePaymentStep] = useState(1);
  const [paymentDetails, setPaymentDetails] = useState({
    studentName: '',
    rollNumber: '',
    class: '',
    feeType: '',
    amount: ''
  });
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [teacherAttendanceSession, setTeacherAttendanceSession] = useState<any>(null);
  const [leaveNotifications, setLeaveNotifications] = useState<any[]>([]);
  const [showAttendanceOverlay, setShowAttendanceOverlay] = useState(false);
  const [attendanceFilters, setAttendanceFilters] = useState<'subject' | 'duration'>('subject');
  const [showStudentDetailsCard, setShowStudentDetailsCard] = useState(false);
  const [qrProgressVisible, setQrProgressVisible] = useState(false);
  const [qrProgress, setQrProgress] = useState(0);
  const [qrStudentData, setQrStudentData] = useState<any>(null);

  useEffect(() => {
    // Set dummy data
    setNotices(dummyNotices);
    setStudentProfile(dummyProfile);
    
    // Check teacher's choice for attendance method and session
    const checkTeacherSession = () => {
      const session = JSON.parse(localStorage.getItem('smartpresence_student_attendance_session') || 'null');
      if (session && session.isActive) {
        setTeacherAttendanceSession(session);
        setEnabledAttendanceMethod(session.mode);
      } else {
        setTeacherAttendanceSession(null);
        setEnabledAttendanceMethod(null);
      }
    };
    
    checkTeacherSession();
    
    // Check admin mode setting
    const adminMode = localStorage.getItem('smartpresence_admin_mode') || 'offline';
    setIsOnlineMode(adminMode === 'online');
    
    // Load notices from localStorage (published by admin)
    const loadNotices = () => {
      const publishedNotices = JSON.parse(localStorage.getItem('smartpresence_notices') || '[]');
      if (publishedNotices.length > 0) {
        setNotices([...publishedNotices, ...dummyNotices]);
      }
    };
    
    loadNotices();
    
    // Listen for notice updates when admin publishes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartpresence_notices') {
        loadNotices();
      }
      if (e.key === 'smartpresence_student_attendance_session') {
        checkTeacherSession();
      }
      if (e.key === 'smartpresence_student_notifications' && e.newValue) {
        // Handle new notifications with slide-up animation
        const notifications = JSON.parse(e.newValue);
        setLeaveNotifications(notifications);
        const newNotification = notifications.find((n: any) => n.isNew);
        if (newNotification) {
          toast({
            title: newNotification.title,
            description: newNotification.message,
            className: newNotification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          });
          // Mark notifications as read after showing toast
          setTimeout(() => {
            NotificationManager.markAsRead('student');
          }, 3000);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for updates periodically (for same-tab updates)
    const interval = setInterval(() => {
      loadNotices();
      checkTeacherSession();
    }, 1000);

    // Load leave applications from localStorage
    const savedApplications = JSON.parse(localStorage.getItem('smartpresence_student_leave_applications') || '[]');
    const parsedApplications = savedApplications.map((app: any) => ({
      ...app,
      startDate: new Date(app.startDate),
      endDate: new Date(app.endDate),
      submittedAt: new Date(app.submittedAt),
    }));
    setLeaveApplications(parsedApplications);

    // Load last transaction from localStorage
    const storedTransaction = localStorage.getItem('smartpresence_student_last_transaction');
    if (storedTransaction) {
      setLastTransaction(JSON.parse(storedTransaction));
    }

    // Load leave notifications from localStorage
    const storedNotifications = localStorage.getItem('smartpresence_student_notifications');
    if (storedNotifications) {
      setLeaveNotifications(JSON.parse(storedNotifications));
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Dummy data for demo
  const dummyNotices = [
    { id: 1, title: "Extra class tomorrow at 3 PM", content: "Additional Physics class scheduled", created_at: new Date().toISOString() },
    { id: 2, title: "Fee payment reminder", content: "Exam fees due by Oct 15th", created_at: new Date().toISOString() },
    { id: 3, title: "Holiday announcement", content: "School closed for Diwali on Oct 12th", created_at: new Date().toISOString() }
  ];

  const dummyProfile = {
    full_name: "Snehhh",
    class: "10",
    roll_number: "25",
    section: "A"
  };

  useEffect(() => {
    // Set dummy data
    setNotices(dummyNotices);
    setStudentProfile(dummyProfile);
  }, []);

  const handleLeaveSubmit = (leaveData: Omit<LeaveApplication, 'id' | 'status' | 'applicationNumber' | 'submittedAt'>) => {
    const applicationNumber = `SL${Date.now().toString().slice(-6)}`;
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
    localStorage.setItem('smartpresence_student_leave_applications', JSON.stringify(updatedApplications));
    
    // Also save to global leave applications for admin view
    const globalApplications = JSON.parse(localStorage.getItem('smartpresence_all_leave_applications') || '[]');
    const globalApplication = {
      ...newApplication,
      submittedBy: {
        id: user?.id || 'student-1',
        name: studentProfile?.full_name || 'Student',
        role: 'student' as const,
        email: user?.email || 'student@school.com',
        class: studentProfile?.class,
        rollNumber: studentProfile?.roll_number,
      }
    };
    const globalUpdated = [...globalApplications, globalApplication];
    localStorage.setItem('smartpresence_all_leave_applications', JSON.stringify(globalUpdated));
    
    setLeaveApplications(updatedApplications);
    setShowLeaveForm(false);
    
    toast({
      title: "✅ Leave Application Submitted",
      description: "Your application has been submitted successfully and is pending approval.",
    });
  };

  const handleFeePayment = () => {
    setShowFeePayment(true);
    setFeePaymentStep(1);
  };

  const handlePaymentDetailsSubmit = () => {
    if (!paymentDetails.studentName || !paymentDetails.rollNumber || !paymentDetails.class || !paymentDetails.feeType || !paymentDetails.amount) {
      toast({
        title: "Error",
        description: "Please fill all required fields.",
        className: "bg-red-50 border-red-200"
      });
      return;
    }
    setFeePaymentStep(2);
  };

  const handlePaymentConfirm = () => {
    // Simulate bank redirect
    setFeePaymentStep(3);
    
    // Simulate payment processing
    setTimeout(() => {
      const transaction = {
        id: `TXN${Date.now()}`,
        amount: paymentDetails.amount,
        feeType: paymentDetails.feeType,
        status: 'Successful',
        date: new Date().toISOString(),
        studentName: paymentDetails.studentName,
        rollNumber: paymentDetails.rollNumber,
        class: paymentDetails.class,
        paymentMethod: 'Online Banking'
      };

      setLastTransaction(transaction);
      localStorage.setItem('smartpresence_student_last_transaction', JSON.stringify(transaction));
      
      // Play success sound and show popup
      SoundEffects.playSuccess();
      
      toast({
        title: "🎉 Payment Successful",
        description: `Transaction ID: ${transaction.id}`,
        className: "bg-green-50 border-green-200"
      });
      
      setFeePaymentStep(4);
    }, 3000);
  };

  const registerComplaint = () => {
    toast({
      title: "Complaint System",
      description: "Complaint registration system coming soon!",
    });
  };

  const markStudentAttendance = (method: 'face' | 'qr') => {
    if (enabledAttendanceMethod !== method) {
      SoundEffects.playError();
      toast({
        title: `❌ ${method === 'face' ? 'Face Recognition' : 'QR Scanner'} Disabled`,
        description: "This attendance method is not currently enabled by your teacher.",
        variant: "destructive",
      });
      return;
    }

    if (isOnlineMode) {
      // Skip location check in online mode - directly open camera/scanner
      if (method === 'face') {
        handleCameraPreview();
      } else {
        handleQRScanner();
      }
    } else {
      // Show location permission modal in offline mode
      setShowLocationModal(true);
    }
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
      
      // Check if within school radius using utility function
      const isWithinRadius = isWithinSchoolRadius(detectedLat, detectedLng);
      
      if (isWithinRadius) {
        SoundEffects.playSuccess();
        toast({
          title: "✅ Location Verified",
          description: "Within school premises. Opening attendance interface...",
        });
        
        setTimeout(() => {
          if (enabledAttendanceMethod === 'face') {
            handleCameraPreview();
          } else {
            handleQRScanner();
          }
        }, 1500);
      } else {
        setShowLocationMismatch(true);
        SoundEffects.playError();
        
        // Add shake animation
        document.body.classList.add('animate-shake');
        setTimeout(() => {
          document.body.classList.remove('animate-shake');
        }, 500);
        
        toast({
          title: "⚠️ Location Verification Failed",
          description: "You must be within 500 meters of school premises.",
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

  // Face Recognition Camera Preview
  const handleCameraPreview = async () => {
    setShowCameraPreview(true);
    
    try {
      const stream = await requestCameraAccess();
      setCameraStream(stream);
      attachStreamToVideo(stream, 'student-camera-video');
      
      // Auto-close camera after 2 seconds and show success
      setTimeout(() => {
        stopCameraStream(stream);
        setCameraStream(null);
        setShowCameraPreview(false);
        
        // Success notification with sound
        SoundEffects.playSuccess();
        setAttendanceMarked(true);
        
        const successMessage = teacherAttendanceSession 
          ? `Attendance marked for ${teacherAttendanceSession.subject}`
          : "Your attendance has been recorded using face recognition.";
        
        toast({
          title: "✅ Face Recognition Successful",
          description: successMessage,
        });
      }, 2000);
      
    } catch (error) {
      console.error('Camera error:', error);
      setShowCameraPreview(false);
      SoundEffects.playError();
      toast({
        title: "❌ Camera Access Denied",
        description: "Camera access is required for face recognition attendance.",
        variant: "destructive",
      });
    }
  };

  // Enhanced QR Code Scanner with real QR detection
  const handleQRScanner = async () => {
    console.log('Student Dashboard: Starting QR scanner...');
    setShowQRScanner(true);
    
    try {
      const scanner = new QRScanner();
      setQrScanner(scanner);
      
      await scanner.startScanning('student-qr-video');
      console.log('Student Dashboard: QR scanner initialized successfully');
      
      // Start real-time QR detection
      scanner.startRealTimeScanning((result) => {
        console.log('Student Dashboard: QR scan result:', result);
        
        if (result.success) {
          // Valid QR Code detected
          console.log('Student Dashboard: Valid QR code detected, showing student details');
          SoundEffects.playScan();
          
          // Close QR scanner and show student details card
          scanner.stopScanning();
          setQrScanner(null);
          setShowQRScanner(false);
          
          // Show student details card with animation
          const studentData = {
            name: studentProfile?.full_name || 'Snehhh',
            rollNumber: studentProfile?.roll_number || '25',
            class: studentProfile?.class || '10',
            section: studentProfile?.section || 'A',
            photo: '/src/assets/student-photo.png',
            subject: teacherAttendanceSession?.subject || 'Mathematics',
            time: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })
          };
          
          setQrStudentData(studentData);
          setShowStudentDetailsCard(true);
          setQrProgressVisible(true);
          setQrProgress(0);
          
          // Animate progress bar over 8 seconds (changed from 12)
          const progressInterval = setInterval(() => {
            setQrProgress(prev => {
              if (prev >= 100) {
                clearInterval(progressInterval);
                return 100;
              }
              return prev + (100 / 80); // 80 steps over 8 seconds
            });
          }, 100);
          
          // Auto-close after 8 seconds with success popup (changed from 12)
          setTimeout(() => {
            console.log('Student Dashboard: Auto-closing student details after 8 seconds');
            setShowStudentDetailsCard(false);
            setQrProgressVisible(false);
            setQrProgress(0);
            
            SoundEffects.playSuccess();
            setAttendanceMarked(true);
            
            const successMessage = teacherAttendanceSession 
              ? `Attendance marked successfully for ${teacherAttendanceSession.subject}`
              : "Your attendance has been recorded via QR code.";
            
            toast({
              title: "🎉 Attendance Marked Successfully",
              description: successMessage,
              className: "bg-green-50 border-green-200 animate-fade-in"
            });
          }, 8000); // Changed to 8 seconds
        } else {
          // Invalid QR Code or error
          console.log('Student Dashboard: QR scan failed:', result.error);
          scanner.stopScanning();
          setQrScanner(null);
          setShowQRScanner(false);
          
          SoundEffects.playError();
          
          // Show animated error popup
          toast({
            title: "❌ Invalid QR Code",
            description: result.error || "Invalid QR Code. Please try again.",
            variant: "destructive",
            className: "animate-pulse border-red-500 bg-red-50"
          });
        }
      });
      
    } catch (error) {
      console.error('Student Dashboard: QR Scanner error:', error);
      setShowQRScanner(false);
      SoundEffects.playError();
      toast({
        title: "❌ QR Scanner Error",
        description: "Unable to access camera for QR scanning.",
        variant: "destructive",
      });
    }
  };

  // Mock data for today's classes
  const todaysClasses = [
    { time: "09:00 AM", subject: "Mathematics", teacher: "Mr. Smith", room: "Room 101" },
    { time: "10:30 AM", subject: "Physics", teacher: "Dr. Johnson", room: "Room 203" },
    { time: "12:00 PM", subject: "English", teacher: "Ms. Brown", room: "Room 105" },
    { time: "02:00 PM", subject: "Chemistry", teacher: "Prof. Wilson", room: "Room 301" },
  ];

  // Mock attendance data
  const attendanceData = {
    present: 18,
    absent: 2,
    total: 20,
    percentage: 90
  };

  // Show Fee Payment
  if (showFeePayment) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Pay Fees Online</h1>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeePayment(false);
                setFeePaymentStep(1);
                setPaymentDetails({
                  studentName: '',
                  rollNumber: '',
                  class: '',
                  feeType: '',
                  amount: ''
                });
              }}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
          </div>

          {feePaymentStep === 1 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Student Details</CardTitle>
                <CardDescription>Please fill in your details to proceed with payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Student Name *</Label>
                  <input
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                    value={paymentDetails.studentName}
                    onChange={(e) => setPaymentDetails({...paymentDetails, studentName: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Roll Number *</Label>
                  <input
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                    value={paymentDetails.rollNumber}
                    onChange={(e) => setPaymentDetails({...paymentDetails, rollNumber: e.target.value})}
                    placeholder="Enter your roll number"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Class *</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                    value={paymentDetails.class}
                    onChange={(e) => setPaymentDetails({...paymentDetails, class: e.target.value})}
                  >
                    <option value="">Select Class</option>
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fee Type *</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                    value={paymentDetails.feeType}
                    onChange={(e) => setPaymentDetails({...paymentDetails, feeType: e.target.value})}
                  >
                    <option value="">Select Fee Type</option>
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Exam Fee">Exam Fee</option>
                    <option value="Library Fee">Library Fee</option>
                    <option value="Transport Fee">Transport Fee</option>
                    <option value="Activity Fee">Activity Fee</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount *</Label>
                  <input
                    type="number"
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md"
                    value={paymentDetails.amount}
                    onChange={(e) => setPaymentDetails({...paymentDetails, amount: e.target.value})}
                    placeholder="Enter amount"
                  />
                </div>
                <Button onClick={handlePaymentDetailsSubmit} className="w-full mt-6">
                  Continue to Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {feePaymentStep === 2 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Please review your payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Student Name:</span>
                    <span className="font-medium">{paymentDetails.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Roll Number:</span>
                    <span className="font-medium">{paymentDetails.rollNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Class:</span>
                    <span className="font-medium">{paymentDetails.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee Type:</span>
                    <span className="font-medium">{paymentDetails.feeType}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-primary">₹{paymentDetails.amount}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <Button variant="outline" onClick={() => setFeePaymentStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handlePaymentConfirm} className="flex-1">
                    Pay Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {feePaymentStep === 3 && (
            <Card className="animate-fade-in">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                <CardTitle>Processing Payment</CardTitle>
                <CardDescription>Please wait while we process your payment...</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Redirected to Bank Gateway</h3>
                  <p className="text-muted-foreground">Secure payment processing in progress</p>
                </div>
              </CardContent>
            </Card>
          )}

          {feePaymentStep === 4 && (
            <Card className="animate-fade-in">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-600">Payment Successful!</CardTitle>
                <CardDescription>Your fee payment has been processed successfully</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-medium">{lastTransaction?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-medium">₹{lastTransaction?.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-green-600">{lastTransaction?.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => toast({ 
                      title: "Last Transaction Details", 
                      description: `ID: ${lastTransaction?.id} | Amount: ₹${lastTransaction?.amount} | Date: ${lastTransaction ? new Date(lastTransaction.date).toLocaleDateString() : 'N/A'}` 
                    })}
                  >
                    <FileText className="w-4 h-4" />
                    View Last Transaction
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => toast({ 
                      title: "Transaction Status", 
                      description: `Status: ${lastTransaction?.status || 'No transaction'} | Method: ${lastTransaction?.paymentMethod || 'N/A'}` 
                    })}
                  >
                    <Eye className="w-4 h-4" />
                    Check Status
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (lastTransaction) {
                        const receiptContent = `PAYMENT RECEIPT\n\nTransaction ID: ${lastTransaction.id}\nStudent: ${lastTransaction.studentName}\nFee Type: ${lastTransaction.feeType}\nAmount: ₹${lastTransaction.amount}\nStatus: ${lastTransaction.status}\nDate: ${new Date(lastTransaction.date).toLocaleDateString()}`;
                        
                        const blob = new Blob([receiptContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `receipt-${lastTransaction.id}.txt`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        
                        toast({ title: "Receipt Downloaded", description: "Payment receipt has been downloaded successfully." });
                      } else {
                        toast({ title: "No Transaction", description: "No transaction found to download receipt.", variant: "destructive" });
                      }
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    Download Receipt
                  </Button>
                </div>
                <Button 
                  onClick={() => {
                    setShowFeePayment(false);
                    setFeePaymentStep(1);
                    setPaymentDetails({
                      studentName: '',
                      rollNumber: '',
                      class: '',
                      feeType: '',
                      amount: ''
                    });
                  }}
                  className="w-full mt-4"
                >
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Show Holiday Calendar
  if (showHolidayCalendar) {
    return (
      <HolidayCalendarViewer 
        onBack={() => setShowHolidayCalendar(false)}
        userRole="student"
      />
    );
  }

  // Show Leave Applications List
  if (showLeaveApplicationsList) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-glassmorphism backdrop-blur-glass border-b border-border shadow-glass">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setShowLeaveApplicationsList(false)}>
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
          <LeaveApplicationsList applications={leaveApplications} userType="student" />
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
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {studentProfile?.full_name || 'Student'}
              </p>
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

          <Card 
            className="cursor-pointer transition-all duration-300 hover:shadow-xl relative overflow-hidden"
            onMouseEnter={() => setShowAttendanceOverlay(true)}
            onMouseLeave={() => setShowAttendanceOverlay(false)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Attendance Rate
                {attendanceData.percentage < 75 && (
                  <Badge className="bg-red-500 animate-bounce text-xs">
                    Alert!
                  </Badge>
                )}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceData.percentage}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
              
              {showAttendanceOverlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  {/* Blurred Background */}
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
                  
                  {/* Full-screen Chart */}
                  <div className="relative z-10 bg-background border rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 animate-scale-in animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Attendance Analytics</h2>
                      <div className="flex gap-2">
                        <Button
                          variant={attendanceFilters === 'subject' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAttendanceFilters('subject')}
                        >
                          Subject-wise
                        </Button>
                        <Button
                          variant={attendanceFilters === 'duration' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAttendanceFilters('duration')}
                        >
                          Duration-wise
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Chart Display */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          {attendanceFilters === 'subject' ? 'Subject-wise Attendance' : 'Duration-wise Attendance'}
                        </h3>
                        {attendanceFilters === 'subject' ? (
                          <div className="space-y-3">
                            {[
                              { subject: 'Mathematics', percentage: 95, present: 19, total: 20 },
                              { subject: 'Physics', percentage: 88, present: 17, total: 20 },
                              { subject: 'Chemistry', percentage: 92, present: 18, total: 20 },
                              { subject: 'English', percentage: 85, present: 17, total: 20 }
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">{item.subject}</span>
                                  <span>{item.percentage}% ({item.present}/{item.total})</span>
                                </div>
                                <Progress value={item.percentage} className="h-2" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {[
                              { period: 'Last Week', percentage: 100, days: '5/5' },
                              { period: 'Last Month', percentage: 90, days: '18/20' },
                              { period: 'This Semester', percentage: 88, days: '70/80' },
                              { period: 'Overall', percentage: 92, days: '184/200' }
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">{item.period}</span>
                                  <span>{item.percentage}% ({item.days})</span>
                                </div>
                                <Progress value={item.percentage} className="h-2" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Stats */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Performance Metrics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-green-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">{attendanceData.present}</div>
                            <div className="text-sm text-green-600">Present Days</div>
                          </div>
                          <div className="p-4 bg-red-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600">{attendanceData.absent}</div>
                            <div className="text-sm text-red-600">Absent Days</div>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">{attendanceData.percentage}%</div>
                            <div className="text-sm text-blue-600">Overall Rate</div>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">A-</div>
                            <div className="text-sm text-purple-600">Grade</div>
                          </div>
                        </div>
                        
                        {attendanceData.percentage < 75 && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="w-5 h-5" />
                              <span className="font-semibold">Attendance Alert!</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                              Your attendance is below 75%. Please attend classes regularly to maintain academic standing.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceData.present}</div>
              <p className="text-xs text-muted-foreground">Out of {attendanceData.total} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notices.length}</div>
              <p className="text-xs text-muted-foreground">Unread notices</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-bounce-subtle" onClick={() => setShowLeaveForm(true)}>
            <CardHeader className="text-center">
              <FileText className="w-12 h-12 mx-auto text-blue-500 mb-2 animate-pulse" />
              <CardTitle>Apply for Leave</CardTitle>
              <CardDescription>
                Submit leave applications quickly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800" onClick={handleFeePayment}>
            <CardHeader className="text-center">
              <CreditCard className="w-12 h-12 mx-auto text-green-500 mb-2 animate-bounce" />
              <CardTitle>Pay Fees Online</CardTitle>
              <CardDescription>
                Secure online fee payments
              </CardDescription>
            </CardHeader>
          </Card>


          <Card 
            className={`transition-all duration-300 ${
              attendanceMarked 
                ? 'opacity-50 cursor-not-allowed bg-muted' 
                : `cursor-pointer ${
                    enabledAttendanceMethod === 'qr' 
                      ? 'shadow-lg ring-2 ring-indigo-500 ring-opacity-50 animate-pulse' 
                      : enabledAttendanceMethod === null 
                        ? 'hover:shadow-lg' 
                        : 'opacity-50 hover:shadow-sm'
                  }`
            }`} 
            onClick={() => !attendanceMarked && markStudentAttendance('qr')}
          >
            <CardHeader className="text-center">
              <QrCode className={`w-12 h-12 mx-auto mb-2 ${
                attendanceMarked 
                  ? 'text-gray-400' 
                  : enabledAttendanceMethod === 'qr' ? 'text-indigo-500' : 'text-gray-400'
              }`} />
              <CardTitle>QR Scan</CardTitle>
              <CardDescription>
                {attendanceMarked 
                  ? 'Attendance already marked for today' 
                  : enabledAttendanceMethod === 'qr' 
                     ? (teacherAttendanceSession 
                        ? `Active for ${teacherAttendanceSession.subject}` 
                        : 'Active - Mark attendance with QR code')
                    : 'Mark attendance with QR code'
                }
              </CardDescription>
              {enabledAttendanceMethod === 'qr' && !attendanceMarked && (
                <Badge className="mt-2 bg-indigo-500">Active</Badge>
              )}
              {attendanceMarked && (
                <Badge className="mt-2 bg-green-500 animate-fade-in">✓ Marked</Badge>
              )}
            </CardHeader>
          </Card>

          <Card 
            className={`transition-all duration-300 ${
              attendanceMarked 
                ? 'opacity-50 cursor-not-allowed bg-muted' 
                : `cursor-pointer ${
                    enabledAttendanceMethod === 'face' 
                      ? 'shadow-lg ring-2 ring-cyan-500 ring-opacity-50 animate-pulse' 
                      : enabledAttendanceMethod === null 
                        ? 'hover:shadow-lg' 
                        : 'opacity-50 hover:shadow-sm'
                  }`
            }`} 
            onClick={() => !attendanceMarked && markStudentAttendance('face')}
          >
            <CardHeader className="text-center">
              <Scan className={`w-12 h-12 mx-auto mb-2 ${
                attendanceMarked 
                  ? 'text-gray-400' 
                  : enabledAttendanceMethod === 'face' ? 'text-cyan-500' : 'text-gray-400'
              }`} />
              <CardTitle>Face Scan</CardTitle>
              <CardDescription>
                {attendanceMarked 
                  ? 'Attendance already marked for today' 
                  : enabledAttendanceMethod === 'face' 
                     ? (teacherAttendanceSession 
                        ? `Active for ${teacherAttendanceSession.subject}` 
                        : 'Active - Mark attendance with face scan')
                    : 'Mark attendance with face scan'
                }
              </CardDescription>
              {enabledAttendanceMethod === 'face' && !attendanceMarked && (
                <Badge className="mt-2 bg-cyan-500">Active</Badge>
              )}
              {attendanceMarked && (
                <Badge className="mt-2 bg-green-500 animate-fade-in">✓ Marked</Badge>
              )}
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Academic Progress", description: "Detailed academic reports coming soon!" })}>
            <CardHeader className="text-center">
              <PieChart className="w-12 h-12 mx-auto text-purple-500 mb-2" />
              <CardTitle>Academic Progress</CardTitle>
              <CardDescription>
                View grades and performance
              </CardDescription>
            </CardHeader>
          </Card>

          {/* More Options Card */}
          <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-pulse" onClick={() => setShowMoreOptions(!showMoreOptions)}>
            <CardHeader className="text-center">
              <MoreHorizontal className="w-12 h-12 mx-auto text-indigo-500 mb-2 animate-spin-slow" />
              <CardTitle>More Options</CardTitle>
              <CardDescription>
                Access additional features
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* More Options - Hidden Cards - Enhanced with Register Complaint */}
        {showMoreOptions && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800" onClick={() => setShowHolidayCalendar(true)}>
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-blue-500 mb-2 animate-pulse" />
                <CardTitle>Holiday Calendar</CardTitle>
                <CardDescription>
                  View upcoming holidays and events
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800" style={{animationDelay: '0.1s'}} onClick={() => setShowLeaveApplicationsList(true)}>
              <CardHeader className="text-center">
                <Eye className="w-12 h-12 mx-auto text-purple-500 mb-2 animate-pulse" />
                <CardTitle>View Leave Applications</CardTitle>
                <CardDescription>
                  Check your leave application history
                </CardDescription>
                {leaveApplications.length > 0 && (
                  <Badge className="mt-2 bg-purple-500 animate-bounce">
                    {leaveApplications.length} application(s)
                  </Badge>
                )}
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-in-right bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800" style={{animationDelay: '0.2s'}} onClick={registerComplaint}>
              <CardHeader className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-orange-500 mb-2 animate-pulse" />
                <CardTitle>Register Complaint</CardTitle>
                <CardDescription>
                  Report issues or concerns
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Attendance Overview
            </CardTitle>
            <CardDescription>
              Your attendance record for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Attendance</span>
                <span className="text-sm text-muted-foreground">
                  {attendanceData.present}/{attendanceData.total} days
                </span>
              </div>
              <Progress value={attendanceData.percentage} className="h-3" />
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{attendanceData.present}</div>
                  <div className="text-sm text-green-600">Present</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{attendanceData.absent}</div>
                  <div className="text-sm text-red-600">Absent</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{attendanceData.percentage}%</div>
                  <div className="text-sm text-blue-600">Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                        {classItem.teacher} • {classItem.room}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
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
                        ) : 'hover:bg-muted/50'
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

        {/* Student Profile Info & Academic Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {studentProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Student information and academic details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Class</Label>
                    <Badge variant="outline" className="mt-1">
                      {studentProfile.class}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Roll Number</Label>
                    <Badge variant="outline" className="mt-1">
                      {studentProfile.roll_number}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Section</Label>
                    <Badge variant="outline" className="mt-1">
                      {studentProfile.section}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>Your current semester overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">A-</div>
                  <div className="text-sm text-green-600">Overall Grade</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">7th</div>
                  <div className="text-sm text-blue-600">Class Rank</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">86%</div>
                  <div className="text-sm text-purple-600">Test Average</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">12</div>
                  <div className="text-sm text-orange-600">Assignments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Status & Important Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Status</CardTitle>
              <CardDescription>Your current fee payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lastTransaction ? (
                  <>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-800">Latest Transaction</h4>
                        <Badge className="bg-green-500">
                          {lastTransaction.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700">Transaction ID:</span>
                          <span className="font-mono text-green-800">{lastTransaction.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Fee Type:</span>
                          <span className="font-medium text-green-800">{lastTransaction.feeType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Amount:</span>
                          <span className="font-bold text-green-800">₹{lastTransaction.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700">Date:</span>
                          <span className="text-green-800">{new Date(lastTransaction.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => toast({ title: "Last Transaction", description: `Transaction ID: ${lastTransaction.id} | Amount: ₹${lastTransaction.amount} | Status: ${lastTransaction.status}` })}
                      >
                        <FileText className="w-3 h-3" />
                        View Last
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => toast({ title: "Transaction Status", description: `Status: ${lastTransaction.status} | Payment Method: ${lastTransaction.paymentMethod}` })}
                      >
                        <Eye className="w-3 h-3" />
                        Check Status
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Tuition Fee</span>
                      <Badge variant="outline" className="text-green-600">Paid</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium">Exam Fee</span>
                      <Badge variant="outline" className="text-yellow-600">Due Oct 15</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Library Fee</span>
                      <Badge variant="outline" className="text-blue-600">Paid</Badge>
                    </div>
                    <div className="text-center pt-2">
                      <span className="text-sm text-muted-foreground">Outstanding: </span>
                      <span className="font-bold text-orange-600">₹2,500</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Dates</CardTitle>
              <CardDescription>Upcoming events and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Mid-term Exams</p>
                    <p className="text-xs text-muted-foreground">Oct 15 - Oct 25</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Project Submission</p>
                    <p className="text-xs text-muted-foreground">Oct 30</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Fee Payment Due</p>
                    <p className="text-xs text-muted-foreground">Nov 5</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Location Permission Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Access Required
            </DialogTitle>
            <DialogDescription>
              To mark your attendance, we need to verify your location matches the school premises.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-2">Current Location:</div>
            <div className="font-mono text-sm">
              <div>Latitude: {currentLocation.lat.toFixed(6)}</div>
              <div>Longitude: {currentLocation.lng.toFixed(6)}</div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => handleLocationPermission(false)}
            >
              Deny
            </Button>
            <Button 
              onClick={() => handleLocationPermission(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Allow Location Access
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Mismatch Modal */}
      <Dialog open={showLocationMismatch} onOpenChange={setShowLocationMismatch}>
        <DialogContent className="sm:max-w-md animate-shake">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <MapPin className="w-5 h-5" />
              ⚠️ Location Mismatch
            </DialogTitle>
            <DialogDescription>
              You are not currently at the school premises. Please move to the school location to mark attendance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <div className="text-sm text-destructive mb-2">Your Location:</div>
            <div className="font-mono text-sm text-destructive">
              <div>Latitude: {currentLocation.lat.toFixed(6)}</div>
              <div>Longitude: {currentLocation.lng.toFixed(6)}</div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowLocationMismatch(false)}
              variant="outline"
            >
              Okay
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Preview Modal */}
      <Dialog open={showCameraPreview} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Preview
            </DialogTitle>
            <DialogDescription>
              Please look at the camera for attendance verification.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <video 
              id="student-camera-video"
              className="w-64 h-48 bg-black rounded-lg object-cover"
              autoPlay
              muted
              playsInline
            />
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg border text-center">
            <div className="text-xs text-muted-foreground mb-1">Current Location</div>
            <div className="font-mono text-xs">
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            {isOnlineMode ? "Online Mode Enabled – Location not required." : "Verifying your identity..."}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced QR Scanner Modal */}
      <Dialog open={showQRScanner} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code Scanner
            </DialogTitle>
            <DialogDescription>
              Position the QR code within the frame to mark attendance.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="relative">
              <video 
                id="student-qr-video"
                className="w-64 h-48 bg-black rounded-lg object-cover border-2 border-indigo-300"
                autoPlay
                muted
                playsInline
              />
              {/* QR Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-indigo-400 border-dashed rounded-lg animate-pulse"></div>
              </div>
              {/* Corner indicators */}
              <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-indigo-400"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-indigo-400"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-indigo-400"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-indigo-400"></div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Scanning for QR code...
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Details Card with Progress Bar */}
      {showStudentDetailsCard && qrStudentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />
          
          {/* Student Details Card */}
          <div className="relative z-10 bg-background border rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in animate-scale-in">
            <div className="text-center space-y-4">
              {/* Student Photo */}
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg animate-fade-in animate-scale-in">
                <img 
                  src={studentPhoto} 
                  alt="Student Photo" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Student Details */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{qrStudentData.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Roll No:</span>
                    <div className="font-semibold">{qrStudentData.rollNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Class:</span>
                    <div className="font-semibold">{qrStudentData.class}-{qrStudentData.section}</div>
                  </div>
                </div>
              </div>
              
              {/* Subject and Time */}
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-lg font-semibold text-indigo-700">
                  {qrStudentData.subject}
                </div>
                <div className="text-sm text-indigo-600">
                  Time: {qrStudentData.time}
                </div>
              </div>
              
              {/* Progress Bar */}
              {qrProgressVisible && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Processing attendance...</div>
                  <Progress value={qrProgress} className="h-2 animate-pulse" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(qrProgress)}% Complete
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Application Form */}
      <LeaveApplicationForm
        open={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        userType="student"
        onSubmit={handleLeaveSubmit}
      />
    </div>
  );
};

export default StudentDashboard;