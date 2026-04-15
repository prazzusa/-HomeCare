import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function logAudit(userId: string, action: string, resource: string, details: string) {
  try {
    await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, resource, details }),
    });
  } catch (error) {
    console.error("Failed to log audit:", error);
  }
}
