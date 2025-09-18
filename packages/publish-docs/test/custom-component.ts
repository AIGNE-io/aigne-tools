import { describe, expect, it } from "bun:test";
import { parseCodeLangStr, removeIndent } from "../src/utils/custom-component.js";

describe("parseCodeLangStr", () => {
  it("should parse basic language without attributes", () => {
    const result = parseCodeLangStr("js");
    expect(result).toEqual({
      lang: "js",
      title: "",
    });
  });

  it("should parse language with title", () => {
    const result = parseCodeLangStr("js MyTitle");
    expect(result).toEqual({
      lang: "js",
      title: "MyTitle",
    });
  });

  it("should parse language identifier with a multi-word title", () => {
    const result = parseCodeLangStr("js My JavaScript Title");
    expect(result).toEqual({
      lang: "js",
      title: "My JavaScript Title",
    });
  });

  it("should parse language with simple key=value attributes", () => {
    const result = parseCodeLangStr("js title=MyTitle icon=langs:js");
    expect(result).toEqual({
      lang: "js",
      title: "MyTitle",
      icon: "langs:js",
    });
  });

  it("should parse language with double-quoted values containing spaces", () => {
    const result = parseCodeLangStr('js title="I am javascript" icon=langs:js');
    expect(result).toEqual({
      lang: "js",
      title: "I am javascript",
      icon: "langs:js",
    });
  });

  it("should parse language with single-quoted values containing spaces", () => {
    const result = parseCodeLangStr("js title='I am javascript' icon=langs:js");
    expect(result).toEqual({
      lang: "js",
      title: "I am javascript",
      icon: "langs:js",
    });
  });

  it("should parse language with mixed quoted and unquoted values", () => {
    const result = parseCodeLangStr('js title="I am javascript" icon=langs:js foldable=true');
    expect(result).toEqual({
      lang: "js",
      title: "I am javascript",
      icon: "langs:js",
      foldable: "true",
    });
  });

  it("should parse language with empty quoted values", () => {
    const result = parseCodeLangStr('js title="" icon=langs:js');
    expect(result).toEqual({
      lang: "js",
      title: "",
      icon: "langs:js",
    });
  });

  it("should parse language with empty single-quoted values", () => {
    const result = parseCodeLangStr("js title='' icon=langs:js");
    expect(result).toEqual({
      lang: "js",
      title: "",
      icon: "langs:js",
    });
  });

  it("should parse language with complex attributes using double quotes", () => {
    const result = parseCodeLangStr(
      'js title="Complex Title" icon="mdi:javascript" foldable=true foldThreshold=10',
    );
    expect(result).toEqual({
      lang: "js",
      title: "Complex Title",
      icon: "mdi:javascript",
      foldable: "true",
      foldThreshold: "10",
    });
  });

  it("should parse language with complex attributes using single quotes", () => {
    const result = parseCodeLangStr(
      "js title='Complex Title' icon='mdi:javascript' foldable=true foldThreshold=10",
    );
    expect(result).toEqual({
      lang: "js",
      title: "Complex Title",
      icon: "mdi:javascript",
      foldable: "true",
      foldThreshold: "10",
    });
  });

  it("should parse language with mixed single and double quotes", () => {
    const result = parseCodeLangStr(
      "js title=\"Complex Title\" icon='mdi:javascript' foldable=true",
    );
    expect(result).toEqual({
      lang: "js",
      title: "Complex Title",
      icon: "mdi:javascript",
      foldable: "true",
    });
  });

  it("should handle empty string input", () => {
    const result = parseCodeLangStr("");
    expect(result).toEqual({
      lang: "",
      title: "",
    });
  });

  it("should handle whitespace-only input", () => {
    const result = parseCodeLangStr("   ");
    expect(result).toEqual({
      lang: "",
      title: "",
    });
  });

  it("should handle mixed title and attributes", () => {
    const result = parseCodeLangStr('js Some Title icon="mdi:javascript"');
    expect(result).toEqual({
      lang: "js",
      title: "Some Title",
      icon: "mdi:javascript",
    });
  });

  it("should handle nested quotes in double-quoted values", () => {
    const result = parseCodeLangStr("js title=\"He said 'Hello World'\" icon=langs:js");
    expect(result).toEqual({
      lang: "js",
      title: "He said 'Hello World'",
      icon: "langs:js",
    });
  });

  it("should handle nested quotes in single-quoted values", () => {
    const result = parseCodeLangStr("js title='He said \"Hello World\"' icon=langs:js");
    expect(result).toEqual({
      lang: "js",
      title: 'He said "Hello World"',
      icon: "langs:js",
    });
  });

  it("should ignore extension syntax like ,no-run", () => {
    const result = parseCodeLangStr("rust,no-run");
    expect(result).toEqual({
      lang: "rust",
      title: "",
    });
  });

  it("should ignore extension syntax with title", () => {
    const result = parseCodeLangStr("rust,no-run My Rust Code");
    expect(result).toEqual({
      lang: "rust",
      title: "My Rust Code",
    });
  });

  it("should ignore extension syntax with attributes", () => {
    const result = parseCodeLangStr('rust,no-run title="Rust Example" icon=mdi:rust');
    expect(result).toEqual({
      lang: "rust",
      title: "Rust Example",
      icon: "mdi:rust",
    });
  });

  it("should handle extension syntax with complex attributes", () => {
    const result = parseCodeLangStr(
      "go,no-run,ignore title=\"Go Example\" icon='mdi:go' foldable=true",
    );
    expect(result).toEqual({
      lang: "go",
      title: "Go Example",
      icon: "mdi:go",
      foldable: "true",
    });
  });

  it("should handle empty language with extension syntax", () => {
    const result = parseCodeLangStr(",no-run");
    expect(result).toEqual({
      lang: "",
      title: "",
    });
  });

  it("should handle language with only comma", () => {
    const result = parseCodeLangStr("js,");
    expect(result).toEqual({
      lang: "js",
      title: "",
    });
  });
});

