import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function parseValidDate(dateInput: string | Date | undefined | null): Date | null {
  if (!dateInput) return null;
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  return isValid(date) ? date : null;
}

export function formatDate(dateInput: string | Date | undefined | null): string {
  const date = parseValidDate(dateInput);
  if (!date) return 'N/A';
  return format(date, 'dd MMM yyyy');
}

export function formatDateTime(dateInput: string | Date | undefined | null): string {
  const date = parseValidDate(dateInput);
  if (!date) return 'N/A';
  return format(date, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(dateInput: string | Date | undefined | null): string {
  const date = parseValidDate(dateInput);
  if (!date) return 'N/A';
  return format(date, 'hh:mm a');
}

export function formatRelativeTime(dateInput: string | Date | undefined | null): string {
  const date = parseValidDate(dateInput);
  if (!date) return 'N/A';
  return formatDistanceToNow(date, { addSuffix: true });
}

export interface OpeningHourItem {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  opensAt: string; // 'HH:mm' e.g. '09:00'
  closesAt: string; // 'HH:mm' e.g. '23:00'
  isClosed: boolean;
}

/**
 * Computes whether a restaurant is currently open given its openingHours and timeZone.
 */
export function isRestaurantOpen(
  openingHours?: OpeningHourItem[],
  timeZone = 'Asia/Karachi'
): { isOpen: boolean; nextTimeText: string } {
  if (!openingHours || openingHours.length === 0) {
    return { isOpen: true, nextTimeText: 'Open 24/7' };
  }

  try {
    // Current time in the target timeZone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value;
    const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minStr = parts.find((p) => p.type === 'minute')?.value ?? '00';

    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const currentDay = weekdayStr && dayMap[weekdayStr] !== undefined ? dayMap[weekdayStr] : now.getDay();
    const currentMinutes = parseInt(hourStr, 10) * 60 + parseInt(minStr, 10);

    const todaySchedule = openingHours.find((h) => h.dayOfWeek === currentDay);

    if (!todaySchedule || todaySchedule.isClosed) {
      return { isOpen: false, nextTimeText: 'Closed today' };
    }

    const [openH, openM] = todaySchedule.opensAt.split(':').map((v) => parseInt(v, 10));
    const [closeH, closeM] = todaySchedule.closesAt.split(':').map((v) => parseInt(v, 10));

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    let isOpenNow = false;
    if (closeMinutes > openMinutes) {
      // Normal schedule (e.g., 09:00 - 23:00)
      isOpenNow = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } else {
      // Overnight schedule (e.g., 18:00 - 02:00)
      isOpenNow = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }

    if (isOpenNow) {
      return { isOpen: true, nextTimeText: `Closes at ${todaySchedule.closesAt}` };
    } else if (currentMinutes < openMinutes) {
      return { isOpen: false, nextTimeText: `Opens at ${todaySchedule.opensAt}` };
    } else {
      return { isOpen: false, nextTimeText: 'Closed for today' };
    }
  } catch {
    return { isOpen: true, nextTimeText: 'Open' };
  }
}
