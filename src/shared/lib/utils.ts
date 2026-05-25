export { cn } from "@/lib/utils";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPrice(cents?: number | null, label?: string | null): string {
  if (label) return label;
  if (!cents) return "Price on request";
  return `From R${(cents / 100).toLocaleString("en-ZA")}`;
}

export function buildWhatsAppUrl(
  phone: string,
  message: string
): string {
  const cleaned = phone.replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