describe("removeIndent", () => {
  it("should remove common indentation from all lines", () => {
    const text = `    line1
    line2
    line3`;
    const result = removeIndent(text);
    expect(result).toBe(`line1
line2
line3`);
  });

  it("should handle mixed indentation levels", () => {
    const text = `  line1
    line2
      line3`;
    const result = removeIndent(text);
    expect(result).toBe(`line1
  line2
    line3`);
  });

  it("should handle empty lines", () => {
    const text = `    line1

    line2
    `;
    const result = removeIndent(text);
    expect(result).toBe(`line1

line2
`);
  });

  it("should handle lines with only whitespace", () => {
    const text = `    line1
    
    line2`;
    const result = removeIndent(text);
    expect(result).toBe(`line1

line2`);
  });

  it("should handle single line", () => {
    const text = "    single line";
    const result = removeIndent(text);
    expect(result).toBe("single line");
  });

  it("should handle empty string", () => {
    const text = "";
    const result = removeIndent(text);
    expect(result).toBe("");
  });

  it("should handle only whitespace", () => {
    const text = "   \n  \n";
    const result = removeIndent(text);
    expect(result).toBe("\n\n");
  });

  it("should handle no indentation", () => {
    const text = `line1
line2
line3`;
    const result = removeIndent(text);
    expect(result).toBe(`line1
line2
line3`);
  });


  it("should handle complex indentation with different levels", () => {
    const text = `        function test() {
            if (true) {
                return "hello";
            }
        }`;
    const result = removeIndent(text);
    expect(result).toBe(`function test() {
    if (true) {
        return "hello";
    }
}`);
  });

  it("should handle lines with zero indentation", () => {
    const text = `line1
    line2
line3`;
    const result = removeIndent(text);
    expect(result).toBe(`line1
    line2
line3`);
  });

  it("should preserve trailing whitespace", () => {
    const text = `    line1    
    line2    `;
    const result = removeIndent(text);
    expect(result).toBe(`line1    
line2    `);
  });

  it("should handle multiline string with inconsistent indentation", () => {
    const text = `  first line
    second line
      third line
  fourth line`;
    const result = removeIndent(text);
    expect(result).toBe(`first line
  second line
    third line
fourth line`);
  });
});
