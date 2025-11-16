// src/components/Common/SafeText.tsx
export default function SafeText({ value }: { value: unknown }) {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return <>{value}</>;
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const pick =
      (o.fullName as string) ||
      (o.name as string) ||
      (o.title as string) ||
      (o._id as string) ||
      (o.id as string) ||
      (o.userId as string);
    return <>{pick ?? JSON.stringify(o)}</>;
  }
  try {
    return <>{String(value)}</>;
  } catch {
    return null;
  }
}
