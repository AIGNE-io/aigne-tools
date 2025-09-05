import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { imageSize } from "image-size";
import { isRemoteUrl } from "./image-finder.js";

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Check if a path is local (not remote URL or data URL)
 */
export function isLocalPath(src: string): boolean {
  return !isRemoteUrl(src) && !src.startsWith("data:");
}

/**
 * Extracts image dimensions from various image file formats using the image-size library.
 *
 * Supported formats: PNG, JPEG, GIF, SVG, WebP, BMP, TIFF, and more.
 *
 * @param filePath - Path to the image file
 * @returns Image dimensions or null if unable to determine
 */
export function getImageDimensions(filePath: string): ImageDimensions | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }

    // Read file as buffer to ensure compatibility with image-size
    const buffer = readFileSync(filePath);
    const dimensions = imageSize(buffer);

    if (dimensions.width && dimensions.height) {
      return {
        width: dimensions.width,
        height: dimensions.height,
      };
    }

    return null;
  } catch (error) {
    console.warn(
      `Image dimension detection failed for ${filePath}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

export function getLocalImageDimensions(src: string): ImageDimensions | null {
  if (!isLocalPath(src)) {
    return null;
  }

  const resolvedPath = resolve(src);
  return getImageDimensions(resolvedPath);
}
