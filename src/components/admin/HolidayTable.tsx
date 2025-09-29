import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { Holiday } from '@/types/holiday';

interface HolidayTableProps {
  holidays: Holiday[];
  onEditHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
}

export const HolidayTable: React.FC<HolidayTableProps> = ({
  holidays,
  onEditHoliday,
  onDeleteHoliday
}) => {
  const sortedHolidays = [...holidays].sort((a, b) => a.date.getTime() - b.date.getTime());

  const isUpcoming = (date: Date) => isFuture(date) || isToday(date);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Holiday Name</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHolidays.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No holidays added yet. Click "Add Holiday" to get started.
              </TableCell>
            </TableRow>
          ) : (
            sortedHolidays.map((holiday) => (
              <TableRow 
                key={holiday.id}
                className={cn(
                  "transition-colors animate-fade-in",
                  isUpcoming(holiday.date) && "bg-blue-50 dark:bg-blue-950/20"
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{format(holiday.date, "EEE, MMM d, yyyy")}</span>
                    {isUpcoming(holiday.date) && (
                      <Badge variant="outline" className="w-fit mt-1 text-xs text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950/30">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{holiday.name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {holiday.description || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditHoliday(holiday)}
                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteHoliday(holiday.id)}
                      className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}