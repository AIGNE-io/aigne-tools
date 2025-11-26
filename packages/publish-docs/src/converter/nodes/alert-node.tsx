import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";

export type AlertColor = "success" | "info" | "warning" | "error";
export type SerializedAlertNode = Spread<
  {
    type: "alert";
    text: string;
    severity: AlertColor;
  },
  SerializedDecoratorBlockNode
>;

function convertAlertElement(domNode: HTMLElement): null | DOMConversionOutput {
  const alertStr = domNode.getAttribute("data-lexical-alert");
  try {
    // biome-ignore lint/style/noNonNullAssertion: no-need
    const parsed = JSON.parse(alertStr!);
    if (parsed) {
      const node = $createAlertNode(parsed.text, parsed.severity);
      return { node };
    }
  } catch (e) {
    console.warn(`Failed to parse: ${alertStr}`, e);
  }
  return null;
}

export class AlertNode extends DecoratorBlockNode {
  __text: string;

  __severity: AlertColor;

  static override getType(): string {
    return "alert";
  }

  static override clone(node: AlertNode): AlertNode {
    return new AlertNode(node.__text, node.__severity, node.__format, node.__key);
  }

  constructor(text: string, severity: AlertColor, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__text = text;
    this.__severity = severity;
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute(
      "data-lexical-alert",
      JSON.stringify({ text: this.__text, severity: this.__severity }),
    );
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-alert")) {
          return null;
        }
        return {
          conversion: convertAlertElement,
          priority: 1,
        };
      },
    };
  }

  static override importJSON(serializedNode: SerializedAlertNode): AlertNode {
    const node = $createAlertNode(serializedNode.text, serializedNode.severity);
    return node;
  }

  override exportJSON(): SerializedAlertNode {
    return {
      ...super.exportJSON(),
      type: "alert",
      text: this.__text,
      severity: this.__severity,
      version: 1,
    };
  }

  getText(): string {
    return this.__text;
  }

  setText(text: string): void {
    const writable = this.getWritable();
    writable.__text = text;
  }

  getSeverity(): string {
    return this.__severity;
  }

  setSeverity(severity: AlertColor): void {
    const writable = this.getWritable();
    writable.__severity = severity;
  }

  override decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return null as any;
  }

  override isInline(): false {
    return false;
  }
}

export function $createAlertNode(text: string, severity: AlertColor): AlertNode {
  const alertNode = new AlertNode(text, severity);
  return alertNode;
}

export function $isAlertNode(node: LexicalNode | null | undefined): node is AlertNode {
  return node instanceof AlertNode;
}
