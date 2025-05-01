import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}