import path from "node:path";
import { $isCodeNode, CodeHighlightNode, CodeNode } from "@lexical/code";
import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import matter from "gray-matter";
import he from "he";
import { JSDOM } from "jsdom";
import {
  $getRoot,
  $insertNodes,
  $isLineBreakNode,
  type LexicalNode,
  LineBreakNode,
  type SerializedEditorState,
  TextNode,
} from "lexical";
import { marked, type RendererObject } from "marked";
import pLimit from "p-limit";
import { parseCodeLangStr, removeIndent } from "../utils/custom-component.js";
import { findImagePath, findLocalImages, isRemoteUrl } from "../utils/image-finder.js";
import { getImageDimensions } from "../utils/image-utils.js";
import { slugify } from "../utils/slugify.js";
import { type UploadFilesOptions, uploadFiles } from "../utils/upload-files.js";
import { AlertNode } from "./nodes/alert-node.js";
import { CustomComponentNode } from "./nodes/custom-component-node.js";
import { ImageNode } from "./nodes/image-node.js";
import { MermaidNode } from "./nodes/mermaid-node.js";

// Extension for :::severity syntax
export const alertExtension = {
  name: "alert",
  level: "block" as const,
  start(src: string) {
    return src.match(/^:::[a-zA-Z0-9_-]+/m)?.index;
  },
  tokenizer(src: string) {
    const rule = /^:::(?<severity>[a-zA-Z0-9_-]+)[^\n]*\n([\s\S]*?)\n:::/;
    const match = rule.exec(src);
    if (match) {
      const severity = match.groups?.severity || "";
      const text = (match[2] || "").trim();
      return {
        type: "alert",
        raw: match[0],
        severity,
        text,
      };
    }
    return undefined;
  },
  renderer(token: { severity: string; text: string; raw: string; type: string }) {
    const data = JSON.stringify({
      text: token.text,
      severity: token.severity,
    });
    return `<div data-lexical-alert="${he.encode(data)}"></div>\n`;
  },
};

export interface ConverterOptions {
  slugPrefix?: string;
  slugWithoutExt?: boolean;
  uploadConfig?: {
    appUrl: string;
    accessToken: string;
    mediaFolder?: string;
    concurrency?: number;
    cacheFilePath?: string;
  };
}

export class Converter {
  private slugPrefix?: string;
  public usedSlugs: Record<string, string[]>;
  public blankFilePaths: string[];
  private slugWithoutExt: boolean;
  private uploadConfig?: ConverterOptions["uploadConfig"];

  constructor(options: ConverterOptions = {}) {
    this.slugPrefix = options.slugPrefix;
    this.slugWithoutExt = options.slugWithoutExt ?? true;
    this.uploadConfig = options.uploadConfig;
    this.usedSlugs = {};
    this.blankFilePaths = [];
  }

