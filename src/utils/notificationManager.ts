// Notification Manager for Real-time Updates with Animations
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'leave_update';
  timestamp: string;
  isNew?: boolean;
  slideDirection?: 'up' | 'down';
}

export class NotificationManager {
  private static readonly MAX_NOTIFICATIONS = 5;
  
  // Add a new notification with slide-up animation
  static addNotification(
    userType: 'teacher' | 'student', 
    notification: Omit<Notification, 'id' | 'timestamp' | 'isNew' | 'slideDirection'>
  ): void {
    const storageKey = `smartpresence_${userType}_notifications`;
    const existingNotifications: Notification[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isNew: true,
      slideDirection: 'up'
    };

    // Add new notification at the beginning and keep only the latest 5
    const updatedNotifications = [newNotification, ...existingNotifications]
      .slice(0, this.MAX_NOTIFICATIONS)
      .map((notif, index) => ({
        ...notif,
        slideDirection: index === 0 ? 'up' : undefined // Only the newest gets slide-up animation
      }));

    localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
    
    // Trigger storage event for real-time updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: JSON.stringify(updatedNotifications),
      oldValue: JSON.stringify(existingNotifications)
    }));
  }

  // Get all notifications for a user type
  static getNotifications(userType: 'teacher' | 'student'): Notification[] {
    const storageKey = `smartpresence_${userType}_notifications`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }

  // Mark notifications as read (remove isNew flag)
  static markAsRead(userType: 'teacher' | 'student'): void {
    const storageKey = `smartpresence_${userType}_notifications`;
    const notifications = this.getNotifications(userType);
    const updatedNotifications = notifications.map(notif => ({
      ...notif,
      isNew: false,
      slideDirection: undefined
    }));
    
    localStorage.setItem(storageKey, JSON.stringify(updatedNotifications));
  }

  // Clear old notifications (keep only latest 3)
  static clearOldNotifications(userType: 'teacher' | 'student'): void {
    const storageKey = `smartpresence_${userType}_notifications`;
    const notifications = this.getNotifications(userType);
    const recentNotifications = notifications.slice(0, 3);
    
    localStorage.setItem(storageKey, JSON.stringify(recentNotifications));
  }
}

// Leave Application Status Manager
export class LeaveStatusManager {
  
  // Update leave application status and notify relevant users
  static updateLeaveStatus(
    applicationId: string, 
    status: 'approved' | 'rejected', 
    rejectionReason?: string
  ): void {
    // Update the global leave applications
    const globalApplications = JSON.parse(localStorage.getItem('smartpresence_all_leave_applications') || '[]');
    const updatedGlobalApplications = globalApplications.map((app: any) => {
      if (app.id === applicationId) {
        return {
          ...app,
          status,
          rejectionReason: rejectionReason || undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return app;
    });
    
    localStorage.setItem('smartpresence_all_leave_applications', JSON.stringify(updatedGlobalApplications));

    // Find the application to get user details
    const application = globalApplications.find((app: any) => app.id === applicationId);
    if (!application) return;

    // Update user-specific leave applications
    const userStorageKey = application.submittedBy.role === 'teacher' 
      ? 'smartpresence_teacher_leave_applications'
      : 'smartpresence_student_leave_applications';
    
    const userApplications = JSON.parse(localStorage.getItem(userStorageKey) || '[]');
    const updatedUserApplications = userApplications.map((app: any) => {
      if (app.id === applicationId) {
        return {
          ...app,
          status,
          rejectionReason: rejectionReason || undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return app;
    });
    
    localStorage.setItem(userStorageKey, JSON.stringify(updatedUserApplications));

    // Send notification to the user
    const notificationTitle = status === 'approved' 
      ? '✅ Leave Application Approved' 
      : '❌ Leave Application Rejected';
    
    const notificationMessage = status === 'approved'
      ? `Your leave application "${application.subject}" has been approved.`
      : `Your leave application "${application.subject}" was rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;

    NotificationManager.addNotification(
      application.submittedBy.role,
      {
        title: notificationTitle,
        message: notificationMessage,
        type: status === 'approved' ? 'success' : 'error'
      }
    );
  }
}
