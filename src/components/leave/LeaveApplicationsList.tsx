import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarDays, Clock, FileText, Filter } from 'lucide-react';

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
  rejectionReason?: string;
  attachment?: File;
}

interface LeaveApplicationsListProps {
  applications: LeaveApplication[];
  userType: 'teacher' | 'student';
}

export function LeaveApplicationsList({ applications, userType }: LeaveApplicationsListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredApplications = applications.filter(app => {
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    const typeMatch = filterType === 'all' || app.type === filterType;
    return statusMatch && typeMatch;
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

  // Get unique leave types for filter
  const leaveTypes = Array.from(new Set(applications.map(app => app.type)));

  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Leave Applications</h3>
          <p className="text-muted-foreground">
            You haven't submitted any leave applications yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Applications
              </CardTitle>
              <CardDescription>
                Filter your leave applications by status and type
              </CardDescription>
            </div>
            <Badge variant="outline">
              {filteredApplications.length} of {applications.length}
            </Badge>
          </div>
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
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {leaveTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {application.subject}
                    </CardTitle>
                    <Badge className={getStatusColor(application.status)}>
                      {getStatusIcon(application.status)} {application.status.toUpperCase()}
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
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm">{application.content}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Start Date</div>
                    <div className="text-muted-foreground">
                      {format(application.startDate, 'PPP')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">End Date</div>
                    <div className="text-muted-foreground">
                      {format(application.endDate, 'PPP')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Submitted</div>
                    <div className="text-muted-foreground">
                      {format(application.submittedAt, 'PPp')}
                    </div>
                  </div>
                </div>
              </div>

              {application.attachment && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Attachment:</span>
                  <span className="text-muted-foreground">{application.attachment.name}</span>
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

      {filteredApplications.length === 0 && applications.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
            <p className="text-muted-foreground">
              No leave applications match your current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}