import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Bell, 
  Settings, 
  CreditCard, 
  Calendar, 
  UserCheck, 
  Users, 
  BookOpen,
  LogOut,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Wifi,
  WifiOff,
  FileText
} from 'lucide-react';
import { SoundEffects } from '@/utils/soundEffects';
import { HolidayCalendar } from '@/components/admin/HolidayCalendar';
import { AdminLeaveManagement, type LeaveApplication } from '@/components/admin/AdminLeaveManagement';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showHolidayCalendar, setShowHolidayCalendar] = useState(false);
  const [showLeaveManagement, setShowLeaveManagement] = useState(false);
  const [classMode, setClassMode] = useState<'online' | 'offline'>('offline');
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [showModeCardExpanded, setShowModeCardExpanded] = useState(false);
  const [pendingRequests] = useState([
    { id: 1, role: 'teacher', profiles: { full_name: 'John Smith', email: 'john@school.com' }, teacher_profiles: { grade_level: 'Secondary', subjects: ['Math', 'Physics'] } },
    { id: 2, role: 'student', profiles: { full_name: 'Sarah Johnson', email: 'sarah@student.com' }, student_profiles: { class: '10', roll_number: '25', section: 'A' } },
    { id: 3, role: 'teacher', profiles: { full_name: 'Emily Davis', email: 'emily@school.com' }, teacher_profiles: { grade_level: 'Primary', subjects: ['English', 'Science'] } }
  ]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Dummy data - no API calls needed (ALL HOOKS MUST BE BEFORE ANY EARLY RETURNS)
  useEffect(() => {
    // Load saved mode from localStorage
    const savedMode = localStorage.getItem('smartpresence_admin_mode') || 'offline';
    setClassMode(savedMode as 'online' | 'offline');
  }, []);

  // Load leave applications
  useEffect(() => {
    const globalApplications = JSON.parse(localStorage.getItem('smartpresence_all_leave_applications') || '[]');
    const parsedApplications = globalApplications.map((app: any) => ({
      ...app,
      startDate: new Date(app.startDate),
      endDate: new Date(app.endDate),
      submittedAt: new Date(app.submittedAt),
    }));
    setLeaveApplications(parsedApplications);
  }, []);

  // Show Holiday Calendar if requested
  if (showHolidayCalendar) {
    return <HolidayCalendar onBack={() => setShowHolidayCalendar(false)} />;
  }

  // Show Leave Management if requested
  if (showLeaveManagement) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-glassmorphism backdrop-blur-glass border-b border-border shadow-glass">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setShowLeaveManagement(false)}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Leave Management</h1>
                <p className="text-muted-foreground">Review and manage leave applications</p>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <AdminLeaveManagement 
            applications={leaveApplications} 
            onUpdateApplication={(id, status, rejectionReason) => {
              const updatedApplication = leaveApplications.find(app => app.id === id);
              if (!updatedApplication) return;

              // Update admin's leave applications
              const updatedApplications = leaveApplications.map(app => 
                app.id === id 
                  ? { ...app, status, rejectionReason } 
                  : app
              );
              setLeaveApplications(updatedApplications);
              localStorage.setItem('smartpresence_all_leave_applications', JSON.stringify(updatedApplications));

              // Update the specific user's leave applications
              const userRole = updatedApplication.submittedBy.role;
              const userStorageKey = userRole === 'teacher' ? 'smartpresence_teacher_leave_applications' : 'smartpresence_student_leave_applications';
              
              const userLeaveApplications = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
              const updatedUserApplications = userLeaveApplications.map((app: any) => 
                app.id === id 
                  ? { ...app, status, rejectionReason } 
                  : app
              );
              localStorage.setItem(userStorageKey, JSON.stringify(updatedUserApplications));

              // Add notification to user's dashboard
              const notificationStorageKey = userRole === 'teacher' ? 'smartpresence_teacher_notifications' : 'smartpresence_student_notifications';
              const existingNotifications = JSON.parse(localStorage.getItem(notificationStorageKey) || '[]');
              
              const notification = {
                id: Date.now(),
                title: status === 'approved' ? 'Leave Approved' : 'Leave Rejected',
                message: status === 'approved' 
                  ? 'Your leave application has been approved.' 
                  : 'Your leave application has been rejected.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date().toISOString(),
                type: status === 'approved' ? 'success' : 'error',
                isNew: true
              };

              const updatedNotifications = [notification, ...existingNotifications].slice(0, 10);
              localStorage.setItem(notificationStorageKey, JSON.stringify(updatedNotifications));

              // Trigger storage event to update dashboards in real-time
              window.dispatchEvent(new Event('storage'));
            }}
          />
        </div>
      </div>
    );
  }

  const handleModeToggle = (online: boolean) => {
    const newMode = online ? 'online' : 'offline';
    setClassMode(newMode);
    
    // Store mode for teacher dashboard
    localStorage.setItem('smartpresence_admin_mode', newMode);
    
    // Play success sound
    SoundEffects.playSuccess();
    
    toast({
      title: "✅ Mode Updated Successfully",
      description: `Attendance mode switched to ${newMode.toUpperCase()}${newMode === 'offline' ? ' (Location Required)' : ' (Location Skipped)'}`,
    });
  };

  const handleApproval = (requestId: number, approved: boolean) => {
    const status = approved ? 'approved' : 'rejected';
    
    toast({
      title: "Success",
      description: `Request ${status} successfully`,
    });
  };

  const publishNotice = () => {
    if (!noticeTitle || !noticeContent) {
      toast({
        title: "Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Create new notice
    const newNotice = {
      id: Date.now(),
      title: noticeTitle,
      content: noticeContent,
      created_at: new Date().toISOString(),
      created_by: 'admin'
    };
    
    // Get existing notices from localStorage
    const existingNotices = JSON.parse(localStorage.getItem('smartpresence_notices') || '[]');
    
    // Add new notice to the beginning
    const updatedNotices = [newNotice, ...existingNotices].slice(0, 10); // Keep only latest 10
    
    // Save to localStorage
    localStorage.setItem('smartpresence_notices', JSON.stringify(updatedNotices));
    
    // Simulate publishing
    setTimeout(() => {
      toast({
        title: "✅ Notice Published Successfully",
        description: "Notice is now visible to all teachers and students",
      });
      setNoticeTitle('');
      setNoticeContent('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-glassmorphism backdrop-blur-glass border-b border-border shadow-glass">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">SmartPresence Administration</p>
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
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Mode</CardTitle>
              {classMode === 'online' ? 
                <ToggleRight className="h-4 w-4 text-green-500" /> : 
                <ToggleLeft className="h-4 w-4 text-blue-500" />
              }
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{classMode}</div>
              <p className="text-xs text-muted-foreground">Class mode</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Active teachers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">248</div>
              <p className="text-xs text-muted-foreground">Active students</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Publish Notice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Publish Notice
              </CardTitle>
              <CardDescription>
                Send announcements to all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noticeTitle">Title</Label>
                <Input
                  id="noticeTitle"
                  placeholder="Enter notice title"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noticeContent">Content</Label>
                <Textarea
                  id="noticeContent"
                  placeholder="Enter notice content"
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  rows={4}
                />
              </div>
              <Button 
                onClick={publishNotice} 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-red-500 to-orange-500"
              >
                {loading ? 'Publishing...' : 'Publish Notice'}
              </Button>
            </CardContent>
          </Card>

          {/* Switch Mode - Enhanced Card */}
          <Card 
            className="bg-gradient-to-br from-background to-muted/20 border-2 border-primary/20 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300"
            onMouseEnter={() => setShowModeCardExpanded(true)}
            onMouseLeave={() => setShowModeCardExpanded(false)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                SmartPresence Mode Control
              </CardTitle>
              <CardDescription>
                Control attendance verification requirements globally
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mode Toggle with Enhanced Visuals */}
              <div className="flex items-center justify-between p-6 border-2 rounded-xl bg-gradient-to-r from-background to-muted/10 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full transition-all duration-300 ${
                    classMode === 'online' 
                      ? 'bg-green-500/20 text-green-600' 
                      : 'bg-blue-500/20 text-blue-600'
                  }`}>
                    {classMode === 'online' ? <Wifi className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {classMode === 'online' ? 'Online Mode Active' : 'Offline Mode Active'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {classMode === 'online' 
                        ? 'Location verification disabled for all users' 
                        : 'Location verification required within 500m of school'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={classMode === 'online'}
                  onCheckedChange={(checked) => handleModeToggle(checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              {/* Status Information */}
              <div className={`p-6 rounded-xl border-2 transition-all duration-500 animate-fade-in ${
                classMode === 'online' 
                  ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                  : 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${
                    classMode === 'online' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {classMode === 'online' ? <WifiOff className="w-4 h-4 text-white" /> : <MapPin className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h4 className="font-semibold">Current Settings</h4>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <Badge 
                      variant="outline" 
                      className={`capitalize font-medium animate-scale-in ${
                        classMode === 'online' 
                          ? 'text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30' 
                          : 'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/30'
                      }`}
                    >
                      {classMode} Classes
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Location Check:</span>
                    <span className={`font-medium ${
                      classMode === 'online' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {classMode === 'online' ? 'Disabled' : 'Required'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>School Radius:</span>
                    <span className="font-medium text-muted-foreground">
                      {classMode === 'online' ? 'N/A' : '500 meters'}
                    </span>
                  </div>
                </div>

                {/* School Location Info */}
                {classMode === 'offline' && (
                  <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>School Location: 25.637146°N, 85.012951°E</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Payment Management", description: "Teacher salary and student fee management system coming soon!" })}>
            <CardHeader className="text-center">
              <CreditCard className="w-12 h-12 mx-auto text-green-500 mb-2" />
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                Manage teacher salaries and student fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending Salaries:</span>
                  <span className="font-medium">₹45,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fee Collection:</span>
                  <span className="font-medium">₹2,48,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Outstanding:</span>
                  <span className="font-medium text-red-500">₹32,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowLeaveManagement(true)}>
              <CardHeader className="text-center">
                <FileText className="w-12 h-12 mx-auto text-red-500 mb-2" />
                <CardTitle>View Leaves</CardTitle>
                <CardDescription>
                  Review and manage leave applications
                </CardDescription>
                {leaveApplications.length > 0 && (
                  <Badge className="mt-2 bg-red-500">
                    {leaveApplications.filter(app => app.status === 'pending').length} pending
                  </Badge>
                )}
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowHolidayCalendar(true)}>
              <CardHeader className="text-center">
                <Calendar className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <CardTitle>Holiday Calendar</CardTitle>
                <CardDescription>
                  Add and manage academic holidays
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This Month:</span>
                  <span className="font-medium">3 holidays</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Next Holiday:</span>
                  <span className="font-medium">Oct 2nd</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Academic Days:</span>
                  <span className="font-medium">22 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => toast({ title: "Analytics Reports", description: "Detailed analytics dashboard coming soon!" })}>
            <CardHeader className="text-center">
              <UserCheck className="w-12 h-12 mx-auto text-purple-500 mb-2" />
              <CardTitle>Analytics Reports</CardTitle>
              <CardDescription>
                View detailed system analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Avg Attendance:</span>
                  <span className="font-medium">89.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Users:</span>
                  <span className="font-medium">260</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>System Health:</span>
                  <span className="font-medium text-green-500">Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Pending Approvals ({pendingRequests.length})
              </CardTitle>
              <CardDescription>
                Review and approve teacher/student registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="capitalize">
                          {request.role}
                        </Badge>
                        <h3 className="font-medium">{request.profiles?.full_name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                      {request.teacher_profiles && (
                        <p className="text-xs text-muted-foreground">
                          Grade: {request.teacher_profiles.grade_level} | 
                          Subjects: {request.teacher_profiles.subjects?.join(', ')}
                        </p>
                      )}
                      {request.student_profiles && (
                        <p className="text-xs text-muted-foreground">
                          Class: {request.student_profiles.class} | 
                          Roll: {request.student_profiles.roll_number} | 
                          Section: {request.student_profiles.section}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(request.id, false)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(request.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;