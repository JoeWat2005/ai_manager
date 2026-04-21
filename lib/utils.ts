import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine class names safely and resolve Tailwind conflicts
export function cn(...inputs: ClassValue[]) {
  // Step 1: clsx → builds a class string from mixed inputs
  // Step 2: twMerge → removes conflicting Tailwind classes
  return twMerge(clsx(inputs))
}