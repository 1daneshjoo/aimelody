import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function statusLabel(status: string) {
  switch (status) {
    case "approved":
      return "تایید شده";
    case "pending":
      return "در انتظار تایید";
    case "rejected":
      return "رد شده";
    case "active":
      return "فعال";
    case "ended":
      return "پایان‌یافته";
    case "upcoming":
      return "به‌زودی";
    default:
      return status;
  }
}
