import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarDays, Clock, FileText, Users, GraduationCap, BookOpen, Filter, CheckCircle, XCircle, Eye, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LeaveStatusManager } from '@/utils/notificationManager';

export interface LeaveApplication {
  id: string;
  type: string;
  subject: string;
  content: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  applicationNumber: string;
  submittedAt: Date;
  submittedBy: {
    id: string;
    name: string;
    role: 'teacher' | 'student';
    email: string;
    class?: string;
    rollNumber?: string;
    subjects?: string[];
  };
  rejectionReason?: string;
  attachment?: File;
}

interface AdminLeaveManagementProps {
  applications: LeaveApplication[];
  onUpdateApplication: (id: string, status: 'approved' | 'rejected', rejectionReason?: string) => void;
}

export function AdminLeaveManagement({ applications, onUpdateApplication }: AdminLeaveManagementProps) {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const filteredApplications = applications.filter(app => {
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    const roleMatch = filterRole === 'all' || app.submittedBy.role === filterRole;
    return statusMatch && roleMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '⏳';
    }
  };

  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleApprove = (application: LeaveApplication) => {
    onUpdateApplication(application.id, 'approved');
    
    // Update leave status with real-time notifications
    LeaveStatusManager.updateLeaveStatus(application.id, 'approved');
    
    toast({
      title: "✅ Application Approved",
      description: `Leave application by ${application.submittedBy.name} has been approved.`,
    });
  };

  const handleReject = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    onUpdateApplication(selectedApplication.id, 'rejected', rejectionReason);
    
    // Update leave status with real-time notifications
    LeaveStatusManager.updateLeaveStatus(selectedApplication.id, 'rejected', rejectionReason);
    
    toast({
      title: "❌ Application Rejected",
      description: `Leave application by ${selectedApplication.submittedBy.name} has been rejected.`,
    });

    setShowRejectDialog(false);
    setSelectedApplication(null);
    setRejectionReason('');
  };

  const handleViewAttachment = (application: LeaveApplication) => {
    if (application.attachment) {
      setSelectedApplication(application);
      setSelectedAttachment(application.attachment);
      setShowAttachmentDialog(true);
    }
  };

  const handleDownloadAttachment = () => {
    if (selectedAttachment) {
      const url = URL.createObjectURL(selectedAttachment);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedAttachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${selectedAttachment.name}`,
      });
    }
  };

  const getFilePreview = (file: File) => {
    // Handle cases where file or file.type is undefined
    if (!file) {
      return (
        <div className="text-center p-8">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">File Not Available</p>
          <p className="text-sm text-muted-foreground">
            The attachment could not be loaded.
          </p>
        </div>
      );
    }

    const fileType = file.type || '';
    const fileName = file.name || 'Unknown file';

    if (fileType.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      return (
        <div className="w-full max-w-md mx-auto">
          <img 
            src={url} 
            alt="Attachment preview" 
            className="w-full h-auto rounded-lg border"
            onLoad={() => URL.revokeObjectURL(url)}
          />
        </div>
      );
    } else if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      return (
        <div className="text-center p-8">
          <FileText className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <p className="text-lg font-medium mb-2">PDF Document</p>
          <p className="text-muted-foreground mb-4">{fileName}</p>
          <p className="text-sm text-muted-foreground">
            PDF preview not available. Click download to view the file.
          </p>
        </div>
      );
    } else {
      return (
        <div className="text-center p-8">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">File Attachment</p>
          <p className="text-muted-foreground mb-4">{fileName}</p>
          <p className="text-sm text-muted-foreground">
            Preview not available for this file type. Click download to view the file.
          </p>
        </div>
      );
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    teachers: applications.filter(app => app.submittedBy.role === 'teacher').length,
    students: applications.filter(app => app.submittedBy.role === 'student').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">From Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">From Students</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="px-3 py-1">
              {filteredApplications.length} of {applications.length} applications
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <Card 
            key={application.id} 
            className={`transition-all duration-300 hover:shadow-md ${
              application.status === 'approved' 
                ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' 
                : application.status === 'rejected'
                  ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
                  : 'hover:border-primary/20'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {application.subject}
                    </CardTitle>
                    <Badge className={getStatusColor(application.status)}>
                      {getStatusIcon(application.status)} {application.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {application.submittedBy.role === 'teacher' ? (
                        <GraduationCap className="w-4 h-4 text-blue-500" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-green-500" />
                      )}
                      <span className="font-medium">{application.submittedBy.name}</span>
                    </div>
                    <Badge variant="outline">
                      {application.submittedBy.role}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-medium">#{application.applicationNumber}</span>
                    <span>•</span>
                    <span>{application.type}</span>
                    <span>•</span>
                    <span>{calculateDays(application.startDate, application.endDate)} day(s)</span>
                  </div>
                </div>

                {application.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(application)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(application)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm">{application.content}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Duration</div>
                    <div className="text-muted-foreground">
                      {format(application.startDate, 'MMM dd')} - {format(application.endDate, 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Submitted</div>
                    <div className="text-muted-foreground">
                      {format(application.submittedAt, 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Contact</div>
                    <div className="text-muted-foreground">
                      {application.submittedBy.email}
                    </div>
                  </div>
                </div>
              </div>

              {application.submittedBy.role === 'student' && application.submittedBy.class && (
                <div className="text-sm">
                  <span className="font-medium">Class:</span> {application.submittedBy.class}
                  {application.submittedBy.rollNumber && (
                    <span>, <span className="font-medium">Roll:</span> {application.submittedBy.rollNumber}</span>
                  )}
                </div>
              )}

              {application.submittedBy.role === 'teacher' && application.submittedBy.subjects && (
                <div className="text-sm">
                  <span className="font-medium">Subjects:</span> {application.submittedBy.subjects.join(', ')}
                </div>
              )}

              {application.attachment && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Attachment:</span>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 underline"
                    onClick={() => handleViewAttachment(application)}
                  >
                    {application.attachment.name}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setSelectedAttachment(application.attachment!);
                      handleDownloadAttachment();
                    }}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {application.status === 'rejected' && application.rejectionReason && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="font-medium text-red-800 dark:text-red-400 mb-1">
                    Rejection Reason:
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {application.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
            <p className="text-muted-foreground">
              {applications.length === 0
                ? "No leave applications have been submitted yet."
                : "No applications match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attachment Viewer Dialog */}
      <Dialog open={showAttachmentDialog} onOpenChange={setShowAttachmentDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  View Attachment
                </DialogTitle>
                <DialogDescription>
                  {selectedApplication && `Leave application by ${selectedApplication.submittedBy.name}`}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAttachment}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAttachmentDialog(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedAttachment && getFilePreview(selectedAttachment)}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAttachmentDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave application.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
              >
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}