import { describe, it, expect } from "vitest";
import { routeModel, inferComplexity } from "./router.js";

describe("routeModel", () => {
  it("returns default routing", () => {
    expect(routeModel("low")).toBe("low");
    expect(routeModel("medium")).toBe("medium");
    expect(routeModel("high")).toBe("high");
  });

  it("respects custom routing", () => {
    expect(routeModel("low", { low: "medium" })).toBe("medium");
    expect(routeModel("high", { high: "medium" })).toBe("medium");
  });
});

describe("inferComplexity", () => {
  it("detects low complexity tasks", () => {
    expect(inferComplexity("find the definition of foo")).toBe("low");
    expect(inferComplexity("quick lookup of bar")).toBe("low");
  });

  it("detects medium complexity tasks", () => {
    expect(inferComplexity("implement user auth")).toBe("medium");
    expect(inferComplexity("add error handling")).toBe("medium");
    expect(inferComplexity("fix the login bug")).toBe("medium");
  });

  it("detects high complexity tasks", () => {
    expect(inferComplexity("refactor the database layer")).toBe("high");
    expect(inferComplexity("debug the race condition")).toBe("high");
    expect(inferComplexity("architect the new system")).toBe("high");
  });

  it("defaults to medium for unknown tasks", () => {
    expect(inferComplexity("do something unclear")).toBe("medium");
  });
});
