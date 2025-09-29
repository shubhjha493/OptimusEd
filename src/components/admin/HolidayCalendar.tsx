import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GraduationCap, Plus, Calendar, ArrowLeft } from 'lucide-react';
import { Holiday } from '@/types/holiday';
import { HolidayForm } from './HolidayForm';
import { HolidayTable } from './HolidayTable';
import { HolidayCalendarView } from './HolidayCalendarView';
import { ConfirmDialog } from './ConfirmDialog';
import { format, isFuture, isToday } from 'date-fns';

const SAMPLE_HOLIDAYS: Holiday[] = [
  { id: '1', name: "New Year's Day", date: new Date(2025, 0, 1), description: 'Start of the new year' },
  { id: '2', name: "Martin Luther King Jr. Day", date: new Date(2025, 0, 20), description: 'Federal holiday' },
  { id: '3', name: "Presidents' Day", date: new Date(2025, 1, 17), description: 'Federal holiday' },
  { id: '4', name: "Spring Break", date: new Date(2025, 2, 24), description: 'One week spring break' },
  { id: '5', name: "Memorial Day", date: new Date(2025, 4, 26), description: 'Federal holiday' },
  { id: '6', name: "Independence Day", date: new Date(2025, 6, 4), description: 'Fourth of July celebration' },
  { id: '7', name: "Labor Day", date: new Date(2025, 8, 1), description: 'Federal holiday' },
  { id: '8', name: "Thanksgiving Break", date: new Date(2025, 10, 27), description: 'Thanksgiving holiday' },
  { id: '9', name: "Christmas Break Start", date: new Date(2025, 11, 20), description: 'Winter break begins' }
];

export const HolidayCalendar: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deleteHolidayId, setDeleteHolidayId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    // Load holidays from localStorage or use sample data
    const storedHolidays = localStorage.getItem('smartpresence_holidays');
    if (storedHolidays) {
      const parsed = JSON.parse(storedHolidays);
      setHolidays(parsed.map((h: any) => ({ ...h, date: new Date(h.date) })));
    } else {
      setHolidays(SAMPLE_HOLIDAYS);
      localStorage.setItem('smartpresence_holidays', JSON.stringify(SAMPLE_HOLIDAYS));
    }
  }, []);

  const saveHolidays = (newHolidays: Holiday[]) => {
    setHolidays(newHolidays);
    localStorage.setItem('smartpresence_holidays', JSON.stringify(newHolidays));
  };

  const upcomingHolidays = holidays.filter(h => isFuture(h.date) || isToday(h.date));

  const handleAddHoliday = (holidayData: Holiday) => {
    const newHolidays = [...holidays, holidayData];
    saveHolidays(newHolidays);
    setIsFormOpen(false);
  };

  const handleEditHoliday = (holidayData: Holiday) => {
    const newHolidays = holidays.map(h => h.id === holidayData.id ? holidayData : h);
    saveHolidays(newHolidays);
    setEditingHoliday(null);
    setIsFormOpen(false);
  };

  const handleDeleteHoliday = (id: string) => {
    const newHolidays = holidays.filter(h => h.id !== id);
    saveHolidays(newHolidays);
    setDeleteHolidayId(null);
  };

  const openEditForm = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditingHoliday(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingHoliday(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-glassmorphism backdrop-blur-glass border-b border-border shadow-glass">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">School Admin Dashboard</h1>
                <p className="text-muted-foreground">Holiday Calendar Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" onClick={onBack} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              )}
              <Badge variant="outline" className="text-sm">
                {upcomingHolidays.length} Upcoming Holidays
              </Badge>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddForm} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Holiday
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                    </DialogTitle>
                  </DialogHeader>
                  <HolidayForm
                    holiday={editingHoliday}
                    onSave={editingHoliday ? handleEditHoliday : handleAddHoliday}
                    onCancel={closeForm}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Holiday Calendar
            </CardTitle>
            <CardDescription>
              Manage academic holidays and important dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendar" className="animate-fade-in">
                <HolidayCalendarView 
                  holidays={holidays}
                  onEditHoliday={openEditForm}
                  onDeleteHoliday={setDeleteHolidayId}
                />
              </TabsContent>
              
              <TabsContent value="table" className="animate-fade-in">
                <HolidayTable
                  holidays={holidays}
                  onEditHoliday={openEditForm}
                  onDeleteHoliday={setDeleteHolidayId}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteHolidayId}
        onClose={() => setDeleteHolidayId(null)}
        onConfirm={() => deleteHolidayId && handleDeleteHoliday(deleteHolidayId)}
        title="Delete Holiday"
        description="Are you sure you want to delete this holiday? This action cannot be undone."
      />
    </div>
  );
};