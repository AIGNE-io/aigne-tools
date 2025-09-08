import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { imageSize } from "image-size";
import probe from "probe-image-size";
import { isRemoteUrl } from "./image-finder.js";

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions for any image source (local files, remote URLs, etc.)
 *
 * @param src - Image source: local file path, remote URL, or data URL
 * @returns Promise resolving to image dimensions or null if unable to determine
 */
export async function getImageDimensions(src: string): Promise<ImageDimensions | null> {
  // Handle data URLs
  if (src.startsWith("data:")) {
    return null; // Data URLs are not supported for dimension detection
  }

  // Handle remote URLs
  if (isRemoteUrl(src)) {
    try {
      const result = await probe(src);
      return {
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.warn(
        `Remote image dimension detection failed for ${src}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  // Handle local files
  try {
    const resolvedPath = resolve(src);

    if (!existsSync(resolvedPath)) {
      return null;
    }

    // Read file as buffer to ensure compatibility with image-size
    const buffer = readFileSync(resolvedPath);
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
      `Local image dimension detection failed for ${src}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}
