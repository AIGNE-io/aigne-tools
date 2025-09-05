import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import {
  getImageDimensions,
  getLocalImageDimensions,
  isLocalPath,
} from "../src/utils/image-utils.js";

const TEST_ASSETS_DIR = resolve(__dirname, "assets");

describe("Image Utils", () => {
  describe("isLocalPath", () => {
    it("should return true for relative paths", () => {
      expect(isLocalPath("./image.png")).toBe(true);
      expect(isLocalPath("../image.jpg")).toBe(true);
      expect(isLocalPath("image.svg")).toBe(true);
      expect(isLocalPath("folder/image.png")).toBe(true);
    });

    it("should return true for absolute paths", () => {
      expect(isLocalPath("/path/to/image.png")).toBe(true);
      expect(isLocalPath("/Users/user/image.jpg")).toBe(true);
    });

    it("should return false for HTTP URLs", () => {
      expect(isLocalPath("http://example.com/image.png")).toBe(false);
      expect(isLocalPath("https://example.com/image.jpg")).toBe(false);
    });

    it("should return false for data URLs", () => {
      expect(
        isLocalPath(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        ),
      ).toBe(false);
    });
  });

  describe("getImageDimensions", () => {
    it("should return correct dimensions for PNG image", () => {
      const pngPath = resolve(TEST_ASSETS_DIR, "png-test.png");
      const dimensions = getImageDimensions(pngPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1378);
      expect(dimensions?.height).toBe(642);
    });

    it("should return correct dimensions for JPEG image", () => {
      const jpgPath = resolve(TEST_ASSETS_DIR, "jpg-test.jpg");
      const dimensions = getImageDimensions(jpgPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1002);
      expect(dimensions?.height).toBe(600);
    });

    it("should return correct dimensions for SVG with explicit width/height", () => {
      const svgPath = resolve(TEST_ASSETS_DIR, "svg-test-2.svg");
      const dimensions = getImageDimensions(svgPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(17);
      expect(dimensions?.height).toBe(17);
    });

    it("should return correct dimensions for SVG with viewBox", () => {
      const svgPath = resolve(TEST_ASSETS_DIR, "svg-test.svg");
      const dimensions = getImageDimensions(svgPath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1041);
      expect(dimensions?.height).toBe(1519);
    });

    it("should return null for non-existent file", () => {
      const nonExistentPath = resolve(TEST_ASSETS_DIR, "non-existent.png");
      const dimensions = getImageDimensions(nonExistentPath);

      expect(dimensions).toBeNull();
    });

    it("should return null for invalid image file", () => {
      const invalidPath = resolve(TEST_ASSETS_DIR, "../image-utils.test.ts");
      const dimensions = getImageDimensions(invalidPath);

      expect(dimensions).toBeNull();
    });
  });

  describe("getLocalImageDimensions", () => {
    it("should return dimensions for local image paths", () => {
      const relativePath = "test/assets/png-test.png";
      const dimensions = getLocalImageDimensions(relativePath);

      expect(dimensions).not.toBeNull();
      expect(dimensions?.width).toBe(1378);
      expect(dimensions?.height).toBe(642);
    });

    it("should return null for HTTP URLs", () => {
      const httpUrl = "https://example.com/image.png";
      const dimensions = getLocalImageDimensions(httpUrl);

      expect(dimensions).toBeNull();
    });

    it("should return null for data URLs", () => {
      const dataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const dimensions = getLocalImageDimensions(dataUrl);

      expect(dimensions).toBeNull();
    });

    it("should handle various image formats", () => {
      const testCases = [
        { file: "png-test.png", expected: { width: 1378, height: 642 } },
        { file: "jpg-test.jpg", expected: { width: 1002, height: 600 } },
        { file: "svg-test.svg", expected: { width: 1041, height: 1519 } },
        { file: "svg-test-2.svg", expected: { width: 17, height: 17 } },
      ];

      for (const testCase of testCases) {
        const relativePath = `test/assets/${testCase.file}`;
        const dimensions = getLocalImageDimensions(relativePath);

        expect(dimensions).not.toBeNull();
        expect(dimensions?.width).toBe(testCase.expected.width);
        expect(dimensions?.height).toBe(testCase.expected.height);
      }
    });
  });

  describe("Error handling", () => {
    it("should handle corrupted files gracefully", () => {
      // Test handling of non-existent corrupted image file
      const invalidPath = resolve(TEST_ASSETS_DIR, "corrupted.png");

      // Should not throw, should return null
      expect(() => {
        const dimensions = getImageDimensions(invalidPath);
        expect(dimensions).toBeNull();
      }).not.toThrow();
    });

    it("should handle empty file paths", () => {
      expect(() => {
        const dimensions = getImageDimensions("");
        expect(dimensions).toBeNull();
      }).not.toThrow();
    });

    it("should handle directory paths", () => {
      const dirPath = resolve(TEST_ASSETS_DIR);

      expect(() => {
        const dimensions = getImageDimensions(dirPath);
        expect(dimensions).toBeNull();
      }).not.toThrow();
    });
  });
});
