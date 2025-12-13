
import { Assignment } from './types';

export const HOURS_PER_WEEK = 40;
export const BAR_MAX_HOURS = 40;
export const VAT_RATE = 0.2;

export const fmtMoney = (n: number) => "₽ " + (Math.round(Number(n) || 0)).toLocaleString("ru-RU");
export const fmtHours = (h: number) => String(Math.max(0, Math.round(Number(h) || 0)));
export const fteToHours = (fte: number) => Math.round((Number(fte) || 0) * HOURS_PER_WEEK);
export const hoursToFte = (hours: number) => { const h = Math.max(0, Math.round(Number(hours) || 0)); return h / HOURS_PER_WEEK; };
export const fillRatio = (h: number) => Math.min(Math.max(0, Math.round(Number(h) || 0)), BAR_MAX_HOURS) / BAR_MAX_HOURS;

export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x; };
export const addWeeks = (d: Date, n: number) => addDays(d, n * 7);

export const pad2 = (n: number) => (n < 10 ? ("0" + n) : String(n));

// Format date to YYYY-MM-DD using LOCAL time to avoid UTC shifts
export const fmtISO = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};

export const fmtDM = (d: Date) => pad2(d.getDate()) + "." + pad2(d.getMonth() + 1);

export const fmtWeekRange = (iso: string) => {
  // Parse YYYY-MM-DD explicitly as local numbers
  const parts = iso.split('-').map(Number); // [2023, 12, 04]
  const d = new Date(parts[0], parts[1] - 1, parts[2]); // Monday
  
  const e = new Date(d); 
  e.setDate(d.getDate() + 4); // Monday + 4 days = Friday
  
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)} - ${pad2(e.getDate())}.${pad2(e.getMonth() + 1)}`;
};

export const startOfISOWeek = (d: Date) => {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const x = new Date(d);
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const yearWeekMondays = (year: number) => {
  let m = startOfISOWeek(new Date(year, 0, 1));
  const end = new Date(year, 11, 31); 
  end.setHours(0, 0, 0, 0);
  const list: string[] = [];
  while (m <= end) {
    list.push(fmtISO(m));
    m = addDays(m, 7);
  }
  return list;
};

export const isWeekEnded = (weekISO: string) => {
  // weekISO is Monday. End is Sunday (Monday + 6)
  // We parse explicitly to avoid UTC shift
  const parts = weekISO.split('-').map(Number);
  const start = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const end = addDays(start, 6); // Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > end;
};

export const rndId = () => Math.random().toString(36).slice(2) + "_" + Date.now();

export const parseDate = (s: string) => {
  if (!s) return null;
  const parts = s.split('-').map(Number);
  if (parts.length !== 3) return null;
  // Construct local date
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(d.getTime())) return null;
  return d;
};

export const getWorkingDaysInMonth = (year: number, month: number) => {
  // month is 0-indexed (0 = Jan)
  let count = 0;
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Not Sunday (0) and not Saturday (6)
      count++;
    }
    date.setDate(date.getDate() + 1);
  }
  return count;
};

// Aggregators
export const personWeekTotal = (as: Assignment[], pid: string, w: string) => 
  as.filter(a => a.personId === pid && a.weekStart === w).reduce((s, a) => s + a.fte, 0);

export const effectiveFactHours = (a: Assignment | undefined, w: string) => {
  if (!a) return 0;
  const has = (a.factHours != null && !isNaN(a.factHours));
  if (has) return Math.max(0, Math.round(Number(a.factHours) || 0));
  if (isWeekEnded(w)) return Math.max(0, Math.round(fteToHours(a.fte)));
  return 0;
};

export const personWeekFactTotal = (as: Assignment[], pid: string, w: string) => 
  as.filter(a => a.personId === pid && a.weekStart === w).reduce((s, a) => s + effectiveFactHours(a, w), 0);

export const personProjectWeekFact = (as: Assignment[], pid: string, pr: string, w: string) =>
  as.filter(a => a.personId === pid && a.projectId === pr && a.weekStart === w)
    .reduce((sum, a) => sum + effectiveFactHours(a, w), 0);

export const sumFactForPersonProject = (as: Assignment[], pid: string, pr: string, weeks: string[]) =>
  weeks.reduce((acc, w) => acc + personProjectWeekFact(as, pid, pr, w), 0);

export const fteFor = (as: Assignment[], pid: string, pr: string, w: string) =>
  as.filter(a => a.personId === pid && a.projectId === pr && a.weekStart === w).reduce((s, a) => s + a.fte, 0);
