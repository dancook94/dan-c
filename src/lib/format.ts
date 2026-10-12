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

/** USDT is not an ISO currency, so format it as a grouped amount plus the code. */
export function formatUsdt(
  value: number | null | undefined,
  digits = 2,
): string {
  return formatMetric(value, (n) => {
    const body = new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
    return `${body} USDT`;
  });
}

export function formatCryptoQty(value: number | null | undefined): string {
  return formatMetric(value, (n) =>
    new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(n),
  );
}

export function formatCryptoPrice(value: number | null | undefined): string {
  return formatMetric(value, (n) =>
    new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
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
