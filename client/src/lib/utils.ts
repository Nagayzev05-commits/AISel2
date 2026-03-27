import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "М";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "К";
  return String(n);
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(ts));
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][d.getMonth()]}`;
}

export function marketplaceName(mp: string): string {
  return mp === "wb" ? "Wildberries" : "Ozon";
}

export function marketplaceColor(mp: string): string {
  return mp === "wb" ? "purple" : "blue";
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: "Черновик", active: "Активна", paused: "На паузе",
    archived: "Архив", processing: "Обработка", published: "Опубликована"
  };
  return map[s] || s;
}

export function taskTypeLabel(t: string): string {
  const map: Record<string, string> = {
    description: "Описание и контент",
    seo_keywords: "SEO ключи",
    price_analysis: "Анализ цен",
    ab_test: "A/B тест",
    infographic: "Инфографика",
    bg_remove: "Удаление фона",
    competitor_analysis: "Анализ конкурентов",
  };
  return map[t] || t;
}
