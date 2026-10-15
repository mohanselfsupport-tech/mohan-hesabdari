const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

/**
 * Converts English digits in any string or number to Persian digits
 */
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

/**
 * Converts Persian and Arabic digits in user input to English digits for processing/storage
 */
export function toEnglishDigits(value: string | null | undefined): string {
  if (!value) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let str = value;
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(persianDigits[i], 'g'), String(i));
    str = str.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return str;
}

/**
 * Formats a number as Persian currency with 3-digit comma separators and Persian digits
 */
export function formatPersianCurrency(amount: number | null | undefined, currency: string = 'تومان'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `۰ ${currency}`;
  }
  const formattedWithCommas = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${toPersianDigits(formattedWithCommas)} ${currency}`;
}

/**
 * Converts a Gregorian date to Jalali date object
 */
export function gregorianToJalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

/**
 * Formats ISO or Date string to Persian Jalali date with Persian digits
 */
export function formatPersianDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const monthName = PERSIAN_MONTHS[jm - 1];
  
  return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Formats date and time to Persian representation
 */
export function formatPersianDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  const dateStr = formatPersianDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr} - ساعت ${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
}

export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

/**
 * Gets today's Jalali date with Persian day of week (e.g. دوشنبه ۲۲ مهر ۱۴۰۵)
 */
export function getJalaliDateWithDay(dateInput: Date = new Date()): string {
  const dayName = PERSIAN_WEEKDAYS[dateInput.getDay()];
  const dateStr = formatPersianDate(dateInput);
  return `${dayName}، ${dateStr}`;
}

/**
 * Formats live clock with seconds (e.g. ۱۴:۳۵:۲۰)
 */
export function formatLiveTime(dateInput: Date = new Date()): string {
  const h = String(dateInput.getHours()).padStart(2, '0');
  const m = String(dateInput.getMinutes()).padStart(2, '0');
  const s = String(dateInput.getSeconds()).padStart(2, '0');
  return `${toPersianDigits(h)}:${toPersianDigits(m)}:${toPersianDigits(s)}`;
}

/**
 * Gets today's Jalali date in formatted string
 */
export function getTodayJalali(): string {
  return formatPersianDate(new Date());
}

/**
 * Generate sequential invoice number (e.g. MH-1403-1001)
 */
export function generateInvoiceCode(sequence: number): string {
  const now = new Date();
  const { jy } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const padded = String(sequence).padStart(4, '0');
  return `MH-${jy}-${padded}`;
}

/**
 * Generate sequential internal part code (e.g. MH-P-1001)
 */
export function generatePartCode(sequence: number): string {
  const padded = String(sequence).padStart(4, '0');
  return `PRT-${padded}`;
}