  public async markdownToLexical(
    markdown: string,
    filePath: string,
  ): Promise<{
    title: string | undefined;
    labels?: string[];
    icon?: string;
    content: SerializedEditorState | null;
  }> {
    const m = matter(markdown);
    let markdownContent = m.content.trim();

    const labels = Array.isArray(m.data.labels) ? m.data.labels : undefined;
    const icon = typeof m.data.icon === "string" ? m.data.icon : undefined;
    let title: string | undefined;

    const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
    if (titleMatch?.[1]) {
      title = titleMatch[1].trim();
      markdownContent = markdownContent.replace(/^#\s+.+$/m, "").trim();
    }

    if (markdownContent.trim() === "") {
      this.blankFilePaths.push(filePath);
      return { title, labels, icon, content: null };
    }

    const slugPrefix = this.slugPrefix;
    const usedSlugs = this.usedSlugs;
    const slugWithoutExt = this.slugWithoutExt;

    const renderer: RendererObject = {
      heading({ tokens, depth }) {
        // Convert codespan tokens to text tokens
        const processedTokens = tokens.map((token) => {
          if (token.type === "codespan") {
            return {
              type: "text" as const,
              raw: token.text,
              text: token.text,
            };
          }
          return token;
        });
        const content = this.parser.parseInline(processedTokens);
        return `<h${depth}>${content}</h${depth}>\n`;
      },
      code({ text, lang: rawLang, escaped }) {
        const { lang, ...attrs } = parseCodeLangStr(rawLang);

        if (lang === "mermaid") return `<pre class="mermaid">${text}</pre>`;

        // Convert title/icon and other attributes to data-* attributes
        const dataAttrs = Object.entries(attrs)
          .map(([k, v]) => `data-${he.encode(k)}="${he.encode(v)}"`)
          .join(" ");

        return `<x-code data-language="${lang}" ${dataAttrs}>${escaped ? text : he.encode(text)}</x-code>`;
      },
      link({ href, text }) {
        if (/^(http|https|\/|#|mailto:)/.test(href)) return false;

        const absPath = path.resolve(path.dirname(filePath), href);
        const docsRoot = path.resolve(process.cwd(), process.env.DOC_ROOT_DIR ?? "docs");
        const relPath = path.relative(docsRoot, absPath);
        const normalizedRelPath = relPath.replace(/\.([a-zA-Z-]+)\.md$/, ".md");
        const [relPathWithoutAnchor, anchor] = normalizedRelPath.split("#");
        const slug = slugify(relPathWithoutAnchor as string, slugWithoutExt);
        usedSlugs[slug] = [...(usedSlugs[slug] ?? []), filePath];
        return `<a href="${slugPrefix ? `${slug}-${slugPrefix}${anchor ? `#${anchor}` : ""}` : slug}${anchor ? `#${anchor}` : ""}">${marked.parseInline(text)}</a>`;
      },
      html({ text }) {
        if (text.startsWith("<x-")) {
          let updatedText = text;
          // Check if text contains data-href attributes and process all of them
          const dataHrefMatches = text.matchAll(/data-href="([^"]+)"/g);
          for (const match of dataHrefMatches) {
            const hrefValue = match[1];
            // If href starts with "/", normalize the path (/aa/bb/cc => aa-bb-cc-<slugPrefix>)
            if (hrefValue?.startsWith("/")) {
              const prefix = slugPrefix ? `-${slugPrefix}` : "";
              const processedHref = hrefValue.substring(1).replace(/\//g, "-") + prefix;
              updatedText = updatedText.replace(match[0], `data-href="${processedHref}"`);
            }
          }

          // support parse inline markdown
          const dom = new JSDOM(updatedText);
          const { document } = dom.window;

          function walk(node: Element) {
            if (node.nodeType === 1) {
              const el = node;

              if (el.hasAttribute("markdown")) {
                el.innerHTML = marked.parseInline(removeIndent(el.textContent || "")) as string;
              } else {
                Array.from(el.children).forEach(walk);
              }
            }
          }
          Array.from(document.body.children).forEach(walk);
          updatedText = document.body.innerHTML;

          return updatedText;
        }
        return false;
      },
    };

    marked.use({ extensions: [alertExtension], renderer });
    const html = await marked.parse(markdownContent);

    const editor = createHeadlessEditor({
      namespace: "editor",
      theme: {},
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableRowNode,
        TableCellNode,
        LinkNode,
        ImageNode,
        MermaidNode,
        TextNode,
        LineBreakNode,
        AlertNode,
        CustomComponentNode,
      ],
    });

    editor.update(
      () => {
        const dom = new JSDOM(html);
        const htmlDocument = dom.window.document;
        const nodes = $generateNodesFromDOM(editor, htmlDocument);
        $getRoot().select();
        $insertNodes(nodes);
        nodes.forEach(this.trimTrailingLineBreak.bind(this));
      },
      { discrete: true },
    );

    const content = await new Promise<SerializedEditorState>((resolve) => {
      setTimeout(
        () => {
          editor.update(() => {
            const state = editor.getEditorState();
            const json = state.toJSON();
            resolve(json);
          });
        },
        Math.min(markdownContent.length, 500),
      );
    });

    // Process images if upload config is provided
    if (this.uploadConfig && content) {
      await this.processImages(content, filePath);
    }

    return { title, labels, icon, content };
  }

  private async processImages(content: SerializedEditorState, filePath: string): Promise<void> {
    if (!this.uploadConfig) return;

    // Collect all local image sources
    const localImageSources: string[] = [];

    const collectImageSources = (node: any): void => {
      // image node
      if (node.type === "image" && node.src && !isRemoteUrl(node.src)) {
        localImageSources.push(node.src);
      }

      // x-component node
      if (node.type === "x-component") {
        // Collect images from custom components
        if (
          node.data?.component === "card" &&
          node.data?.properties?.image &&
          !isRemoteUrl(node.data?.properties?.image)
        ) {
          localImageSources.push(node.data?.properties?.image);
        }

        if (node.data?.component === "cards") {
          node.data?.properties?.children?.forEach((child: any) => {
            if (
              child.component === "card" &&
              child.properties?.image &&
              !isRemoteUrl(child.properties?.image)
            ) {
              localImageSources.push(child.properties?.image);
            }
          });
        }
      }

      if (node.children) {
        node.children.forEach(collectImageSources);
      }
    };

    content.root.children.forEach(collectImageSources);

    let localImageFiles: string[] = [];
    let foundImagePaths: Map<string, string> = new Map();

    if (localImageSources.length > 0) {
      // Find local image files
      const imageSearchResult = findLocalImages(localImageSources, {
        mediaFolder: this.uploadConfig.mediaFolder,
        markdownFilePath: filePath,
      });
      foundImagePaths = imageSearchResult.foundPaths;
      localImageFiles = Array.from(foundImagePaths.values());
    }

    try {
      // Upload images
      const uploadOptions: UploadFilesOptions = {
        appUrl: this.uploadConfig.appUrl,
        filePaths: localImageFiles,
        accessToken: this.uploadConfig.accessToken,
        concurrency: this.uploadConfig.concurrency,
        cacheFilePath: this.uploadConfig.cacheFilePath,
      };

      const result = await uploadFiles(uploadOptions);

      // Create mapping from original src paths to uploaded URLs
      const urlMapping = new Map<string, string>();
      for (const uploadResult of result.results) {
        if (uploadResult.url) {
          // Find the original src that corresponds to this uploaded file
          const actualPath = uploadResult.filePath;
          const originalSrc = Array.from(foundImagePaths.entries()).find(
            ([_, foundPath]) => foundPath === actualPath,
          )?.[0];

          if (originalSrc) {
            // Map the original src to the uploaded URL
            urlMapping.set(originalSrc, uploadResult.url);
          }
        }
      }

      const warnMissingImageUrl = (imagePath: string) => {
        console.warn(`No uploaded URL found for image: ${decodeURIComponent(imagePath || "")}`);
      };

      // Create a concurrency limit for image processing to avoid overwhelming the system
      const limit = pLimit(3);

      // Update image sources in the content
      const updateImageSources = async (node: any): Promise<void> => {
        if (node.type === "image" && node.src) {
          let imagePath: string | null;
          if (isRemoteUrl(node.src)) {
            imagePath = node.src;
          } else {
            const imageLocalPath = node.src;

            const uploadedUrl = urlMapping.get(node.src);
            if (uploadedUrl) {
              node.src = uploadedUrl;
            } else {
              warnMissingImageUrl(node.src);
            }

            imagePath = findImagePath(imageLocalPath, {
              mediaFolder: this.uploadConfig?.mediaFolder,
              markdownFilePath: filePath,
            });
          }

          if (imagePath) {
            // update image width and height
            const dimensions = await getImageDimensions(imagePath);
            if (dimensions) {
              node.width = dimensions.width;
              node.height = dimensions.height;
            }
          }
        }

        if (node.type === "x-component") {
          if (
            node.data?.component === "card" &&
            node.data?.properties?.image &&
            !isRemoteUrl(node.data?.properties?.image)
          ) {
            const uploadedUrl = urlMapping.get(node.data?.properties?.image);
            if (uploadedUrl) {
              node.data.properties.image = uploadedUrl;
            } else {
              warnMissingImageUrl(node.data?.properties?.image);
            }
          }

          if (node.data?.component === "cards") {
            node.data?.properties?.children?.forEach((child: any) => {
              if (
                child.component === "card" &&
                child.properties?.image &&
                !isRemoteUrl(child.properties?.image)
              ) {
                const uploadedUrl = urlMapping.get(child.properties?.image);
                if (uploadedUrl) {
                  child.properties.image = uploadedUrl;
                } else {
                  warnMissingImageUrl(child.properties?.image);
                }
              }
            });
          }
        }
        if (node.children) {
          await Promise.all(node.children.map((child: any) => updateImageSources(child)));
        }
      };

      await Promise.all(
        content.root.children.map((child) => limit(() => updateImageSources(child))),
      );
    } catch (error) {
      console.warn(`Failed to upload images for ${filePath}:`, error);
    }
  }

  private trimTrailingLineBreak(node: LexicalNode | null) {
    if ($isCodeNode(node)) {
      const lastChild = node.getLastChild();
      if ($isLineBreakNode(lastChild)) {
        lastChild.remove();
      } else {
        this.trimTrailingLineBreak(lastChild);
      }
    }
  }
}
