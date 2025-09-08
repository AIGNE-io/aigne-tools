export type LangAttrs = {
  icon?: string;
  foldable?: string; // Whether to enable folding functionality
  foldThreshold?: string; // Folding threshold - auto-fold when line count exceeds this value
};

/**
 * 支持解析 markdown 中带参数的 code block, 例如:
 *
 * ```js MyTitle icon='mdi:javascript'
 * console.log('Hello, world!')
 * ```
 *
 * 解析后返回
 * {
 *   lang: 'js',
 *   title: 'MyTitle',
 *   icon: 'mdi:javascript'
 * }
 */
export function parseCodeLangStr(lang: string = "") {
  const trimmed = lang.trim();
  if (!trimmed) {
    return { lang: "", title: "" };
  }

  // Extract language identifier
  const firstSpaceIndex = trimmed.indexOf(" ");
  const langPart = firstSpaceIndex === -1 ? trimmed : trimmed.substring(0, firstSpaceIndex);
  // 忽略 lang 修饰符，如 rust,no-run -> rust
  const actualLang = langPart.split(",")[0] || "";

  if (firstSpaceIndex === -1) {
    return { lang: actualLang, title: "" };
  }

  const rest = trimmed.substring(firstSpaceIndex + 1);
  let title = "";
  const attrs: LangAttrs = {};

  // Parse remaining text, supporting quoted and unquoted attribute values
  const keyValueRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  const titleParts: string[] = [];

  match = keyValueRegex.exec(rest);
  while (match !== null) {
    // Add text before the match to title parts
    const beforeMatch = rest.substring(lastIndex, match.index).trim();
    if (beforeMatch) {
      titleParts.push(beforeMatch);
    }

    // Extract attribute value
    const value = match[2] ?? match[3] ?? match[4];
    // biome-ignore lint/style/noNonNullAssertion: Non-null assertion needed for type safety
    attrs[match[1]! as keyof LangAttrs] = value!;

    lastIndex = match.index + match[0].length;
    match = keyValueRegex.exec(rest);
  }

  // Add remaining text to title parts
  const remaining = rest.substring(lastIndex).trim();
  if (remaining) {
    titleParts.push(remaining);
  }

  title = titleParts.join(" ");

  return { lang: actualLang, title, ...attrs };
}
