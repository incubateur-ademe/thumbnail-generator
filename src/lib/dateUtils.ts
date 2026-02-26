export function formatDateFR(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR");
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}
