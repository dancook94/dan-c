import type { ResultsCurrency } from "@/lib/results";

export function formatMetric(
  value: number | null | undefined,
  format: (n: number) => string,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return format(value);
}

export function formatMoney(
  value: number | null | undefined,
  currency: ResultsCurrency = "GBP",
): string {
  return formatMetric(value, (n) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n),
  );
}

export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  return formatMetric(value, (n) => `${n.toFixed(digits)}%`);
}

export function formatSignedPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  return formatMetric(value, (n) => {
    const body = `${Math.abs(n).toFixed(digits)}%`;
    if (n > 0) return `+${body}`;
    if (n < 0) return `−${body}`;
    return body;
  });
}

export function formatMoneyWhole(
  value: number | null | undefined,
  currency: ResultsCurrency = "GBP",
): string {
  return formatMetric(value, (n) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n),
  );
}

export function formatNumber(
  value: number | null | undefined,
  digits = 3,
): string {
  return formatMetric(value, (n) =>
    new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    }).format(n),
  );
}

export function formatMonth(month: string): string {
  const [year, mm] = month.split("-");
  const date = new Date(Date.UTC(Number(year), Number(mm) - 1, 1));
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
