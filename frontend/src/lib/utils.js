import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const readFileAsDataURL = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
    }
    reader.readAsDataURL(file);
  })
}

export const formatDateHandler = (createdAt) => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInSeconds / 3600);
  const diffInDays = Math.floor(diffInSeconds / 86400);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInSeconds < 60) {
      return `vài giây trước`;
  } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
  } else if (diffInDays < 30) {
      return `${diffInDays} ngày trước`;
  } else if (diffInMonths < 6) {
      return `${diffInMonths} tháng trước`;
  } else {
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${hours}:${minutes} ${day}-${month}-${year}`;
  }
};