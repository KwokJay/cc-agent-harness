import { describe, it, expect } from "vitest";
import { render } from "./engine.js";

describe("template engine", () => {
  it("interpolates simple variables", () => {
    expect(render("Hello {{name}}!", { name: "World" })).toBe("Hello World!");
  });

  it("handles missing variables as empty string", () => {
    expect(render("Hello {{name}}!", {})).toBe("Hello !");
  });

  it("renders conditional blocks when truthy", () => {
    const template = "{{#if show}}visible{{/if}}";
    expect(render(template, { show: "yes" })).toBe("visible");
    expect(render(template, { show: true })).toBe("visible");
  });

  it("hides conditional blocks when falsy", () => {
    const template = "{{#if show}}visible{{/if}}";
    expect(render(template, { show: false })).toBe("");
    expect(render(template, { show: "" })).toBe("");
    expect(render(template, {})).toBe("");
  });

  it("renders if/else blocks", () => {
    const template = "{{#if dark}}dark mode{{#else}}light mode{{/if}}";
    expect(render(template, { dark: true })).toBe("dark mode");
    expect(render(template, { dark: false })).toBe("light mode");
  });

  it("renders each blocks with arrays", () => {
    const template = "Items:{{#each items}} {{.}}{{/each}}";
    expect(render(template, { items: ["a", "b", "c"] })).toBe("Items: a b c");
  });

  it("renders empty each block when array is empty", () => {
    const template = "Items:{{#each items}} {{.}}{{/each}}";
    expect(render(template, { items: [] })).toBe("Items:");
  });

  it("handles boolean variables as strings", () => {
    expect(render("{{flag}}", { flag: true })).toBe("true");
    expect(render("{{flag}}", { flag: false })).toBe("false");
  });

  it("handles array variables as comma-separated", () => {
    expect(render("{{list}}", { list: ["a", "b"] })).toBe("a, b");
  });

  it("handles complex template with multiple features", () => {
    const template = `# {{projectName}}
Language: {{language}}
{{#if delegationFirst}}
Delegation is enabled.
{{/if}}`;
    const result = render(template, {
      projectName: "my-app",
      language: "typescript",
      delegationFirst: "true",
    });
    expect(result).toContain("# my-app");
    expect(result).toContain("Language: typescript");
    expect(result).toContain("Delegation is enabled.");
  });
});
