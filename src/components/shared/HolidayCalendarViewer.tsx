import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format, isSameMonth, isFuture, isToday, parseISO } from 'date-fns';
import { Holiday } from '@/types/holiday';

interface HolidayCalendarViewerProps {
  onBack?: () => void;
  userRole?: 'student' | 'teacher' | 'admin';
}

export const HolidayCalendarViewer: React.FC<HolidayCalendarViewerProps> = ({ 
  onBack, 
  userRole = 'teacher' 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    loadHolidays();
    
    // Listen for holiday updates when admin makes changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'smartpresence_holidays') {
        loadHolidays();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for updates periodically (for same-tab updates)
    const interval = setInterval(loadHolidays, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadHolidays = () => {
    const savedHolidays = JSON.parse(localStorage.getItem('smartpresence_holidays') || '[]');
    const parsedHolidays = savedHolidays.map((holiday: any) => ({
      ...holiday,
      date: typeof holiday.date === 'string' ? parseISO(holiday.date) : new Date(holiday.date)
    }));
    setHolidays(parsedHolidays);
  };

  const selectedMonthHolidays = holidays.filter(holiday => 
    isSameMonth(holiday.date, selectedDate)
  ).sort((a, b) => a.date.getTime() - b.date.getTime());

  const isUpcoming = (date: Date) => isFuture(date) || isToday(date);

  const getHolidayForDate = (date: Date) => {
    return holidays.find(holiday => 
      format(holiday.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  // Create modifiers for the calendar
  const holidayDates = holidays.map(holiday => holiday.date);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-glassmorphism backdrop-blur-glass border-b border-border shadow-glass">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Holiday Calendar</h1>
                <p className="text-muted-foreground">View school holidays and breaks</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card className={`animate-fade-in ${userRole === 'student' ? 'hover:shadow-xl transition-all duration-500' : ''}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${userRole === 'student' ? 'animate-bounce-subtle' : ''}`}>
                <CalendarIcon className={`w-5 h-5 ${userRole === 'student' ? 'animate-pulse' : ''}`} />
                {format(selectedDate, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription>
                Click on a date to view holidays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  holiday: holidayDates,
                }}
                modifiersStyles={{
                  holiday: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    fontWeight: 'bold',
                  }
                }}
                className="rounded-md border w-full"
              />
              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Holiday dates</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holiday List for Selected Month */}
          <Card className={`animate-fade-in ${userRole === 'student' ? 'hover:shadow-xl transition-all duration-500' : ''}`}>
            <CardHeader>
              <CardTitle className={userRole === 'student' ? 'animate-bounce-subtle' : ''}>
                Holidays in {format(selectedDate, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription>
                {selectedMonthHolidays.length} holiday{selectedMonthHolidays.length !== 1 ? 's' : ''} this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedMonthHolidays.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">No holidays this month</p>
                    <p className="text-sm">Check other months for upcoming holidays</p>
                  </div>
                ) : (
                  selectedMonthHolidays.map((holiday) => (
                    <div 
                      key={holiday.id}
                      className={`p-4 rounded-lg border transition-all duration-300 animate-fade-in ${
                        isUpcoming(holiday.date) 
                          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{holiday.name}</h3>
                        {isUpcoming(holiday.date) && (
                          <Badge 
                            variant="outline" 
                            className={`${
                              userRole === 'student' 
                                ? 'text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/30 animate-pulse' 
                                : 'text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/30'
                            }`}
                          >
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {format(holiday.date, "EEEE, MMMM d, yyyy")}
                      </p>
                      {holiday.description && (
                        <p className="text-sm bg-background/50 p-2 rounded border">
                          {holiday.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`${userRole === 'student' ? 'animate-bounce-subtle' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holidays</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{holidays.length}</div>
              <p className="text-xs text-muted-foreground">This academic year</p>
            </CardContent>
          </Card>

          <Card className={`${userRole === 'student' ? 'animate-bounce-subtle' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Holidays</CardTitle>
              <CalendarIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {holidays.filter(h => isUpcoming(h.date)).length}
              </div>
              <p className="text-xs text-muted-foreground">Coming up</p>
            </CardContent>
          </Card>

          <Card className={`${userRole === 'student' ? 'animate-bounce-subtle' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <CalendarIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedMonthHolidays.length}</div>
              <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM')} holidays</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};