import { describe, expect, it } from "bun:test";
import he from "he";
import { marked } from "marked";
import { alertExtension } from "../src/converter/index.js";

// Setup marked with alert extension for all tests
marked.use({ extensions: [alertExtension] });

describe("alertExtension", () => {
  describe("basic parsing", () => {
    it("should parse alert block with error severity", async () => {
      const markdown = ":::error\nThis is an error message\n:::";
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("error");
      expect(html).toContain("This is an error message");
      expect(html).toMatch(/<div data-lexical-alert=/);
    });

    it("should handle empty text content", async () => {
      const markdown = ":::error\n\n:::";
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("error");
    });

    it("should output div with data-lexical-alert attribute", async () => {
      const markdown = ":::error\nTest message\n:::";
      const html = await marked.parse(markdown);

      expect(html).toMatch(/<div data-lexical-alert=/);
      expect(html).toMatch(/<\/div>/);
    });
  });

  describe("multiline content", () => {
    it("should parse alert block with multiline text", async () => {
      const markdown = ":::error\nLine 1\nLine 2\nLine 3\n:::";
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("error");
      expect(html).toContain("Line 1");
      expect(html).toContain("Line 2");
      expect(html).toContain("Line 3");
    });

    it("should trim whitespace from text content", async () => {
      const markdown = ":::error\n  Padded text  \n:::";
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("Padded text");
    });
  });

  describe("plain text content", () => {
    it("should preserve markdown syntax as plain text", async () => {
      const markdown = ":::error\nThis is **bold** and *italic*\n:::";
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("error");
      // Content should contain the raw markdown syntax
      expect(html).toContain("**bold**");
      expect(html).toContain("*italic*");
    });

    it("should preserve inline code syntax as plain text", async () => {
      const markdown = ":::error\nCode: `const x = 1;`\n:::";
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("error");
      expect(html).toContain(he.encode("`const x = 1;`"));
    });
  });

  describe("multiple alerts", () => {
    it("should handle multiple alert blocks", async () => {
      const markdown = `:::error
Error message
:::

:::warning
Warning message
:::`;
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("error");
      expect(html).toContain("warning");
      expect(html).toContain("Error message");
      expect(html).toContain("Warning message");
    });

    it("should handle all severity types", async () => {
      const markdown = `:::error
Error message
:::

:::warning
Warning message
:::

:::info
Info message
:::

:::success
Success message
:::`;
      const html = await marked.parse(markdown);

      expect(html).toContain("error");
      expect(html).toContain("warning");
      expect(html).toContain("info");
      expect(html).toContain("success");
    });
  });

  describe("integration with other markdown elements", () => {
    it("should work alongside headings", async () => {
      const markdown = `# Heading

:::error
Error message
:::`;
      const html = await marked.parse(markdown);

      console.log("html: ", html);

      expect(html).toContain("Heading");
      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("Error message");
    });

    it("should work alongside paragraphs", async () => {
      const markdown = `:::error
Error message
:::

Some paragraph text.`;
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("Error message");
      expect(html).toContain("Some paragraph text");
    });

    it("should work alongside lists", async () => {
      const markdown = `:::error
Error message
:::

- Item 1
- Item 2`;
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("Error message");
      expect(html).toContain("Item 1");
      expect(html).toContain("Item 2");
    });

    it("should work alongside code blocks", async () => {
      const markdown = `:::error
Error message
:::

\`\`\`js
console.log('test');
\`\`\``;
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("Error message");
      expect(html).toContain("console.log");
    });
  });

  describe("edge cases", () => {
    it("should not parse incomplete alert block", async () => {
      const markdown = ":::error\nSome text";
      const html = await marked.parse(markdown);

      // Should not contain the alert div
      expect(html).not.toContain("data-lexical-alert");
    });

    it("should not parse invalid syntax without severity", async () => {
      const markdown = ":::\nSome text\n:::";
      const html = await marked.parse(markdown);

      // Should not contain the alert div
      expect(html).not.toContain("data-lexical-alert");
    });

    it("should handle alert with only whitespace", async () => {
      const markdown = ":::error\n   \n:::";
      const html = await marked.parse(markdown);

      expect(html).toContain("data-lexical-alert");
      expect(html).toContain("error");
    });
  });
});
