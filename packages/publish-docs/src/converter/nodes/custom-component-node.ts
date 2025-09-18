import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  ElementFormatType,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";

const NODE_TYPE = "x-component";

interface CustomComponentData {
  component: string;
  properties?: Record<string, unknown>;
}

export type SerializedCustomComponentNode = Spread<
  {
    type: typeof NODE_TYPE;
    data: CustomComponentData;
  },
  SerializedDecoratorBlockNode
>;

function isCustomComponent(domNode: HTMLElement): boolean {
  return domNode.tagName.toLowerCase().startsWith("x-");
}

function getComponentName(domNode: HTMLElement): string {
  if (!isCustomComponent(domNode)) {
    throw new Error(`Invalid component name: ${domNode.tagName.toLowerCase()}`);
  }
  return domNode.tagName.toLowerCase().slice(2);
}

function convertCustomComponentElement(domNode: HTMLElement): null | DOMConversionOutput {
  const component = getComponentName(domNode);
  try {
    if (component) {
      // const properties = domToComponentProperties(domNode);
      const properties: Record<string, unknown> = {
        component: getComponentName(domNode),
        ...domNode.dataset,
      };

      const node = $createCustomComponentNode({
        component,
        properties,
      });

      const { children } = domNode;
      const hasChildren = Array.from(children).some((child) =>
        isCustomComponent(child as HTMLElement),
      );
      if (!hasChildren) {
        properties.body = domNode.textContent?.trim() || "";
        // properties.children = Array.from(children).map((child) => {
        //   // Recursively parse to maintain the complete node structure
        //   const childNode = convertCustomComponentElement(child as HTMLElement);
        //   const data = (childNode?.node as unknown as CustomComponentNode).getData();
        //   return { component: data.component, properties: data.properties };
        // });
      }

      const hasInlineMarkdown = domNode.hasAttribute("markdown");
      return {
        node,
        after(childLexicalNodes) {
          if (node.__data.properties) {
            if (hasInlineMarkdown) {
              node.__data.properties.childNodes = childLexicalNodes.map((v) => v.exportJSON());
            } else {
              node.__data.properties.children = childLexicalNodes
                .filter((v) => v.__type === "x-component")
                .map((v) => (v as CustomComponentNode).__data);
            }
          }
          return childLexicalNodes;
        },
      };
    }
  } catch (e) {
    console.warn(`Failed to parse: ${component}`, e);
  }
  return null;
}

export class CustomComponentNode extends DecoratorBlockNode {
  __data: CustomComponentData;

  static override getType(): string {
    return NODE_TYPE;
  }

  static override clone(node: CustomComponentNode): CustomComponentNode {
    return new CustomComponentNode(node.__data, node.__format, node.__key);
  }

  constructor(data: CustomComponentData, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__data = { ...data };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    const { body, ...rest } = this.__data.properties || {};
    if (body) {
      element.textContent = body as string;
    }
    Object.entries(rest).forEach(([key, value]) => {
      element.setAttribute(`data-${key}`, value as string);
    });
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      "x-code": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
      "x-card": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
      "x-cards": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
      "x-code-group": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
      "x-steps": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
      "x-field": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
      "x-field-group": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
      "x-field-desc": () => ({ conversion: convertCustomComponentElement, priority: 1 }),
    };
  }

  static override importJSON(serializedNode: SerializedCustomComponentNode): CustomComponentNode {
    const node = $createCustomComponentNode(serializedNode.data);
    return node;
  }

  override exportJSON(): SerializedCustomComponentNode {
    return {
      ...super.exportJSON(),
      type: NODE_TYPE,
      data: this.__data,
      version: 1,
    };
  }

  getData(): CustomComponentData {
    return this.__data;
  }

  setData(data: CustomComponentData): void {
    const writable = this.getWritable();
    writable.__data = data;
  }

  override isInline(): false {
    return false;
  }

  override decorate(): JSX.Element {
    return null as any;
  }
}

export function $createCustomComponentNode(data: CustomComponentData): CustomComponentNode {
  const customComponentNode = new CustomComponentNode(data);
  return customComponentNode;
}

export function $isCustomComponentNode(
  node: LexicalNode | null | undefined,
): node is CustomComponentNode {
  return node instanceof CustomComponentNode;
}
