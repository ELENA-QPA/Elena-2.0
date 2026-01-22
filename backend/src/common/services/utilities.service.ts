// src/common/utils/business-days.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilitiesService {
  private readonly colombianHolidays2025: Date[] = [
    new Date('2025-01-01'),

    new Date('2025-03-24'),
    new Date('2025-04-17'),
    new Date('2025-04-18'),
    new Date('2025-05-01'),
    new Date('2025-06-02'),
    new Date('2025-06-23'),
    new Date('2025-06-30'),
    new Date('2025-07-07'),
    new Date('2025-07-20'),
    new Date('2025-08-07'),
    new Date('2025-08-18'),
    new Date('2025-10-13'),
    new Date('2025-11-03'),
    new Date('2025-11-17'),
    new Date('2025-12-08'),
    new Date('2025-12-25'),
  ];

  isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    const dateStr = date.toISOString().split('T')[0];
    return !this.colombianHolidays2025.some(
      (holiday) => holiday.toISOString().split('T')[0] === dateStr,
    );
  }

  subtractBusinessDays(endDate: Date, businessDays: number): Date {
    let currentDate = new Date(endDate);
    let daysSubtracted = 0;

    while (daysSubtracted < businessDays) {
      currentDate.setDate(currentDate.getDate() - 1);

      if (this.isBusinessDay(currentDate)) {
        daysSubtracted++;
      }
    }

    return currentDate;
  }

  isExactlyNBusinessDaysBefore(
    targetDate: Date,
    businessDays: number,
  ): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notificationDate = this.subtractBusinessDays(
      targetDate,
      businessDays,
    );
    notificationDate.setHours(0, 0, 0, 0);

    return today.getTime() === notificationDate.getTime();
  }

  addBusinessDays(startDate: Date, businessDays: number): Date {
    const result = new Date(startDate);
    result.setHours(0, 0, 0, 0);

    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);

      if (this.isBusinessDay(result)) {
        daysAdded++;
      }
    }

    return result;
  }

  colombiaToUTC(dateString: string): Date {
    const date = new Date(dateString);
    return new Date(date.getTime() + 5 * 60 * 60 * 1000);
  }
}
