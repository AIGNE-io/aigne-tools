import { describe, expect, it } from "bun:test";
import { parseCodeLangStr } from "../src/utils/parse-code-lang-str.js";

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

  it("should parse language with multiple word title", () => {
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
    const result = parseCodeLangStr('js title="Complex Title" icon="mdi:javascript" foldable=true foldThreshold=10');
    expect(result).toEqual({
      lang: "js",
      title: "Complex Title",
      icon: "mdi:javascript",
      foldable: "true",
      foldThreshold: "10",
    });
  });

  it("should parse language with complex attributes using single quotes", () => {
    const result = parseCodeLangStr("js title='Complex Title' icon='mdi:javascript' foldable=true foldThreshold=10");
    expect(result).toEqual({
      lang: "js",
      title: "Complex Title",
      icon: "mdi:javascript",
      foldable: "true",
      foldThreshold: "10",
    });
  });

  it("should parse language with mixed single and double quotes", () => {
    const result = parseCodeLangStr('js title="Complex Title" icon=\'mdi:javascript\' foldable=true');
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
    const result = parseCodeLangStr('js title="He said \'Hello World\'" icon=langs:js');
    expect(result).toEqual({
      lang: "js",
      title: "He said 'Hello World'",
      icon: "langs:js",
    });
  });

  it("should handle nested quotes in single-quoted values", () => {
    const result = parseCodeLangStr('js title=\'He said "Hello World"\' icon=langs:js');
    expect(result).toEqual({
      lang: "js",
      title: 'He said "Hello World"',
      icon: "langs:js",
    });
  });
});
