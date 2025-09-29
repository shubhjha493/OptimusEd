import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Edit, Trash2 } from 'lucide-react';
import { format, isSameMonth, isFuture, isToday, isSameDay } from 'date-fns';
import { Holiday } from '@/types/holiday';

interface HolidayCalendarViewProps {
  holidays: Holiday[];
  onEditHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
}

export const HolidayCalendarView: React.FC<HolidayCalendarViewProps> = ({
  holidays,
  onEditHoliday,
  onDeleteHoliday
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const currentMonthHolidays = holidays.filter(holiday => 
    isSameMonth(holiday.date, selectedDate)
  );

  const holidayDates = holidays.map(h => h.date);

  const isUpcoming = (date: Date) => isFuture(date) || isToday(date);

  const getHolidayForDate = (date: Date) => {
    return holidays.find(holiday => isSameDay(holiday.date, date));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="pointer-events-auto w-full"
            modifiers={{
              holiday: holidayDates
            }}
            modifiersStyles={{
              holiday: {
                backgroundColor: 'rgb(59 130 246 / 0.2)',
                color: 'rgb(29 78 216)',
                fontWeight: 'bold',
                border: '2px solid rgb(59 130 246 / 0.5)',
                borderRadius: '6px'
              }
            }}
            onDayClick={(date) => {
              const holiday = getHolidayForDate(date);
              if (holiday) {
                setSelectedDate(date);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Monthly Holiday List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {format(selectedDate, "MMMM yyyy")} Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentMonthHolidays.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No holidays this month
              </p>
            ) : (
              currentMonthHolidays
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((holiday) => (
                  <Card 
                    key={holiday.id} 
                    className={`p-4 transition-all duration-200 animate-fade-in ${
                      isUpcoming(holiday.date) 
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{holiday.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(holiday.date, "EEE, MMM d, yyyy")}
                          </p>
                          {holiday.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {holiday.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditHoliday(holiday)}
                            className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteHoliday(holiday.id)}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {isUpcoming(holiday.date) && (
                        <Badge 
                          variant="outline" 
                          className="text-xs text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/30"
                        >
                          Upcoming
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};