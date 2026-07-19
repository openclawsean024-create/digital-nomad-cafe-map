import type { Cafe } from '@/domain/types';

const CAFE_KEY = 'deskbound-contributed-cafes-v1';
const UNLOCK_KEY = 'deskbound-unlock-until-v1';
const REMINDER_KEY = 'deskbound-city-reminders-v1';

function parseList<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function loadContributedCafes(): Cafe[] {
  if (typeof window === 'undefined') return [];
  return parseList<Cafe>(window.localStorage.getItem(CAFE_KEY));
}

export function saveContributedCafes(cafes: Cafe[]): void {
  window.localStorage.setItem(CAFE_KEY, JSON.stringify(cafes));
}

export function loadUnlockUntil(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(UNLOCK_KEY);
}

export function saveDemoUnlock(days = 30, now = new Date()): string {
  const validUntil = new Date(now.getTime() + days * 86_400_000).toISOString();
  window.localStorage.setItem(UNLOCK_KEY, validUntil);
  return validUntil;
}

export function loadCityReminders(): string[] {
  if (typeof window === 'undefined') return [];
  return parseList<string>(window.localStorage.getItem(REMINDER_KEY));
}

export function saveCityReminders(cityIds: string[]): void {
  window.localStorage.setItem(REMINDER_KEY, JSON.stringify(cityIds));
}
