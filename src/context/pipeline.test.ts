import { describe, it, expect } from "vitest";
import { ContextPipeline } from "./pipeline.js";

describe("ContextPipeline", () => {
  it("adds and builds blocks in priority order", () => {
    const pipeline = new ContextPipeline();
    pipeline.addBlock("low-priority", "Low content", 50);
    pipeline.addBlock("high-priority", "High content", 10);

    const result = pipeline.build();
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].tag).toBe("high-priority");
    expect(result.blocks[1].tag).toBe("low-priority");
  });

  it("renders blocks with tags", () => {
    const pipeline = new ContextPipeline();
    pipeline.addBlock("test-block", "Hello World", 10);

    const result = pipeline.build();
    expect(result.rendered).toContain("<!-- test-block -->");
    expect(result.rendered).toContain("Hello World");
    expect(result.rendered).toContain("<!-- /test-block -->");
  });

  it("adds custom rules", () => {
    const pipeline = new ContextPipeline();
    pipeline.addCustomRules(["Rule 1", "Rule 2"]);

    const result = pipeline.build();
    expect(result.rendered).toContain("- Rule 1");
    expect(result.rendered).toContain("- Rule 2");
  });

  it("skips empty custom rules", () => {
    const pipeline = new ContextPipeline();
    pipeline.addCustomRules([]);

    const result = pipeline.build();
    expect(result.blocks).toHaveLength(0);
  });

  it("clears all blocks", () => {
    const pipeline = new ContextPipeline();
    pipeline.addBlock("a", "content", 10);
    pipeline.clear();

    const result = pipeline.build();
    expect(result.blocks).toHaveLength(0);
    expect(result.rendered).toBe("");
  });

  it("adds raw blocks", () => {
    const pipeline = new ContextPipeline();
    pipeline.addRaw("custom", "custom content", 5);

    const result = pipeline.build();
    expect(result.blocks[0].tag).toBe("custom");
    expect(result.blocks[0].priority).toBe(5);
  });

  it("supports xml tag style", () => {
    const pipeline = new ContextPipeline();
    pipeline.addBlock("instructions", "Do the thing", 10);

    const result = pipeline.build({ tagStyle: "xml" });
    expect(result.rendered).toContain("<instructions>");
    expect(result.rendered).toContain("Do the thing");
    expect(result.rendered).toContain("</instructions>");
  });

  it("supports none tag style", () => {
    const pipeline = new ContextPipeline();
    pipeline.addBlock("instructions", "Do the thing", 10);

    const result = pipeline.build({ tagStyle: "none" });
    expect(result.rendered).not.toContain("<!--");
    expect(result.rendered).not.toContain("<instructions>");
    expect(result.rendered).toBe("Do the thing");
  });

  it("defaults to markdown tag style", () => {
    const pipeline = new ContextPipeline();
    pipeline.addBlock("test", "content", 10);

    const result = pipeline.build();
    expect(result.rendered).toContain("<!-- test -->");
    expect(result.rendered).toContain("<!-- /test -->");
  });
});
