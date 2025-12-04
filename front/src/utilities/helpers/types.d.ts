


import 'react-day-picker';

declare module 'react-day-picker' {
  export interface FormattersInput {
    formatWeekdayName?: (weekday: number) => string;
  }
}
