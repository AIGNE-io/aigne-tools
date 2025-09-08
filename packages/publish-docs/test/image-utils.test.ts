import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { getImageDimensions } from "../src/utils/image-utils.js";

const TEST_ASSETS_DIR = resolve(__dirname, "assets");

describe("Image Utils", () => {
  describe("getImageDimensions", () => {
    it("should return correct dimensions for PNG image", async () => {
      const pngPath = resolve(TEST_ASSETS_DIR, "png-test.png");
      const dimensions = await getImageDimensions(pngPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1378);
      expect(dimensions?.height).toBe(642);
    });

    it("should return correct dimensions for JPEG image", async () => {
      const jpgPath = resolve(TEST_ASSETS_DIR, "jpg-test.jpg");
      const dimensions = await getImageDimensions(jpgPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1002);
      expect(dimensions?.height).toBe(600);
    });

    it("should return correct dimensions for SVG with explicit width/height", async () => {
      const svgPath = resolve(TEST_ASSETS_DIR, "svg-test-2.svg");
      const dimensions = await getImageDimensions(svgPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(17);
      expect(dimensions?.height).toBe(17);
    });

    it("should return correct dimensions for SVG with viewBox", async () => {
      const svgPath = resolve(TEST_ASSETS_DIR, "svg-test.svg");
      const dimensions = await getImageDimensions(svgPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1041);
      expect(dimensions?.height).toBe(1519);
    });

    it("should return null for non-existent file", async () => {
      const nonExistentPath = resolve(TEST_ASSETS_DIR, "non-existent.png");
      const dimensions = await getImageDimensions(nonExistentPath);

      expect(dimensions).toBeNull();
    });

    it("should return null for invalid image file", async () => {
      const invalidPath = resolve(TEST_ASSETS_DIR, "../image-utils.test.ts");
      const dimensions = await getImageDimensions(invalidPath);

      expect(dimensions).toBeNull();
    });

    it("should handle remote images", async () => {
      const remoteUrl =
        "https://docsmith.aigne.io/image-bin/uploads/def424c20bbdb3c77483894fe0e22819.png";
      const dimensions = await getImageDimensions(remoteUrl);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(3148);
      expect(dimensions?.height).toBe(1638);
    });

    it("should return null for HTTP URLs that don't exist", async () => {
      const httpUrl = "https://example.com/non-existent-image.png";
      const dimensions = await getImageDimensions(httpUrl);

      expect(dimensions).toBeNull();
    });

    it("should return null for data URLs", async () => {
      const dataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const dimensions = await getImageDimensions(dataUrl);

      expect(dimensions).toBeNull();
    });

    it("should handle various image formats", async () => {
      const testCases = [
        { file: "png-test.png", expected: { width: 1378, height: 642 } },
        { file: "jpg-test.jpg", expected: { width: 1002, height: 600 } },
        { file: "svg-test.svg", expected: { width: 1041, height: 1519 } },
        { file: "svg-test-2.svg", expected: { width: 17, height: 17 } },
      ];

      for (const testCase of testCases) {
        const relativePath = `test/assets/${testCase.file}`;
        const dimensions = await getImageDimensions(relativePath);

        expect(dimensions).not.toBeNull();
        expect(dimensions?.width).toBe(testCase.expected.width);
        expect(dimensions?.height).toBe(testCase.expected.height);
      }
    });
  });

  describe("Error handling", () => {
    it("should handle corrupted files gracefully", async () => {
      // Test handling of corrupted image file
      const invalidPath = resolve(TEST_ASSETS_DIR, "corrupted.png");

      // Should not throw, should return null
      await expect(async () => {
        const dimensions = await getImageDimensions(invalidPath);
        expect(dimensions).toBeNull();
      }).not.toThrow();
    });

    it("should handle empty file paths", async () => {
      await expect(async () => {
        const dimensions = await getImageDimensions("");
        expect(dimensions).toBeNull();
      }).not.toThrow();
    });

    it("should handle directory paths", async () => {
      const dirPath = resolve(TEST_ASSETS_DIR);

      await expect(async () => {
        const dimensions = await getImageDimensions(dirPath);
        expect(dimensions).toBeNull();
      }).not.toThrow();
    });
  });
});
