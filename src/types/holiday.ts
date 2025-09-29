export interface Holiday {
  id: string;
  name: string;
  date: Date;
  description?: string;
}

export interface HolidayFormData {
  name: string;
  date: Date | undefined;
  description: string;
}

export interface HolidayFormErrors {
  name?: string;
  date?: string;
  description?: string;
}