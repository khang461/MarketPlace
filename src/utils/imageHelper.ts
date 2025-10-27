import { VehicleImage } from "../types";


type ImageType = string | VehicleImage | { url: string; kind?: string };


export const getImageUrl = (
  image: ImageType | undefined,
  fallback: string = "/placeholder-car.jpg"
): string => {
  if (!image) return fallback;


  if (typeof image === "string") {
    if (image.startsWith("http")) return image;
    return `http://localhost:8081${image}`;
  }

  // If image is an object with url property
  if (typeof image === "object" && "url" in image) {
    const url = image.url;
    if (url.startsWith("http")) return url;
    return `http://localhost:8081${url}`;
  }

  return fallback;
};


export const getFirstImageUrl = (
  images: ImageType[] | undefined,
  fallback: string = "/placeholder-car.jpg"
): string => {
  if (!images || images.length === 0) return fallback;
  return getImageUrl(images[0], fallback);
};

export const getAllImageUrls = (
  images: ImageType[] | undefined
): string[] => {
  if (!images || images.length === 0) return [];
  return images.map((img) => getImageUrl(img, ""));
};
