export interface DelayOption {
  id: string;
  label: string;
  hours?: number;
  days?: number;
  custom?: boolean;
  calculateTime?: () => number;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  time: string;
  endDate?: number;
}

export interface DelayedTab {
  id: string;
  url?: string;
  title?: string;
  favicon?: string;
  createdAt: number;
  wakeTime: number;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}
