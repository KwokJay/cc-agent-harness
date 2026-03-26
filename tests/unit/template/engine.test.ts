import { describe, it, expect } from "vitest";
import { render } from "../../../src/template/engine.js";

describe("render", () => {
  describe("variable interpolation", () => {
    it("replaces string variables", () => {
      expect(render("Hello {{name}}!", { name: "World" })).toBe("Hello World!");
    });

    it("interpolates true as the string true", () => {
      expect(render("x={{flag}}", { flag: true })).toBe("x=true");
    });

    it("interpolates false as the string false", () => {
      expect(render("x={{flag}}", { flag: false })).toBe("x=false");
    });

    it("joins array values with comma space", () => {
      expect(render("tags: {{tags}}", { tags: ["a", "b", "c"] })).toBe("tags: a, b, c");
    });

    it("renders empty string for undefined keys", () => {
      expect(render("{{missing}}", {})).toBe("");
    });

    it("handles multiple distinct placeholders", () => {
      expect(render("{{a}}-{{b}}", { a: "1", b: "2" })).toBe("1-2");
    });

    it("handles repeated same key", () => {
      expect(render("{{x}} {{x}}", { x: "y" })).toBe("y y");
    });

    it("joins empty array to empty string in interpolation", () => {
      expect(render("{{items}}", { items: [] })).toBe("");
    });
  });

  describe("conditional blocks", () => {
    it("includes if body when string value is non-empty", () => {
      expect(render("{{#if show}}yes{{/if}}", { show: "1" })).toBe("yes");
    });

    it("omits if body when value is undefined", () => {
      expect(render("{{#if show}}yes{{/if}}", {})).toBe("");
    });

    it("omits if body when boolean is false", () => {
      expect(render("{{#if show}}yes{{/if}}", { show: false })).toBe("");
    });

    it("omits if body when string is empty", () => {
      expect(render("{{#if show}}yes{{/if}}", { show: "" })).toBe("");
    });

    it("treats empty array as falsy for if", () => {
      expect(render("{{#if items}}yes{{/if}}", { items: [] })).toBe("");
    });

    it("treats non-empty array as truthy for if", () => {
      expect(render("{{#if items}}yes{{/if}}", { items: ["a"] })).toBe("yes");
    });

    it("uses else branch when falsy", () => {
      expect(render("{{#if x}}a{{#else}}b{{/if}}", { x: false })).toBe("b");
    });

    it("uses if branch when truthy with else", () => {
      expect(render("{{#if x}}a{{#else}}b{{/if}}", { x: true })).toBe("a");
    });
  });

  describe("each loops", () => {
    it("repeats body and substitutes dot with each item", () => {
      expect(render("{{#each items}}[{{.}}]{{/each}}", { items: ["a", "b"] })).toBe(
        "[a][b]",
      );
    });

    it("renders nothing for empty array", () => {
      expect(render("{{#each items}}x{{/each}}", { items: [] })).toBe("");
    });

    it("renders nothing when key is not an array", () => {
      expect(render("{{#each items}}x{{/each}}", { items: undefined })).toBe("");
      expect(render("{{#each items}}x{{/each}}", { items: "nope" as unknown as string[] })).toBe(
        "",
      );
    });

    it("replaces every dot placeholder in each iteration", () => {
      expect(render("{{#each items}}({{.}}|{{.}}){{/each}}", { items: ["z"] })).toBe(
        "(z|z)",
      );
    });
  });

  describe("combined and ordering", () => {
    it("runs each before conditionals then interpolation", () => {
      const tpl = "{{#each parts}}{{.}}:{{label}};{{/each}}";
      expect(render(tpl, { parts: ["p1", "p2"], label: "L" })).toBe("p1:L;p2:L;");
    });

    it("expands each then interpolates remaining variables", () => {
      expect(
        render("{{#each xs}}<{{.}}>{{suffix}}{{/each}}", { xs: ["a"], suffix: "!" }),
      ).toBe("<a>!");
    });

    it("applies conditionals after each expansion", () => {
      const tpl = "{{#each list}}{{#if show}}{{label}}{{.}}{{/if}}{{/each}}";
      expect(
        render(tpl, { list: ["a", "b"], show: true, label: "-" }),
      ).toBe("-a-b");
    });

    it("supports if-else with surrounding static text", () => {
      expect(render("start{{#if ok}}Y{{#else}}N{{/if}}end", { ok: false })).toBe("startNend");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for empty template", () => {
      expect(render("", {})).toBe("");
    });

    it("leaves non-placeholder braces unchanged when not matching patterns", () => {
      expect(render("{not a var}", {})).toBe("{not a var}");
    });

    it("handles template with only static text", () => {
      expect(render("plain", { a: "b" })).toBe("plain");
    });
  });
});
