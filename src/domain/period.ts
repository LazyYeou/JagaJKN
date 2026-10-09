import { InputValidationError } from "@/domain/errors";

export function assertPeriod(period: unknown): asserts period is string {
  if (typeof period !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new InputValidationError("Periode harus menggunakan format YYYY-MM.");
  }
}

export function resolvePeriodSelection(value: string | null | undefined, fallback = "2026-09") {
  assertPeriod(fallback);
  if (value === null || value === undefined || value === "") {
    return { period: fallback, validationMessage: null as string | null };
  }
  try {
    assertPeriod(value);
    return { period: value, validationMessage: null as string | null };
  } catch {
    return {
      period: fallback,
      validationMessage: "Periode tidak valid. Menampilkan periode demo 2026-09.",
    };
  }
}

export function periodBounds(period: string) {
  assertPeriod(period);
  const [yearPart, monthPart] = period.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0)),
  };
}

export function periodForDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function previousPeriods(period: string, count: number) {
  assertPeriod(period);
  const [yearPart, monthPart] = period.split("-");
  const current = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1, 1));
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - (count - index - 1), 1));
    return periodForDate(date);
  });
}

export function parseIsoDate(value: unknown, options: { firstOfMonth?: boolean } = {}) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InputValidationError("Tanggal harus menggunakan format YYYY-MM-DD.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new InputValidationError("Tanggal tidak valid.");
  }
  if (options.firstOfMonth && value.slice(-2) !== "01") {
    throw new InputValidationError("Tanggal efektif kontrak harus tanggal 1.");
  }
  return date;
}

export function dateBefore(date: Date) {
  return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}
